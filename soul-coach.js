// soul-coach.js — Soulink (polished)
// Generates tips from your profile (soulQuiz) + a simple task list saved locally.

(() => {
  const KEY = "soulQuiz";
  const KEY_TASKS = "soulinkCoach";
  const $ = (s, r = document) => r.querySelector(s);

  const data = (() => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } })();

  // Essentials
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || "–"; };
  set("c-name", data.name);
  set("c-ct", data.connectionType);
  set("c-ll", data.loveLanguage);
  set("c-bd", data.birthday);

  // light calculators
  const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  const sumDigits = (s) => String(s).split("").reduce((a,c)=>a + (/\d/.test(c)?+c:0),0);
  function reduce(n){ while (![11,22,33].includes(n) && n>9) n=sumDigits(n); return n; }
  function lifePath(iso){ if(!iso || !DATE_RE.test(iso)) return "–"; return String(reduce(sumDigits(iso.replace(/-/g,"")))); }
  function zodiac(month, day){
    const z=[{n:"Capricorn",f:[12,22],t:[1,19]},{n:"Aquarius",f:[1,20],t:[2,18]},{n:"Pisces",f:[2,19],t:[3,20]},{n:"Aries",f:[3,21],t:[4,19]},{n:"Taurus",f:[4,20],t:[5,20]},{n:"Gemini",f:[5,21],t:[6,20]},{n:"Cancer",f:[6,21],t:[7,22]},{n:"Leo",f:[7,23],t:[8,22]},{n:"Virgo",f:[8,23],t:[9,22]},{n:"Libra",f:[9,23],t:[10,22]},{n:"Scorpio",f:[10,23],t:[11,21]},{n:"Sagittarius",f:[11,22],t:[12,21]}];
    const oa=(m,d,mm,dd)=>(m>mm)||(m===mm&&d>=dd), ob=(m,d,mm,dd)=>(m<mm)||(m===mm&&d<=dd);
    const valid = DATE_RE.test(data.birthday||"");
    if (!valid) return "–";
    const [y,m,d] = data.birthday.split("-").map(Number);
    for(const s of z){const [fm,fd]=s.f,[tm,td]=s.t; if(fm<=tm){if(oa(m,d,fm,fd)&&ob(m,d,tm,td)) return s.n;} else {if(oa(m,d,fm,fd)||ob(m,d,tm,td)) return s.n;}}
    return "–";
  }
  set("c-west", zodiac());
  set("c-life", lifePath(data.birthday));

  // Insights (static mappings + profile aware)
  const insights = [];
  if (data.loveLanguage) {
    const ll = data.loveLanguage;
    const map = {
      "Words of Affirmation": "Keep a gratitude note. Write one genuine compliment for someone you care about.",
      "Acts of Service": "Pick a 10-minute helpful action for someone (or your future self) and do it now.",
      "Receiving Gifts": "Choose a small, meaningful token (even digital) to appreciate someone.",
      "Quality Time": "Block 20 minutes of uninterrupted, phone-free time with a friend or yourself.",
      "Physical Touch": "Offer a warm hug or mindful touch with consent; connect through presence."
    };
    insights.push(map[ll] || "Lean into your primary love language with one mindful act today.");
  }
  if (Array.isArray(data.values) && data.values.length) {
    insights.push(`Live your values: pick one (${data.values.slice(0,5).join(", ")}) and act on it today.`);
  }
  if (Array.isArray(data.hobbies) && data.hobbies.length) {
    insights.push(`Refuel with a hobby: ${data.hobbies[0]} for 15 minutes.`);
  }
  const ul = document.getElementById("coach-insights");
  if (ul) {
    ul.innerHTML = "";
    insights.forEach(t => {
      const li = document.createElement("li");
      li.textContent = t;
      ul.appendChild(li);
    });
  }

  // Today's Action generator (a tiny pool influenced by profile)
  function makeAction() {
    const base = [
      "Message someone and ask one sincere question.",
      "Take a 10-minute walk without your phone.",
      "Write three lines about how you want to love & be loved.",
      "Declutter one tiny area (service to future-you).",
      "Invite someone to share a quiet 10-minute check-in."
    ];
    const byLL = {
      "Words of Affirmation": "Send a heartfelt text with one specific appreciation.",
      "Acts of Service": "Do one task they dislike without being asked.",
      "Receiving Gifts": "Prepare a tiny surprise (note, song link, photo).",
      "Quality Time": "Schedule a 20-minute, no-distraction catch-up.",
      "Physical Touch": "Offer a warm hug or mindful touch (with consent)."
    };
    const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
    return byLL[data.loveLanguage] || pick(base);
  }
  function setAction() { const el = document.getElementById("coach-action"); if (el) el.textContent = makeAction(); }
  setAction();
  document.getElementById("newAction")?.addEventListener("click", setAction);

  // Tasks
  function loadTasks() {
    try { return JSON.parse(localStorage.getItem(KEY_TASKS) || "{}"); } catch { return {}; }
  }
  function saveTasks(obj) { localStorage.setItem(KEY_TASKS, JSON.stringify(obj)); }

  const state = loadTasks();
  if (!Array.isArray(state.tasks)) {
    // default tasks influenced by profile
    const seed = [];
    if (data.loveLanguage) seed.push(`Practice your love language: ${data.loveLanguage}`);
    if (data.connectionType) seed.push(`Nurture a ${data.connectionType.toLowerCase()} connection`);
    seed.push("Reflect for 5 minutes: what felt good today?");
    state.tasks = seed.map((t,i)=>({ id: String(i+1), text: t, done: false }));
    saveTasks(state);
  }

  const tasksWrap = document.getElementById("tasks");
  function renderTasks() {
    tasksWrap.innerHTML = "";
    state.tasks.forEach((t) => {
      const row = document.createElement("div");
      row.className = "task";
      row.innerHTML = `
        <input type="checkbox" ${t.done ? "checked" : ""} data-id="${t.id}" />
        <span>${t.text}</span>
        <button class="btn" style="margin-left:auto;" data-del="${t.id}">Remove</button>
      `;
      tasksWrap.appendChild(row);
    });

    // bind toggles
    tasksWrap.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener("change", () => {
        const id = cb.getAttribute("data-id");
        const item = state.tasks.find(x => x.id === id);
        if (item) { item.done = cb.checked; saveTasks(state); }
      });
    });
    // bind deletes
    tasksWrap.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del");
        const idx = state.tasks.findIndex(x => x.id === id);
        if (idx >= 0) { state.tasks.splice(idx,1); saveTasks(state); renderTasks(); }
      });
    });
  }
  renderTasks();

  // add task
  document.getElementById("add-task")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("task-input");
    const text = (input?.value || "").trim();
    if (!text) return;
    const id = String(Date.now());
    state.tasks.push({ id, text, done:false });
    saveTasks(state);
    input.value = "";
    renderTasks();
  });

  // reset
  document.getElementById("resetTasks")?.addEventListener("click", () => {
    if (!confirm("Reset tasks?")) return;
    localStorage.removeItem(KEY_TASKS);
    location.reload();
  });
})();

