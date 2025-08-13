// match.js — Soulink (romantic compatibility)
// Stores candidates in localStorage 'soulinkMatches' and scores them vs your profile 'soulQuiz'.
// Weights are user-tweakable and auto-normalized based on available data.

(() => {
  const KEY_PROFILE = "soulQuiz";
  const KEY_MATCHES = "soulinkMatches";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // --- Load state
  const me = (() => { try { return JSON.parse(localStorage.getItem(KEY_PROFILE) || "{}"); } catch { return {}; } })();
  const matches = (() => { try { return JSON.parse(localStorage.getItem(KEY_MATCHES) || "[]"); } catch { return []; } })();

  // --- Fill snapshot
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || "–"; };
  set("me-name", me.name);
  set("me-ct", me.connectionType);
  set("me-ll", me.loveLanguage);
  set("me-bd", me.birthday);
  set("me-hobbies", (me.hobbies && me.hobbies.length) ? me.hobbies.join(", ") : "–");
  set("me-values",  (me.values && me.values.length)   ? me.values.join(", ")  : "–");

  // --- Helpers
  const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

  function tokenizeCSV(s) {
    return (s || "")
      .split(",")
      .map(x => x.trim())
      .filter(Boolean);
  }

  function signOf(iso) {
    if (!iso || !DATE_RE.test(iso)) return null;
    const [y,m,d] = iso.split("-").map(Number);
    // West zodiac sign by Sun
    const z = [
      { n:"Capricorn",  f:[12,22], t:[1,19] },
      { n:"Aquarius",   f:[1,20],  t:[2,18] },
      { n:"Pisces",     f:[2,19],  t:[3,20] },
      { n:"Aries",      f:[3,21],  t:[4,19] },
      { n:"Taurus",     f:[4,20],  t:[5,20] },
      { n:"Gemini",     f:[5,21],  t:[6,20] },
      { n:"Cancer",     f:[6,21],  t:[7,22] },
      { n:"Leo",        f:[7,23],  t:[8,22] },
      { n:"Virgo",      f:[8,23],  t:[9,22] },
      { n:"Libra",      f:[9,23],  t:[10,22] },
      { n:"Scorpio",    f:[10,23], t:[11,21] },
      { n:"Sagittarius",f:[11,22], t:[12,21] },
    ];
    const oa=(M,D,mm,dd)=>(M>mm)||(M===mm&&D>=dd), ob=(M,D,mm,dd)=>(M<mm)||(M===mm&&D<=dd);
    for (const s of z) {
      const [fm,fd]=s.f, [tm,td]=s.t;
      if (fm<=tm) { if (oa(m,d,fm,fd) && ob(m,d,tm,td)) return s.n; }
      else { if (oa(m,d,fm,fd) || ob(m,d,tm,td)) return s.n; }
    }
    return null;
  }

  function elementOf(sign) {
    const map = {
      Fire: ["Aries","Leo","Sagittarius"],
      Earth:["Taurus","Virgo","Capricorn"],
      Air:  ["Gemini","Libra","Aquarius"],
      Water:["Cancer","Scorpio","Pisces"]
    };
    for (const [el, arr] of Object.entries(map)) if (arr.includes(sign)) return el;
    return null;
  }

  function zodiacCompat(s1, s2) {
    if (!s1 || !s2) return null;
    const e1 = elementOf(s1), e2 = elementOf(s2);
    if (!e1 || !e2) return null;
    if (e1 === e2) return 1; // same element: great
    const pairs = { Fire:"Air", Air:"Fire", Earth:"Water", Water:"Earth" };
    if (pairs[e1] === e2) return 0.8;   // complementary elements
    return 0.3;                         // less natural, still possible
  }

  function lifePath(iso){
    if (!iso || !DATE_RE.test(iso)) return null;
    const sum = (s) => String(s).split("").reduce((a,c)=>a + (/\d/.test(c)?+c:0), 0);
    function reduce(n){ while (![11,22,33].includes(n) && n>9) n = sum(n); return n; }
    return reduce(sum(iso.replace(/-/g,"")));
  }

  // --- Scoring (0..100)
  function scoreCandidate(c, opts) {
    // Feature scores in 0..1, null if not applicable
    const feats = {
      connection: null,
      loveLang: null,
      values: null,
      hobbies: null,
      zodiac: null,
      life: null
    };

    // Connection alignment (Romantic focus)
    if (me.connectionType) {
      const wantRomance = /Romantic/i.test(me.connectionType);
      const candRom = /Romantic/i.test(c.ct) || /Both/i.test(c.ct);
      feats.connection = wantRomance ? (candRom ? 1 : 0.2) : 0.8; // if you don't require romance, be softer
    }

    // Love language
    if (me.loveLanguage && c.ll) feats.loveLang = (me.loveLanguage === c.ll) ? 1 : 0;

    // Values overlap (Jaccard-like)
    if (Array.isArray(me.values) && me.values.length && Array.isArray(c.values) && c.values.length) {
      const A = new Set(me.values.map(String));
      const B = new Set(c.values.map(String));
      let inter = 0; B.forEach(v => { if (A.has(v)) inter++; });
      const union = new Set([...A, ...B]).size || 1;
      feats.values = inter / union; // 0..1
    }

    // Hobbies overlap
    if (Array.isArray(me.hobbies) && me.hobbies.length && Array.isArray(c.hobbies) && c.hobbies.length) {
      const A = new Set(me.hobbies.map(String));
      const B = new Set(c.hobbies.map(String));
      let inter = 0; B.forEach(v => { if (A.has(v)) inter++; });
      const union = new Set([...A, ...B]).size || 1;
      feats.hobbies = inter / union;
    }

    // Zodiac (optional)
    if (opts.useZodiac) {
      const s1 = signOf(me.birthday || "");
      const s2 = signOf(c.bd || "");
      const z = zodiacCompat(s1, s2);
      feats.zodiac = (z == null) ? null : z; // 0..1
    }

    // Life path (optional)
    if (opts.useLife) {
      const L1 = lifePath(me.birthday || "");
      const L2 = lifePath(c.bd || "");
      if (L1 && L2) {
        const diff = Math.abs(L1 - L2);
        feats.life = diff === 0 ? 1 : diff === 1 ? 0.7 : diff === 2 ? 0.4 : 0.2;
      }
    }

    // Weights (will be normalized across available features)
    const rawW = {
      connection: opts.w.ct,
      loveLang:  opts.w.ll,
      values:    opts.w.val,
      hobbies:   opts.w.hob,
      zodiac:    opts.w.zod,
      life:      opts.w.life
    };

    // Normalize to only features with scores != null
    let sumW = 0;
    Object.entries(feats).forEach(([k, v]) => { if (v != null) sumW += rawW[k] || 0; });
    if (!sumW) return { total: 0, feats, weights: rawW };

    let total = 0;
    Object.entries(feats).forEach(([k, v]) => {
      if (v != null) total += v * (rawW[k] / sumW);
    });

    return { total: Math.round(total * 100), feats, weights: rawW };
  }

  // --- Persist matches
  function saveMatches(arr) {
    localStorage.setItem(KEY_MATCHES, JSON.stringify(arr));
  }

  // --- UI state
  const filterRomantic = $("#f-romantic");
  const useZod = $("#f-zodiac");
  const useLife = $("#f-life");
  const sortBy = $("#sortBy");
  const weights = {
    ct:  $("#w-ct"),
    ll:  $("#w-ll"),
    val: $("#w-val"),
    hob: $("#w-hob"),
    zod: $("#w-zod"),
    life:$("#w-life")
  };

  function getWeightValue(input, def) {
    return input ? Number(input.value) : def;
  }

  // --- Render list
  const list = $("#match-list");
  const empty = $("#empty-note");

  function render() {
    list.innerHTML = "";
    let arr = matches.slice();

    // romantic filter
    if (filterRomantic?.checked) {
      arr = arr.filter(c => /Romantic/i.test(c.ct) || /Both/i.test(c.ct));
    }

    // score each
    const opts = {
      useZodiac: !!useZod?.checked,
      useLife:   !!useLife?.checked,
      w: {
        ct:  getWeightValue(weights.ct, 30),
        ll:  getWeightValue(weights.ll, 30),
        val: getWeightValue(weights.val, 20),
        hob: getWeightValue(weights.hob, 15),
        zod: getWeightValue(weights.zod, 5),
        life:getWeightValue(weights.life, 0),
      }
    };

    const scored = arr.map(c => ({ c, s: scoreCandidate(c, opts) }));

    // sort
    const key = sortBy?.value || "score";
    scored.sort((a, b) => {
      if (key === "name") return (a.c.name || "").localeCompare(b.c.name || "");
      return b.s.total - a.s.total;
    });

    if (!scored.length) { empty.style.display = "block"; return; }
    empty.style.display = "none";

    scored.forEach((row, i) => {
      const { c, s } = row;
      const div = document.createElement("div");
      div.className = "cand";
      const zTxt = (c.bd && signOf(c.bd)) ? ` (${signOf(c.bd)})` : "";
      div.innerHTML = `
        <div class="row" style="justify-content:space-between;">
          <strong>${c.name || "Candidate"}</strong>
          <span class="score">${s.total}</span>
        </div>
        <div style="margin-top:.3rem; font-size:.95rem;">
          <div><strong>Intent:</strong> ${c.ct || "–"}</div>
          <div><strong>Love Language:</strong> ${c.ll || "–"}</div>
          <div><strong>Birth Date:</strong> ${c.bd || "–"}${zTxt}</div>
          <div><strong>Hobbies:</strong> ${(c.hobbies && c.hobbies.length) ? c.hobbies.join(", ") : "–"}</div>
          <div><strong>Values:</strong> ${(c.values && c.values.length) ? c.values.join(", ") : "–"}</div>
        </div>
        <details style="margin-top:.4rem;">
          <summary>Compatibility breakdown</summary>
          <div class="hint" style="margin-top:.3rem;">
            <div>Connection: ${formatFeat(s.feats.connection)}</div>
            <div>Love Language: ${formatFeat(s.feats.loveLang)}</div>
            <div>Values Overlap: ${formatFeat(s.feats.values)}</div>
            <div>Hobbies Overlap: ${formatFeat(s.feats.hobbies)}</div>
            <div>Zodiac: ${formatFeat(s.feats.zodiac)}</div>
            <div>Life Path: ${formatFeat(s.feats.life)}</div>
          </div>
        </details>
        <div class="row" style="margin-top:.5rem;">
          <button class="btn" data-del="${i}">Remove</button>
        </div>
      `;
      list.appendChild(div);
    });

    // delete handlers
    $$('[data-del]').forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = +btn.getAttribute("data-del");
        const arr = matches.slice();
        arr.splice(idx, 1);
        saveMatches(arr);
        location.reload();
      });
    });
  }

  function formatFeat(v){
    if (v == null) return "—";
    return Math.round(v * 100) + "%";
    // we show % of that feature, prior to weight normalization
  }

  // Initial render + listeners
  ["change","input"].forEach(evt => {
    filterRomantic?.addEventListener(evt, render);
    useZod?.addEventListener(evt, render);
    useLife?.addEventListener(evt, render);
    sortBy?.addEventListener(evt, render);
    Object.values(weights).forEach(w => w?.addEventListener(evt, render));
  });
  render();

  // --- Add candidate
  $("#add-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const c = {
      name: $("#c-name")?.value.trim(),
      ct:   $("#c-ct")?.value,
      ll:   $("#c-ll")?.value,
      bd:   $("#c-bd")?.value.trim(),
      hobbies: tokenizeCSV($("#c-hobbies")?.value),
      values:  tokenizeCSV($("#c-values")?.value),
    };
    if (!c.name) { alert("Please enter a name."); return; }
    if (c.bd && !DATE_RE.test(c.bd)) { alert("Please use YYYY-MM-DD for Birth Date."); return; }

    const arr = matches.slice();
    arr.push(c);
    saveMatches(arr);
    e.target.reset();
    render();
  });

  // Export / Import / Clear
  $("#exportMatches")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(matches, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "soulink-matches.json"; a.click();
    URL.revokeObjectURL(url);
  });

  $("#importMatches")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const arr = JSON.parse(ev.target.result);
        if (!Array.isArray(arr)) throw new Error("Not an array");
        saveMatches(arr);
        location.reload();
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  });

  $("#clearAll")?.addEventListener("click", () => {
    if (confirm("Clear all matches?")) {
      localStorage.removeItem(KEY_MATCHES);
      location.reload();
    }
  });
})();
