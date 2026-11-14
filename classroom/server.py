"""Serve the classroom UI and real CAT-SOOP under /learn on one origin."""
import argparse
import json
import mimetypes
import os
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = Path(os.environ.get('GUBBER_DATA', str(ROOT/'classroom/runtime'))).resolve()
COURSE_IDS = {c['id'] for c in json.loads((ROOT/'content/courses.json').read_text())['courses']}

def prepare():
    RUNTIME.mkdir(parents=True, exist_ok=True)
    shutil.copytree(ROOT/'classroom/courses', RUNTIME/'courses', dirs_exist_ok=True)
    os.environ['CATSOOP_CONFIG'] = str(ROOT/'classroom/config.py')


def application(environ, start_response):
    path = environ.get('PATH_INFO', '/')
    if path == '/learn':
        start_response('302 Found', [('Location', '/learn/'), ('Content-Length', '0')])
        return [b'']
    if path.startswith('/learn/'):
        from catsoop.wsgi import application as catsoop
        native = environ.copy()
        native['SCRIPT_NAME'] = environ.get('SCRIPT_NAME', '')+'/learn'
        native['PATH_INFO'] = path[len('/learn'):]
        return catsoop(native, start_response)
    # Only explicitly public files are served, never configuration or logs.
    relative = path.lstrip('/')
    target = (ROOT/('index.html' if path == '/' else relative)).resolve()
    allowed = (path in ('/', '/index.html') and target == ROOT/'index.html') or any(
        relative.startswith(name+'/') and target.is_relative_to(ROOT/name) for name in ('assets','content')
    )
    if not allowed or not target.is_file():
        body=b'Not found'
        start_response('404 Not Found', [('Content-Type','text/plain'),('Content-Length',str(len(body)))])
        return [body]
    if environ.get('REQUEST_METHOD') not in ('GET', 'HEAD'):
        start_response('405 Method Not Allowed',[('Allow','GET, HEAD'),('Content-Length','0')])
        return [b'']
    body=target.read_bytes()
    if target == ROOT/'index.html':
        body=body.replace(b'<script src="assets/classroom.js"',b'<script>window.GUBBER_SERVER="/learn";</script><script src="assets/classroom.js"')
    content_type=mimetypes.guess_type(str(target))[0] or 'application/octet-stream'
    start_response('200 OK', [('Content-Type', content_type), ('Content-Length', str(len(body))), ('X-Content-Type-Options','nosniff')])
    return [] if environ.get('REQUEST_METHOD')=='HEAD' else [body]


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=int(os.environ.get('PORT','7667')))
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--enroll', help='Enroll an existing CAT-SOOP username, without setting a password')
    parser.add_argument('--course', choices=sorted(COURSE_IDS), default='materials')
    parser.add_argument('--role', choices=['Student','Instructor'], default='Student')
    args=parser.parse_args()
    prepare()
    if args.enroll:
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,80}',args.enroll):
            parser.error('Username must contain only letters, numbers, underscores, and hyphens.')
        users=RUNTIME/'courses'/args.course/'__USERS__'
        users.mkdir(exist_ok=True)
        (users/(args.enroll+'.py')).write_text(f'role = {args.role!r}\n')
        print(f'Enrolled {args.enroll} in {args.course} as {args.role}.')
        return
    from cheroot.wsgi import Server
    print(f'Gubber: http://localhost:{args.port}/',flush=True)
    print(f'CAT-SOOP: http://localhost:{args.port}/learn/',flush=True)
    Server((args.host,args.port), application).start()

if __name__ == '__main__':
    main()