// === Coach enhancements (fixed IDs) ===
(() => {
  // paprastas „fallback“ generatorius pagal profilį
  function localDailySuggestion(profile){
    const ll = (profile.loveLanguage||'').toLowerCase();
    const conn = (profile.connectionType||'').toLowerCase();
    const pick = (arr)=>arr[Math.floor(Math.random()*arr.length)];
    const base = {
      service: [
        "Do one tiny helpful act without being asked.",
        "Prepare something practical for someone (tea, a reminder, a lift).",
        "Declutter one small area (service to future-you)."
      ],
      words: [
        "Send a 3-sentence appreciation message.",
        "Write one specific compliment and share it.",
        "Leave a kind sticky note for someone (or yourself)."
      ],
      gifts: [
        "Share a small treat or a favorite link.",
        "Donate one item or gift a book recommendation.",
        "Bring a tiny surprise to someone’s day."
      ],
      quality: [
        "Offer 15 minutes of undivided attention.",
        "Plan a mini walk & talk with someone.",
        "Schedule a 20-minute no-phone catch-up."
      ],
      touch: [
        "Give a warm hug (if welcome) or mindful self-soothing practice.",
        "5-minute stretch or self-massage.",
        "Ground yourself with a mindful breathing touch."
      ]
    };
    let bucket = base.quality;
    if (ll.includes('service')) bucket = base.service;
    else if (ll.includes('words')) bucket = base.words;
    else if (ll.includes('gift')) bucket = base.gifts;
    else if (ll.includes('touch')) bucket = base.touch;

    const solo = !(conn.includes('friend') || conn.includes('both'));
    let action = pick(bucket);
    if (solo) action = action.replace('someone','yourself');
    return action;
  }

  // mažas toast’as
  function notify(msg){
    let n = document.getElementById('toast');
    if (!n){
      n = document.createElement('div');
      n.id = 'toast';
      n.style.cssText = 'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);padding:10px 14px;border-radius:10px;background:#0a3;box-shadow:0 8px 30px rgba(0,0,0,.25);color:#fff;z-index:9999;opacity:0;transition:.2s';
      document.body.appendChild(n);
    }
    n.textContent = msg;
    n.style.opacity = '1';
    setTimeout(()=> n.style.opacity='0', 1200);
  }

  function setActionRandom(){
    const profile = JSON.parse(localStorage.getItem('soulQuiz')||'{}');
    const el = document.getElementById('coach-action');   // <-- teisingas ID
    if (el) el.textContent = localDailySuggestion(profile);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // pradinė reikšmė
    setActionRandom();

    // „New Suggestion“ mygtukas (HTML: id="newAction")
    document.getElementById('newAction')?.addEventListener('click', () => {
      setActionRandom();
      notify('New suggestion ready 💡');
    });
  });
})();

