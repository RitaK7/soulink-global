// soul-chart.js — Soulink "Soul Chart" AI dashboard
// Reads soul profile via data-helpers and renders glowing charts.

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

  function safeGetSoulData() {
    let data = {};
    try {
      if (typeof getSoulData === "function") {
        try {
          data = getSoulData({ ensureShape: true }) || {};
        } catch (e) {
          data = getSoulData() || {};
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
    if (normaliseText(soul.birthday)) return true;
    if (normaliseText(soul.zodiac)) return true;
    if (normaliseText(soul.chineseZodiac)) return true;
    if (soul.lifePathNumber != null) return true;
    if (normaliseText(soul.loveLanguage)) return true;
    if (toArray(soul.loveLanguages || []).length) return true;
    if (toArray(soul.values || []).length) return true;
    if (toArray(soul.hobbies || soul.interests || []).length) return true;
    return false;
  }

  function pickPrimaryLoveLanguage(soul) {
    const primary = normaliseText(soul.loveLanguage);
    if (primary) return primary;
    const list = toArray(soul.loveLanguages || []);
    if (list.length) return normaliseText(list[0]);
    return "";
  }

  function canonicalLoveKey(labelRaw) {
    const label = normaliseText(labelRaw).toLowerCase();
    if (!label) return "";
    if (label.includes("affirmation") || label.includes("words"))
      return "words";
    if (label.includes("quality")) return "quality";
    if (label.includes("service")) return "service";
    if (label.includes("touch")) return "touch";
    if (label.includes("gift")) return "gifts";
    return "other";
  }

  // Zodiac + numerology fallback, reusing logic style from other pages
  function deriveZodiacFallback(soul) {
    const zodiacExisting = normaliseText(soul.zodiac);
    const chineseExisting = normaliseText(soul.chineseZodiac);
    let lifePathExisting = soul.lifePathNumber;

    function computeFromBirthday(birthdayRaw) {
      const raw = normaliseText(birthdayRaw);
      if (!raw) return {};

      let year, month, day;
      const euMatch = raw.match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
      if (euMatch) {
        day = Number(euMatch[1]);
        month = Number(euMatch[2]);
        year = Number(euMatch[3]);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const parts = raw.split("-");
        year = Number(parts[0]);
        month = Number(parts[1]);
        day = Number(parts[2]);
      } else {
        const digits = raw.replace(/[^\d]/g, "");
        if (/^\d{8}$/.test(digits)) {
          year = Number(digits.slice(0, 4));
          month = Number(digits.slice(4, 6));
          day = Number(digits.slice(6, 8));
        } else {
          return {};
        }
      }

      const dt = new Date(Date.UTC(year, month - 1, day));
      if (isNaN(dt.getTime())) return {};

      function zodiacSign(mo, da) {
        const md = mo * 100 + da;
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

      function chineseZodiac(y) {
        const animals = [
          "Rat",
          "Ox",
          "Tiger",
          "Rabbit",
          "Dragon",
          "Snake",
          "Horse",
          "Goat",
          "Monkey",
          "Rooster",
          "Dog",
          "Pig",
        ];
        const idx = (y - 1900) % 12;
        return animals[(idx + 12) % 12];
      }

      function lifePath(yyyy, mm, dd) {
        const digitsAll =
          String(yyyy) +
          String(mm).padStart(2, "0") +
          String(dd).padStart(2, "0");
        const sumDigits = (s) =>
          s.split("").reduce((acc, ch) => acc + Number(ch || 0), 0);
        let n = sumDigits(digitsAll);
        const isMaster = (x) => x === 11 || x === 22 || x === 33;
        while (n > 9 && !isMaster(n)) {
          n = sumDigits(String(n));
        }
        return n;
      }

      return {
        zodiac: zodiacSign(month, day),
        chineseZodiac: chineseZodiac(year),
        lifePathNumber: lifePath(year, month, day),
      };
    }

    let zodiac = zodiacExisting;
    let chineseZodiac = chineseExisting;
    let lifePathNumber = lifePathExisting;

    if (!zodiac || !chineseZodiac || lifePathNumber == null) {
      const fromBirthday = computeFromBirthday(soul.birthday);
      if (!zodiac) zodiac = normaliseText(fromBirthday.zodiac) || zodiacExisting;
      if (!chineseZodiac)
        chineseZodiac =
          normaliseText(fromBirthday.chineseZodiac) || chineseExisting;
      if (lifePathNumber == null && fromBirthday.lifePathNumber != null) {
        lifePathNumber = fromBirthday.lifePathNumber;
      }
    }

    return { zodiac, chineseZodiac, lifePathNumber };
  }

  function animate(from, to, duration, cb) {
    if (prefersReducedMotion || duration <= 0) {
      cb(to);
      return;
    }
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      cb(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
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
    loveCanvas: /** @type {HTMLCanvasElement|null} */ (
      $("#loveLanguageChart")
    ),
    hobbiesCanvas: /** @type {HTMLCanvasElement|null} */ ($("#hobbiesChart")),
    valuesCanvas: /** @type {HTMLCanvasElement|null} */ (
      $("#valuesCompassChart")
    ),
    loveSummary: $("#loveLanguageSummary"),
    hobbiesSummary: $("#hobbiesSummary"),
    valuesSummary: $("#valuesSummary"),
    loveChips: $("#loveLanguageChips"),
    hobbiesChips: $("#hobbiesChips"),
    valuesChips: $("#valuesChips"),
    zodiacLine: $("#zodiacLine"),
    zodiacChips: $("#zodiacChips"),
    refreshBtn: $("#scRefreshBtn"),
  };

  // ---------- chart builders ----------

  function buildLoveLanguageChart(soul) {
    if (!ui.loveCanvas) return;
    const ctx = ui.loveCanvas.getContext("2d");
    if (!ctx) return;

    const primary = pickPrimaryLoveLanguage(soul);
    const loveList = toArray(soul.loveLanguages || []);
    const axes = [
      { key: "words", label: "Words of Affirmation" },
      { key: "service", label: "Acts of Service" },
      { key: "gifts", label: "Receiving Gifts" },
      { key: "quality", label: "Quality Time" },
      { key: "touch", label: "Physical Touch" },
    ];

    if (!primary && loveList.length === 0) {
      ctx.clearRect(0, 0, ui.loveCanvas.width, ui.loveCanvas.height);
      if (ui.loveSummary) {
        ui.loveSummary.textContent =
          "Your primary love language will appear here once you complete the Quiz.";
      }
      if (ui.loveChips) ui.loveChips.textContent = "";
      return;
    }

    const values = axes.map(() => 1);
    const canonicalPrimary = canonicalLoveKey(primary);
    const canonicalList = loveList.map(canonicalLoveKey).filter(Boolean);

    axes.forEach((ax, i) => {
      if (ax.key === canonicalPrimary) values[i] = 5;
      else if (canonicalList.includes(ax.key)) values[i] = 3;
      else values[i] = 1.5;
    });

    if (ui.loveChips) {
      ui.loveChips.textContent = "";
      axes.forEach((ax) => {
        const span = document.createElement("span");
        span.className =
          "sc-chip" + (ax.key === canonicalPrimary ? " primary" : "");
        span.textContent = ax.label;
        ui.loveChips.appendChild(span);
      });
    }

    if (ui.loveSummary) {
      if (primary) {
        let line =
          "Your heart speaks loudest through " + primary + ". ";
        const key = canonicalPrimary;
        if (key === "words") {
          line +=
            "Kind words, reassurance and honest conversations are your strongest love signal.";
        } else if (key === "quality") {
          line +=
            "Unrushed, present time together is what makes you feel most held and seen.";
        } else if (key === "service") {
          line +=
            "When someone supports you with real actions, your whole nervous system relaxes.";
        } else if (key === "touch") {
          line +=
            "Safe, caring physical touch is how your body recognises that love is real.";
        } else if (key === "gifts") {
          line +=
            "Small, thoughtful gifts tell you that you are remembered and valued.";
        } else {
          line +=
            "You might resonate with more than one love language — notice which moments feel most nourishing.";
        }
        ui.loveSummary.textContent = line;
      } else {
        ui.loveSummary.textContent =
          "You might resonate with several love languages — your full pattern will appear once you refine your Quiz.";
      }
    }

    const { width, height } = ui.loveCanvas;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const radius = Math.min(width, height) * 0.32;
    const maxValue = 5;

    ctx.save();
    ctx.translate(centerX, centerY);

    // grid
    const ringCount = 4;
    for (let r = 1; r <= ringCount; r++) {
      const rNorm = (r / ringCount) * radius;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(0,253,216,0.18)";
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.7;
      ctx.arc(0, 0, rNorm, 0, Math.PI * 2);
      ctx.stroke();
    }

    // axes
    for (let i = 0; i < axes.length; i++) {
      const angle = (-Math.PI / 2) + (i * (2 * Math.PI / axes.length));
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "rgba(0,253,216,0.16)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // labels
    ctx.font = "11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    axes.forEach((ax, i) => {
      const angle = (-Math.PI / 2) + (i * (2 * Math.PI / axes.length));
      const labelRadius = radius + 18;
      const x = Math.cos(angle) * labelRadius;
      const y = Math.sin(angle) * labelRadius;
      ctx.fillText(ax.label, x, y);
    });

    // animated polygon
    const points = axes.map((_, i) => {
      const angle = (-Math.PI / 2) + (i * (2 * Math.PI / axes.length));
      return { angle, value: values[i] };
    });

    function drawPolygon(progress) {
      ctx.save();
      ctx.beginPath();
      points.forEach((p, idx) => {
        const rNorm = (p.value / maxValue) * radius * progress;
        const x = Math.cos(p.angle) * rNorm;
        const y = Math.sin(p.angle) * rNorm;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();

      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      grd.addColorStop(0, "rgba(0,253,216,0.45)");
      grd.addColorStop(1, "rgba(0,253,216,0.05)");
      ctx.fillStyle = grd;
      ctx.globalAlpha = 0.85;
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(0,253,216,0.9)";
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(0,253,216,0.95)";
      points.forEach((p) => {
        const rNorm = (p.value / maxValue) * radius * progress;
        const x = Math.cos(p.angle) * rNorm;
        const y = Math.sin(p.angle) * rNorm;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    animate(0, 1, 900, (t) => {
      ctx.clearRect(-centerX, -centerY, width, height);
      // re-draw grid + axes (simple approach: call function again)
      ctx.save();
      ctx.translate(centerX, centerY);
      // grid
      const ringCountInner = 4;
      for (let r = 1; r <= ringCountInner; r++) {
        const rNorm = (r / ringCountInner) * radius;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0,253,216,0.18)";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        ctx.arc(0, 0, rNorm, 0, Math.PI * 2);
        ctx.stroke();
      }
      // axes
      for (let i = 0; i < axes.length; i++) {
        const angle = (-Math.PI / 2) + (i * (2 * Math.PI / axes.length));
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x, y);
        ctx.strokeStyle = "rgba(0,253,216,0.16)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // labels
      ctx.font =
        "11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      axes.forEach((ax, i) => {
        const angle = (-Math.PI / 2) + (i * (2 * Math.PI / axes.length));
        const labelRadius = radius + 18;
        const x = Math.cos(angle) * labelRadius;
        const y = Math.sin(angle) * labelRadius;
        ctx.fillText(ax.label, x, y);
      });
      drawPolygon(t);
      ctx.restore();
    });
  }

  function buildHobbiesChart(soul) {
    if (!ui.hobbiesCanvas) return;
    const ctx = ui.hobbiesCanvas.getContext("2d");
    if (!ctx) return;

    const hobbiesRaw = toArray(soul.hobbies || soul.interests || [])
      .map(normaliseText)
      .filter(Boolean);

    const hobbies = hobbiesRaw.slice(0, 6);

    if (!hobbies.length) {
      ctx.clearRect(0, 0, ui.hobbiesCanvas.width, ui.hobbiesCanvas.height);
      if (ui.hobbiesSummary) {
        ui.hobbiesSummary.textContent =
          "Not filled in yet — your interests, hobbies and passions will appear here after you add them.";
      }
      if (ui.hobbiesChips) ui.hobbiesChips.textContent = "";
      return;
    }

    if (ui.hobbiesChips) {
      ui.hobbiesChips.textContent = "";
      hobbies.forEach((h, idx) => {
        const span = document.createElement("span");
        span.className = "sc-chip" + (idx === 0 ? " primary" : "");
        span.textContent = h;
        ui.hobbiesChips.appendChild(span);
      });
    }

    if (ui.hobbiesSummary) {
      const preview = hobbies.slice(0, 3).join(", ");
      ui.hobbiesSummary.textContent =
        "Your soul lights up most when you are around: " + preview + ".";
    }

    const { width, height } = ui.hobbiesCanvas;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2 + 5;
    const outerR = Math.min(width, height) * 0.38;
    const innerR = outerR * 0.52;

    const values = hobbies.map(() => 1);
    const total = values.reduce((acc, v) => acc + v, 0) || 1;

    function drawDonut(progress) {
      ctx.clearRect(0, 0, width, height);

      // background glow ring
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.beginPath();
      ctx.arc(0, 0, outerR + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,253,216,0.25)";
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.9;
      ctx.stroke();

      let startAngle = -Math.PI / 2;
      hobbies.forEach((hobby, idx) => {
        const value = values[idx];
        const sliceAngle = (value / total) * Math.PI * 2 * progress;
        const endAngle = startAngle + sliceAngle;

        const hueShift = idx * 12;
        const baseColor =
          "rgba(0,253,216," + (0.35 + idx * 0.07).toFixed(2) + ")";

        ctx.beginPath();
        ctx.moveTo(
          Math.cos(startAngle) * innerR,
          Math.sin(startAngle) * innerR
        );
        ctx.arc(0, 0, outerR, startAngle, endAngle);
        ctx.lineTo(
          Math.cos(endAngle) * innerR,
          Math.sin(endAngle) * innerR
        );
        ctx.arc(0, 0, innerR, endAngle, startAngle, true);
        ctx.closePath();

        const grad = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
        grad.addColorStop(0, "rgba(0,253,216,0.25)");
        grad.addColorStop(1, baseColor);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.9;
        ctx.fill();

        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(0,253,216,0.9)";
        ctx.globalAlpha = 0.7;
        ctx.stroke();

        startAngle += sliceAngle;
      });

      // inner core
      ctx.beginPath();
      ctx.arc(0, 0, innerR * 0.68, 0, Math.PI * 2);
      const coreGrad = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        innerR * 0.68
      );
      coreGrad.addColorStop(0, "rgba(0,253,216,0.25)");
      coreGrad.addColorStop(1, "rgba(0,253,216,0.02)");
      ctx.fillStyle = coreGrad;
      ctx.globalAlpha = 1;
      ctx.fill();

      ctx.restore();
    }

    animate(0, 1, 900, drawDonut);
  }

  function classifyValues(values) {
    const buckets = {
      heart: 0,
      mind: 0,
      spirit: 0,
    };

    const heartWords = [
      "love",
      "family",
      "friends",
      "kindness",
      "compassion",
      "empathy",
      "connection",
      "community",
      "loyalty",
      "support",
      "relationship",
      "care",
    ];
    const mindWords = [
      "truth",
      "justice",
      "honesty",
      "logic",
      "growth",
      "success",
      "ambition",
      "learning",
      "knowledge",
      "focus",
      "discipline",
      "clarity",
    ];
    const spiritWords = [
      "freedom",
      "adventure",
      "spiritual",
      "spirituality",
      "intuition",
      "creativity",
      "art",
      "faith",
      "nature",
      "healing",
      "purpose",
      "magic",
      "joy",
    ];

    values.forEach((raw) => {
      const v = normaliseText(raw).toLowerCase();
      if (!v) return;
      let heartScore = 0;
      let mindScore = 0;
      let spiritScore = 0;

      heartWords.forEach((w) => {
        if (v.includes(w)) heartScore += 2;
      });
      mindWords.forEach((w) => {
        if (v.includes(w)) mindScore += 2;
      });
      spiritWords.forEach((w) => {
        if (v.includes(w)) spiritScore += 2;
      });

      if (heartScore === 0 && mindScore === 0 && spiritScore === 0) {
        heartScore += 1;
        mindScore += 1;
        spiritScore += 1;
      }

      buckets.heart += heartScore;
      buckets.mind += mindScore;
      buckets.spirit += spiritScore;
    });

    if (
      buckets.heart === 0 &&
      buckets.mind === 0 &&
      buckets.spirit === 0 &&
      values.length
    ) {
      buckets.heart = buckets.mind = buckets.spirit = 1;
    }

    return buckets;
  }

  function buildValuesCompassChart(soul) {
    if (!ui.valuesCanvas) return;
    const ctx = ui.valuesCanvas.getContext("2d");
    if (!ctx) return;

    const valuesRaw = toArray(soul.values || [])
      .map(normaliseText)
      .filter(Boolean);

    if (!valuesRaw.length) {
      ctx.clearRect(0, 0, ui.valuesCanvas.width, ui.valuesCanvas.height);
      if (ui.valuesSummary) {
        ui.valuesSummary.textContent =
          "Not filled in yet — your core values will appear here once you share them in the Quiz or Edit Profile.";
      }
      if (ui.valuesChips) ui.valuesChips.textContent = "";
      return;
    }

    if (ui.valuesChips) {
      ui.valuesChips.textContent = "";
      valuesRaw.slice(0, 8).forEach((val) => {
        const span = document.createElement("span");
        span.className = "sc-chip";
        span.textContent = val;
        ui.valuesChips.appendChild(span);
      });
      if (valuesRaw.length > 8) {
        const more = document.createElement("span");
        more.className = "sc-chip muted";
        more.textContent = "+" + (valuesRaw.length - 8) + " more";
        ui.valuesChips.appendChild(more);
      }
    }

    const buckets = classifyValues(valuesRaw);
    const { width, height } = ui.valuesCanvas;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2 + 8;
    const radius = Math.min(width, height) * 0.35;

    const maxBucket = Math.max(buckets.heart, buckets.mind, buckets.spirit, 1);
    const heartR = (buckets.heart / maxBucket) * radius;
    const mindR = (buckets.mind / maxBucket) * radius;
    const spiritR = (buckets.spirit / maxBucket) * radius;

    const points = [
      { label: "Heart", angle: -Math.PI / 2, r: heartR },
      { label: "Mind", angle: (2 * Math.PI) / 3 - Math.PI / 2, r: mindR },
      { label: "Spirit", angle: (4 * Math.PI) / 3 - Math.PI / 2, r: spiritR },
    ];

    function drawCompass(progress) {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(centerX, centerY);

      // triangle frame
      ctx.beginPath();
      points.forEach((p, idx) => {
        const x = Math.cos(p.angle) * radius;
        const y = Math.sin(p.angle) * radius;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = "rgba(0,253,216,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // radial grid
      const gridLevels = 3;
      for (let i = 1; i <= gridLevels; i++) {
        const rInner = (i / gridLevels) * radius;
        ctx.beginPath();
        points.forEach((p, idx) => {
          const x = Math.cos(p.angle) * rInner;
          const y = Math.sin(p.angle) * rInner;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.strokeStyle = "rgba(0,253,216,0.14)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // labels
      ctx.font =
        "11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      points.forEach((p) => {
        const labelR = radius + 16;
        const x = Math.cos(p.angle) * labelR;
        const y = Math.sin(p.angle) * labelR;
        ctx.fillText(p.label, x, y);
      });

      // filled polygon
      ctx.beginPath();
      points.forEach((p, idx) => {
        const rNorm = p.r * progress;
        const x = Math.cos(p.angle) * rNorm;
        const y = Math.sin(p.angle) * rNorm;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, "rgba(0,253,216,0.4)");
      gradient.addColorStop(1, "rgba(0,253,216,0.05)");
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.85;
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(0,253,216,0.9)";
      ctx.stroke();

      ctx.restore();
    }

    animate(0, 1, 900, drawCompass);

    if (ui.valuesSummary) {
      const sorted = [
        { key: "Heart", value: buckets.heart },
        { key: "Mind", value: buckets.mind },
        { key: "Spirit", value: buckets.spirit },
      ].sort((a, b) => b.value - a.value);

      const top = sorted[0];
      const second = sorted[1];
      let line = "";

      if (top.value === 0 && second.value === 0) {
        line =
          "Your values are spread quite evenly — your compass balances Heart, Mind and Spirit.";
      } else if (second && top.value >= second.value * 1.4) {
        line =
          "Your compass leans strongly toward " +
          top.key +
          ", with the other directions playing a softer supporting role.";
      } else {
        line =
          "Your compass moves mainly between " +
          top.key +
          " and " +
          second.key +
          ", creating a blend of their qualities.";
      }

      ui.valuesSummary.textContent = line;
    }
  }

  function buildZodiacSnapshot(soul, derived) {
    if (!ui.zodiacLine) return;

    const name = normaliseText(soul.name) || "Your soul";
    const zodiac = normaliseText(derived.zodiac || soul.zodiac);
    const chinese = normaliseText(derived.chineseZodiac || soul.chineseZodiac);
    let lp = derived.lifePathNumber;
    if (lp == null && soul.lifePathNumber != null) lp = soul.lifePathNumber;

    if (!zodiac && !chinese && lp == null) {
      ui.zodiacLine.textContent =
        "Your zodiac and numerology snapshot will appear here after you add your birthday.";
      if (ui.zodiacChips) ui.zodiacChips.textContent = "";
      return;
    }

    const parts = [];
    if (zodiac) parts.push(zodiac);
    if (chinese) parts.push(chinese + " year");
    if (lp != null) parts.push("Life Path " + lp);

    ui.zodiacLine.textContent =
      name + " carries a combination of " + parts.join(", ") + ".";

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

  // ---------- summary & hero ----------

  function populateHeroAndSummary(soul, derived) {
    const name = normaliseText(soul.name);
    const zodiac = normaliseText(derived.zodiac || soul.zodiac);
    const chinese = normaliseText(derived.chineseZodiac || soul.chineseZodiac);
    let lp = derived.lifePathNumber;
    if (lp == null && soul.lifePathNumber != null) lp = soul.lifePathNumber;
    const love = pickPrimaryLoveLanguage(soul);

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
      if (name) {
        ui.scOrbitMain.textContent = name;
        ui.scOrbitSub.textContent = "This is your current soul blueprint in Soulink.";
      } else {
        ui.scOrbitMain.textContent = "Soul online";
        ui.scOrbitSub.textContent =
          "Ready to translate your inner map into glowing charts.";
      }
    }

    if (!ui.scSummarySection || !ui.scSummaryText || !ui.scSummaryMeta) return;

    ui.scSummarySection.hidden = false;

    const who = name || "This soul";
    const pieces = [];

    pieces.push(
      who +
        " carries a unique combination of astrological, emotional and spiritual energies."
    );
    if (zodiac) {
      pieces.push("Western zodiac: " + zodiac + ".");
    }
    if (chinese) {
      pieces.push("Chinese zodiac: " + chinese + ".");
    }
    if (lp != null && Number.isFinite(Number(lp))) {
      pieces.push("Life path: " + lp + ".");
    }
    if (love) {
      pieces.push("Primary love language: " + love + ".");
    }

    ui.scSummaryText.textContent = pieces.join(" ");

    const hasValues = toArray(soul.values || []).some((v) => normaliseText(v));
    const hasHobbies = toArray(soul.hobbies || soul.interests || []).some((v) =>
      normaliseText(v)
    );

    let tail =
      "Your Soul Chart does not define you, but it can gently remind you of the environments, relationships and rhythms where you tend to thrive.";

    if (hasValues && hasHobbies) {
      tail =
        "Your values act like an inner compass, while your hobbies and passions show where your energy feels most alive. " +
        tail;
    } else if (hasValues) {
      tail =
        "Your values act like an inner compass for your choices and boundaries. " +
        tail;
    } else if (hasHobbies) {
      tail =
        "Your passions and interests show where your energy feels most alive and playful. " +
        tail;
    }

    ui.scSummaryMeta.textContent = tail;
  }

  // ---------- orchestration ----------

  let soulData = {};

  function renderAll() {
    const soul = soulData || {};
    const derived = deriveZodiacFallback(soul);

    buildLoveLanguageChart(soul);
    buildHobbiesChart(soul);
    buildValuesCompassChart(soul);
    buildZodiacSnapshot(soul, derived);
    populateHeroAndSummary(soul, derived);
  }

  function init() {
    try {
      soulData = safeGetSoulData();
      const hasData = hasAnyCoreData(soulData);

      if (!hasData) {
        if (ui.scEmpty) ui.scEmpty.hidden = false;
        if (ui.scDashboard) ui.scDashboard.hidden = true;
        if (ui.scSummarySection) ui.scSummarySection.hidden = true;
        return;
      }

      if (ui.scEmpty) ui.scEmpty.hidden = false;
      if (ui.scDashboard) ui.scDashboard.hidden = false;

      renderAll();
    } catch (err) {
      console.error("Soul Chart: init failed", err);
      if (ui.scEmpty) {
        ui.scEmpty.hidden = false;
        ui.scEmpty.textContent =
          "We could not load your Soul Chart data. Please refresh the page or try again later.";
      }
    }
  }

  if (ui.refreshBtn) {
    ui.refreshBtn.addEventListener("click", function () {
      soulData = safeGetSoulData();
      if (!hasAnyCoreData(soulData)) {
        if (ui.scEmpty) ui.scEmpty.hidden = false;
        if (ui.scDashboard) ui.scDashboard.hidden = true;
        if (ui.scSummarySection) ui.scSummarySection.hidden = true;
        return;
      }
      if (ui.scEmpty) ui.scEmpty.hidden = true;
      if (ui.scDashboard) ui.scDashboard.hidden = false;
      renderAll();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
