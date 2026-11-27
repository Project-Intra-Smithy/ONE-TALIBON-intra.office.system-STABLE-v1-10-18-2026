"""Trusted offline launcher. Copy outside the package and authenticate these bytes
against the independently accepted launcher digest BEFORE executing this program.
The separately pinned package manifest is never learned from the package itself.
"""
import argparse
import ctypes
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import stat
from concurrent.futures import ThreadPoolExecutor

_windows_actor = None


def refuse(message):
    raise RuntimeError(message)


def secure_path(path, secret=False):
    global _windows_actor
    path = Path(path)
    if path.is_symlink() or not path.exists() or (os.name == 'nt' and path.lstat().st_file_attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT):
        refuse('Missing or symbolic deployment input')
    if os.name != 'nt':
        metadata = path.stat()
        if metadata.st_uid not in (0, os.geteuid()) or metadata.st_mode & (0o077 if secret else 0o022):
            refuse('Unsafe deployment ownership or permissions')
        return
    # Inspect native SIDs/DACLs, not localized icacls strings or a documentation-only promise.
    adv, kernel = ctypes.windll.advapi32, ctypes.windll.kernel32
    owner, dacl, descriptor = ctypes.c_void_p(), ctypes.c_void_p(), ctypes.c_void_p()
    result = adv.GetNamedSecurityInfoW(ctypes.c_wchar_p(str(path)), 1, 5, ctypes.byref(owner), None, ctypes.byref(dacl), None, ctypes.byref(descriptor))
    if result or not dacl.value:
        refuse('Unverifiable Windows deployment ACL')
    def sid_text(pointer):
        out = ctypes.c_wchar_p()
        if not adv.ConvertSidToStringSidW(pointer, ctypes.byref(out)):
            refuse('Unverifiable Windows SID')
        value = out.value
        kernel.LocalFree(out)
        return value
    try:
        # Current user's SID is supplied by the OS token through a constant, profile-free query.
        if _windows_actor is None:
            _windows_actor = subprocess.check_output(['whoami', '/user', '/fo', 'csv', '/nh'], text=True).strip().split(',')[-1].strip('"')
        allowed = {_windows_actor, 'S-1-5-18', 'S-1-5-32-544'}
        owner_sid = sid_text(owner)
        if owner_sid not in allowed:
            refuse('Untrusted Windows deployment owner')
        count = ctypes.c_ushort.from_address(dacl.value+4).value
        for index in range(count):
            ace = ctypes.c_void_p()
            if not adv.GetAce(dacl, index, ctypes.byref(ace)):
                refuse('Unverifiable Windows ACE')
            kind = ctypes.c_ubyte.from_address(ace.value).value
            if kind == 1:  # A deny ACE cannot add authority.
                continue
            if kind != 0:
                refuse('Unsupported Windows deployment ACE')
            mask = ctypes.c_uint32.from_address(ace.value+4).value
            trustee = sid_text(ctypes.c_void_p(ace.value+8))
            # OWNER RIGHTS applies to the already-verified object owner, not an arbitrary user.
            if trustee == 'S-1-3-4':
                trustee = owner_sid
            if trustee not in allowed and (secret or mask & 0x500d0156):
                refuse('Untrusted Windows deployment access')
    finally:
        kernel.LocalFree(descriptor)


