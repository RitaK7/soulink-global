// my-soul.js — Soulink (golden + polish)
// Renders profile from localStorage 'soulQuiz', computes zodiacs & life path,
// shows photos, hides empty cards, and wires Edit button.

(() => {
  const KEY = "soulQuiz";
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function safeParse(v){ try { return JSON.parse(v) || {}; } catch { return {}; } }
  function load(){ return safeParse(localStorage.getItem(KEY)); }

  // --- formatting & calculators
  const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  const fmtDate = (iso) => (iso && DATE_RE.test(iso)) ? iso : "–";

  function westernZodiac(month, day){
    const z = [
      { name:"Capricorn",  from:[12,22], to:[1,19] },
      { name:"Aquarius",   from:[1,20],  to:[2,18] },
      { name:"Pisces",     from:[2,19],  to:[3,20] },
      { name:"Aries",      from:[3,21],  to:[4,19] },
      { name:"Taurus",     from:[4,20],  to:[5,20] },
      { name:"Gemini",     from:[5,21],  to:[6,20] },
      { name:"Cancer",     from:[6,21],  to:[7,22] },
      { name:"Leo",        from:[7,23],  to:[8,22] },
      { name:"Virgo",      from:[8,23],  to:[9,22] },
      { name:"Libra",      from:[9,23],  to:[10,22] },
      { name:"Scorpio",    from:[10,23], to:[11,21] },
      { name:"Sagittarius",from:[11,22], to:[12,21] },
    ];
    const onOrAfter  = (m,d,mm,dd) => (m>mm) || (m===mm && d>=dd);
    const onOrBefore = (m,d,mm,dd) => (m<mm) || (m===mm && d<=dd);
    for (const s of z) {
      const [fm,fd]=s.from, [tm,td]=s.to;
      if (fm <= tm) { if (onOrAfter(month,day,fm,fd) && onOrBefore(month,day,tm,td)) return s.name; }
      else { if (onOrAfter(month,day,fm,fd) || onOrBefore(month,day,tm,td)) return s.name; }
    }
    return "–";
  }

  function chineseZodiac(year){
    if (!year || isNaN(year)) return "–";
    const animals = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];
    const idx = (year - 4) % 12;
    return animals[(idx + 12) % 12];
  }

  const sumDigits = (s) => String(s).split("").reduce((a,c)=>a + (/\d/.test(c)?+c:0), 0);
  function reduceNumber(n){ while (![11,22,33].includes(n) && n>9) n = sumDigits(n); return n; }
  function lifePath(iso){
    if (!iso || !DATE_RE.test(iso)) return "–";
    const total = sumDigits(iso.replace(/-/g,""));
    return String(reduceNumber(total));
  }

  // --- render
  const data = load();

  $("#ms-name") && ($("#ms-name").textContent = (data.name?.trim() || "Friend"));

  const bfmt = fmtDate(data.birthday);
  const [y,m,d] = DATE_RE.test(data.birthday||"") ? data.birthday.split("-").map(Number) : [null,null,null];

  const fields = {
    "ms-birthDate": bfmt,
    "ms-country": data.country || "–",
    "ms-height": (data.height || data.height === 0) ? String(data.height) : "–",
    "ms-weight": (data.weight || data.weight === 0) ? String(data.weight) : "–",
    "ms-connection": data.connectionType || "–",

    // Love Language shown in two places
    "ms-loveLanguage": data.loveLanguage || "–",
    "ms-loveLanguagePreview": data.loveLanguage || "–",

    "ms-hobbies": (Array.isArray(data.hobbies)&&data.hobbies.length) ? data.hobbies.join(", ") : "–",
    "ms-values":  (Array.isArray(data.values)&&data.values.length)   ? data.values.join(", ")  : "–",
    "ms-unacceptable": data.unacceptable || "–",
    "ms-about": data.about || "–",

    "ms-zodiac-west": (m&&d) ? westernZodiac(m,d) : "–",
    "ms-zodiac-cn": (y) ? chineseZodiac(y) : "–",
    "ms-lifePath": (y&&m&&d) ? lifePath(data.birthday) : "–",
  };

  Object.entries(fields).forEach(([id,val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });

  // Photos
  ["profilePhoto1","profilePhoto2","profilePhoto3"].forEach((pid,i)=>{
    const img = document.getElementById(`ms-photo${i+1}`);
    const src = data[pid];
    if (img) {
      if (src) { img.src = src; img.style.display = "block"; img.style.cursor="zoom-in"; img.addEventListener("click", ()=> window.open(src, "_blank")); }
      else { img.removeAttribute("src"); img.style.display = "none"; }
    }
  });

  // Hide empty cards to keep page clean
  function hideIfEmpty(cardId, ids){
    const card = document.getElementById(cardId);
    if (!card) return;
    const allEmpty = ids.every(id => {
      const el = document.getElementById(id);
      return !el || el.textContent.trim() === "–";
    });
    if (allEmpty) card.style.display = "none";
  }
  hideIfEmpty("card-love",    ["ms-loveLanguage","ms-loveLanguagePreview"]);
  hideIfEmpty("card-hobbies", ["ms-hobbies","ms-values"]);
  hideIfEmpty("card-essence", ["ms-unacceptable","ms-about"]);
  hideIfEmpty("card-west",    ["ms-zodiac-west"]);
  hideIfEmpty("card-cn",      ["ms-zodiac-cn"]);
  hideIfEmpty("card-life",    ["ms-lifePath"]);

  // Edit button
  $("#ms-edit")?.addEventListener("click", ()=> (window.location.href = "edit-profile.html"));
})();
