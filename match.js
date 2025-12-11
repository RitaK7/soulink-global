// match.js — Soulink "Match" page, glowing AI compatibility dashboard
// Logic adapted from earlier Match Lab script

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
      console.warn("Match: failed to read soul data", err);
      data = {};
    }
    if (!data || typeof data !== "object") return {};
    return data;
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
    cleanList(arr).forEach((item) => {
      set.add(item.toLowerCase());
    });
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

  // ===================== Data Sources =====================

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
      console.warn("Match: failed to read soulink.friends.list", err);
      return [];
    }
  }

  function safeGetMatches() {
    const fromStorage = safeGetMatchesFromStorage();
    if (fromStorage.length) return fromStorage;
    return DEMO_MATCHES;
  }

  function hasAnyCoreData(soul) {
    if (!soul || typeof soul !== "object") return false;
    if (normaliseText(soul.name)) return true;
    if (normaliseText(soul.connectionType)) return true;
    if (getPrimaryLoveLanguage(soul)) return true;
    if (cleanList(soul.values || soul.coreValues || []).length) return true;
    if (cleanList(soul.hobbies || soul.passions || soul.interests || []).length) return true;
    if (normaliseText(soul.westernZodiac || soul.zodiac)) return true;
    if (numericLifePath(soul.lifePathNumber) != null) return true;
    return false;
  }

  // ===================== Compatibility scoring =====================

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
      label = "Different love languages — with communication, this can still balance.";
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
      label = "Same life path number — strong resonance in how you move through life.";
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

  function generateAISummary(baseSoul, match, breakdown) {
    const baseName = normaliseText(baseSoul.name) || "You";
    const matchName = normaliseText(match.name) || "this person";

    const strongAreas = [];
    const softAreas = [];

    if (breakdown.love.strong) {
      strongAreas.push("how you give and receive care");
    }

    if (breakdown.values.items.length) {
      strongAreas.push("what you both stand for");
    }

    if (breakdown.hobbies.items.length) {
      strongAreas.push("the things that bring you joy");
    }

    const zodiacInfo = normaliseText(breakdown.zodiac.label);
    const chineseInfo = normaliseText(breakdown.chinese.label);
    const numerologyInfo = normaliseText(breakdown.numerology.label);

    if (!strongAreas.length && (zodiacInfo || chineseInfo || numerologyInfo)) {
      softAreas.push("symbolic patterns like zodiac and numerology");
    }

    let sentence = "";

    if (strongAreas.length) {
      if (strongAreas.length === 1) {
        sentence =
          baseName +
          " and " +
          matchName +
          " align strongly in " +
          strongAreas[0] +
          ".";
      } else if (strongAreas.length === 2) {
        sentence =
          baseName +
          " and " +
          matchName +
          " align strongly in " +
          strongAreas[0] +
          " and " +
          strongAreas[1] +
          ".";
      } else {
        sentence =
          baseName +
          " and " +
          matchName +
          " share a lot in how you love, what you value and the joys you choose.";
      }
    } else {
      sentence =
        "At first glance there are not many obvious overlaps, which can still be beautiful if you both bring curiosity and honest communication.";
    }

    const snippets = [];

    if (breakdown.values.items.length) {
      const first = breakdown.values.items[0];
      snippets.push("You both care about " + first.toLowerCase() + ".");
    }

    if (breakdown.hobbies.items.length) {
      const first = breakdown.hobbies.items[0];
      snippets.push(
        "Shared joy around " + first.toLowerCase() + " can create easy bonding."
      );
    }

    if (zodiacInfo) {
      snippets.push(zodiacInfo);
    }

    if (numerologyInfo && snippets.length < 3) {
      snippets.push(numerologyInfo);
    }

    let extra = "";
    if (snippets.length) {
      extra = " " + snippets.join(" ");
    }

    return sentence + extra;
  }

  // ===================== DOM cache =====================

  const ui = {
    page: $(".match-page"),
    empty: $("#matchEmpty"),
    layout: $("#matchLayout"),
    heroName: $("#matchHeroName"),
    heroLove: $("#matchHeroLove"),
    heroLife: $("#matchHeroLife"),
    pillName: $("#matchPillName"),
    pillLove: $("#matchPillLove"),
    pillLife: $("#matchPillLife"),
    orbMain: $("#matchOrbMain"),
    orbSub: $("#matchOrbSub"),
    list: $("#matchList"),
  };

  let orbRotationTimer = null;

  // ===================== Rendering =====================

  function renderHero(soul) {
    const name = normaliseText(soul.name) || "Beautiful soul";
    const primaryLove = getPrimaryLoveLanguage(soul);
    const lifePath = numericLifePath(soul.lifePathNumber);

    if (ui.heroName) ui.heroName.textContent = name;
    if (ui.heroLove) ui.heroLove.textContent = primaryLove || "Not set yet";
    if (ui.heroLife) {
      ui.heroLife.textContent =
        lifePath != null ? String(lifePath) : "Not calculated yet";
    }

    if (ui.pillName) {
      ui.pillName.setAttribute("title", "Base profile name");
    }
    if (ui.pillLove) {
      ui.pillLove.setAttribute("title", "Your primary love language");
    }
    if (ui.pillLife) {
      ui.pillLife.setAttribute("title", "Life path number from numerology");
    }

    if (ui.orbMain) {
      ui.orbMain.textContent = "Explore your connections";
    }

    if (ui.orbSub) {
      const loveKey = canonicalLoveKey(primaryLove);
      let line =
        "Notice who feels easy to be around — your nervous system is part of the data.";

      if (loveKey === "quality") {
        line =
          "Quality time matters: pay attention to who offers you slow, present moments.";
      } else if (loveKey === "words") {
        line =
          "Words matter: notice who speaks to you with respect and clear, kind language.";
      } else if (loveKey === "service") {
        line =
          "Support matters: notice who quietly helps your day feel lighter.";
      } else if (loveKey === "touch") {
        line =
          "Body language matters: notice where touch feels safe and welcomed.";
      } else if (loveKey === "gifts") {
        line =
          "Symbolic gestures matter: notice who remembers the small details about you.";
      }

      ui.orbSub.textContent = line;
    }
  }

  function createAvatarInitial(name) {
    const t = normaliseText(name);
    if (!t) return "?";
    const words = t.split(/\s+/);
    if (!words.length) return t.charAt(0).toUpperCase();
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }

  function buildMetaLine(match, score) {
    const parts = [];
    const conn = normaliseText(match.connectionType);
    if (conn) parts.push(conn);

    const age = computeAge(match.birthday);
    if (age != null) parts.push(age + " yrs");

    const zodiacName = normaliseText(match.westernZodiac || match.zodiac);
    if (zodiacName) {
      parts.push(zodiacSymbol(zodiacName) + " " + zodiacName);
    }

    if (score >= 80) {
      parts.push("High harmony");
    } else if (score >= 60) {
      parts.push("Good potential");
    } else if (score >= 40) {
      parts.push("Exploration match");
    }

    return parts.join(" • ");
  }

  function buildChipGroups(baseSoul, match, breakdown) {
    const groups = [];

    // Love language
    const baseLove = getPrimaryLoveLanguage(baseSoul);
    const matchLove = getPrimaryLoveLanguage(match);
    const loveChips = [];
    if (baseLove) loveChips.push("You: " + baseLove);
    if (matchLove) loveChips.push(match.name + ": " + matchLove);
    if (loveChips.length) {
      groups.push({
        label: "Love language",
        chips: loveChips,
      });
    }

    // Values
    if (breakdown.values.items.length) {
      const list = breakdown.values.items.slice(0, 3);
      groups.push({
        label: "Values",
        chips: list,
      });
    }

    // Hobbies
    if (breakdown.hobbies.items.length) {
      const list = breakdown.hobbies.items.slice(0, 3);
      groups.push({
        label: "Joys",
        chips: list,
      });
    }

    // Zodiac / Chinese / Numerology
    const zodiacName = normaliseText(match.westernZodiac || match.zodiac);
    const chineseName = normaliseText(match.chineseZodiac);
    const lp = numericLifePath(match.lifePathNumber);

    const astroChips = [];
    if (zodiacName) {
      astroChips.push(zodiacSymbol(zodiacName) + " " + zodiacName);
    }
    if (chineseName) {
      astroChips.push(chineseEmoji(chineseName) + " " + chineseName);
    }
    if (lp != null) {
      astroChips.push("Life Path " + lp);
    }
    if (astroChips.length) {
      groups.push({
        label: "Astro & numbers",
        chips: astroChips,
      });
    }

    return groups;
  }

  function createMatchCard(baseSoul, match, breakdown) {
    const card = document.createElement("article");
    card.className = "m-card";

    const inner = document.createElement("div");
    inner.className = "m-card-inner";

    // Header
    const header = document.createElement("header");
    header.className = "m-card-header";

    const left = document.createElement("div");
    left.className = "m-card-left";

    const avatar = document.createElement("div");
    avatar.className = "m-avatar-circle";
    const avatarSpan = document.createElement("span");
    avatarSpan.className = "m-avatar-initial";
    avatarSpan.textContent = createAvatarInitial(match.name);
    avatar.appendChild(avatarSpan);

    const titleBlock = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "m-card-title";
    title.textContent = normaliseText(match.name) || "Soul connection";

    const meta = document.createElement("p");
    meta.className = "m-card-meta";
    meta.textContent = buildMetaLine(match, breakdown.score);

    titleBlock.appendChild(title);
    titleBlock.appendChild(meta);

    left.appendChild(avatar);
    left.appendChild(titleBlock);

    const scoreWrap = document.createElement("div");
    scoreWrap.className = "m-score";

    const scoreRing = document.createElement("div");
    scoreRing.className = "m-score-ring";
    scoreRing.style.setProperty("--score", String(breakdown.score));
    scoreRing.setAttribute(
      "aria-label",
      "Compatibility score " + breakdown.score + " percent"
    );
    scoreRing.setAttribute("role", "img");

    const scoreInner = document.createElement("div");
    scoreInner.className = "m-score-inner";

    const scoreValue = document.createElement("span");
    scoreValue.className = "m-score-value";
    scoreValue.textContent = String(breakdown.score);

    const scoreLabel = document.createElement("span");
    scoreLabel.className = "m-score-label";
    scoreLabel.textContent = "match";

    scoreInner.appendChild(scoreValue);
    scoreInner.appendChild(scoreLabel);
    scoreRing.appendChild(scoreInner);
    scoreWrap.appendChild(scoreRing);

    header.appendChild(left);
    header.appendChild(scoreWrap);

    // Body
    const body = document.createElement("div");
    body.className = "m-card-body";

    const chipRow = document.createElement("div");
    chipRow.className = "m-chip-row";

    const chipGroups = buildChipGroups(baseSoul, match, breakdown);
    chipGroups.forEach((group) => {
      const groupEl = document.createElement("div");
      groupEl.className = "m-chip-group";

      const label = document.createElement("span");
      label.className = "m-chip-label";
      label.textContent = group.label;
      groupEl.appendChild(label);

      group.chips.forEach((ch) => {
        const chip = document.createElement("span");
        chip.className = "m-chip";
        chip.textContent = ch;
        groupEl.appendChild(chip);
      });

      chipRow.appendChild(groupEl);
    });

    body.appendChild(chipRow);

    const snippet = document.createElement("p");
    snippet.className = "m-snippet";
    snippet.textContent = generateAISummary(baseSoul, match, breakdown);

    body.appendChild(snippet);

    const actions = document.createElement("div");
    actions.className = "m-card-actions";

    const viewBtn = document.createElement("a");
    viewBtn.className = "btn outline btn-outline";
    viewBtn.href =
      "match-profile.html?id=" +
      encodeURIComponent(match.id || match.name || "");
    viewBtn.textContent = "View Profile";

    actions.appendChild(viewBtn);

    body.appendChild(actions);

    inner.appendChild(header);
    inner.appendChild(body);
    card.appendChild(inner);

    return card;
  }

  function renderMatchesList(baseSoul, matches) {
    if (!ui.list) return;
    ui.list.innerHTML = "";

    const enriched = matches.map((match) => {
      const breakdown = computeCompatibility(baseSoul, match);
      return { match, breakdown };
    });

    enriched.sort((a, b) => b.breakdown.score - a.breakdown.score);

    enriched.forEach(({ match, breakdown }) => {
      const card = createMatchCard(baseSoul, match, breakdown);
      ui.list.appendChild(card);
    });
  }

  function animateSectionsOnce() {
    if (!ui.page) return;
    if (prefersReducedMotion()) {
      return;
    }
    window.requestAnimationFrame(function () {
      ui.page.classList.add("match-animate");
    });
  }

  function startOrbRotation() {
    if (!ui.orbSub) return;
    if (prefersReducedMotion()) return;

    const lines = [
      ui.orbSub.textContent || "",
      "Compatibility is information, not a verdict.",
      "Mutual effort and respect are the real magic.",
      "Follow where your body feels safe and alive.",
    ].filter(Boolean);

    if (!lines.length) return;

    let index = 0;
    if (orbRotationTimer) window.clearInterval(orbRotationTimer);

    orbRotationTimer = window.setInterval(function () {
      index = (index + 1) % lines.length;
      ui.orbSub.textContent = lines[index];
    }, 9000);
  }

  // ===================== Init =====================

  function init() {
    try {
      const soul = safeGetSoulData();
      const hasData = hasAnyCoreData(soul);
      const matches = safeGetMatches();

      const hasMatches = matches && matches.length > 0;

      if (!hasMatches) {
        if (ui.empty) ui.empty.hidden = false;
        if (ui.layout) ui.layout.hidden = true;
        return;
      }

      if (ui.empty) ui.empty.hidden = true;
      if (ui.layout) ui.layout.hidden = false;

      if (hasData) {
        renderHero(soul);
      }

      renderMatchesList(soul, matches);
      animateSectionsOnce();
      startOrbRotation();
    } catch (err) {
      console.error("Match: init failed", err);
      if (ui.empty) {
        ui.empty.hidden = false;
        ui.empty.textContent =
          "We could not load your Match data right now. Please refresh the page or try again later.";
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
