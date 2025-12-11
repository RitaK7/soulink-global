(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const $ = (sel, root = document) => root.querySelector(sel);

  // ===================== Small helpers =====================

  function normaliseText(v) {
    return v == null ? "" : String(v).trim();
  }

  function toArray(v) {
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
  }

  function prefersReducedMotion() {
    try {
      return (
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    } catch (_err) {
      return false;
    }
  }

  function safeParseJSON(raw) {
    if (!raw || typeof raw !== "string") return null;
    try {
      return JSON.parse(raw);
    } catch (_err) {
      return null;
    }
  }

  function isContactLike(strRaw) {
    const str = normaliseText(strRaw).toLowerCase();
    if (!str) return false;
    if (str.includes("@")) return true;
    if (str.includes("http://") || str.includes("https://") || str.includes("www.")) return true;
    if (str.includes("telegram") || str.includes("tg:") || str.includes("whatsapp")) return true;
    if (str.replace(/[^0-9+]/g, "").length >= 6) return true;
    return false;
  }

  function cleanList(listLike) {
    const out = [];
    const seen = new Set();
    toArray(listLike).forEach((item) => {
      const t = normaliseText(item);
      if (!t) return;
      if (isContactLike(t)) return;
      const key = t.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(t);
    });
    return out;
  }

  function normalisedSet(arr) {
    const set = new Set();
    cleanList(arr).forEach((item) => set.add(item.toLowerCase()));
    return set;
  }

  function overlapList(baseArr, otherArr) {
    const baseSet = normalisedSet(baseArr);
    const result = [];
    cleanList(otherArr).forEach((item) => {
      const norm = item.toLowerCase();
      if (baseSet.has(norm)) {
        result.push(item);
      }
    });
    return result;
  }

  function numericLifePath(value) {
    if (value == null) return null;
    let n = value;
    if (typeof n === "string") {
      n = parseInt(n, 10);
    }
    if (!Number.isFinite(n)) return null;
    return n;
  }

  function computeAge(birthdayRaw) {
    const str = normaliseText(birthdayRaw);
    if (!str) return null;
    const match = str.match(/(\d{4})/);
    if (!match) return null;
    const year = parseInt(match[1], 10);
    if (!Number.isFinite(year)) return null;
    const now = new Date();
    const age = now.getFullYear() - year;
    if (age < 0 || age > 120) return null;
    return age;
  }

  function getQueryId() {
    try {
      const search = window.location.search || "";
      const params = new URLSearchParams(search);
      const raw = params.get("id");
      return raw ? raw.trim() : "";
    } catch (_err) {
      return "";
    }
  }

  function safeGetSoulData() {
    let data = {};
    try {
      if (typeof getSoulData === "function") {
        try {
          data = getSoulData({ ensureShape: true }) || {};
        } catch (_e) {
          data = getSoulData() || {};
        }
      }
    } catch (err) {
      console.warn("Match Profile: failed to read soul data", err);
      data = {};
    }
    if (!data || typeof data !== "object") return {};
    return data;
  }

  // ===================== Love language helpers =====================

  function getPrimaryLoveLanguage(person) {
    if (!person || typeof person !== "object") return "";
    const direct = normaliseText(person.loveLanguage);
    if (direct) return direct;
    const list = toArray(person.loveLanguages || []);
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

  // ===================== Zodiac helpers =====================

  const ZODIAC_ELEMENTS = {
    aries: "fire",
    leo: "fire",
    sagittarius: "fire",
    taurus: "earth",
    virgo: "earth",
    capricorn: "earth",
    gemini: "air",
    libra: "air",
    aquarius: "air",
    cancer: "water",
    scorpio: "water",
    pisces: "water",
  };

  const ZODIAC_SYMBOLS = {
    aries: "♈",
    taurus: "♉",
    gemini: "♊",
    cancer: "♋",
    leo: "♌",
    virgo: "♍",
    libra: "♎",
    scorpio: "♏",
    sagittarius: "♐",
    capricorn: "♑",
    aquarius: "♒",
    pisces: "♓",
  };

  const CHINESE_EMOJI = {
    rat: "🐀",
    ox: "🐂",
    tiger: "🐅",
    rabbit: "🐇",
    dragon: "🐉",
    snake: "🐍",
    horse: "🐎",
    goat: "🐐",
    sheep: "🐑",
    monkey: "🐒",
    rooster: "🐓",
    dog: "🐕",
    pig: "🐖",
    boar: "🐗",
  };

  function normaliseZodiac(name) {
    const s = normaliseText(name).toLowerCase();
    if (!s) return "";
    return s;
  }

  function zodiacSymbol(name) {
    const key = normaliseZodiac(name);
    return ZODIAC_SYMBOLS[key] || "★";
  }

  function chineseEmoji(name) {
    const key = normaliseText(name).toLowerCase();
    if (!key) return "☯";
    const parts = key.split(/\s+/);
    for (const p of parts) {
      if (CHINESE_EMOJI[p]) return CHINESE_EMOJI[p];
    }
    return "☯";
  }

  // ===================== Data sources: matches =====================

  const DEMO_MATCHES = [
    {
      id: "match-aurora",
      name: "Aurora",
      connectionType: "Romantic",
      loveLanguage: "Quality Time",
      loveLanguages: ["Quality Time", "Words of Affirmation"],
      values: ["Honesty", "Loyalty", "Growth"],
      hobbies: ["Hiking", "Books", "Music"],
      westernZodiac: "Sagittarius",
      chineseZodiac: "Dragon",
      lifePathNumber: 7,
      birthday: "1986-12-03",
    },
    {
      id: "match-leo",
      name: "Leo",
      connectionType: "Romantic",
      loveLanguage: "Physical Touch",
      loveLanguages: ["Physical Touch", "Acts of Service"],
      values: ["Passion", "Adventure", "Authenticity"],
      hobbies: ["Travel", "Dancing", "Cooking"],
      westernZodiac: "Leo",
      chineseZodiac: "Tiger",
      lifePathNumber: 5,
      birthday: "1984-08-01",
    },
    {
      id: "match-sage",
      name: "Sage",
      connectionType: "Friendship",
      loveLanguage: "Words of Affirmation",
      loveLanguages: ["Words of Affirmation", "Quality Time"],
      values: ["Honesty", "Curiosity", "Freedom"],
      hobbies: ["Podcasts", "Yoga", "Nature"],
      westernZodiac: "Aquarius",
      chineseZodiac: "Rabbit",
      lifePathNumber: 9,
      birthday: "1990-02-11",
    },
    {
      id: "match-luna",
      name: "Luna",
      connectionType: "Romantic",
      loveLanguage: "Acts of Service",
      loveLanguages: ["Acts of Service", "Receiving Gifts"],
      values: ["Loyalty", "Kindness", "Family"],
      hobbies: ["Cooking", "Gardening", "Films"],
      westernZodiac: "Cancer",
      chineseZodiac: "Horse",
      lifePathNumber: 6,
      birthday: "1988-07-05",
    },
    {
      id: "match-river",
      name: "River",
      connectionType: "Friendship",
      loveLanguage: "Quality Time",
      loveLanguages: ["Quality Time", "Physical Touch"],
      values: ["Growth", "Spirituality", "Authenticity"],
      hobbies: ["Meditation", "Hiking", "Art"],
      westernZodiac: "Pisces",
      chineseZodiac: "Goat",
      lifePathNumber: 11,
      birthday: "1992-03-15",
    },
    {
      id: "match-nova",
      name: "Nova",
      connectionType: "Romantic",
      loveLanguage: "Receiving Gifts",
      loveLanguages: ["Receiving Gifts", "Acts of Service"],
      values: ["Creativity", "Freedom", "Joy"],
      hobbies: ["Art", "Design", "Music"],
      westernZodiac: "Libra",
      chineseZodiac: "Monkey",
      lifePathNumber: 3,
      birthday: "1987-10-10",
    },
  ];

  function safeGetMatchesFromStorage() {
    if (typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem("soulink.friends.list");
      const parsed = safeParseJSON(raw);
      if (!parsed || !Array.isArray(parsed)) return [];
      return parsed.filter((item) => item && typeof item === "object");
    } catch (err) {
      console.warn("Match Profile: failed to read soulink.friends.list", err);
      return [];
    }
  }

  function safeGetMatches() {
    const fromStorage = safeGetMatchesFromStorage();
    if (fromStorage.length) return fromStorage;
    return DEMO_MATCHES;
  }

  function findMatchByIdOrName(id, matches) {
    if (!id) return null;
    const decoded = decodeURIComponent(id);

    let m = matches.find((item) => String(item.id) === id);
    if (m) return m;

    m = matches.find((item) => String(item.id) === decoded);
    if (m) return m;

    const targetName = decoded.toLowerCase();
    m = matches.find(
      (item) => normaliseText(item.name).toLowerCase() === targetName
    );
    return m || null;
  }

  function hasAnyCoreData(soul) {
    if (!soul || typeof soul !== "object") return false;
    if (normaliseText(soul.name)) return true;
    if (getPrimaryLoveLanguage(soul)) return true;
    if (cleanList(soul.values || soul.coreValues || []).length) return true;
    if (cleanList(soul.hobbies || soul.passions || soul.interests || []).length)
      return true;
    if (normaliseText(soul.westernZodiac || soul.zodiac)) return true;
    if (numericLifePath(soul.lifePathNumber) != null) return true;
    return false;
  }

  // ===================== Compatibility scoring (same model as match.js) =====================

  const WEIGHTS = {
    love: 35,
    values: 25,
    hobbies: 15,
    zodiac: 10,
    chinese: 5,
    numerology: 10,
  };

  function computeValueOverlap(baseValues, matchValues) {
    const base = cleanList(baseValues);
    const other = cleanList(matchValues);
    if (!base.length || !other.length) {
      return { score: 0, items: [] };
    }
    const items = overlapList(base, other);
    const maxReference = Math.max(base.length, 1);
    const ratio = Math.min(items.length / maxReference, 1);
    const score = Math.round(ratio * WEIGHTS.values);
    return { score, items };
  }

  function computeHobbyScore(baseHobbies, matchHobbies) {
    const base = cleanList(baseHobbies);
    const other = cleanList(matchHobbies);
    if (!base.length || !other.length) {
      return { score: 0, items: [] };
    }
    const items = overlapList(base, other);
    const maxReference = Math.max(base.length, 1);
    const ratio = Math.min(items.length / maxReference, 1);
    const score = Math.round(ratio * WEIGHTS.hobbies);
    return { score, items };
  }

  function loveLanguageScore(basePerson, matchPerson) {
    const basePrimary = getPrimaryLoveLanguage(basePerson);
    const matchPrimary = getPrimaryLoveLanguage(matchPerson);

    const baseSet = normalisedSet(
      toArray(basePerson.loveLanguages || []).concat(basePrimary)
    );
    const matchSet = normalisedSet(
      toArray(matchPerson.loveLanguages || []).concat(matchPrimary)
    );

    let score = 0;
    let label = "No clear overlap yet.";
    let strong = false;

    if (!baseSet.size || !matchSet.size) {
      return { score, label, strong };
    }

    const primarySame =
      normaliseText(basePrimary).toLowerCase() ===
      normaliseText(matchPrimary).toLowerCase();

    let anyOverlap = false;
    for (const l of baseSet) {
      if (matchSet.has(l)) {
        anyOverlap = true;
        break;
      }
    }

    if (primarySame && basePrimary) {
      score = WEIGHTS.love;
      label = "Primary love languages mirror each other.";
      strong = true;
    } else if (anyOverlap) {
      score = Math.round(WEIGHTS.love * 0.7);
      label = "You share at least one love language.";
      strong = true;
    } else {
      score = Math.round(WEIGHTS.love * 0.3);
      label =
        "Different love languages — with communication, this can still balance.";
    }

    return { score, label, strong, primarySame };
  }

  function zodiacCompatibility(baseZodiacRaw, matchZodiacRaw) {
    const baseZ = normaliseZodiac(baseZodiacRaw);
    const matchZ = normaliseZodiac(matchZodiacRaw);
    if (!baseZ || !matchZ) {
      return { score: 0, label: "" };
    }

    const baseElem = ZODIAC_ELEMENTS[baseZ] || "";
    const matchElem = ZODIAC_ELEMENTS[matchZ] || "";

    let multiplier = 0.5;
    let label = "Different elements — can be complementary with effort.";

    if (baseZ === matchZ) {
      multiplier = 1;
      label = "Same sign — you may recognize each other easily.";
    } else if (baseElem && matchElem && baseElem === matchElem) {
      multiplier = 0.85;
      label = "Same element — similar emotional climate.";
    } else if (
      (baseElem === "fire" && matchElem === "air") ||
      (baseElem === "air" && matchElem === "fire") ||
      (baseElem === "earth" && matchElem === "water") ||
      (baseElem === "water" && matchElem === "earth")
    ) {
      multiplier = 0.75;
      label = "Complementary elements — different but supportive.";
    }

    const score = Math.round(WEIGHTS.zodiac * multiplier);
    return { score, label };
  }

  function chineseZodiacCompatibility(baseChineseRaw, matchChineseRaw) {
    const baseC = normaliseText(baseChineseRaw).toLowerCase();
    const matchC = normaliseText(matchChineseRaw).toLowerCase();
    if (!baseC || !matchC) {
      return { score: 0, label: "" };
    }

    if (baseC === matchC) {
      return {
        score: WEIGHTS.chinese,
        label: "Same Chinese sign — similar rhythm of growth.",
      };
    }

    return {
      score: Math.round(WEIGHTS.chinese * 0.6),
      label: "Different Chinese signs — diversity that can enrich the dynamic.",
    };
  }

  function numerologyCompatibility(baseLifePathRaw, matchLifePathRaw) {
    const base = numericLifePath(baseLifePathRaw);
    const match = numericLifePath(matchLifePathRaw);
    if (base == null || match == null) {
      return { score: 0, label: "" };
    }

    const diff = Math.abs(base - match);
    let multiplier = 0.6;
    let label = "Different life paths — can still learn from each other.";

    if (diff === 0) {
      multiplier = 1;
      label =
        "Same life path number — strong resonance in how you move through life.";
    } else if (diff === 1) {
      multiplier = 0.85;
      label = "Adjacent life paths — similar lessons with different flavors.";
    } else if (diff === 2) {
      multiplier = 0.7;
      label = "Related but distinct life paths — potential for complementary growth.";
    }

    const score = Math.round(WEIGHTS.numerology * multiplier);
    return { score, label };
  }

  function computeCompatibility(baseSoul, candidate) {
    const baseValues = baseSoul.values || baseSoul.coreValues || [];
    const baseHobbies =
      baseSoul.hobbies || baseSoul.passions || baseSoul.interests || [];
    const matchValues = candidate.values || candidate.coreValues || [];
    const matchHobbies =
      candidate.hobbies || candidate.passions || candidate.interests || [];

    const loveRes = loveLanguageScore(baseSoul, candidate);
    const valuesRes = computeValueOverlap(baseValues, matchValues);
    const hobbyRes = computeHobbyScore(baseHobbies, matchHobbies);

    const baseZodiac = baseSoul.westernZodiac || baseSoul.zodiac;
    const matchZodiac = candidate.westernZodiac || candidate.zodiac;
    const zodiacRes = zodiacCompatibility(baseZodiac, matchZodiac);

    const chineseRes = chineseZodiacCompatibility(
      baseSoul.chineseZodiac,
      candidate.chineseZodiac
    );

    const numerologyRes = numerologyCompatibility(
      baseSoul.lifePathNumber,
      candidate.lifePathNumber
    );

    let score =
      loveRes.score +
      valuesRes.score +
      hobbyRes.score +
      zodiacRes.score +
      chineseRes.score +
      numerologyRes.score;

    if (!Number.isFinite(score)) score = 0;
    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      score,
      love: loveRes,
      values: valuesRes,
      hobbies: hobbyRes,
      zodiac: zodiacRes,
      chinese: chineseRes,
      numerology: numerologyRes,
    };
  }

  function overallVibeLabel(score) {
    if (score >= 80) return "High harmony";
    if (score >= 60) return "Good potential";
    if (score >= 40) return "Exploration match";
    return "Learning connection";
  }

  // ===================== DOM cache =====================

  const ui = {
    page: $(".match-profile-page"),
    error: $("#mpError"),
    errorMessage: $("#mpErrorMessage"),
    layout: $("#mpLayout"),

    titleName: $("#mpTitleName"),
    subtitle: $("#mpSubtitle"),
    youName: $("#mpYouName"),
    themName: $("#mpThemName"),
    scoreValue: $("#mpScoreValue"),
    orbMain: $("#mpOrbMain"),
    orbSub: $("#mpOrbSub"),

    loveYou: $("#mpLoveYou"),
    loveThem: $("#mpLoveThem"),
    loveSummary: $("#mpLoveSummary"),
    loveTips: $("#mpLoveTips"),

    valuesChips: $("#mpValuesChips"),
    valuesSummary: $("#mpValuesSummary"),
    valuesTips: $("#mpValuesTips"),

    joyChips: $("#mpJoyChips"),
    joySummary: $("#mpJoySummary"),
    joyIdeas: $("#mpJoyIdeas"),

    astroYouZodiac: $("#mpAstroYouZodiac"),
    astroYouChinese: $("#mpAstroYouChinese"),
    astroYouLifePath: $("#mpAstroYouLifePath"),
    astroThemZodiac: $("#mpAstroThemZodiac"),
    astroThemChinese: $("#mpAstroThemChinese"),
    astroThemLifePath: $("#mpAstroThemLifePath"),
    astroSummary: $("#mpAstroSummary"),

    stepSummary: $("#mpStepSummary"),
    stepHighlight: $("#mpStepHighlight"),
  };

  // ===================== Section text generators =====================

  function buildLoveSummary(baseSoul, match, breakdown) {
    const baseName = normaliseText(baseSoul.name) || "You";
    const matchName = normaliseText(match.name) || "this person";
    const youLove = getPrimaryLoveLanguage(baseSoul);
    const themLove = getPrimaryLoveLanguage(match);

    const youKey = canonicalLoveKey(youLove);
    const themKey = canonicalLoveKey(themLove);

    if (!youLove && !themLove) {
      return (
        "Even if love languages aren’t named yet, you can still pay attention to " +
        "what makes each of you visibly relax, soften or light up."
      );
    }

    if (youKey && youKey === themKey && youKey !== "other") {
      return (
        baseName +
        " and " +
        matchName +
        " seem to be tuned to a similar channel of care. " +
        "This can make it easier to feel understood, especially when you both " +
        "say out loud what this love language means in everyday life."
      );
    }

    if (!youLove || !themLove) {
      const who = youLove ? baseName : matchName;
      return (
        "One of you — " +
        who +
        " — already has a clearer language of care. " +
        "Naming what feels supportive on both sides can reduce silent expectations and guesswork."
      );
    }

    return (
      "Your love languages are different, which doesn’t have to be a problem. " +
      "It simply means you are learning to speak two emotional dialects. " +
      "The more you translate for each other, the less likely you are to miss good intentions."
    );
  }

  function buildLoveTips(baseSoul, match) {
    const tips = [];
    const youLove = canonicalLoveKey(getPrimaryLoveLanguage(baseSoul));
    const themLove = canonicalLoveKey(getPrimaryLoveLanguage(match));

    tips.push(
      "Name one concrete action that makes each of you feel genuinely cared for."
    );
    tips.push(
      "Choose one small weekly ritual that belongs just to this connection — something realistic, not grand."
    );

    if (youLove && themLove && youLove === themLove) {
      tips.push(
        "When stress rises, return to this shared love language on purpose instead of waiting for the perfect moment."
      );
    } else if (youLove && themLove) {
      tips.push(
        "Take turns: one day you lean into your language, another day into theirs — like swapping playlists."
      );
    } else {
      tips.push(
        "Gently ask: “When did you last feel really cared for by someone?” and listen for clues without fixing."
      );
    }

    return tips;
  }

  function buildValuesSummary(baseSoul, match, breakdown) {
    const baseName = normaliseText(baseSoul.name) || "You";
    const matchName = normaliseText(match.name) || "this person";

    if (breakdown.values.items.length) {
      const shared = breakdown.values.items.slice(0, 3);
      const joined =
        shared.length === 1
          ? shared[0]
          : shared.slice(0, -1).join(", ") +
            " and " +
            shared[shared.length - 1];

      return (
        "You both seem to care about " +
        joined.toLowerCase() +
        ". When these values are honoured in daily choices, " +
        "the connection tends to feel steadier and more trustworthy."
      );
    }

    return (
      baseName +
      " and " +
      matchName +
      " may be bringing different values to the table, or they simply aren’t fully visible yet. " +
      "This can still be a fertile space, as long as you stay honest about what you each need to feel respected and safe."
    );
  }

  function buildValuesTips(breakdown) {
    const tips = [];

    if (breakdown.values.items.length) {
      tips.push(
        "Choose one shared value and ask: “What does this look like in real life for you?”"
      );
      tips.push(
        "Notice moments when this value is honoured between you and say it out loud — it strengthens the pattern."
      );
      tips.push(
        "If tension appears, check whether one of your core values feels ignored before blaming personalities."
      );
    } else {
      tips.push(
        "Have a gentle conversation about what each of you refuses to compromise on in relationships or friendships."
      );
      tips.push(
        "Share one story each about a time you felt deeply respected — what value was being honoured there?"
      );
      tips.push(
        "If conflict arises, ask: “Which value of mine feels touched right now?” instead of jumping straight into blame."
      );
    }

    return tips;
  }

  function buildJoySummary(baseSoul, match, breakdown) {
    const baseName = normaliseText(baseSoul.name) || "You";
    const matchName = normaliseText(match.name) || "this person";

    if (breakdown.hobbies.items.length) {
      return (
        "These shared joys are likely to feel like low-friction spaces for you both. " +
        "They don’t have to become big events — even 30 minutes of something light and familiar can reset the emotional tone."
      );
    }

    return (
      baseName +
      " and " +
      matchName +
      " might be bringing different flavours of joy into the mix. " +
      "This can be a beautiful exchange as long as you stay curious and avoid judging what refuels the other person."
    );
  }

  function buildJoyIdeas(baseSoul, match, breakdown) {
    const suggestions = new Set();
    const shared = breakdown.hobbies.items;

    const allHobbies = cleanList(
      [
        ...(baseSoul.hobbies || []),
        ...(baseSoul.passions || []),
        ...(baseSoul.interests || []),
        ...(match.hobbies || []),
        ...(match.passions || []),
        ...(match.interests || []),
      ].concat(shared || [])
    );

    const lower = allHobbies.map((h) => h.toLowerCase());

    function maybeAdd(condition, idea) {
      if (condition) suggestions.add(idea);
    }

    const hasNature = lower.some((h) =>
      /(hike|walk|nature|forest|mountain|park|outdoor)/.test(h)
    );
    const hasBooks = lower.some((h) =>
      /(book|read|reading|library|bookshop)/.test(h)
    );
    const hasCoffee = lower.some((h) =>
      /(coffee|tea|cafe|café)/.test(h)
    );
    const hasMusic = lower.some((h) =>
      /(music|concert|dance|dancing)/.test(h)
    );
    const hasFilms = lower.some((h) =>
      /(film|movie|cinema|series)/.test(h)
    );
    const hasCooking = lower.some((h) =>
      /(cook|cooking|kitchen|food|restaurant)/.test(h)
    );
    const hasArt = lower.some((h) =>
      /(art|drawing|paint|design|photo|photography)/.test(h)
    );
    const hasMindful = lower.some((h) =>
      /(yoga|meditation|breath|breathing)/.test(h)
    );
    const hasTravel = lower.some((h) =>
      /(travel|trip|journey|road trip)/.test(h)
    );

    maybeAdd(
      hasNature,
      "Plan a slow walk or simple time in nature together — no big agenda, just shared space."
    );
    maybeAdd(
      hasBooks,
      "Meet for a quiet coffee and a bookstore or library wander, where conversation can come and go naturally."
    );
    maybeAdd(
      hasCoffee,
      "Keep it light with a short tea or coffee ritual, focusing on presence rather than long, heavy talks."
    );
    maybeAdd(
      hasMusic,
      "Share music — a playlist exchange, a small concert, or even dancing in the kitchen."
    );
    maybeAdd(
      hasFilms,
      "Choose a film or series you both enjoy and treat it as a soft ritual, not just background noise."
    );
    maybeAdd(
      hasCooking,
      "Cook something simple together, even if it’s just assembling snacks — shared tasks can lower social pressure."
    );
    maybeAdd(
      hasArt,
      "Create side-by-side: drawing, crafting or browsing art for inspiration rather than perfection."
    );
    maybeAdd(
      hasMindful,
      "Experiment with a short shared pause — a guided meditation, stretching or focused breathing for a few minutes."
    );
    maybeAdd(
      hasTravel,
      "If it feels right, plan a small micro-trip, even just to a new part of town, to experience newness together."
    );

    if (!suggestions.size) {
      suggestions.add(
        "Pick one low-pressure activity that neither of you has to impress at — a walk, a simple meal, or sitting together with music."
      );
      suggestions.add(
        "Notice which moments feel easy and light, then consider repeating those rather than forcing dramatic plans."
      );
    }

    return Array.from(suggestions).slice(0, 4);
  }

  function buildAstroSummary(baseSoul, match, breakdown) {
    const pieces = [];

    if (breakdown.zodiac && breakdown.zodiac.label) {
      pieces.push(breakdown.zodiac.label);
    }
    if (breakdown.chinese && breakdown.chinese.label) {
      pieces.push(breakdown.chinese.label);
    }
    if (breakdown.numerology && breakdown.numerology.label) {
      pieces.push(breakdown.numerology.label);
    }

    if (!pieces.length) {
      return (
        "Astrology and numerology here are gently symbolic — they can offer language for tendencies, " +
        "but they never override your choices, communication or consent."
      );
    }

    const joined = pieces.join(" ");
    return (
      joined +
      " These are all lenses, not rules. You are always free to relate differently than any description suggests."
    );
  }

  function buildStepSummary(baseSoul, match) {
    const baseName = normaliseText(baseSoul.name) || "You";
    const matchName = normaliseText(match.name) || "this person";

    return (
      baseName +
      " and " +
      matchName +
      " don’t need a perfect plan — usually one small, honest action is enough to test how safe and alive the connection feels."
    );
  }

  function buildStepHighlight(baseSoul, match, breakdown) {
    const sharedValue = breakdown.values.items[0];
    const sharedJoy = breakdown.hobbies.items[0];
    const loveKey = canonicalLoveKey(getPrimaryLoveLanguage(baseSoul));

    if (sharedValue && sharedJoy) {
      return (
        "Share one sentence each about what “" +
        sharedValue.toLowerCase() +
        "” means to you, then plan a tiny shared moment that includes “" +
        sharedJoy.toLowerCase() +
        "” somewhere in it."
      );
    }

    if (sharedValue) {
      return (
        "Today, gently name one boundary or request that protects your value of “" +
        sharedValue.toLowerCase() +
        "”, and invite them to share one of theirs too."
      );
    }

    if (sharedJoy) {
      return (
        "Invite them into a small shared moment around “" +
        sharedJoy.toLowerCase() +
        "” — nothing big, just enough to see how your energies feel side by side."
      );
    }

    if (loveKey === "quality") {
      return (
        "Offer 20–30 minutes of undistracted presence — put phones away and let the conversation wander without trying to fix anything."
      );
    }

    if (loveKey === "words") {
      return (
        "Send or say one clear, kind sentence about what you appreciate in them, without expecting anything specific back."
      );
    }

    if (loveKey === "service") {
      return (
        "Notice one small practical way you could lighten their load today and ask if that would truly feel helpful."
      );
    }

    if (loveKey === "touch") {
      return (
        "If the connection and context allow, ask directly what kind of physical closeness feels safe for them instead of assuming."
      );
    }

    if (loveKey === "gifts") {
      return (
        "Offer a tiny symbolic gesture — a song, a picture, a snack — that says “I remembered you,” more than “I spent a lot.”"
      );
    }

    return (
      "Ask yourself: “What would make me feel 5% safer and more relaxed with this person?” and share one small part of that answer."
    );
  }

  // ===================== Rendering =====================

  function renderHero(baseSoul, match, breakdown) {
    const baseName = normaliseText(baseSoul.name) || "You";
    const matchName = normaliseText(match.name) || "this person";

    if (ui.titleName) {
      ui.titleName.textContent = matchName;
    }

    if (ui.subtitle) {
      ui.subtitle.textContent =
        "A gentle compatibility portrait between you and " +
        matchName +
        " — blending love languages, values, joys and symbolic sky.";
    }

    if (ui.youName) {
      ui.youName.textContent = baseName;
    }

    if (ui.themName) {
      const cx = normaliseText(match.connectionType);
      ui.themName.textContent = cx ? matchName + " · " + cx : matchName;
    }

    if (ui.scoreValue) {
      ui.scoreValue.textContent = breakdown.score + "%";
    }

    if (ui.orbMain) {
      ui.orbMain.textContent = overallVibeLabel(breakdown.score);
    }

    if (ui.orbSub) {
      ui.orbSub.textContent =
        "Mutual effort, clear communication and respect are always more important than any number on this page.";
    }
  }

  function renderLoveSection(baseSoul, match, breakdown) {
    const youLove = getPrimaryLoveLanguage(baseSoul);
    const themLove = getPrimaryLoveLanguage(match);

    if (ui.loveYou) ui.loveYou.textContent = youLove || "Not named yet";
    if (ui.loveThem) ui.loveThem.textContent = themLove || "Not named yet";

    if (ui.loveSummary) {
      ui.loveSummary.textContent = buildLoveSummary(baseSoul, match, breakdown);
    }

    if (ui.loveTips) {
      ui.loveTips.innerHTML = "";
      const tips = buildLoveTips(baseSoul, match);
      tips.forEach((t) => {
        const li = document.createElement("li");
        li.textContent = t;
        ui.loveTips.appendChild(li);
      });
    }
  }

  function renderValuesSection(baseSoul, match, breakdown) {
    if (ui.valuesChips) {
      ui.valuesChips.innerHTML = "";
      if (breakdown.values.items.length) {
        breakdown.values.items.slice(0, 5).forEach((val) => {
          const chip = document.createElement("span");
          chip.className = "mp-chip";
          chip.textContent = val;
          ui.valuesChips.appendChild(chip);
        });
      } else {
        const chip = document.createElement("span");
        chip.className = "mp-chip mp-chip-muted";
        chip.textContent =
          "Values aren’t clearly overlapping yet — they may still be emerging.";
        ui.valuesChips.appendChild(chip);
      }
    }

    if (ui.valuesSummary) {
      ui.valuesSummary.textContent = buildValuesSummary(baseSoul, match, breakdown);
    }

    if (ui.valuesTips) {
      ui.valuesTips.innerHTML = "";
      const tips = buildValuesTips(breakdown);
      tips.forEach((t) => {
        const li = document.createElement("li");
        li.textContent = t;
        ui.valuesTips.appendChild(li);
      });
    }
  }

  function renderJoySection(baseSoul, match, breakdown) {
    if (ui.joyChips) {
      ui.joyChips.innerHTML = "";
      if (breakdown.hobbies.items.length) {
        breakdown.hobbies.items.slice(0, 5).forEach((h) => {
          const chip = document.createElement("span");
          chip.className = "mp-chip";
          chip.textContent = h;
          ui.joyChips.appendChild(chip);
        });
      } else {
        const chip = document.createElement("span");
        chip.className = "mp-chip mp-chip-muted";
        chip.textContent =
          "Shared joys aren’t obvious yet — this might simply mean you’re still discovering them.";
        ui.joyChips.appendChild(chip);
      }
    }

    if (ui.joySummary) {
      ui.joySummary.textContent = buildJoySummary(baseSoul, match, breakdown);
    }

    if (ui.joyIdeas) {
      ui.joyIdeas.innerHTML = "";
      const ideas = buildJoyIdeas(baseSoul, match, breakdown);
      ideas.forEach((t) => {
        const li = document.createElement("li");
        li.textContent = t;
        ui.joyIdeas.appendChild(li);
      });
    }
  }

  function renderAstroSection(baseSoul, match, breakdown) {
    const baseZodiac = baseSoul.westernZodiac || baseSoul.zodiac;
    const matchZodiac = match.westernZodiac || match.zodiac;
    const baseChinese = baseSoul.chineseZodiac;
    const matchChinese = match.chineseZodiac;
    const baseLife = numericLifePath(baseSoul.lifePathNumber);
    const matchLife = numericLifePath(match.lifePathNumber);

    if (ui.astroYouZodiac) {
      if (baseZodiac) {
        ui.astroYouZodiac.textContent =
          zodiacSymbol(baseZodiac) + " " + normaliseText(baseZodiac);
      } else {
        ui.astroYouZodiac.textContent = "Not set yet";
      }
    }

    if (ui.astroThemZodiac) {
      if (matchZodiac) {
        ui.astroThemZodiac.textContent =
          zodiacSymbol(matchZodiac) + " " + normaliseText(matchZodiac);
      } else {
        ui.astroThemZodiac.textContent = "Not set yet";
      }
    }

    if (ui.astroYouChinese) {
      if (baseChinese) {
        ui.astroYouChinese.textContent =
          chineseEmoji(baseChinese) + " " + normaliseText(baseChinese);
      } else {
        ui.astroYouChinese.textContent = "Not set yet";
      }
    }

    if (ui.astroThemChinese) {
      if (matchChinese) {
        ui.astroThemChinese.textContent =
          chineseEmoji(matchChinese) + " " + normaliseText(matchChinese);
      } else {
        ui.astroThemChinese.textContent = "Not set yet";
      }
    }

    if (ui.astroYouLifePath) {
      ui.astroYouLifePath.textContent =
        baseLife != null ? String(baseLife) : "Not calculated yet";
    }

    if (ui.astroThemLifePath) {
      ui.astroThemLifePath.textContent =
        matchLife != null ? String(matchLife) : "Not calculated yet";
    }

    if (ui.astroSummary) {
      ui.astroSummary.textContent = buildAstroSummary(baseSoul, match, breakdown);
    }
  }

  function renderStepSection(baseSoul, match, breakdown) {
    if (ui.stepSummary) {
      ui.stepSummary.textContent = buildStepSummary(baseSoul, match);
    }
    if (ui.stepHighlight) {
      ui.stepHighlight.textContent = buildStepHighlight(baseSoul, match, breakdown);
    }
  }

  function showError(message) {
    if (ui.layout) ui.layout.hidden = true;
    if (ui.error) {
      ui.error.hidden = false;
      if (ui.errorMessage && message) {
        ui.errorMessage.textContent = message;
      }
    }
  }

  function animatePageOnce() {
    if (!ui.page) return;
    if (prefersReducedMotion()) return;
    window.requestAnimationFrame(function () {
      ui.page.classList.add("mp-animate");
    });
  }

  // ===================== Init =====================

  function init() {
    try {
      const id = getQueryId();
      const matches = safeGetMatches();

      if (!id || !matches.length) {
        showError(
          "We couldn’t find a compatibility portrait for this connection yet. Try creating or refreshing your matches first."
        );
        return;
      }

      const match = findMatchByIdOrName(id, matches);
      if (!match) {
        showError(
          "This specific match could not be found. It may have been renamed or removed."
        );
        return;
      }

      const soul = safeGetSoulData();
      const baseSoul = hasAnyCoreData(soul)
        ? soul
        : {
            name: "You",
          };

      const breakdown = computeCompatibility(baseSoul, match);

      if (ui.error) ui.error.hidden = true;
      if (ui.layout) ui.layout.hidden = false;

      renderHero(baseSoul, match, breakdown);
      renderLoveSection(baseSoul, match, breakdown);
      renderValuesSection(baseSoul, match, breakdown);
      renderJoySection(baseSoul, match, breakdown);
      renderAstroSection(baseSoul, match, breakdown);
      renderStepSection(baseSoul, match, breakdown);

      animatePageOnce();
    } catch (err) {
      console.error("Match Profile: init failed", err);
      showError(
        "We couldn’t load this match profile right now. Please refresh the page or try again later."
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
