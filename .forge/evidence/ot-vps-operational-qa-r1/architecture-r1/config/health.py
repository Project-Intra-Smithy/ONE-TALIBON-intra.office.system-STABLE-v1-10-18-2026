#!/usr/bin/python3
"""Credential-free single-node health report; alerts stay in the operator journal."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import time

def state_issues(name, state):
    return [name+': unavailable'] if not state['running'] or state['health']=='unhealthy' else []

def collect():
    issues=[]
    states={}
    for name in ['app','db','caddy']:
        result=subprocess.run(['docker','inspect','devtestportal-'+name+'-1'],capture_output=True,text=True,timeout=15)
        if result.returncode:
            issues.append(name+': missing');continue
        info=json.loads(result.stdout)[0]
        states[name]={'running':info['State']['Running'],'health':info['State'].get('Health',{}).get('Status','not_configured'),'restarts':info['RestartCount']}
        issues.extend(state_issues(name,states[name]))
        if name in ['app','db'] and info['NetworkSettings'].get('Ports') and any(info['NetworkSettings']['Ports'].values()): issues.append(name+': published port')
    disk=shutil.disk_usage('/')
    memory={k:int(v.split()[0]) for k,v in (line.split(':',1) for line in Path('/proc/meminfo').read_text().splitlines())}
    if disk.free<20*1024**3 or disk.used/disk.total>.85:issues.append('disk: pressure')
    if memory['MemAvailable']<2*1024**2:issues.append('memory: pressure')
    probe=subprocess.run(['curl','--silent','--show-error','--max-time','15','--output','/dev/null','--write-out','%{http_code}',
                          '--resolve','devtestportal.talibonbohol.com:443:127.0.0.1','https://devtestportal.talibonbohol.com/login'],capture_output=True,text=True)
    if probe.returncode or probe.stdout!='200':issues.append('https: unavailable or TLS failure')
    query=r"try { require 'vendor/autoload.php'; $a=require 'bootstrap/app.php'; $a->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); $v=Illuminate\Support\Facades\DB::selectOne('SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()'); echo $v->ssl ? 'TLS_OK' : 'TLS_MISSING'; } catch(Throwable $e) {exit(1);}"
    database=subprocess.run(['docker','exec','devtestportal-app-1','php','-r',query],capture_output=True,text=True,timeout=20)
    if database.returncode or database.stdout!='TLS_OK':issues.append('database: runtime TLS check failed')
    certificate=subprocess.run(['openssl','x509','-checkend','2592000','-noout','-in','/opt/devtestportal/infra/postgres-tls/server.crt'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    if certificate.returncode:issues.append('database certificate: renewal due within 30 days')
    return {'time':int(time.time()),'issues':issues,'containers':states,'disk_free_bytes':disk.free,'memory_available_kib':memory['MemAvailable'],'tls_login_http':probe.stdout}

if __name__=='__main__':
    if '--self-test' in sys.argv:
        # The evaluator must classify missing/stopped/unhealthy without exposing Docker env.
        assert not state_issues('app',{'running':True,'health':'healthy'})
        assert state_issues('app',{'running':False,'health':'healthy'})==['app: unavailable']
        assert state_issues('db',{'running':True,'health':'unhealthy'})==['db: unavailable']
        print('SELF_TEST_PASS');raise SystemExit(0)
    report=collect()
    root=Path('/var/lib/one-talibon');root.mkdir(mode=0o700,exist_ok=True)
    (root/'health.json').write_text(json.dumps(report,sort_keys=True))
    print(json.dumps(report,sort_keys=True))
    if report['issues']:
        subprocess.run(['logger','-p','daemon.crit','-t','one-talibon-health','; '.join(report['issues'])],check=True)
        raise SystemExit(1)
