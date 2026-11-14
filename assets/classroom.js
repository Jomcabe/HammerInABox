"use strict";
const $ = (s) => document.querySelector(s);
const icons = {
  overview:
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  materials:
    '<path d="M3 4h6a5 5 0 0 1 3 1 5 5 0 0 1 3-1h6v15h-6a5 5 0 0 0-3 1 5 5 0 0 0-3-1H3z"/><path d="M12 5v15"/>',
  schedule:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M7 15h3m4 0h3"/>',
  assignments:
    '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 11l2 2 4-4m-6 8h6"/>',
  resources: '<path d="M3 7V4h7l2 3h9v13H3z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  file: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.file}</svg>`;
const glyphs = (html) =>
  html
    .replaceAll(
      "↗",
      '<svg class="mini-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8"/></svg>',
    )
    .replaceAll(
      "▤",
      icon("materials").replace("<svg ", '<svg class="mini-icon" '),
    )
    .replaceAll(
      "▢",
      icon("assignments").replace("<svg ", '<svg class="mini-icon" '),
    );
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const nativeLink = (path, label = "Open in CAT-SOOP") =>
  window.GUBBER_SERVER
    ? `<a class="secondary" href="${window.GUBBER_SERVER}/${course.id}${path}">${label} ↗</a>`
    : "";
const href = (view = "overview", id = "") =>
  `#/${course.id}/${view}${id ? "/" + id : ""}`;
let data,
  course,
  view,
  detail,
  assignmentFilter = "all",
  storageAvailable = true,
  toastTimer;
let progress = {};
try {
  progress = JSON.parse(localStorage.getItem("gubber-classroom-v1") || "{}");
  if (!progress || typeof progress !== "object" || Array.isArray(progress))
    progress = {};
} catch {
  storageAvailable = false;
}
const stateKey = (unit) => `${course.id}:${unit.id}`;
const read = (unit) => progress[stateKey(unit)]?.read === true;
const passed = (unit) =>
  unit.assignment.questions.every(
    (q) => progress[stateKey(unit)]?.answers?.[q.id]?.correct === true,
  );
function persist() {
  try {
    localStorage.setItem("gubber-classroom-v1", JSON.stringify(progress));
    return true;
  } catch {
    storageAvailable = false;
    return false;
  }
}
function unitState(unit) {
  const key = stateKey(unit);
  if (!progress[key] || typeof progress[key] !== "object") progress[key] = {};
  return progress[key];
}
function setRead(unit) {
  unitState(unit).read = true;
  persist();
}
const pill = (unit) =>
  passed(unit)
    ? '<span class="pill">Completed</span>'
    : '<span class="pill neutral">Not started</span>';
function head(title, description, eyebrow = course.code + " · SAMPLE COURSE") {
  return `<div class="eyebrow">${esc(eyebrow)}</div><div class="page-heading"><div><h1>${esc(title)}</h1><p>${esc(description)}</p></div><div class="term">${icon("calendar")} ${esc(course.term)}</div></div>`;
}
function orbit() {
  return `<div class="hero-art" aria-hidden="true"><div class="orbit"><svg viewBox="0 0 280 240"><g fill="none" stroke="#adc984" stroke-width=".8" opacity=".65"><ellipse cx="140" cy="120" rx="105" ry="44" transform="rotate(-30 140 120)"/><ellipse cx="140" cy="120" rx="105" ry="44" transform="rotate(30 140 120)"/><ellipse cx="140" cy="120" rx="105" ry="44" transform="rotate(90 140 120)"/><circle cx="140" cy="120" r="80" stroke-dasharray="2 5" opacity=".3"/></g><g fill="#d4e79c"><circle cx="140" cy="120" r="14"/><circle cx="54" cy="88" r="6"/><circle cx="213" cy="66" r="6"/><circle cx="140" cy="224" r="6"/></g><g fill="none" stroke="#c6dd9b" opacity=".4"><path d="M140 24v-9m-5 5h10M237 151v-9m-5 5h10M48 179v-7m-4 3.5h8"/></g></svg></div><span class="art-label">SMALL PARTS. BIG POSSIBILITIES.</span></div>`;
}
function unitCard(u) {
  return `<a href="${href("lesson", u.id)}" class="unit-card ${u.number === 1 ? "featured" : ""}"><div class="unit-card-body"><span class="unit-number">${String(u.number).padStart(2, "0")}</span><div><h3 class="unit-title">${esc(u.title)}</h3><div class="unit-subtitle">${esc(u.description)}</div></div><span class="unit-arrow">↗</span></div><div class="unit-card-footer"><div class="unit-items"><span>▤ &nbsp; 1 lesson</span><span>▢ &nbsp; 1 practice</span><span>${u.duration} min</span></div>${read(u) ? '<span class="pill">Lesson read</span>' : '<span class="pill neutral">Sample module</span>'}</div></a>`;
}
function overview() {
  const total = course.units.length;
  const completed = course.units.filter(read).length;
  const percent = Math.round((completed / total) * 100);
  const next = course.units.find((u) => !read(u)) || course.units[0];
  return `${head("Room to get curious.", "A place to learn, work things out, and build something new.", "WELCOME TO GUBBER CLASSROOM")}
<section class="hero"><div class="hero-copy"><div class="hero-kicker">${esc(course.code)} &nbsp;·&nbsp; ${esc(course.title.toUpperCase())}</div><h2>${esc(course.hero)}</h2><p>${esc(course.description)} Start with a lesson. Try a problem. See where it takes you.</p><a class="primary" href="${href("lesson", next.id)}">${completed ? "Continue learning" : "Explore the first lesson"} <span>↗</span></a></div>${orbit()}</section>
<div class="stats-strip"><div class="stat"><div class="stat-icon">${icon("materials")}</div><div><div class="stat-value">04 <small>modules</small></div><div class="stat-label">Ideas to explore</div></div></div><div class="stat"><div class="stat-icon">${icon("assignments")}</div><div><div class="stat-value">08 <small>questions</small></div><div class="stat-label">Learn by doing</div></div></div><div class="stat"><div class="stat-icon">${icon("clock")}</div><div><div class="stat-value">Your pace</div><div class="stat-label">No deadlines yet</div></div></div></div>
<div class="content-grid"><section><div class="section-heading"><h2>The learning path</h2><a href="${href("materials")}">All course material &nbsp;↗</a></div>${course.units.slice(0, 3).map(unitCard).join("")}<div class="overview-bottom"><p><strong>Something to make your own.</strong>The final module brings your ideas together.</p><a href="${href("lesson", course.units[3].id)}">Explore module 04 &nbsp;↗</a></div></section>
<aside class="right-rail" aria-label="Course information"><section class="rail-card"><div class="rail-heading">On the horizon <span>UP NEXT</span></div><div class="up-next"><div class="eyebrow">PRACTICE 01</div><h3>${esc(course.units[0].title)}</h3><p>2 questions &nbsp;·&nbsp; Self-paced</p></div><div class="up-next"><div class="eyebrow">PROJECT SPACE</div><h3>Your next good idea</h3><p>A blank canvas for a future project.</p></div><a class="rail-link" href="${href("assignments")}">View assignments <span>→</span></a></section>
<section class="rail-card notice-card"><span class="mono">A NOTE FROM JOSE</span><h3>Every classroom<br>starts somewhere.</h3><p>This one is a work in progress. The lessons and problems are samples, ready for whatever comes next.</p><a class="rail-link" href="${href("about")}">Meet the classroom <span>↗</span></a></section>
<section class="rail-card"><div class="rail-heading">Your little head start</div><div class="progress-wrap"><div class="progress-ring" style="--progress:${percent}%"><span>${percent}%</span></div><p><strong>${completed} of ${total} lessons read</strong><br>Saved in this browser only.</p></div></section></aside></div>`;
}
function materials() {
  return (
    head(
      course.title,
      "Four small modules. Plenty of room for your own ideas.",
    ) +
    `<div class="material-groups">${course.units.map((u) => `<section class="material-group"><div class="unit-number">${String(u.number).padStart(2, "0")}</div><div class="eyebrow">MODULE ${String(u.number).padStart(2, "0")}</div><h2>${esc(u.title)}</h2><p>${esc(u.description)}</p><a class="material-item" href="${href("lesson", u.id)}">${iconInline("▤")} Lesson & notes <span>${read(u) ? "Read ✓" : u.duration + " min"} &nbsp;↗</span></a><a class="material-item" href="${href("assignment", u.assignment.id)}">${iconInline("▢")} Practice ${String(u.number).padStart(2, "0")} <span>2 questions &nbsp;↗</span></a></section>`).join("")}</div>`
  );
}
function iconInline(symbol) {
  return `<span aria-hidden="true">${symbol}</span>`;
}
function assignments() {
  const filtered = course.units.filter(
    (u) =>
      assignmentFilter === "all" ||
      (assignmentFilter === "complete" ? passed(u) : !passed(u)),
  );
  return (
    head(
      "A little practice goes a long way.",
      "Try a concept check and a short calculation after each lesson.",
    ) +
    `<div class="demo-note">Sample problems · Unlimited attempts · Progress stays in this browser. This preview does not submit grades to a teacher.</div><div class="filter-bar" role="group" aria-label="Filter assignments">${[
      ["all", "All assignments"],
      ["open", "To explore"],
      ["complete", "Completed"],
    ]
      .map(
        ([id, title]) =>
          `<button class="filter ${assignmentFilter === id ? "active" : ""}" data-filter="${id}" aria-pressed="${assignmentFilter === id}">${title}</button>`,
      )
      .join(
        "",
      )}</div><div class="assignment-list">${filtered.length ? filtered.map((u) => `<a href="${href("assignment", u.assignment.id)}" class="assignment-row"><span class="unit-number">${String(u.number).padStart(2, "0")}</span><div><h3>${esc(u.assignment.title)}</h3><p>2 questions &nbsp;·&nbsp; Module ${u.number} &nbsp;·&nbsp; No deadline</p></div>${pill(u)}<span class="unit-arrow">↗</span></a>`).join("") : '<div class="empty-state"><h2>Room for a first step.</h2>No completed assignments yet. Try any sample practice to get started.</div>'}</div>`
  );
}
function schedule() {
  return (
    head(
      "A plan, with room to wander.",
      "A placeholder sequence for a future term. Dates and deadlines are not set.",
    ) +
    `<div class="table-scroll"><table class="schedule-table"><thead><tr><th>Week</th><th>Focus</th><th>Material</th><th>Practice</th></tr></thead><tbody>${course.units.map((u) => `<tr><td>${String(u.number).padStart(2, "0")}</td><td>${esc(u.title)}<div class="unit-subtitle">Dates to be announced</div></td><td><a href="${href("lesson", u.id)}">Lesson ${String(u.number).padStart(2, "0")} ↗</a></td><td><a href="${href("assignment", u.assignment.id)}">Practice ${String(u.number).padStart(2, "0")} ↗</a></td></tr>`).join("")}</tbody></table></div><section class="rail-card notice-card" style="margin-top:24px;max-width:550px"><h3>Make the schedule yours.</h3><p>Each week is a starting point. Future readings, studio sessions, office hours, and project milestones will live here.</p></section>`
  );
}
function resources() {
  return (
    head(
      "Keep a few good things close.",
      "Reference pages, a notebook, and space for future handouts.",
    ) +
    `<div class="resource-grid"><section class="resource-card">${icon("file")}<h2>Course guide</h2><p>A sample syllabus with the learning path, expectations, and room for future policies.</p><button data-action="syllabus">Read the sample syllabus &nbsp;↗</button></section><section class="resource-card">${icon("materials")}<h2>Your notebook</h2><p>A place for rough ideas and questions. Notes save locally in this browser.</p><button data-action="notebook">Open your notebook &nbsp;↗</button></section><section class="resource-card">${icon("resources")}<h2>Course outline</h2><p>A simple text outline you can keep, print, or use as a starting point.</p><button data-action="download">Download the outline &nbsp;↓</button></section><section class="resource-card">${icon("assignments")}<h2>Practice library</h2><p>All the sample problems in one place. Check an answer and get instant feedback.</p><a href="${href("assignments")}">Browse sample practice &nbsp;↗</a></section><section class="resource-card">${icon("overview")}<h2>CAT-SOOP</h2><p>The Python learning system behind the server course template in this project.</p><a href="https://catsoop.org/" target="_blank" rel="noopener">Visit CAT-SOOP &nbsp;↗</a></section><section class="resource-card">${icon("clock")}<h2>A fresh start</h2><p>Reset only this course’s sample answers, lesson progress, and notebook in this browser.</p><button data-action="reset">Reset course progress &nbsp;↗</button></section></div>`
  );
}
function about() {
  return (
    head(
      "A classroom for what comes next.",
      "Independent, curious, and very much a work in progress.",
    ) +
    `<section class="reading about-section"><h2>Welcome to Gubber.</h2><p>This is an independent classroom by Jose Carvajal-Beltran. A place for future lessons, experiments, and things worth figuring out.</p><p>For now, the courses, week numbers, assignments, and policies are placeholders. Explore freely. The sample answers and notes stay in your browser.</p><h3>Start small. Keep building.</h3><p>Choose a course, open a lesson, and try its practice problems. Nothing is due. There are no real grades or enrolled students in this template.</p><h3>Built with a future classroom in mind.</h3><p>The repository includes real CAT-SOOP course files for a Python server. The public preview on GitHub Pages is a standalone template. Accounts, shared submissions, and teacher grading need that server to be deployed.</p><p>Gubber is an independent project and is not an official MIT course or service.</p><a class="primary dark" href="${href("materials")}">Explore the material <span>↗</span></a></section>`
  );
}
function lesson() {
  const u = course.units.find((u) => u.id === detail);
  if (!u) return missing();
  const l = u.lesson;
  return `<a class="back-link" href="${href("materials")}">← &nbsp; Course material</a>${head(u.title, u.description, `MODULE ${String(u.number).padStart(2, "0")} · SAMPLE LESSON`)}<div class="lesson-layout"><article class="reading">${nativeLink("/" + u.id)}<h2>${esc(l.heading)}</h2><p>${esc(l.body)}</p><blockquote>Notice the details. Ask a question. Try it out.</blockquote><h2>A simple example</h2><p>${esc(l.example)}</p><div class="formula">${esc(l.formula)}</div><h2>Pause and try</h2><p>${esc(l.activity)}</p><div class="lesson-nav"><button class="secondary" data-action="mark-read" data-unit="${u.id}">${read(u) ? "Lesson read ✓" : "Mark lesson as read"}</button><a class="primary dark" href="${href("assignment", u.assignment.id)}">Try the practice <span>↗</span></a></div></article><aside class="lesson-rail"><section class="rail-card"><div class="rail-heading">In this lesson</div><p class="unit-subtitle">01 &nbsp; ${esc(l.heading)}<br><br>02 &nbsp; A simple example<br><br>03 &nbsp; Pause and try</p><a class="rail-link" href="${href("schedule")}">View course sequence <span>↗</span></a></section><section class="rail-card notice-card"><div class="eyebrow">MAKE A NOTE</div><p>What clicked? What still feels fuzzy?</p><label class="sr-only" for="lesson-notes">Lesson notes</label><textarea class="note-input" id="lesson-notes" data-note="${u.id}" placeholder="Leave yourself a thought…">${esc(progress[stateKey(u)]?.note || "")}</textarea><div class="saving-label">${storageAvailable ? "Saved in this browser only." : "Browser storage is unavailable."}</div></section></aside></div>`;
}
function questionCard(q, index, u) {
  const saved = progress[stateKey(u)]?.answers?.[q.id];
  return `<form class="question-card" data-question="${q.id}" data-unit="${u.id}"><div class="question-header"><span>QUESTION ${String(index + 1).padStart(2, "0")}</span><span>${q.type === "choice" ? "CONCEPT CHECK" : "QUICK CALCULATION"}</span></div><h2 id="question-${q.id}">${esc(q.prompt)}</h2><div role="group" aria-labelledby="question-${q.id}">${q.type === "choice" ? q.options.map((opt, i) => `<label class="option"><input type="radio" name="answer" value="${i}" ${saved?.value === String(i) ? "checked" : ""} required><span>${esc(opt)}</span></label>`).join("") : `<label class="sr-only" for="answer-${q.id}">Your answer in ${esc(q.unit)}</label><div class="number-input"><input id="answer-${q.id}" type="number" name="answer" step="any" value="${esc(saved?.value || "")}" placeholder="Your answer" required><span>${esc(q.unit)}</span></div>`}</div><div class="question-actions"><button type="submit" class="primary dark">Check answer <span>→</span></button><button type="button" class="text-button" data-action="hint">Need a hint?</button></div><div class="hint" hidden>${esc(q.hint)}</div><div class="feedback-zone" aria-live="polite">${saved?.checked ? feedback(q, saved.correct) : ""}</div></form>`;
}
function feedback(q, correct) {
  return `<div class="question-feedback ${correct ? "" : "wrong"}"><strong>${correct ? "That’s it." : "Not quite yet."}</strong> ${correct ? esc(q.explanation) : "Take another look at the relationship and try again. You have unlimited attempts."}</div>`;
}
function assignment() {
  const u = course.units.find((u) => u.assignment.id === detail);
  if (!u) return missing();
  return `<a class="back-link" href="${href("assignments")}">← &nbsp; All assignments</a>${head(u.assignment.title, "Two small checks to put the lesson into practice.", `${course.code} · SAMPLE PRACTICE`)}<div class="demo-note">Browser practice only. Answers save on this device and do not count toward a real grade.</div><div class="lesson-layout"><section>${nativeLink("/" + u.id + "/practice")}${u.assignment.questions.map((q, i) => questionCard(q, i, u)).join("")}<div class="lesson-nav"><a href="${href("lesson", u.id)}" class="secondary">← Revisit the lesson</a>${u.number < course.units.length ? `<a class="primary dark" href="${href("lesson", course.units[u.number].id)}">Next module <span>→</span></a>` : `<a class="primary dark" href="${href("materials")}">Back to learning path <span>→</span></a>`}</div></section><aside><section class="rail-card"><div class="rail-heading">Your practice</div><p class="unit-subtitle">2 questions<br><br>No deadline<br><br>Unlimited attempts<br><br>Feedback after each answer</p><a class="rail-link" href="${href("lesson", u.id)}">Open lesson notes <span>↗</span></a></section><section class="rail-card notice-card"><h3>Working it out counts.</h3><p>Take your time. Write down the relationship. Keep track of the units.</p></section></aside></div>`;
}
function missing() {
  return (
    head(
      "This page wandered off.",
      "Try the learning path to find your next step.",
    ) +
    `<a class="primary dark" href="${href("materials")}">Back to the material →</a>`
  );
}
const titles = {
  overview: "Overview",
  materials: "Course material",
  schedule: "Schedule",
  assignments: "Assignments",
  resources: "Resources",
  about: "About",
  lesson: "Lesson",
  assignment: "Practice",
};
function closeNav() {
  $("#sidebar").classList.remove("open");
  $("#menu-toggle").setAttribute("aria-expanded", "false");
  $("#backdrop").hidden = true;
}
function render(focus = false) {
  const parts = location.hash.slice(2).split("/");
  course = data.courses.find((c) => c.id === parts[0]) || data.courses[0];
  view = parts[1] || "overview";
  detail = parts[2] || "";
  $("#course-select").value = course.id;
  $("#breadcrumb").textContent = titles[view] || "Page";
  $("#navigation").innerHTML = [
    "overview",
    "materials",
    "schedule",
    "assignments",
    "resources",
  ]
    .map(
      (v) =>
        `<a class="nav-link ${view === v || (v === "materials" && view === "lesson") || (v === "assignments" && view === "assignment") ? "active" : ""}" href="${href(v)}" ${view === v ? 'aria-current="page"' : ""}>${icon(v)}<span>${titles[v]}</span>${v === "assignments" ? '<span class="nav-count">4</span>' : ""}</a>`,
    )
    .join("");
  const pages = {
    overview,
    materials,
    schedule,
    assignments,
    resources,
    about,
    lesson,
    assignment,
  };
  $("#main").innerHTML = glyphs(
    `<div class="view-enter">${(pages[view] || missing)()}</div>`,
  );
  document.title = `${titles[view] || "Page"} · ${course.title} · Gubber`;
  closeNav();
  if (focus) {
    window.scrollTo(0, 0);
    $("#main").focus({ preventScroll: true });
  }
}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 3200);
}
function modal(title, body) {
  $("#modal-title").textContent = title;
  $("#modal-body").innerHTML = body;
  $("#modal").showModal();
}
function openSearch() {
  modal(
    "A little help finding things.",
    `<label class="sr-only" for="search-input">Search lessons and assignments</label><input type="search" class="search-input" id="search-input" placeholder="Try a lesson, topic, or practice…" autocomplete="off"><div id="search-results"></div>`,
  );
  const input = $("#search-input");
  function update() {
    const query = input.value.trim().toLowerCase();
    let results = [];
    for (const c of data.courses) {
      for (const u of c.units) {
        if (
          !query ||
          [c.title, u.title, u.description, u.lesson.body]
            .join(" ")
            .toLowerCase()
            .includes(query)
        ) {
          results.push(
            `<a class="search-result" href="#/${c.id}/lesson/${u.id}">${esc(u.title)}<small>${esc(c.title)} · Lesson ${u.number}</small></a>`,
          );
          results.push(
            `<a class="search-result" href="#/${c.id}/assignment/${u.assignment.id}">${esc(u.assignment.title)}<small>${esc(c.title)} · Practice</small></a>`,
          );
        }
      }
    }
    $("#search-results").innerHTML =
      results.slice(0, 8).join("") ||
      "<p>No matches yet. Try another word.</p>";
  }
  input.addEventListener("input", update);
  update();
  input.focus();
}
function downloadOutline() {
  const text =
    `${course.code} — ${course.title}\nGubber Classroom · Sample course outline\n\n${course.description}\n\nAll dates and policies are placeholders.\n\n` +
    course.units
      .map(
        (u) =>
          `MODULE ${u.number}: ${u.title}\n${u.description}\nLesson: ${u.lesson.heading}\n${u.lesson.body}\nActivity: ${u.lesson.activity}\nPractice: ${u.assignment.title} (2 questions)\n`,
      )
      .join("\n");
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `gubber-${course.id}-outline.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Course outline downloaded.");
}
document.addEventListener("click", (event) => {
  if (event.target.closest(".skip")) {
    event.preventDefault();
    $("#main").focus();
    return;
  }
  if (event.target.closest(".close-dialog")) {
    $("#modal").close();
    return;
  }
  if (event.target.closest(".search-result")) {
    $("#modal").close();
    return;
  }
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    assignmentFilter = filter.dataset.filter;
    render();
    return;
  }
  const el = event.target.closest("[data-action]");
  if (!el) return;
  switch (el.dataset.action) {
    case "search":
      openSearch();
      break;
    case "help":
      modal(
        "A classroom, in the making.",
        `<p>Welcome to Gubber, an independent classroom by Jose Carvajal-Beltran.</p><p>Everything here is sample content for future work. Choose a course, read a lesson, or try a practice problem. No real student accounts or teacher submissions are connected.</p><p>Your sample answers, notes, and progress stay in this browser.</p><p><a href="${href("about")}" class="search-result">More about the classroom ↗</a></p>`,
      );
      break;
    case "mark-read": {
      const u = course.units.find((u) => u.id === el.dataset.unit);
      setRead(u);
      el.textContent = "Lesson read ✓";
      toast(
        storageAvailable
          ? "Lesson marked as read. Keep going."
          : "Lesson marked as read for this visit.",
      );
      break;
    }
    case "hint": {
      const hint = el.closest("form").querySelector(".hint");
      hint.hidden = !hint.hidden;
      el.textContent = hint.hidden ? "Need a hint?" : "Hide hint";
      break;
    }
    case "syllabus":
      modal(
        "A sample course guide.",
        `<p><strong>${esc(course.code)} · ${esc(course.title)}</strong></p><p>${esc(course.description)}</p><p><strong>The plan</strong><br>${course.units.map((u) => `Week ${u.number}: ${esc(u.title)}`).join("<br>")}</p><p><strong>How to use the classroom</strong><br>Read the lesson, try the activity, and work through the practice. Return to the notes whenever you need them.</p><p><strong>Future course details</strong><br>Instructor contact, meeting times, office hours, grading, accessibility arrangements, and collaboration policies will be added before a real course begins.</p><p>This sample has no real deadlines, enrollment, or grades.</p>`,
      );
      break;
    case "notebook":
      modal(
        "Keep the rough ideas.",
        `<p>A notebook for ${esc(course.title)}. Saved in this browser only.</p><label class="notes-label" for="course-notes">Your notes</label><textarea class="note-input" id="course-notes" data-course-note="true" placeholder="Questions, sketches in words, things to try…">${esc(progress[course.id + ":notebook"] || "")}</textarea><div class="saving-label">${storageAvailable ? "Saved in this browser only." : "Browser storage is unavailable."}</div>`,
      );
      break;
    case "download":
      downloadOutline();
      break;
    case "reset":
      modal(
        "Start this course fresh?",
        `<p>This clears sample answers, lesson notes, the course notebook, and lesson progress for ${esc(course.title)} in this browser.</p><p>Other courses are kept.</p><button class="primary dark" data-action="confirm-reset">Reset this course <span>↗</span></button>`,
      );
      break;
    case "confirm-reset":
      for (const key of Object.keys(progress))
        if (key.startsWith(course.id + ":")) delete progress[key];
      persist();
      $("#modal").close();
      render();
      toast("A fresh start. Course progress cleared.");
      break;
  }
});
document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-question]");
  if (!form) return;
  event.preventDefault();
  const u = course.units.find((u) => u.id === form.dataset.unit);
  const q = u.assignment.questions.find((q) => q.id === form.dataset.question);
  const value = new FormData(form).get("answer");
  if (value === null || String(value).trim() === "") return;
  const correct =
    q.type === "choice"
      ? Number(value) === q.answer
      : Number.isFinite(Number(value)) &&
        Math.abs(Number(value) - q.answer) <= q.tolerance;
  const st = unitState(u);
  if (!st.answers) st.answers = {};
  st.answers[q.id] = { value: String(value), correct, checked: true };
  persist();
  form.querySelector(".feedback-zone").innerHTML = feedback(q, correct);
  if (passed(u)) toast("Practice complete. Nicely worked out.");
});
document.addEventListener("input", (event) => {
  const el = event.target;
  if (el.matches("[data-note]")) {
    const u = course.units.find((u) => u.id === el.dataset.note);
    unitState(u).note = el.value;
    const ok = persist();
    el.nextElementSibling.textContent = ok
      ? "Saved in this browser."
      : "Notes are available for this visit only.";
  }
  if (el.matches("[data-course-note]")) {
    progress[course.id + ":notebook"] = el.value;
    const ok = persist();
    el.nextElementSibling.textContent = ok
      ? "Saved in this browser."
      : "Notes are available for this visit only.";
  }
});
$("#course-select").addEventListener("change", (e) => {
  assignmentFilter = "all";
  location.hash = `#/${e.target.value}/overview`;
});
$("#menu-toggle").addEventListener("click", () => {
  const open = $("#sidebar").classList.toggle("open");
  $("#menu-toggle").setAttribute("aria-expanded", String(open));
  $("#backdrop").hidden = !open;
});
$("#backdrop").addEventListener("click", closeNav);
$("#modal").addEventListener("click", (e) => {
  if (e.target === $("#modal")) {
    const r = $("#modal").getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      $("#modal").close();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNav();
  if (
    event.key === "/" &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName) &&
    !$("#modal").open
  ) {
    event.preventDefault();
    if (data) openSearch();
  }
});
window.addEventListener("hashchange", () => {
  if (data) render(true);
});
fetch("content/courses.json")
  .then((r) => {
    if (!r.ok) throw Error("Course data could not load");
    return r.json();
  })
  .then((json) => {
    data = json;
    $("#course-select").innerHTML = data.courses
      .map((c) => `<option value="${esc(c.id)}">${esc(c.title)}</option>`)
      .join("");
    render();
  })
  .catch(() => {
    $("#main").innerHTML =
      '<div class="empty-state"><h1>The classroom could not load.</h1><p>Refresh the page to try again.</p><button class="secondary" onclick="location.reload()">Try again</button></div>';
  });
