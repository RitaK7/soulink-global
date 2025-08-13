// my-soul.js — Soulink (golden)
// Loads data from localStorage 'soulQuiz' and renders Personal Info,
// Hobbies/Values, Essence, Love Language, Western Zodiac, Chinese Zodiac,
// and Life Path Number. Also shows profile photos if present.

(function () {
  const KEY = "soulQuiz";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---- data helpers
  function safeParse(v) { try { return JSON.parse(v) || {}; } catch { return {}; } }
  function load() { return safeParse(localStorage.getItem(KEY)); }

  // ---- formatters
  const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  function fmtDate(yyyy_mm_dd) {
    if (!yyyy_mm_dd || !DATE_RE.test(yyyy_mm_dd)) return "–";
    return yyyy_mm_dd; // keep ISO (YYYY-MM-DD) for clarity
  }

  function westernZodiac(month, day) {
    // month: 1-12, day: 1-31
    const z = [
      { name: "Capricorn",  from: [12, 22], to: [1, 19]  },
      { name: "Aquarius",   from: [1, 20],  to: [2, 18]  },
      { name: "Pisces",     from: [2, 19],  to: [3, 20]  },
      { name: "Aries",      from: [3, 21],  to: [4, 19]  },
      { name: "Taurus",     from: [4, 20],  to: [5, 20]  },
      { name: "Gemini",     from: [5, 21],  to: [6, 20]  },
      { name: "Cancer",     from: [6, 21],  to: [7, 22]  },
      { name: "Leo",        from: [7, 23],  to: [8, 22]  },
      { name: "Virgo",      from: [8, 23],  to: [9, 22]  },
      { name: "Libra",      from: [9, 23],  to: [10, 22] },
      { name: "Scorpio",    from: [10, 23], to: [11, 21] },
      { name: "Sagittarius",from: [11, 22], to: [12, 21] }
    ];
    function onOrAfter(m, d, mm, dd){ return (m > mm) || (m === mm && d >= dd); }
    function onOrBefore(m, d, mm, dd){ return (m < mm) || (m === mm && d <= dd); }

    for (const s of z) {
      const [fm, fd] = s.from, [tm, td] = s.to;
      if (fm <= tm) {
        if (onOrAfter(month, day, fm, fd) && onOrBefore(month, day, tm, td)) return s.name;
      } else {
        // wrap year (Capricorn)
        if (onOrAfter(month, day, fm, fd) || onOrBefore(month, day, tm, td)) return s.name;
      }
    }
    return "–";
  }

  function chineseZodiac(year) {
    if (!year || isNaN(year)) return "–";
    const animals = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];
    // Simple Gregorian approximation (doesn't handle Lunar New Year boundary)
    const idx = (year - 4) % 12;
    return animals[(idx + 12) % 12];
  }

  function sumDigits(nStr) { return String(nStr).split("").reduce((a, c) => a + (/\d/.test(c) ? +c : 0), 0); }
  function reduceNumber(n) {
    // keep master numbers 11, 22, 33
    while (![11,22,33].includes(n) && n > 9) n = sumDigits(String(n));
    return n;
  }
  function lifePath(yyyy_mm_dd) {
    if (!yyyy_mm_dd || !DATE_RE.test(yyyy_mm_dd)) return "–";
    const compact = yyyy_mm_dd.replace(/-/g, "");
    const total = sumDigits(compact);
    return String(reduceNumber(total));
  }
  function hideIfEmpty(cardId, ids) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const allEmpty = ids.every(id => {
    const el = document.getElementById(id);
    return !el || el.textContent.trim() === "–";
  });
  if (allEmpty) card.style.display = "none";
}

// Hide cards that have no data
hideIfEmpty("card-love", ["ms-loveLanguage", "ms-loveLanguagePreview"]);
hideIfEmpty("card-hobbies", ["ms-hobbies", "ms-values"]);
hideIfEmpty("card-essence", ["ms-unacceptable", "ms-about"]);
hideIfEmpty("card-west", ["ms-zodiac-west"]);
hideIfEmpty("card-cn", ["ms-zodiac-cn"]);
hideIfEmpty("card-life", ["ms-lifePath"]);

// Click-to-zoom photos
["ms-photo1","ms-photo2","ms-photo3"].forEach(id => {
  const img = document.getElementById(id);
  if (img) img.addEventListener("click", () => { if (img.src) window.open(img.src, "_blank"); });
});


  // ---- render
  const data = load();

  // Header name
  const name = data.name?.trim() || "Friend";
  const headerNameEl = $("#ms-name");
  if (headerNameEl) headerNameEl.textContent = name;

  // Personal
  const bdate = fmtDate(data.birthday);
  const [y,m,d] = DATE_RE.test(data.birthday||"") ? data.birthday.split("-").map(Number) : [null,null,null];

  const fields = {
    "ms-birthDate": bdate,
    "ms-country": data.country || "–",
    "ms-height": (data.height || data.height === 0) ? `${data.height}` : "–",
    "ms-weight": (data.weight || data.weight === 0) ? `${data.weight}` : "–",
    "ms-connection": data.connectionType || "–",
    "ms-loveLanguage": data.loveLanguage || "–",
    "ms-loveLanguagePreview": data.loveLanguage || "–",
    "ms-hobbies": (Array.isArray(data.hobbies) && data.hobbies.length) ? data.hobbies.join(", ") : "–",
    "ms-values": (Array.isArray(data.values) && data.values.length) ? data.values.join(", ") : "–",
    "ms-unacceptable": data.unacceptable || "–",
    "ms-about": data.about || "–",
    "ms-zodiac-west": (m && d) ? westernZodiac(m, d) : "–",
    "ms-zodiac-cn": (y) ? chineseZodiac(y) : "–",
    "ms-lifePath": (y && m && d) ? lifePath(data.birthday) : "–"
  };

  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });

  // Photos (if you have placeholders on this page)
  ["profilePhoto1","profilePhoto2","profilePhoto3"].forEach((pid, i) => {
    const img = document.getElementById(`ms-photo${i+1}`);
    const src = data[pid];
    if (img) {
      if (src) { img.src = src; img.style.display = "block"; }
      else { img.removeAttribute("src"); img.style.display = "none"; }
    }
  });

  // Edit button
  const editBtn = $("#ms-edit");
  if (editBtn) editBtn.addEventListener("click", () => (window.location.href = "edit-profile.html"));
})();