def verify(package, manifest_file, digest):
    secure_path(Path(manifest_file).parent, True)
    secure_path(Path(__file__).parent, True)
    secure_path(manifest_file, True)
    data = Path(manifest_file).read_bytes()
    if hashlib.sha256(data).hexdigest() != digest:
        refuse('Independent package-manifest digest mismatch')
    manifest = json.loads(data)
    if manifest.get('format') != 2 or manifest.get('accepted_ancestor') != '34116e7ed8321c14c2a48b3542d68ce3ebddd7b8':
        refuse('Unsupported package lineage')
    package = Path(package).resolve()
    # Trust records and credentials must be independently controlled outside executable content.
    if Path(manifest_file).resolve().is_relative_to(package) or Path(__file__).resolve().is_relative_to(package):
        refuse('Trust anchor must be outside the executable package')
    secure_path(package)
    files_to_hash = []
    for directory, dirs, files in os.walk(package, followlinks=False):
        for name in dirs+files:
            path = Path(directory)/name
            if path.is_file():
                files_to_hash.append(path)
            elif path.is_dir():
                secure_path(path)
            else:
                refuse('Unexpected executable filesystem object')
    def verify_file(path):
        secure_path(path)
        return path.relative_to(package).as_posix(),hashlib.sha256(path.read_bytes()).hexdigest()
    with ThreadPoolExecutor(max_workers=8) as pool:
        found=dict(pool.map(verify_file,files_to_hash))
    if found != manifest['files']:
        refuse('Tampered, missing or unexpected package content')
    for required in ['artisan','vendor/autoload.php','vendor/composer/installed.json','composer.lock','package-lock.json','public/build/manifest.json','database/deployment/security-contract.json']:
        if required not in found:
            refuse('Incomplete executable/dependency/build package')
    return manifest


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--package', type=Path, required=True)
    ap.add_argument('--manifest', type=Path, required=True)
    ap.add_argument('--sha256', required=True)
    ap.add_argument('--target', type=Path, required=True)
    ap.add_argument('--credentials', type=Path, required=True)
    ap.add_argument('--php', required=True)
    ap.add_argument('--ini', type=Path, help='Private, independently controlled provisioning-only PHP configuration')
    ap.add_argument('--verify-only', action='store_true')
    args = ap.parse_args()
    manifest = verify(args.package, args.manifest, args.sha256)
    for path in [args.target, args.credentials]:
        secure_path(path.parent, True)
        secure_path(path, True)
        if path.resolve().is_relative_to(args.package.resolve()):
            refuse('Private inputs must be outside the executable package')
    if args.verify_only:
        print('VERIFIED_PACKAGE')
        return
    env = dict(os.environ)
    if any(env.get(name) for name in ['PHPRC','PHP_INI_SCAN_DIR','PHP_VALUE','PHP_ADMIN_VALUE','LD_PRELOAD','LD_AUDIT','LD_LIBRARY_PATH','DYLD_INSERT_LIBRARIES']):
        refuse('Unsupported runtime configuration override')
    php_command=[args.php]
    if args.ini:
        secure_path(args.ini, True)
        secure_path(args.ini.parent, True)
        if args.ini.resolve().is_relative_to(args.package.resolve()):
            refuse('Runtime configuration must be outside the package')
        php_command += ['-c',str(args.ini)]
        scan_guard=tempfile.TemporaryDirectory(prefix='ot-empty-php-scan-',dir=args.target.parent)
        secure_path(scan_guard.name, True)
        env['PHP_INI_SCAN_DIR']=scan_guard.name
    probe_env={k:v for k,v in env.items() if k.upper() in ['PATH','SYSTEMROOT','WINDIR','HOME','USERPROFILE','TEMP','TMP']}
    if args.ini:
        probe_env['PHP_INI_SCAN_DIR']=scan_guard.name
    probe=json.loads(subprocess.check_output([*php_command,'-r',"echo json_encode(['prepend'=>ini_get('auto_prepend_file'),'append'=>ini_get('auto_append_file'),'preload'=>ini_get('opcache.preload'),'ffi_preload'=>ini_get('ffi.preload'),'ini'=>php_ini_loaded_file(),'scanned'=>php_ini_scanned_files(),'extensions'=>get_loaded_extensions()]);"],env=probe_env,text=True))
    if any(probe.get(k) for k in ['prepend','append','preload','ffi_preload']):
        refuse('Unsupported PHP startup instrumentation')
    allowed_extensions={'core','date','libxml','openssl','pcre','zlib','filter','hash','json','pcntl','random','reflection','spl','session','standard','sodium','pdo','xml','calendar','ctype','curl','dom','mbstring','fileinfo','ftp','gd','gettext','iconv','intl','exif','mysqli','pdo_mysql','pdo_pgsql','pgsql','pdo_sqlite','phar','posix','readline','shmop','simplexml','sockets','sqlite3','sysvmsg','sysvsem','sysvshm','tokenizer','xmlreader','xmlwriter','xsl','zip','bcmath','com_dotnet','mysqlnd','ffi','bz2','dba','gmp','ldap','odbc','pdo_dblib','pdo_odbc','pspell','snmp','soap','tidy','enchant','zend opcache'}
    unsupported=[ext for ext in probe['extensions'] if ext.lower() not in allowed_extensions]
    if unsupported:
        refuse('Unsupported PHP extension: '+','.join(unsupported))
    for ini in [probe.get('ini'), *(probe.get('scanned') or '').replace('\n','').split(',')]:
        if ini and ini.strip():
            secure_path(ini.strip())
    if env.get('DB_SSLROOTCERT'):
        secure_path(env['DB_SSLROOTCERT'])
    # No source-supplied php.ini, prepend/preload, stale opcode cache or ambient APM enrollment.
    if any(k.startswith(('OTEL_', 'DD_', 'BLACKFIRE_', 'NEW_RELIC_')) and v for k,v in env.items()):
        refuse('Unsupported instrumentation environment')
    # This bootstrap is generated from trusted launcher bytes, never from package-controlled PHP.
    bootstrap = r'''<?php
    $info=json_decode(file_get_contents($argv[1]),true,32,JSON_THROW_ON_ERROR);
    define('ONE_TALIBON_VERIFIED_PACKAGE',$info);
    $bad=['auto_prepend_file','auto_append_file','opcache.preload','ffi.preload'];
    foreach($bad as $setting) { if(ini_get($setting)) { exit(81); } }
    foreach(get_loaded_extensions() as $ext) {
      if(!in_array(strtolower($ext),['core','date','libxml','openssl','pcre','zlib','filter','hash','json','pcntl','random','reflection','spl','session','standard','sodium','pdo','xml','calendar','ctype','curl','dom','mbstring','fileinfo','ftp','gd','gettext','iconv','intl','exif','mysqli','pdo_mysql','pdo_pgsql','pgsql','pdo_sqlite','phar','posix','readline','shmop','simplexml','sockets','sqlite3','sysvmsg','sysvsem','sysvshm','tokenizer','xmlreader','xmlwriter','xsl','zip','bcmath','com_dotnet','mysqlnd','ffi','bz2','dba','gmp','ldap','odbc','pdo_dblib','pdo_odbc','pspell','snmp','soap','tidy','enchant','zend opcache'],true)) { exit(82); }
    }
    require $argv[2].'/vendor/autoload.php';
    $app=require $argv[2].'/bootstrap/app.php';
    $app->useStoragePath($argv[3]);
    $kernel=$app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    $status=$kernel->call('deploy:persistent',['manifest'=>$argv[4],'credentials'=>$argv[5]]);
    echo $kernel->output(); exit($status);
    '''
    with tempfile.TemporaryDirectory(prefix='ot-private-bootstrap-', dir=args.target.parent) as temporary:
        root = Path(temporary)
        secure_path(root, True)
        info = {k:manifest[k] for k in ['source_sha','tree_sha','accepted_ancestor']}
        info.update(package_sha256=args.sha256, root=str(args.package.resolve()))
        (root/'attestation.json').write_text(json.dumps(info))
        (root/'bootstrap.php').write_text(bootstrap)
        (root/'storage').mkdir()
        for name in ['framework/cache','framework/sessions','framework/views','logs','app/private']:
            (root/'storage'/name).mkdir(parents=True,exist_ok=True)
        env['LOG_CHANNEL']='stderr'
        result = subprocess.run([*php_command,'-d','opcache.enable_cli=0',str(root/'bootstrap.php'),str(root/'attestation.json'),str(args.package.resolve()),str(root/'storage'),str(args.target.resolve()),str(args.credentials.resolve())],env=env,cwd=args.package)
        if result.returncode:
            raise SystemExit(result.returncode)


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        # No secret values, PHP/SQL diagnostics, source content or verifier material in errors.
        print('Verified persistent launch refused. ['+type(exc).__name__+']'+((' '+str(exc)) if type(exc) is RuntimeError else ''),file=sys.stderr)
        raise SystemExit(1)
