"""Check native course rendering, grading, and private-file boundaries without a network server."""
import io
import json
import os
from pathlib import Path
import re
import runpy
import sys
import tempfile
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'classroom'))

def request(app, path):
    out=[]
    env={'REQUEST_METHOD':'GET','PATH_INFO':path,'SERVER_NAME':'localhost','SERVER_PORT':'7667',
         'QUERY_STRING':'','wsgi.input':io.BytesIO(b''),'wsgi.url_scheme':'http','REMOTE_ADDR':'127.0.0.1'}
    body=b''.join(app(env,lambda status,headers:out.append((status,headers))))
    return out[0][0],body.decode('utf-8',errors='replace')

with tempfile.TemporaryDirectory(prefix='gubber-catsoop-check-') as runtime:
    os.environ['GUBBER_DATA']=runtime
    import server
    server.prepare()
    import catsoop
    native_root=Path(catsoop.__file__).parent
    courses=json.loads((ROOT/'content/courses.json').read_text())['courses']
    routes=0
    checks=0
    for c in courses:
        for path,expected in [('',c['title']),('/schedule','Sample schedule'),('/guide','Sample course guide')]:
            status,body=request(server.application,f'/learn/{c["id"]}{path}')
            assert status=='200 OK',(path,status)
            assert expected in BeautifulSoup(body,"html.parser").get_text(),(path,expected)
            assert 'Traceback (most recent call last)' not in body,path
            routes+=1
        for u in c['units']:
            for suffix,expected in [('',u['lesson']['heading']),('/practice',u['assignment']['questions'][0]['prompt'])]:
                path=f'/learn/{c["id"]}/{u["id"]}{suffix}'
                status,body=request(server.application,path)
                assert status=='200 OK',(path,status)
                assert expected in BeautifulSoup(body,"html.parser").get_text(),(path,expected)
                assert 'Traceback (most recent call last)' not in body,path
                routes+=1
            source=(ROOT/'classroom/courses'/c['id']/u['id']/'practice/content.catsoop').read_text()
            for kind,code in re.findall(r'<question (\w+)>\n(.*?)</question>',source,re.S):
                qtype=runpy.run_path(str(native_root/'__QTYPES__'/kind/(kind+'.py')))
                info=qtype['defaults'].copy()
                exec(code,info)
                solution=str(info['csq_soln'])
                def grade(value):
                    return qtype['handle_submission']({info['csq_name']:{'data':value}},**info)['score']
                assert grade(solution)==1,(c['id'],u['id'],kind,'correct answer rejected')
                bad=str((int(solution)+1)%3) if kind=='multiplechoice' else str(float(solution)+100)
                assert grade(bad)==0,(c['id'],u['id'],kind,'wrong answer accepted')
                checks+=2
                if kind=='smallbox':
                    for bad in ('not a number','nan','inf','1/0','__import__("os")'):
                        assert grade(bad)==0,('invalid numeric input accepted',bad)
                        checks+=1
    for path in ('/classroom/config.py','/classroom/runtime/_logs','/assets/../classroom/config.py','/.git/config'):
        status,_=request(server.application,path)
        assert status=='404 Not Found',(path,status)
    status,body=request(server.application,'/')
    assert status=='200 OK' and 'window.GUBBER_SERVER="/learn"' in body
    print(f'PASS: {routes} native CAT-SOOP pages, {checks} native grading checks, public homepage, and private-file boundaries.')
