"""Bound the deployment successor and prove the moved SQL policy is unchanged."""
from pathlib import Path
import re
import subprocess

BASE = 'ad1d6d60e31e06a49c7eb15fdfbc192dc776179d'


def git(*args):
    return subprocess.check_output(['git', *args])


allowed = {
    'app/Deployment/PersistentInstaller.php', 'app/Console/Commands/InstallPersistent.php',
    'scripts/ci/verify-persistent-successor.py', 'tests/Manual/persistent-install-rehearsal.py',
    '.github/workflows/functional-completion-pg16.yml', '.github/workflows/persistent-install-pg16.yml',
    'docs/deployment/PERSISTENT-PG16.md',
    'app/Deployment/SecurityCatalog.php', 'app/Deployment/PersistentSecurity.php', 'app/Deployment/CredentialBoundary.php',
    'scripts/deployment/verified-install.py', 'scripts/deployment/build-package.py',
    'tests/Manual/build-security-contract.php', 'config/database.php',
}
changed = set(git('diff', '--name-only', BASE, 'HEAD').decode().splitlines())
guarded = set()
for p in Path('database/migrations').glob('*.php'):
    old = git('show', BASE+':'+p.as_posix()).decode()
    current = p.read_text(encoding='utf-8')
    if 'N03_DISPOSABLE_LEASE' in old:
        guarded.add(p.as_posix())
        # Every SQL heredoc, including canonical expected function/constraint definitions, stays exact.
        pattern = r"<<<'([^']+)'\n(.*?)\n\s*\1"
        assert re.findall(pattern, old, re.S) == re.findall(pattern, current, re.S), p
        assert "getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'" in current
        assert "! PersistentInstaller::active() &&" in current
        restored = current.replace('use App\\Deployment\\PersistentInstaller;\n', '')
        restored = restored.replace('if (! PersistentInstaller::active() && (', 'if (', 1)
        restored = restored.replace("!== 'talibon_portal_test'))", "!== 'talibon_portal_test')", 1)
        restored = restored.replace('PersistentInstaller::database()', "'talibon_portal_test'")
        restored = restored.replace('PersistentInstaller::bootstrapRole()', "'postgres'")
        assert re.sub(r'\s+', '', old) == re.sub(r'\s+', '', restored), 'Unexpected migration change: '+str(p)
    else:
        assert old == current, p

policies = {
    'G1B_DISPOSABLE_PG16_ROLE_INSTALL_R1.sql':'g1b',
    'G2_DISPOSABLE_PG16_CUSTODY_ROLE_EXTENSION_R1.sql':'g2',
    'N03_DISPOSABLE_PG16_ROLE_INSTALL_R1.sql':'n03',
    'N03_G2B_DISPOSABLE_PG16_ROLE_INSTALL_R1.sql':'g2b',
    'N03_K2_DISPOSABLE_PG16_ROLE_INSTALL_R1.sql':'k2',
    'N03_G3_DISPOSABLE_PG16_READER_ROLE_INSTALL_R1.sql':'g3',
}
for name, stage in policies.items():
    path = 'tests/Manual/sql/'+name
    allowed.add(path)
    old = git('show', BASE+':'+path).decode()
    prefix, tail = old.split('END $guard$;', 1)
    body, suffix = tail.rsplit('COMMIT;', 1)
    passwords = re.findall(r"^SELECT format\('ALTER ROLE.*\\gexec\n", body, re.M)
    body = re.sub(r"^SELECT format\('ALTER ROLE.*\\gexec\n", '', body, flags=re.M)
    body = re.sub(r'^(GRANT|REVOKE) (.*) ON DATABASE talibon_portal_test (.*);$',
                  lambda m: "DO $database_acl$ BEGIN EXECUTE format('"+m[1]+' '+m[2]+" ON DATABASE %I "+m[3]+"', current_database()); END $database_acl$;", body, flags=re.M)
    assert Path('database/deployment/'+stage+'.sql').read_text(encoding='utf-8') == '-- Shared privilege policy; entrypoints validate target and prerequisites.\n'+body.lstrip()
    assert Path(path).read_text(encoding='utf-8') == prefix+'END $guard$;\n\n\\ir ../../../database/deployment/'+stage+'.sql\n'+''.join(passwords)+'\nCOMMIT;'+suffix

allowed.update('database/deployment/'+stage+'.sql' for stage in [*policies.values(), 'finalize', 'registry'])
allowed.add('database/deployment/security-contract.json')
assert changed <= allowed | guarded | {p for p in changed if p.startswith('.forge/')}, changed-allowed-guarded
for path in ['composer.json','composer.lock','package.json','package-lock.json']:
    assert git('show', BASE+':'+path) == Path(path).read_bytes(), path
print('Persistent successor: bounded paths, unchanged SQL contracts/disposable guards and locked dependencies PASS')
