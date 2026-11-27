"""Build in an independently trusted checkout after locked dependency/asset qualification.
Publish the external manifest digest and launcher digest through the acceptance channel.
Never generate this trust manifest from a running or externally supplied package.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import shutil
import subprocess
import tarfile

ap=argparse.ArgumentParser(description=__doc__)
ap.add_argument('--output',type=Path,required=True)
args=ap.parse_args()
source=Path(__file__).resolve().parents[2]
def git(*argv):
    return subprocess.check_output(['git',*argv],cwd=source)
if git('status','--porcelain','--untracked-files=no').strip():
    raise RuntimeError('Trusted package builder requires a clean committed checkout')
sha=git('rev-parse','HEAD').decode().strip()
base='34116e7ed8321c14c2a48b3542d68ce3ebddd7b8'
subprocess.run(['git','merge-base','--is-ancestor',base,sha],cwd=source,check=True)
root=args.output.resolve()
root.mkdir(mode=0o700,parents=True,exist_ok=False)
package=root/'package'
package.mkdir()
with tarfile.open(fileobj=io.BytesIO(git('archive',sha,'app','bootstrap','config','database','routes','resources','public','bin','artisan','composer.json','composer.lock','package.json','package-lock.json'))) as archive:
    for member in archive:
        name=member.name
        if not (name in ['artisan','composer.json','composer.lock','package.json','package-lock.json'] or name.startswith(('app/','bootstrap/','config/','database/','routes/','resources/','public/','bin/'))):
            continue
        if member.issym() or member.islnk():
            raise RuntimeError('Symbolic executable source is unsupported')
        if member.isfile():
            path=package/name
            path.parent.mkdir(parents=True,exist_ok=True)
            path.write_bytes(archive.extractfile(member).read())
for rel in ['vendor','public/build','bootstrap/cache']:
    if not (source/rel).is_dir():
        raise RuntimeError('Missing independently installed dependencies/assets')
    shutil.copytree(source/rel,package/rel,dirs_exist_ok=True,copy_function=shutil.copyfile)
# A previous config/route cache is executable drift, not a deployable dependency.
for name in ['config.php','routes-v7.php','events.php']:
    if (package/'bootstrap/cache'/name).exists():
        raise RuntimeError('Cached runtime configuration cannot enter a trusted install package')
manifest={'format':2,'source_sha':sha,'tree_sha':git('rev-parse',sha+'^{tree}').decode().strip(),'accepted_ancestor':base,
          'files':{p.relative_to(package).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(package.rglob('*')) if p.is_file()}}
file=root/'package-manifest.json'
file.write_text(json.dumps(manifest,sort_keys=True,separators=(',',':')),encoding='utf-8')
file.chmod(0o600)
launcher=source/'scripts/deployment/verified-install.py'
shutil.copy2(launcher,root/'verified-install.py')
print(json.dumps({'source_sha':sha,'tree_sha':manifest['tree_sha'],'package_manifest_sha256':hashlib.sha256(file.read_bytes()).hexdigest(),
                  'launcher_sha256':hashlib.sha256(launcher.read_bytes()).hexdigest(),'files':len(manifest['files'])}))
