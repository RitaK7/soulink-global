// soul-chart.js — Soulink "Soul Chart" page
// Reads soul profile and renders an at-a-glance chart of key energies.

(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const $ = (sel, root = document) => root.querySelector(sel);

  // ===================== Helpers =====================

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
      } else if (typeof localStorage !== "undefined") {
        const primary = localStorage.getItem("soulink.soulQuiz");
        const legacy = localStorage.getItem("soulQuiz");
        const raw = primary || legacy;
        data = raw ? JSON.parse(raw) : {};
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
    if (label.includes("affirmation") || label.includes("words")) return "words";
    if (label.includes("quality")) return "quality";
    if (label.includes("service")) return "service";
    if (label.includes("touch")) return "touch";
    if (label.includes("gift")) return "gifts";
    return "other";
  }

  // Same birthday parsing & zodiac logic as soul-coach.js
  function deriveZodiacFallback(soul) {
    const zodiacExisting = normaliseText(soul.zodiac);
    const chineseExisting = normaliseText(soul.chineseZodiac);
    let lifePathExisting = soul.lifePathNumber;

    function computeFromBirthday(birthdayRaw) {
      const raw = normaliseText(birthdayRaw);
      if (!raw) return {};

      let year, month, day;

      // European formats: DD.MM.YYYY or DD/MM/YYYY
      const euMatch = raw.match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
      if (euMatch) {
        day = Number(euMatch[1]);
        month = Number(euMatch[2]);
        year = Number(euMatch[3]);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        // ISO YYYY-MM-DD
        const parts = raw.split("-");
        year = Number(parts[0]);
        month = Number(parts[1]);
        day = Number(parts[2]);
      } else {
        // Digits-only fallback: YYYYMMDD
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

  // ===================== DOM cache =====================

  const ui = {
    chartEmpty: $("#chartEmpty"),

    chartZodiac: $("#chartZodiac"),
    chartChinese: $("#chartChinese"),
    chartLifePath: $("#chartLifePath"),
    chartLove: $("#chartLove"),
    chartValues: $("#chartValues"),
    chartHobbies: $("#chartHobbies"),
    chartSummary: $("#chartSummary"),
  };

  // ===================== Renderers =====================

  function renderZodiacSection(soul, zodiac) {
    if (!ui.chartZodiac) return;

    const sign = normaliseText(zodiac || soul.zodiac);
    if (!sign) {
      ui.chartZodiac.textContent =
        "Not set yet — your zodiac sign will appear here after you add or update your birthday.";
      return;
    }

    const lower = sign.toLowerCase();
    let short = "";

    if (lower === "aries") {
      short = "Bold fire starter, thrives on honesty, action and new beginnings.";
    } else if (lower === "taurus") {
      short = "Grounded, sensual and loyal, needs stability and calm beauty.";
    } else if (lower === "gemini") {
      short = "Curious communicator, connects through ideas, stories and play.";
    } else if (lower === "cancer") {
      short = "Soft-hearted and protective, needs emotional safety and home energy.";
    } else if (lower === "leo") {
      short = "Radiant and warm, loves to shine and be appreciated for their heart.";
    } else if (lower === "virgo") {
      short = "Practical healer, sees details and values integrity and improvement.";
    } else if (lower === "libra") {
      short = "Harmony seeker, cares deeply about balance, fairness and beauty.";
    } else if (lower === "scorpio") {
      short = "Intense and intuitive, drawn to depth, truth and transformation.";
    } else if (lower === "sagittarius") {
      short = "Free-spirited explorer, hungry for meaning, travel and big visions.";
    } else if (lower === "capricorn") {
      short = "Wise builder, values responsibility, long-term goals and loyalty.";
    } else if (lower === "aquarius") {
      short = "Unique visionary, cares about authenticity, freedom and community.";
    } else if (lower === "pisces") {
      short = "Empathic dreamer, deeply intuitive, spiritual and compassionate.";
    } else {
      short =
        "Your sign brings its own unique mix of strengths, lessons and magic.";
    }

    ui.chartZodiac.textContent = sign + " — " + short;
  }

  function renderChineseSection(soul, chineseZodiac) {
    if (!ui.chartChinese) return;

    const sign = normaliseText(chineseZodiac || soul.chineseZodiac);
    if (!sign) {
      ui.chartChinese.textContent =
        "Not set yet — your Chinese zodiac animal will appear here after your birthday is known.";
      return;
    }

    const lower = sign.toLowerCase();
    let short = "";

    if (lower === "rat") {
      short =
        "Sharp, adaptable and clever, gifted at finding solutions and openings.";
    } else if (lower === "ox") {
      short = "Steady, reliable and patient, carries strong endurance in life.";
    } else if (lower === "tiger") {
      short =
        "Brave, passionate and bold, not afraid to protect what matters.";
    } else if (lower === "rabbit") {
      short =
        "Gentle, sensitive and graceful, seeks peace and a cozy environment.";
    } else if (lower === "dragon") {
      short =
        "Powerful and visionary, carries big energy and leadership potential.";
    } else if (lower === "snake") {
      short =
        "Mystical, wise and intuitive, skilled at sensing deeper truths.";
    } else if (lower === "horse") {
      short =
        "Free-spirited, energetic and independent, needs room to move.";
    } else if (lower === "goat" || lower === "sheep") {
      short =
        "Artistic, soft and kind-hearted, nourished by beauty and safety.";
    } else if (lower === "monkey") {
      short =
        "Playful, quick-thinking and inventive, brings humor into life.";
    } else if (lower === "rooster") {
      short =
        "Confident, honest and proud, values clarity and self-expression.";
    } else if (lower === "dog") {
      short =
        "Loyal, protective and devoted, deeply values trust and fairness.";
    } else if (lower === "pig" || lower === "boar") {
      short =
        "Generous, warm and pleasure-loving, loves comfort, food and joy.";
    } else {
      short =
        "This animal sign adds an extra flavor to how you love, work and protect yourself.";
    }

    ui.chartChinese.textContent = sign + " — " + short;
  }

  function renderLifePathSection(soul, lifePathNumber) {
    if (!ui.chartLifePath) return;

    let n = lifePathNumber;
    if (n == null) n = soul.lifePathNumber;
    if (typeof n === "string") n = parseInt(n, 10);

    if (!Number.isFinite(n)) {
      ui.chartLifePath.textContent =
        "Not calculated yet — your life path number will appear here after your birthday is recognized.";
      return;
    }

    let short = "";

    switch (n) {
      case 1:
        short =
          "Pioneer & leader — here to learn healthy independence and courage.";
        break;
      case 2:
        short =
          "Peacemaker & empath — here to master harmony, intuition and cooperation.";
        break;
      case 3:
        short =
          "Creative communicator — here to share joy, art and honest expression.";
        break;
      case 4:
        short =
          "Builder & stabilizer — here to create solid foundations and structures.";
        break;
      case 5:
        short =
          "Explorer of freedom — here to learn change, flexibility and responsible adventure.";
        break;
      case 6:
        short =
          "Healer & guardian — here to embody care, responsibility and heart-led service.";
        break;
      case 7:
        short =
          "Seeker of truth — here to dive deep into wisdom, introspection and spirituality.";
        break;
      case 8:
        short =
          "Manifestor of power — here to balance material success with integrity and heart.";
        break;
      case 9:
        short =
          "Old soul & humanitarian — here to learn compassion, letting go and completion.";
        break;
      case 11:
        short =
          "Master 11 — intuitive light-bringer, here to channel inspiration into the world.";
        break;
      case 22:
        short =
          "Master 22 — master builder, here to turn soul visions into real structures.";
        break;
      case 33:
        short =
          "Master 33 — master teacher of compassion, here to radiate high-frequency love.";
        break;
      default:
        short =
          "This number carries its own curriculum — notice the themes life repeats for you again and again.";
        break;
    }

    ui.chartLifePath.textContent = "Life Path " + n + " — " + short;
  }

  function renderLoveSection(soul) {
    if (!ui.chartLove) return;

    const primary = pickPrimaryLoveLanguage(soul);
    if (!primary) {
      ui.chartLove.textContent =
        "Not chosen yet — your primary love language will appear here after you complete the quiz.";
      return;
    }

    const key = canonicalLoveKey(primary);
    let short = "";

    switch (key) {
      case "words":
        short =
          "You feel loved through kind words, appreciation and honest conversation.";
        break;
      case "quality":
        short =
          "You feel most connected when someone is fully present with you, without rush.";
        break;
      case "service":
        short =
          "You relax when people support you with practical help and shared tasks.";
        break;
      case "touch":
        short =
          "You receive love through safe, caring physical touch and closeness.";
        break;
      case "gifts":
        short =
          "You treasure small, meaningful gifts that show you are remembered and seen.";
        break;
      default:
        short =
          "You likely resonate with more than one love language — notice what consistently makes you feel safe and cherished.";
        break;
    }

    ui.chartLove.textContent = primary + " — " + short;
  }

  function renderValuesSection(soul) {
    if (!ui.chartValues) return;

    const values = toArray(soul.values || [])
      .map(normaliseText)
      .filter(Boolean);

    if (!values.length) {
      ui.chartValues.textContent =
        "Not filled in yet — your core values will appear here once you share them in the quiz or Edit Profile.";
      return;
    }

    ui.chartValues.textContent = values.join(", ");
  }

  function renderHobbiesSection(soul) {
    if (!ui.chartHobbies) return;

    const hobbies = toArray(soul.hobbies || soul.interests || [])
      .map(normaliseText)
      .filter(Boolean);

    if (!hobbies.length) {
      ui.chartHobbies.textContent =
        "Not filled in yet — your interests, hobbies and passions will appear here after you add them.";
      return;
    }

    ui.chartHobbies.textContent = hobbies.join(", ");
  }

  function renderSummarySection(soul, derived) {
    if (!ui.chartSummary) return;

    const name = normaliseText(soul.name) || "This soul";
    const zodiac = normaliseText(derived.zodiac || soul.zodiac);
    const chinese = normaliseText(derived.chineseZodiac || soul.chineseZodiac);
    const lp =
      derived.lifePathNumber != null ? derived.lifePathNumber : soul.lifePathNumber;
    const love = pickPrimaryLoveLanguage(soul);
    const hasValues = toArray(soul.values || []).some((v) => normaliseText(v));
    const hasHobbies = toArray(soul.hobbies || soul.interests || []).some((v) =>
      normaliseText(v)
    );

    const parts = [];

    parts.push(
      name +
        " carries a unique combination of astrological, numerological and emotional energies."
    );

    if (zodiac) {
      parts.push("Western zodiac: " + zodiac + ".");
    }
    if (chinese) {
      parts.push("Chinese zodiac: " + chinese + ".");
    }
    if (lp != null && Number.isFinite(Number(lp))) {
      parts.push("Life path: " + lp + ".");
    }
    if (love) {
      parts.push("Primary love language: " + love + ".");
    }
    if (hasValues) {
      parts.push("Core values are already defined and act like an inner compass.");
    }
    if (hasHobbies) {
      parts.push("Passions and interests show where this soul feels most alive.");
    }

    if (!parts.length) {
      ui.chartSummary.textContent =
        "Your Soul Chart will come alive once you complete the Soulink Quiz and share a bit more about yourself.";
    } else {
      ui.chartSummary.textContent = parts.join(" ");
    }
  }

  // ===================== Orchestration =====================

  let soulData = {};

  function renderAll() {
    const soul = soulData || {};
    const derived = deriveZodiacFallback(soul);

    renderZodiacSection(soul, derived.zodiac);
    renderChineseSection(soul, derived.chineseZodiac);
    renderLifePathSection(soul, derived.lifePathNumber);
    renderLoveSection(soul);
    renderValuesSection(soul);
    renderHobbiesSection(soul);
    renderSummarySection(soul, derived);
  }

  function init() {
    try {
      soulData = safeGetSoulData();
      const hasData = hasAnyCoreData(soulData);

      if (!hasData) {
        if (ui.chartEmpty) {
          ui.chartEmpty.hidden = false;
          ui.chartEmpty.textContent =
            "No soul data yet — please complete your Soulink Quiz and Edit Profile to see your Soul Chart.";
        }
        // Render with empty defaults anyway
      } else if (ui.chartEmpty) {
        ui.chartEmpty.hidden = true;
      }

      renderAll();
    } catch (err) {
      console.error("Soul Chart: init failed", err);
      if (ui.chartEmpty) {
        ui.chartEmpty.hidden = false;
        ui.chartEmpty.textContent =
          "We could not load your Soul Chart data. Please refresh the page or try again later.";
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
