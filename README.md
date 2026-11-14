# Gubber Classroom

An independent classroom template by Jose Carvajal-Beltran, replacing the old gubber.us homepage.
All courses, lessons, assignments, and dates are filler. This is not an official MIT service.

## What is live on gubber.us

GitHub Pages serves `index.html`, `assets/`, and `content/`. The classroom has three sample courses,
four modules per course, lesson pages, a schedule, sample problems, search, a notebook, and a course-outline download.
Browser practice runs in JavaScript. Answers and progress stay in the visitor's local browser.
It does not provide real enrollment, shared grades, or server submissions.

## Real CAT-SOOP is included

`classroom/courses/` contains genuine CAT-SOOP course sources, not HTML imitations.
`classroom/server.py` serves the custom homepage at `/` and CAT-SOOP at `/learn/`.
When running this server, lessons and practices also offer an **Open in CAT-SOOP** link.
CAT-SOOP handles accounts, enrollment permissions, stored submissions, and built-in grading.
The sample questions use inline (`legacy`) grading; no separate checker or code execution sandbox is needed.

GitHub Pages cannot run Python. The actual CAT-SOOP service must run on a Python host,
Linux server, or Raspberry Pi. No server hosting or domain migration is configured by this change.

### Run locally with Python 3.11 or 3.12

CAT-SOOP 19.0.9 is pinned and was checked with Python 3.12. Use Python 3.12 for the container.

```sh
python3.12 -m venv .venv
.venv/bin/pip install -r classroom/requirements.txt
.venv/bin/python classroom/server.py
```

Open `http://localhost:7667/` for the custom classroom.
Open `http://localhost:7667/learn/materials` for the actual CAT-SOOP course.
The other courses are at `/learn/circuits` and `/learn/workshop`.
Runtime logs and accounts are stored in `classroom/runtime/`, which Git ignores.

### Run with Docker

```sh
docker compose up --build -d
```

Open `http://localhost:7667/`. The named volume preserves accounts and submissions across restarts.
The published port binds to localhost for local use.

### Enroll an account

1. Open a native CAT-SOOP course and use its registration flow to create an account.
2. Run this command with that exact username:

```sh
.venv/bin/python classroom/server.py --enroll YOUR_USERNAME --course materials --role Student
```

For Docker:

```sh
docker compose exec classroom python classroom/server.py --enroll YOUR_USERNAME --course materials --role Student
```

Use `--role Instructor` for your own instructor account. Enroll separately in each course.
There are no seeded users, shared passwords, or automatic instructor permissions.
Guests can read; only explicitly enrolled users can submit. Runtime roles stay outside Git.

### Before using real student data

The included configuration is for local template development. For public CAT-SOOP hosting,
set `GUBBER_ORIGIN` to the actual HTTPS origin, configure a TLS reverse proxy,
use encrypted persistent storage, and set a backup policy. Decide registration and enrollment policies
before adding students. Follow CAT-SOOP's public server configuration guide:
https://catsoop.org/docs/installing/server_configuration

## Replace the filler

Edit `content/courses.json`. Course titles, modules, lesson text, questions, and solutions live there.
Then regenerate the CAT-SOOP courses:

```sh
python3 scripts/generate_catsoop.py
```

Commit both the JSON and the generated `classroom/courses/` changes.
Restart the Python service to copy revised course content into its runtime directory.
Existing user roles and logs remain in runtime storage. Keep unit and question IDs stable after real submissions exist.

Change `assets/classroom.css` for the design and `assets/classroom.js` for the public preview behavior.
The public sample JSON contains its solutions intentionally. Do not place private exams or student data there.

## Preview the public site

```sh
python3 scripts/build.py
```

This creates `dist/` with only public files. The repository's existing GitHub Pages root publishing
uses the source files directly; `CNAME` remains `gubber.us`.
The original hackathon files remain in the repository and Git history.

## Validation

```sh
node --check assets/classroom.js
.venv/bin/python scripts/check_catsoop.py
```

The CAT-SOOP check makes in-process WSGI requests, verifies each lesson and practice renders,
and checks every generated question's correct and incorrect answers. It does not open a server port.

CAT-SOOP is provided by its upstream package under AGPLv3+. See https://catsoop.org/ for source and license details.
The custom UI and sample course content are authored in this repository. No upstream course content was copied.