// === Coach enhancements (fixed IDs) ===
(() => {
  // paprastas „fallback“ generatorius pagal profilį
  function localDailySuggestion(profile){
    const ll = (profile.loveLanguage||'').toLowerCase();
    const conn = (profile.connectionType||'').toLowerCase();
    const pick = (arr)=>arr[Math.floor(Math.random()*arr.length)];
    const base = {
      service: [
        "Do one tiny helpful act without being asked.",
        "Prepare something practical for someone (tea, a reminder, a lift).",
        "Declutter one small area (service to future-you)."
      ],
      words: [
        "Send a 3-sentence appreciation message.",
        "Write one specific compliment and share it.",
        "Leave a kind sticky note for someone (or yourself)."
      ],
      gifts: [
        "Share a small treat or a favorite link.",
        "Donate one item or gift a book recommendation.",
        "Bring a tiny surprise to someone’s day."
      ],
      quality: [
        "Offer 15 minutes of undivided attention.",
        "Plan a mini walk & talk with someone.",
        "Schedule a 20-minute no-phone catch-up."
      ],
      touch: [
        "Give a warm hug (if welcome) or mindful self-soothing practice.",
        "5-minute stretch or self-massage.",
        "Ground yourself with a mindful breathing touch."
      ]
    };
    let bucket = base.quality;
    if (ll.includes('service')) bucket = base.service;
    else if (ll.includes('words')) bucket = base.words;
    else if (ll.includes('gift')) bucket = base.gifts;
    else if (ll.includes('touch')) bucket = base.touch;

    const solo = !(conn.includes('friend') || conn.includes('both'));
    let action = pick(bucket);
    if (solo) action = action.replace('someone','yourself');
    return action;
  }

  // mažas toast’as
  function notify(msg){
    let n = document.getElementById('toast');
    if (!n){
      n = document.createElement('div');
      n.id = 'toast';
      n.style.cssText = 'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);padding:10px 14px;border-radius:10px;background:#0a3;box-shadow:0 8px 30px rgba(0,0,0,.25);color:#fff;z-index:9999;opacity:0;transition:.2s';
      document.body.appendChild(n);
    }
    n.textContent = msg;
    n.style.opacity = '1';
    setTimeout(()=> n.style.opacity='0', 1200);
  }

  function setActionRandom(){
    const profile = JSON.parse(localStorage.getItem('soulQuiz')||'{}');
    const el = document.getElementById('coach-action');   // <-- teisingas ID
    if (el) el.textContent = localDailySuggestion(profile);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // pradinė reikšmė
    setActionRandom();

    // „New Suggestion“ mygtukas (HTML: id="newAction")
    document.getElementById('newAction')?.addEventListener('click', () => {
      setActionRandom();
      notify('New suggestion ready 💡');
    });
  });
})();
