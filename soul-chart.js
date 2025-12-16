// soul-chart.js — Soulink "Soul Chart" dashboard (clear, responsive, no libraries)
// Reads soul profile via data-helpers.js getSoulData() and renders readable charts.

(function () {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;

  const $ = (sel, root = document) => root.querySelector(sel);

  const prefersReducedMotion = (() => {
    try {
      return (
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    } catch (e) {
      return false;
    }
  })();

  // ---------- helpers ----------

  function normaliseText(v) {
    return (v == null ? "" : String(v)).trim();
  }

  function toArray(v) {
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
  }

  function uniqueList(arr) {
    const out = [];
    const seen = new Set();
    (arr || []).forEach((x) => {
      const s = normaliseText(x);
      if (!s) return;
      const k = s.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      out.push(s);
    });
    return out;
  }

  function safeGetSoulData() {
    let data = {};
    try {
      if (typeof window.getSoulData === "function") {
        try {
          data = window.getSoulData({ ensureShape: true, fallbackToLegacy: true }) || {};
        } catch (e) {
          data = window.getSoulData() || {};
        }
      } else {
        data = {};
      }
    } catch (err) {
      console.warn("Soul Chart: failed to read soul data", err);
      data = {};
    }
    if (!data || typeof data !== "object") return {};
    return data;
  }

  function hasAnyCoreData(soul) {
    if (!soul || typeof soul !== "object") return false;
    if (normaliseText(soul.name)) return true;
    if (normaliseText(soul.birthday) || normaliseText(soul.birthdate)) return true;
    if (normaliseText(soul.zodiac) || normaliseText(soul.zodiacSign) || normaliseText(soul.sunSign)) return true;
    if (normaliseText(soul.chineseZodiac) || normaliseText(soul.chineseSign)) return true;
    if (soul.lifePathNumber != null) return true;

    if (normaliseText(soul.loveLanguage)) return true;
    if (toArray(soul.loveLanguages || []).length) return true;

    if (toArray(soul.values || []).length) return true;
    if (toArray(soul.hobbies || soul.interests || []).length) return true;
    return false;
  }

  const LOVE_LANGUAGES = [
    "Words of Affirmation",
    "Quality Time",
    "Acts of Service",
    "Physical Touch",
    "Receiving Gifts",
  ];

  function normaliseLoveLanguageLabel(raw) {
    const s = normaliseText(raw);
    if (!s) return "";
    const low = s.toLowerCase();
    // match by intent (robust against minor variations)
    if (low.includes("affirm") || low.includes("words")) return "Words of Affirmation";
    if (low.includes("quality") || low.includes("time")) return "Quality Time";
    if (low.includes("service") || low.includes("acts")) return "Acts of Service";
    if (low.includes("touch") || low.includes("physical")) return "Physical Touch";
    if (low.includes("gift") || low.includes("receiv")) return "Receiving Gifts";
    // if already exact
    const exact = LOVE_LANGUAGES.find((x) => x.toLowerCase() === low);
    return exact || s;
  }

  function pickPrimaryLoveLanguage(soul) {
    const primary = normaliseLoveLanguageLabel(soul.loveLanguage);
    if (primary && LOVE_LANGUAGES.includes(primary)) return primary;

    const list = uniqueList(toArray(soul.loveLanguages || []).map(normaliseLoveLanguageLabel));
    if (list.length && LOVE_LANGUAGES.includes(list[0])) return list[0];

    // fallback: if user has some label that matches
    const any = list.find((x) => LOVE_LANGUAGES.includes(x));
    return any || "";
  }

  function parseBirthdayToParts(raw) {
    const str = normaliseText(raw);
    if (!str) return null;

    // YYYY-MM-DD or YYYY/MM/DD
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(str)) {
      const parts = str.split(/[-/]/);
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const day = Number(parts[2]);
      if (!year || !month || !day) return null;
      return { year, month, day };
    }

    // DD.MM.YYYY or DD/MM/YYYY
    const m = str.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
    if (m) {
      const day = Number(m[1]);
      const month = Number(m[2]);
      let year = Number(m[3]);
      if (year < 100) year += year >= 50 ? 1900 : 2000;
      if (!year || !month || !day) return null;
      return { year, month, day };
    }

    // digits fallback: YYYYMMDD
    const digits = str.replace(/[^\d]/g, "");
    if (/^\d{8}$/.test(digits)) {
      const year = Number(digits.slice(0, 4));
      const month = Number(digits.slice(4, 6));
      const day = Number(digits.slice(6, 8));
      if (!year || !month || !day) return null;
      return { year, month, day };
    }

    // last resort: Date parse
    const d = new Date(str);
    if (isNaN(d.getTime())) return null;
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }

  function deriveZodiacFallback(soul) {
    const zodiacExisting =
      normaliseText(soul.zodiac) ||
      normaliseText(soul.zodiacSign) ||
      normaliseText(soul.sunSign);

    const chineseExisting =
      normaliseText(soul.chineseZodiac) ||
      normaliseText(soul.chineseSign) ||
      normaliseText(soul.chinese);

    let lifePathExisting = soul.lifePathNumber;
    if (lifePathExisting == null) lifePathExisting = soul.lifePath;

    function zodiacSign(month, day) {
      const md = month * 100 + day;
      if (md >= 321 && md <= 419) return "Aries";
      if (md >= 420 && md <= 520) return "Taurus";
      if (md >= 521 && md <= 620) return "Gemini";
      if (md >= 621 && md <= 722) return "Cancer";
      if (md >= 723 && md <= 822) return "Leo";
      if (md >= 823 && md <= 922) return "Virgo";
      if (md >= 923 && md <= 1022) return "Libra";
      if (md >= 1023 && md <= 1121) return "Scorpio";
      if (md >= 1122 && md <= 1221) return "Sagittarius";
      if (md >= 1222 || md <= 119) return "Capricorn";
      if (md >= 120 && md <= 218) return "Aquarius";
      if (md >= 219 && md <= 320) return "Pisces";
      return "";
    }

    function chineseZodiac(year) {
      const animals = [
        "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake",
        "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig",
      ];
      const idx = (year - 1900) % 12;
      return animals[(idx + 12) % 12];
    }

    function lifePath(year, month, day) {
      const digitsAll =
        String(year) + String(month).padStart(2, "0") + String(day).padStart(2, "0");
      const sumDigits = (s) => s.split("").reduce((acc, ch) => acc + Number(ch || 0), 0);
      let n = sumDigits(digitsAll);
      const isMaster = (x) => x === 11 || x === 22 || x === 33;
      while (n > 9 && !isMaster(n)) {
        n = sumDigits(String(n));
      }
      return n;
    }

    const bRaw = normaliseText(soul.birthday || soul.birthdate);
    const parts = parseBirthdayToParts(bRaw);

    let zodiac = zodiacExisting;
    let chinese = chineseExisting;
    let lp = lifePathExisting;

    if (parts) {
      if (!zodiac) zodiac = zodiacSign(parts.month, parts.day);
      if (!chinese) chinese = chineseZodiac(parts.year);
      if (lp == null) lp = lifePath(parts.year, parts.month, parts.day);
    }

    return { zodiac, chineseZodiac: chinese, lifePathNumber: lp };
  }

  function formatUpdatedTime(date) {
    const d = date || new Date();
    try {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    } catch (e) {
      return "—";
    }
  }

  function truncateText(ctx, text, maxWidth) {
    const s = normaliseText(text);
    if (!s) return "";
    if (ctx.measureText(s).width <= maxWidth) return s;
    const ell = "…";
    let lo = 0;
    let hi = s.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      const candidate = s.slice(0, mid) + ell;
      if (ctx.measureText(candidate).width <= maxWidth) lo = mid + 1;
      else hi = mid;
    }
    const cut = Math.max(1, lo - 1);
    return s.slice(0, cut) + ell;
  }

  // Canvas scaling for crisp rendering + correct mobile sizing
  function getCanvasCtx(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width || 1);
    const cssH = Math.max(1, rect.height || 1);

    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const needW = Math.round(cssW * dpr);
    const needH = Math.round(cssH * dpr);

    if (canvas.width !== needW) canvas.width = needW;
    if (canvas.height !== needH) canvas.height = needH;

    // Draw in CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return { ctx, cssW, cssH };
  }

  function drawPlaceholder(canvas, title, subtitle) {
    const pack = getCanvasCtx(canvas);
    if (!pack) return;
    const { ctx, cssW, cssH } = pack;

    ctx.clearRect(0, 0, cssW, cssH);

    // subtle frame
    ctx.strokeStyle = "rgba(0,253,216,0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, cssW - 20, cssH - 20);

    // subtle lines
    ctx.strokeStyle = "rgba(0,253,216,0.12)";
    for (let i = 0; i < 5; i++) {
      const y = 26 + i * ((cssH - 52) / 5);
      ctx.beginPath();
      ctx.moveTo(18, y);
      ctx.lineTo(cssW - 18, y);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "600 14px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(title || "No data yet", 20, 20);

    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = "12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    const lines = normaliseText(subtitle).split("\n").filter(Boolean);
    let y = 44;
    lines.forEach((line) => {
      ctx.fillText(line, 20, y);
      y += 16;
    });
  }

  function drawBarChart(canvas, items, options) {
    const pack = getCanvasCtx(canvas);
    if (!pack) return;
    const { ctx, cssW, cssH } = pack;

    ctx.clearRect(0, 0, cssW, cssH);

    const opts = options || {};
    const title = normaliseText(opts.title);
    const showRightLabels = !!opts.showRightLabels;

    const pad = 16;
    const topPad = title ? 28 : 14;
    const bottomPad = 16;
    const leftPadBase = cssW < 360 ? 92 : 128;
    const leftPad = Math.min(leftPadBase, Math.max(72, Math.floor(cssW * 0.36)));
    const rightPad = showRightLabels ? 66 : 16;

    // Title
    if (title) {
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "600 12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(title, pad, 10);
    }

    // Frame
    ctx.strokeStyle = "rgba(0,253,216,0.16)";
    ctx.lineWidth = 1;
    ctx.strokeRect(pad, topPad, cssW - pad * 2, cssH - topPad - bottomPad);

    const chartX = pad + leftPad;
    const chartY = topPad + 10;
    const chartW = Math.max(40, cssW - pad * 2 - leftPad - rightPad - 10);
    const chartH = Math.max(80, cssH - topPad - bottomPad - 20);

    const rows = items.length || 1;
    const rowH = chartH / rows;
    const barH = Math.max(10, Math.min(16, rowH * 0.38));

    // Grid (0,25,50,75,100)
    ctx.strokeStyle = "rgba(0,253,216,0.12)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const x = chartX + (chartW * i) / 4;
      ctx.beginPath();
      ctx.moveTo(x, chartY);
      ctx.lineTo(x, chartY + chartH);
      ctx.stroke();
    }

    // Bars
    const now = performance.now();
    const anim = prefersReducedMotion ? 1 : Math.min(1, (now - (opts._startTime || now)) / (opts.duration || 500));
    const eased = prefersReducedMotion ? 1 : (1 - Math.pow(1 - anim, 3));

    ctx.font = "12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textBaseline = "middle";

    items.forEach((item, idx) => {
      const label = normaliseText(item.label);
      const value = Math.max(0, Math.min(100, Number(item.value) || 0));
      const rightLabel = normaliseText(item.rightLabel);

      const yCenter = chartY + rowH * idx + rowH / 2;
      const yBar = yCenter - barH / 2;

      // Left label
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "left";
      const maxLabelW = Math.max(40, leftPad - 14);
      const outLabel = truncateText(ctx, label, maxLabelW);
      ctx.fillText(outLabel, pad + 10, yCenter);

      // Background bar
      ctx.fillStyle = "rgba(0,253,216,0.10)";
      ctx.fillRect(chartX, yBar, chartW, barH);

      // Value bar
      const fillW = (chartW * value) / 100;
      const drawW = fillW * eased;
      const grad = ctx.createLinearGradient(chartX, 0, chartX + chartW, 0);
      grad.addColorStop(0, "rgba(0,253,216,0.78)");
      grad.addColorStop(1, "rgba(0,253,216,0.18)");
      ctx.fillStyle = grad;
      ctx.fillRect(chartX, yBar, drawW, barH);

      // Outline
      ctx.strokeStyle = "rgba(0,253,216,0.55)";
      ctx.lineWidth = 1;
      ctx.strokeRect(chartX, yBar, chartW, barH);

      // Right label
      if (showRightLabels) {
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.textAlign = "right";
        const text = rightLabel || (value >= 95 ? "Primary" : value >= 60 ? "Selected" : "");
        ctx.fillText(text, cssW - pad - 10, yCenter);
      }
    });

    // animation loop (single chart render)
    if (!prefersReducedMotion && anim < 1) {
      requestAnimationFrame(() => drawBarChart(canvas, items, options));
    }
  }

  function classifyValues(values) {
    const buckets = { heart: 0, mind: 0, spirit: 0 };

    const heartWords = [
      "love","family","friends","kindness","compassion","empathy","connection","community","loyalty","support","care",
    ];
    const mindWords = [
      "truth","justice","honesty","logic","growth","success","ambition","learning","knowledge","focus","discipline","clarity",
    ];
    const spiritWords = [
      "freedom","adventure","spiritual","spirituality","intuition","creativity","art","faith","nature","healing","purpose","joy","magic",
    ];

    values.forEach((raw) => {
      const v = normaliseText(raw).toLowerCase();
      if (!v) return;

      let h = 0, m = 0, s = 0;
      heartWords.forEach((w) => { if (v.includes(w)) h += 2; });
      mindWords.forEach((w) => { if (v.includes(w)) m += 2; });
      spiritWords.forEach((w) => { if (v.includes(w)) s += 2; });

      if (h === 0 && m === 0 && s === 0) { h = 1; m = 1; s = 1; }
      buckets.heart += h;
      buckets.mind += m;
      buckets.spirit += s;
    });

    const total = buckets.heart + buckets.mind + buckets.spirit;
    if (!total) return { heart: 1, mind: 1, spirit: 1 };
    return buckets;
  }

  function themeHintText(buckets) {
    const entries = [
      { key: "Heart", v: buckets.heart },
      { key: "Mind", v: buckets.mind },
      { key: "Spirit", v: buckets.spirit },
    ].sort((a, b) => b.v - a.v);

    const top = entries[0];
    const second = entries[1];

    if (!top || top.v === 0) return "Theme hint: balanced";
    if (second && top.v >= second.v * 1.4) return "Theme hint: strong " + top.key;
    if (second) return "Theme hint: mix of " + top.key + " + " + second.key;
    return "Theme hint: " + top.key;
  }

  // ---------- DOM cache ----------

  const ui = {
    scEmpty: $("#scEmpty"),
    scDashboard: $("#scDashboard"),
    scSummarySection: $("#scSummarySection"),
    scSummaryText: $("#scSummaryText"),
    scSummaryMeta: $("#scSummaryMeta"),

    scMetaName: $("#scMetaName"),
    scMetaZodiac: $("#scMetaZodiac"),
    scMetaChinese: $("#scMetaChinese"),
    scMetaLifePath: $("#scMetaLifePath"),

    scOrbitMain: $("#scOrbitMain"),
    scOrbitSub: $("#scOrbitSub"),

    loveCanvas: /** @type {HTMLCanvasElement|null} */ ($("#loveLanguageChart")),
    hobbiesCanvas: /** @type {HTMLCanvasElement|null} */ ($("#hobbiesChart")),
    valuesCanvas: /** @type {HTMLCanvasElement|null} */ ($("#valuesCompassChart")),

    loveSummary: $("#loveLanguageSummary"),
    hobbiesSummary: $("#hobbiesSummary"),
    valuesSummary: $("#valuesSummary"),

    loveChips: $("#loveLanguageChips"),
    hobbiesChips: $("#hobbiesChips"),
    valuesChips: $("#valuesChips"),

    zodiacLine: $("#zodiacLine"),
    zodiacChips: $("#zodiacChips"),

    refreshBtn: $("#scRefreshBtn"),
    lastUpdated: $("#scLastUpdated"),
  };

  // ---------- renderers ----------

  function renderLoveLanguage(soul) {
    if (!ui.loveCanvas) return;

    const primary = pickPrimaryLoveLanguage(soul);
    const selected = uniqueList(toArray(soul.loveLanguages || []).map(normaliseLoveLanguageLabel))
      .filter((x) => LOVE_LANGUAGES.includes(x));

    if (primary && !selected.includes(primary)) selected.unshift(primary);

    if (!primary && selected.length === 0) {
      drawPlaceholder(
        ui.loveCanvas,
        "No love language data yet",
        "Complete Quiz or Edit Profile.\nThen tap Refresh Chart."
      );
      if (ui.loveSummary) {
        ui.loveSummary.textContent =
          "Add your love language(s) in Quiz or Edit Profile to see a clear pattern here.";
      }
      if (ui.loveChips) ui.loveChips.textContent = "";
      return;
    }

    const items = LOVE_LANGUAGES.map((label) => {
      const isPrimary = primary && label === primary;
      const isSelected = selected.includes(label);
      const value = isPrimary ? 100 : isSelected ? 70 : 30;
      const rightLabel = isPrimary ? "Primary" : isSelected ? "Selected" : "";
      return { label, value, rightLabel };
    });

    drawBarChart(ui.loveCanvas, items, {
      title: "Love languages (strength)",
      showRightLabels: true,
      duration: 520,
      _startTime: performance.now(),
    });

    if (ui.loveChips) {
      ui.loveChips.textContent = "";
      LOVE_LANGUAGES.forEach((lab) => {
        const chip = document.createElement("span");
        chip.className = "sc-chip" + (lab === primary ? " primary" : "");
        chip.textContent = lab;
        ui.loveChips.appendChild(chip);
      });
    }

    if (ui.loveSummary) {
      if (primary) {
        const others = selected.filter((x) => x !== primary).slice(0, 3);
        const tail = others.length ? " Also meaningful: " + others.join(", ") + "." : "";
        ui.loveSummary.textContent = "Primary: " + primary + "." + tail;
      } else if (selected.length) {
        ui.loveSummary.textContent = "Selected love languages: " + selected.join(", ") + ".";
      } else {
        ui.loveSummary.textContent =
          "Add love languages in Quiz or Edit Profile to see your pattern.";
      }
    }
  }

  function renderRankedListChart(canvas, list, title) {
    const items = (list || []).slice(0, 6).map((label, idx) => {
      const value = Math.max(35, 100 - idx * 12);
      const rightLabel = idx === 0 ? "Top" : "";
      return { label, value, rightLabel };
    });

    drawBarChart(canvas, items, {
      title: title || "Top items",
      showRightLabels: true,
      duration: 520,
      _startTime: performance.now(),
    });
  }

  function renderHobbies(soul) {
    if (!ui.hobbiesCanvas) return;

    const hobbies = uniqueList(toArray(soul.hobbies || soul.interests || []));
    if (!hobbies.length) {
      drawPlaceholder(
        ui.hobbiesCanvas,
        "No hobbies/interests yet",
        "Add hobbies in Quiz or Edit Profile.\nThen tap Refresh Chart."
      );
      if (ui.hobbiesSummary) {
        ui.hobbiesSummary.textContent =
          "Add your hobbies/interests to see a ranked list here (1st = strongest signal).";
      }
      if (ui.hobbiesChips) ui.hobbiesChips.textContent = "";
      return;
    }

    renderRankedListChart(ui.hobbiesCanvas, hobbies, "Hobbies / interests (priority order)");

    if (ui.hobbiesChips) {
      ui.hobbiesChips.textContent = "";
      hobbies.slice(0, 8).forEach((h, idx) => {
        const chip = document.createElement("span");
        chip.className = "sc-chip" + (idx === 0 ? " primary" : "");
        chip.textContent = h;
        ui.hobbiesChips.appendChild(chip);
      });
      if (hobbies.length > 8) {
        const more = document.createElement("span");
        more.className = "sc-chip muted";
        more.textContent = "+" + (hobbies.length - 8) + " more";
        ui.hobbiesChips.appendChild(more);
      }
    }

    if (ui.hobbiesSummary) {
      const top3 = hobbies.slice(0, 3);
      ui.hobbiesSummary.textContent =
        "Top energy flow: " + top3.join(", ") + (hobbies.length > 3 ? "…" : ".");
    }
  }

  function renderValues(soul) {
    if (!ui.valuesCanvas) return;

    const values = uniqueList(toArray(soul.values || []));
    if (!values.length) {
      drawPlaceholder(
        ui.valuesCanvas,
        "No values yet",
        "Add your values in Quiz or Edit Profile.\nThen tap Refresh Chart."
      );
      if (ui.valuesSummary) {
        ui.valuesSummary.textContent =
          "Add your values to see your priorities and a soft theme hint (Heart/Mind/Spirit).";
      }
      if (ui.valuesChips) ui.valuesChips.textContent = "";
      return;
    }

    // Ranked values chart
    renderRankedListChart(ui.valuesCanvas, values, "Values (priority order)");

    // Add subtle theme hint into the summary line
    const buckets = classifyValues(values);
    const hint = themeHintText(buckets);

    if (ui.valuesChips) {
      ui.valuesChips.textContent = "";
      values.slice(0, 8).forEach((v, idx) => {
        const chip = document.createElement("span");
        chip.className = "sc-chip" + (idx === 0 ? " primary" : "");
        chip.textContent = v;
        ui.valuesChips.appendChild(chip);
      });
      if (values.length > 8) {
        const more = document.createElement("span");
        more.className = "sc-chip muted";
        more.textContent = "+" + (values.length - 8) + " more";
        ui.valuesChips.appendChild(more);
      }
    }

    if (ui.valuesSummary) {
      const top3 = values.slice(0, 3);
      ui.valuesSummary.textContent =
        "Top values: " + top3.join(", ") + ". " + hint + ".";
    }
  }

  function buildZodiacSnapshot(soul, derived) {
    if (!ui.zodiacLine) return;

    const name = normaliseText(soul.name) || "Your soul";
    const zodiac = normaliseText(derived.zodiac || soul.zodiac || soul.zodiacSign || soul.sunSign);
    const chinese = normaliseText(derived.chineseZodiac || soul.chineseZodiac || soul.chineseSign);
    let lp = derived.lifePathNumber;
    if (lp == null && soul.lifePathNumber != null) lp = soul.lifePathNumber;

    if (!zodiac && !chinese && lp == null) {
      ui.zodiacLine.textContent =
        "Add your birthday in Quiz or Edit Profile to see your zodiac, Chinese sign and life path number here.";
      if (ui.zodiacChips) ui.zodiacChips.textContent = "";
      return;
    }

    const parts = [];
    if (zodiac) parts.push(zodiac);
    if (chinese) parts.push(chinese + " year");
    if (lp != null) parts.push("Life Path " + lp);

    ui.zodiacLine.textContent = name + " carries: " + parts.join(" • ") + ".";

    if (ui.zodiacChips) {
      ui.zodiacChips.textContent = "";
      if (zodiac) {
        const zChip = document.createElement("span");
        zChip.className = "sc-chip primary";
        zChip.textContent = zodiac;
        ui.zodiacChips.appendChild(zChip);
      }
      if (chinese) {
        const cChip = document.createElement("span");
        cChip.className = "sc-chip";
        cChip.textContent = chinese + " (Chinese zodiac)";
        ui.zodiacChips.appendChild(cChip);
      }
      if (lp != null) {
        const lChip = document.createElement("span");
        lChip.className = "sc-chip";
        lChip.textContent = "Life Path " + lp;
        ui.zodiacChips.appendChild(lChip);
      }
    }
  }

  function populateHeroAndSummary(soul, derived) {
    const name = normaliseText(soul.name);
    const zodiac = normaliseText(derived.zodiac || soul.zodiac || soul.zodiacSign || soul.sunSign);
    const chinese = normaliseText(derived.chineseZodiac || soul.chineseZodiac || soul.chineseSign);
    let lp = derived.lifePathNumber;
    if (lp == null && soul.lifePathNumber != null) lp = soul.lifePathNumber;

    const primaryLove = pickPrimaryLoveLanguage(soul);
    const topValues = uniqueList(toArray(soul.values || [])).slice(0, 2);
    const topHobbies = uniqueList(toArray(soul.hobbies || soul.interests || [])).slice(0, 2);

    if (ui.scMetaName) {
      if (name) {
        ui.scMetaName.hidden = false;
        ui.scMetaName.textContent = name;
      } else {
        ui.scMetaName.hidden = true;
      }
    }

    if (ui.scMetaZodiac) {
      if (zodiac) {
        ui.scMetaZodiac.hidden = false;
        ui.scMetaZodiac.textContent = zodiac + " sun";
      } else {
        ui.scMetaZodiac.hidden = true;
      }
    }

    if (ui.scMetaChinese) {
      if (chinese) {
        ui.scMetaChinese.hidden = false;
        ui.scMetaChinese.textContent = chinese + " year";
      } else {
        ui.scMetaChinese.hidden = true;
      }
    }

    if (ui.scMetaLifePath) {
      if (lp != null) {
        ui.scMetaLifePath.hidden = false;
        ui.scMetaLifePath.textContent = "Life Path " + lp;
      } else {
        ui.scMetaLifePath.hidden = true;
      }
    }

    if (ui.scOrbitMain && ui.scOrbitSub) {
      ui.scOrbitMain.textContent = name || "Soul online";
      const bits = [];
      if (primaryLove) bits.push(primaryLove);
      if (topValues.length) bits.push("values: " + topValues.join(", "));
      if (topHobbies.length) bits.push("joy: " + topHobbies.join(", "));
      ui.scOrbitSub.textContent = bits.length
        ? "Snapshot: " + bits.join(" • ") + "."
        : "Ready to translate your inner map into clear charts.";
    }

    if (!ui.scSummarySection || !ui.scSummaryText || !ui.scSummaryMeta) return;

    ui.scSummarySection.hidden = false;

    const who = name || "This soul";
    const pieces = [];

    if (primaryLove) pieces.push("Primary love language: " + primaryLove + ".");
    if (topValues.length) pieces.push("Top values: " + topValues.join(", ") + ".");
    if (topHobbies.length) pieces.push("Top joys: " + topHobbies.join(", ") + ".");
    if (zodiac) pieces.push("Zodiac: " + zodiac + ".");
    if (chinese) pieces.push("Chinese zodiac: " + chinese + ".");
    if (lp != null && Number.isFinite(Number(lp))) pieces.push("Life path: " + lp + ".");

    if (!pieces.length) {
      ui.scSummaryText.textContent =
        who + " has a Soul Chart ready — add a little more data in Quiz or Edit Profile to unlock it.";
    } else {
      ui.scSummaryText.textContent = who + " — " + pieces.join(" ");
    }

    ui.scSummaryMeta.textContent =
      "Refresh Chart re-reads your saved profile (localStorage) and redraws everything instantly.";
  }

  function setLastUpdatedNow() {
    if (!ui.lastUpdated) return;
    const span = ui.lastUpdated.querySelector("span:last-child");
    if (!span) return;
    span.textContent = "Updated: " + formatUpdatedTime(new Date());
  }

  // ---------- orchestration ----------

  let soulData = {};

  function renderAll() {
    const soul = soulData || {};
    const derived = deriveZodiacFallback(soul);

    renderLoveLanguage(soul);
    renderHobbies(soul);
    renderValues(soul);
    buildZodiacSnapshot(soul, derived);
    populateHeroAndSummary(soul, derived);

    setLastUpdatedNow();
  }

  function showEmptyState() {
    if (ui.scEmpty) ui.scEmpty.hidden = false;
    if (ui.scDashboard) ui.scDashboard.hidden = true;
    if (ui.scSummarySection) ui.scSummarySection.hidden = true;
  }

  function showDashboard() {
    if (ui.scEmpty) ui.scEmpty.hidden = true;
    if (ui.scDashboard) ui.scDashboard.hidden = false;
    if (ui.scSummarySection) ui.scSummarySection.hidden = false;
  }

  function refreshFromStorage() {
    soulData = safeGetSoulData();
    const hasData = hasAnyCoreData(soulData);

    if (!hasData) {
      showEmptyState();
      setLastUpdatedNow();
      return;
    }

    showDashboard();
    renderAll();
  }

  let resizeTimer = null;
  function onResize() {
    // Re-render to fit canvases to new size (mobile rotation / viewport changes)
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!ui.scDashboard || ui.scDashboard.hidden) return;
      // keep same data, just redraw with new canvas sizes
      renderAll();
    }, 120);
  }

  function init() {
    try {
      soulData = safeGetSoulData();
      const hasData = hasAnyCoreData(soulData);

      if (!hasData) {
        showEmptyState();
        setLastUpdatedNow();
        return;
      }

      showDashboard();
      renderAll();
    } catch (err) {
      console.error("Soul Chart: init failed", err);
      showEmptyState();
      if (ui.scEmpty) {
        ui.scEmpty.hidden = false;
      }
      setLastUpdatedNow();
    }
  }

  if (ui.refreshBtn) {
    ui.refreshBtn.addEventListener("click", function () {
      refreshFromStorage();
    });
  }

  // Auto-refresh if changed from another tab/window
  window.addEventListener("storage", function (e) {
    try {
      const k = e && e.key ? String(e.key) : "";
      if (!k) return;
      if (k === "soulink.soulQuiz" || k === "soulQuiz" || k.indexOf("soulink.soulQuiz") !== -1) {
        refreshFromStorage();
      }
    } catch (err) {}
  });

  window.addEventListener("resize", onResize);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
