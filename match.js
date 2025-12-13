// match.js — Soulink Match Lab (DEMO now, easy switch to real users later)
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ===================== Settings =====================

  const FRIENDS_KEY = "soulink.friends.list";

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
      vibeTag: "Warm horizon seeker",
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
      vibeTag: "Bold heart, bright fire",
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
      vibeTag: "Quiet thinker, kind soul",
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
      vibeTag: "Soft moonlight protector",
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
      vibeTag: "Gentle mystic stream",
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
      vibeTag: "Spark of playful light",
    },
  ];

  const WEIGHTS = {
    love: 35,
    values: 25,
    hobbies: 15,
    zodiac: 10,
    chinese: 5,
    numerology: 10,
  };

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

  // ===================== Utils =====================

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
      if (baseSet.has(norm)) result.push(item);
    });
    return result;
  }

  function numericLifePath(value) {
    if (value == null) return null;
    let n = value;
    if (typeof n === "string") n = parseInt(n, 10);
    if (!Number.isFinite(n)) return null;
    return n;
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

  function hasAnyCoreData(soul) {
    if (!soul || typeof soul !== "object") return false;
    if (normaliseText(soul.name)) return true;
    if (normaliseText(soul.connectionType)) return true;
    if (normaliseText(soul.loveLanguage)) return true;
    if (cleanList(soul.values || soul.coreValues || []).length) return true;
    if (cleanList(soul.hobbies || soul.passions || soul.interests || []).length) return true;
    if (normaliseText(soul.westernZodiac || soul.zodiac)) return true;
    if (numericLifePath(soul.lifePathNumber) != null) return true;
    return false;
  }

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

  function normaliseZodiac(name) {
    return normaliseText(name).toLowerCase();
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

  function createAvatarInitial(name) {
    const t = normaliseText(name);
    if (!t) return "?";
    const words = t.split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
    return (words[0].slice(0, 1) + words[1].slice(0, 1)).toUpperCase();
  }

  // ===================== Friends list =====================

  function readFriendsList() {
    if (typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(FRIENDS_KEY);
      const parsed = safeParseJSON(raw);
      if (!parsed || !Array.isArray(parsed)) return [];
      return parsed.filter((item) => item && typeof item === "object");
    } catch (err) {
      console.warn("Match: failed to read friends list", err);
      return [];
    }
  }

  function writeFriendsList(list) {
    if (typeof localStorage === "undefined") return;
    try {
      const safe = Array.isArray(list) ? list : [];
      localStorage.setItem(FRIENDS_KEY, JSON.stringify(safe));
    } catch (err) {
      console.warn("Match: failed to write friends list", err);
    }
  }

  function friendKeyFromMatch(match) {
    const id = normaliseText(match && match.id);
    if (id) return "id:" + id.toLowerCase();
    const name = normaliseText(match && match.name);
    if (name) return "name:" + name.toLowerCase();
    return "";
  }

  function isMatchInCircle(friends, match) {
    if (!Array.isArray(friends) || !friends.length || !match) return false;
    const key = friendKeyFromMatch(match);
    if (!key) return false;
    return friends.some((f) => {
      const fid = normaliseText(f && f.id);
      const fname = normaliseText(f && f.name);
      let fk = "";
      if (fid) fk = "id:" + fid.toLowerCase();
      else if (fname) fk = "name:" + fname.toLowerCase();
      return fk && fk === key;
    });
  }

  function toFriendObject(match, score) {
    const now = Date.now();
    return {
      id: normaliseText(match.id) || normaliseText(match.name) || "match-" + now,
      name: normaliseText(match.name) || "Unknown",
      connectionType: normaliseText(match.connectionType) || null,
      score: Number.isFinite(score) ? score : null,
      vibeTag: normaliseText(match.vibeTag) || null,
      values: cleanList(match.values || match.coreValues || []),
      hobbies: cleanList(match.hobbies || match.passions || match.interests || []),
      westernZodiac: normaliseText(match.westernZodiac || match.zodiac) || null,
      chineseZodiac: normaliseText(match.chineseZodiac) || null,
      lifePathNumber: numericLifePath(match.lifePathNumber),
      profilePhoto: normaliseText(match.profilePhoto) || null,
      createdAt: new Date().toISOString(),
    };
  }

  function addMatchToCircle(match, score) {
    const friends = readFriendsList();
    if (isMatchInCircle(friends, match)) return friends;
    const next = friends.slice();
    next.push(toFriendObject(match, score));
    writeFriendsList(next);
    return next;
  }

  // ===================== Compatibility =====================

  function computeValueOverlap(baseValues, matchValues) {
    const base = cleanList(baseValues);
    const other = cleanList(matchValues);
    if (!base.length || !other.length) return { score: 0, items: [] };
    const items = overlapList(base, other);
    const ratio = Math.min(items.length / Math.max(base.length, 1), 1);
    return { score: Math.round(ratio * WEIGHTS.values), items };
  }

  function computeHobbyScore(baseHobbies, matchHobbies) {
    const base = cleanList(baseHobbies);
    const other = cleanList(matchHobbies);
    if (!base.length || !other.length) return { score: 0, items: [] };
    const items = overlapList(base, other);
    const ratio = Math.min(items.length / Math.max(base.length, 1), 1);
    return { score: Math.round(ratio * WEIGHTS.hobbies), items };
  }

  function loveLanguageScore(basePerson, matchPerson) {
    const basePrimary = getPrimaryLoveLanguage(basePerson);
    const matchPrimary = getPrimaryLoveLanguage(matchPerson);

    const baseSet = normalisedSet(toArray(basePerson.loveLanguages || []).concat(basePrimary));
    const matchSet = normalisedSet(toArray(matchPerson.loveLanguages || []).concat(matchPrimary));

    let score = 0;
    let label = "No clear overlap yet.";
    let strong = false;

    if (!baseSet.size || !matchSet.size) return { score, label, strong };

    const primarySame =
      normaliseText(basePrimary).toLowerCase() === normaliseText(matchPrimary).toLowerCase();

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
      label = "Different love languages — still workable with clear communication.";
    }

    return { score, label, strong, primarySame };
  }

  function zodiacCompatibility(baseZodiacRaw, matchZodiacRaw) {
    const baseZ = normaliseZodiac(baseZodiacRaw);
    const matchZ = normaliseZodiac(matchZodiacRaw);
    if (!baseZ || !matchZ) return { score: 0, label: "" };

    const baseElem = ZODIAC_ELEMENTS[baseZ] || "";
    const matchElem = ZODIAC_ELEMENTS[matchZ] || "";

    let multiplier = 0.5;
    let label = "Different elements — can be complementary with care.";

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

    return { score: Math.round(WEIGHTS.zodiac * multiplier), label };
  }

  function chineseZodiacCompatibility(baseChineseRaw, matchChineseRaw) {
    const baseC = normaliseText(baseChineseRaw).toLowerCase();
    const matchC = normaliseText(matchChineseRaw).toLowerCase();
    if (!baseC || !matchC) return { score: 0, label: "" };
    if (baseC === matchC) {
      return { score: WEIGHTS.chinese, label: "Same Chinese sign — similar rhythm of growth." };
    }
    return {
      score: Math.round(WEIGHTS.chinese * 0.6),
      label: "Different Chinese signs — diversity that can enrich the dynamic.",
    };
  }

  function numerologyCompatibility(baseLifePathRaw, matchLifePathRaw) {
    const base = numericLifePath(baseLifePathRaw);
    const match = numericLifePath(matchLifePathRaw);
    if (base == null || match == null) return { score: 0, label: "" };

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
      label = "Related but distinct life paths — complementary growth potential.";
    }

    return { score: Math.round(WEIGHTS.numerology * multiplier), label };
  }

  function computeCompatibility(baseSoul, candidate) {
    const baseValues = baseSoul.values || baseSoul.coreValues || [];
    const baseHobbies = baseSoul.hobbies || baseSoul.passions || baseSoul.interests || [];
    const matchValues = candidate.values || candidate.coreValues || [];
    const matchHobbies = candidate.hobbies || candidate.passions || candidate.interests || [];

    const loveRes = loveLanguageScore(baseSoul, candidate);
    const valuesRes = computeValueOverlap(baseValues, matchValues);
    const hobbyRes = computeHobbyScore(baseHobbies, matchHobbies);

    const baseZodiac = baseSoul.westernZodiac || baseSoul.zodiac;
    const matchZodiac = candidate.westernZodiac || candidate.zodiac;
    const zodiacRes = zodiacCompatibility(baseZodiac, matchZodiac);

    const chineseRes = chineseZodiacCompatibility(baseSoul.chineseZodiac, candidate.chineseZodiac);
    const numerologyRes = numerologyCompatibility(baseSoul.lifePathNumber, candidate.lifePathNumber);

    let score =
      loveRes.score +
      valuesRes.score +
      hobbyRes.score +
      zodiacRes.score +
      chineseRes.score +
      numerologyRes.score;

    if (!Number.isFinite(score)) score = 0;
    score = Math.max(0, Math.min(100, Math.round(score)));

    // "Spice" is intentionally playful for DEMO sorting
    const spice = Math.max(
      0,
      Math.min(
        100,
        Math.round(score * 0.6 + (candidate.lifePathNumber ? (Number(candidate.lifePathNumber) % 11) * 4 : 0))
      )
    );

    return {
      score,
      spice,
      love: loveRes,
      values: valuesRes,
      hobbies: hobbyRes,
      zodiac: zodiacRes,
      chinese: chineseRes,
      numerology: numerologyRes,
    };
  }

  function overallVibeLabel(score) {
    if (score >= 85) return "High harmony";
    if (score >= 70) return "Good potential";
    if (score >= 50) return "Exploration match";
    return "Gentle connection";
  }

  // ===================== Snapshot text =====================

  function buildSnapshotBody(baseSoul, match, breakdown, mode) {
    const baseName = normaliseText(baseSoul.name) || "You";
    const matchName = normaliseText(match.name) || "this person";
    const connection = normaliseText(match.connectionType) || "connection";

    if (mode === "love") {
      return (
        "Between " +
        baseName +
        " and " +
        matchName +
        ", love languages act like tuning forks. " +
        "When you both name what actually lands as care, the " +
        connection.toLowerCase() +
        " feels less confusing and more safe."
      );
    }

    if (mode === "values") {
      if (breakdown.values.items.length) {
        const shared = breakdown.values.items.slice(0, 3);
        const joined =
          shared.length === 1
            ? shared[0]
            : shared.slice(0, -1).join(", ") + " and " + shared[shared.length - 1];
        return (
          "You both seem to care about " +
          joined.toLowerCase() +
          ". When these values are honoured in daily choices, trust in this " +
          connection.toLowerCase() +
          " grows quietly in the background."
        );
      }
      return (
        "Your values might still be revealing themselves. A gentle conversation about boundaries and non-negotiables can protect this " +
        connection.toLowerCase() +
        " from silent resentment."
      );
    }

    if (mode === "joy") {
      if (breakdown.hobbies.items.length) {
        const joy = breakdown.hobbies.items[0];
        return (
          "Shared joys create low-friction bonding. Even a tiny ritual around " +
          joy.toLowerCase() +
          " can reset the emotional tone between you."
        );
      }
      return (
        "You may bring different flavours of joy into this " +
        connection.toLowerCase() +
        ". Staying curious instead of judging what refuels the other person keeps the space playful."
      );
    }

    if (mode === "astro") {
      const pieces = [];
      if (breakdown.zodiac && breakdown.zodiac.label) pieces.push(breakdown.zodiac.label);
      if (breakdown.chinese && breakdown.chinese.label) pieces.push(breakdown.chinese.label);
      if (breakdown.numerology && breakdown.numerology.label) pieces.push(breakdown.numerology.label);

      if (!pieces.length) {
        return (
          "Astrology and numerology here are symbolic mirrors only — language for tendencies, " +
          "not rules. Consent, respect and real-time choices always come first."
        );
      }
      return pieces.join(" ") + " These are lenses, not rules — you write the story together in real time.";
    }

    // overview
    const vibe = overallVibeLabel(breakdown.score).toLowerCase();
    return (
      "This " +
      connection.toLowerCase() +
      " currently reads as a " +
      vibe +
      " match. Scores are information, not fate — honest communication and small consistent actions will always matter more than numbers."
    );
  }

  function buildSnapshotHighlight(baseSoul, match, breakdown, mode) {
    const sharedValue = breakdown.values.items[0];
    const sharedJoy = breakdown.hobbies.items[0];
    const loveKey = canonicalLoveKey(getPrimaryLoveLanguage(baseSoul));

    if (mode === "love" && loveKey === "quality") {
      return "Offer 20–30 minutes of undistracted presence — phones away, conversation free to wander.";
    }
    if (mode === "love" && loveKey === "words") {
      return "Share one clear, kind sentence about what you genuinely appreciate in them, with no hidden agenda.";
    }
    if (mode === "love" && loveKey === "service") {
      return "Ask: “What would make your day 5% easier?” — and do one small, real thing.";
    }
    if (mode === "love" && loveKey === "touch") {
      return "Move slowly: ask before touch, and notice what your body says when you’re near them.";
    }
    if (mode === "love" && loveKey === "gifts") {
      return "Offer a small symbolic gesture that shows you remembered a detail about them.";
    }

    if (mode === "values" && sharedValue) {
      return "Name one boundary or request that protects your value of “" + sharedValue.toLowerCase() + "”.";
    }
    if (mode === "joy" && sharedJoy) {
      return "Plan a tiny shared moment around “" + sharedJoy.toLowerCase() + "” — nothing grand, just real.";
    }
    if (mode === "astro") {
      return "Treat every description as a suggestion, not a verdict — you are writing the story together.";
    }

    if (sharedValue && sharedJoy) {
      return "Protect “" + sharedValue.toLowerCase() + "” while making space for “" + sharedJoy.toLowerCase() + "”.";
    }
    return "Ask yourself: “What would make this connection feel 5% kinder today?” and act on one small piece.";
  }

  // ===================== DOM + State =====================

  const ui = {
    list: $("#matchList"),
    emptyTemplate: $("#matchEmptyTemplate"),
    sortSelect: $("#matchSortSelect"),
    toggles: $$(".match-toggle"),
    snapshotTitle: $("#matchSnapshotTitle"),
    snapshotBody: $("#matchSnapshotBody"),
    snapshotScore: $("#matchSnapshotScore"),
    snapshotFocus: $("#matchSnapshotFocus"),
    snapshotHighlight: $("#matchSnapshotHighlight"),
    snapshotPicker: $("#matchSnapshotPicker"),
  };

  const state = {
    baseSoul: null,
    entries: [],
    friends: [],
    filter: "all", // all | romantic | friendship
    sort: "best", // best | name | spice
    selectedId: null,
    snapshotMode: "overview", // overview | love | values | joy | astro
  };

  // ===================== Data prep =====================

  function prepareBaseSoul() {
    const raw = safeGetSoulData();
    state.baseSoul = hasAnyCoreData(raw) ? raw : { name: "You" };
  }

  function getMatchesSource() {
    // DEMO for now. Later: replace this function to return real user matches from storage/DB.
    return DEMO_MATCHES.slice();
  }

  function prepareEntries() {
    const base = state.baseSoul || { name: "You" };
    const rawMatches = getMatchesSource();
    state.entries = rawMatches.map((m, index) => {
      const breakdown = computeCompatibility(base, m);
      return {
        id: normaliseText(m.id) || "match-" + index,
        match: m,
        breakdown,
        index,
      };
    });
  }

  function getFilteredSortedEntries() {
    let list = state.entries.slice();

    const filter = normaliseText(state.filter).toLowerCase();
    if (filter === "romantic" || filter === "friendship") {
      list = list.filter((entry) => {
        const type = normaliseText(entry.match.connectionType).toLowerCase();
        return type === filter;
      });
    }

    const sort = normaliseText(state.sort).toLowerCase();
    list.sort((a, b) => {
      if (sort === "name") {
        const an = normaliseText(a.match.name).toLowerCase();
        const bn = normaliseText(b.match.name).toLowerCase();
        if (an < bn) return -1;
        if (an > bn) return 1;
        return 0;
      }
      if (sort === "spice") {
        if (b.breakdown.spice !== a.breakdown.spice) return b.breakdown.spice - a.breakdown.spice;
        return b.breakdown.score - a.breakdown.score;
      }
      // best
      if (b.breakdown.score !== a.breakdown.score) return b.breakdown.score - a.breakdown.score;
      return a.index - b.index;
    });

    return list;
  }

  // ===================== Render =====================

  function ensureSnapshotPicker() {
    if (!ui.snapshotPicker) return;
    ui.snapshotPicker.innerHTML = "";
    ui.snapshotPicker.setAttribute("aria-hidden", "false");

    const modes = [
      { key: "overview", label: "Overview" },
      { key: "love", label: "Love" },
      { key: "values", label: "Values" },
      { key: "joy", label: "Joy" },
      { key: "astro", label: "Astro" },
    ];

    modes.forEach((m) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "match-snapshot-chip" + (m.key === state.snapshotMode ? " is-active" : "");
      btn.textContent = m.label;
      btn.setAttribute("data-mode", m.key);
      btn.setAttribute("aria-pressed", m.key === state.snapshotMode ? "true" : "false");
      btn.addEventListener("click", () => {
        state.snapshotMode = m.key;
        ensureSnapshotPicker();
        if (state.selectedId) {
          const entry = getEntryById(state.selectedId);
          if (entry) renderSnapshot(entry);
        }
      });
      ui.snapshotPicker.appendChild(btn);
    });
  }

  function renderEmptyState() {
    if (!ui.list) return;
    ui.list.innerHTML = "";
    if (ui.emptyTemplate && ui.emptyTemplate.content) {
      ui.list.appendChild(ui.emptyTemplate.content.cloneNode(true));
    }
  }

  function buildCard(baseSoul, entry) {
    const match = entry.match;
    const breakdown = entry.breakdown;

    const card = document.createElement("article");
    card.className = "match-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Select " + (normaliseText(match.name) || "match") + " snapshot");
    card.dataset.matchId = entry.id;

    const inner = document.createElement("div");
    inner.className = "match-card-inner";

    // Left hero column
    const hero = document.createElement("div");
    hero.className = "match-card-hero";

    const avatarWrap = document.createElement("div");
    avatarWrap.className = "match-avatar-wrap";

    if (match.profilePhoto) {
      const img = document.createElement("img");
      img.className = "match-avatar-img";
      img.src = match.profilePhoto;
      img.alt = normaliseText(match.name) || "Match avatar";
      avatarWrap.appendChild(img);
    } else {
      const fallback = document.createElement("div");
      fallback.className = "match-avatar-fallback";
      fallback.textContent = createAvatarInitial(match.name);
      avatarWrap.appendChild(fallback);
    }

    const scorePill = document.createElement("div");
    scorePill.className = "match-score-pill";
    scorePill.textContent = breakdown.score + "%";

    avatarWrap.appendChild(scorePill);

    const connTag = document.createElement("div");
    connTag.className = "match-connection-tag";
    connTag.textContent = normaliseText(match.connectionType) || "Connection";

    hero.appendChild(avatarWrap);
    hero.appendChild(connTag);

    // Right body column
    const body = document.createElement("div");
    body.className = "match-card-body";

    const header = document.createElement("div");
    header.className = "match-card-header";

    const nameRow = document.createElement("div");
    nameRow.className = "match-name-row";

    const nameEl = document.createElement("div");
    nameEl.className = "match-name";
    nameEl.textContent = normaliseText(match.name) || "Soul connection";

    nameRow.appendChild(nameEl);
    header.appendChild(nameRow);

    const vibe = document.createElement("div");
    vibe.className = "match-vibe";
    vibe.innerHTML =
      "Vibe: <strong>" +
      (normaliseText(match.vibeTag) || overallVibeLabel(breakdown.score)) +
      "</strong>";
    header.appendChild(vibe);

    const badges = document.createElement("div");
    badges.className = "match-badges";

    const love = getPrimaryLoveLanguage(match);
    if (love) {
      const b = document.createElement("div");
      b.className = "match-badge";
      b.innerHTML = "<span>Love:</span> <strong>" + love + "</strong>";
      badges.appendChild(b);
    }

    const sharedValues = breakdown.values.items.slice(0, 2);
    if (sharedValues.length) {
      const b = document.createElement("div");
      b.className = "match-badge";
      b.innerHTML = "<span>Values:</span> <strong>" + sharedValues.join(", ") + "</strong>";
      badges.appendChild(b);
    }

    const zodiacName = normaliseText(match.westernZodiac || match.zodiac);
    if (zodiacName) {
      const b = document.createElement("div");
      b.className = "match-badge";
      b.innerHTML = "<span>Sign:</span> <strong>" + zodiacSymbol(zodiacName) + " " + zodiacName + "</strong>";
      badges.appendChild(b);
    }

    const lp = numericLifePath(match.lifePathNumber);
    if (lp != null) {
      const b = document.createElement("div");
      b.className = "match-badge";
      b.innerHTML = "<span>Life Path:</span> <strong>" + lp + "</strong>";
      badges.appendChild(b);
    }

    body.appendChild(header);
    if (badges.childNodes.length) body.appendChild(badges);

    const summary = document.createElement("div");
    summary.className = "match-summary";

    const summaryMain = document.createElement("div");
    summaryMain.className = "match-summary-main";
    const p = document.createElement("p");
    p.textContent = buildSnapshotBody(baseSoul, match, breakdown, "overview");
    summaryMain.appendChild(p);

    const summarySide = document.createElement("div");
    summarySide.className = "match-summary-pill";
    summarySide.innerHTML =
      "<strong>Highlight:</strong> <span>" + buildSnapshotHighlight(baseSoul, match, breakdown, "overview") + "</span>";

    summary.appendChild(summaryMain);
    summary.appendChild(summarySide);
    body.appendChild(summary);

    const footer = document.createElement("div");
    footer.className = "match-card-footer";

    const actions = document.createElement("div");
    actions.className = "m-card-actions";

    const view = document.createElement("a");
    view.className = "btn";
    view.href = "match-profile.html?id=" + encodeURIComponent(match.id || match.name || entry.id);
    view.textContent = "View Match Profile";
    view.addEventListener("click", (e) => e.stopPropagation());

    const add = document.createElement("button");
    add.type = "button";
    add.className = "btn m-card-add-btn";

    const inCircle = isMatchInCircle(state.friends, match);
    if (inCircle) {
      add.classList.add("in-circle");
      add.textContent = "In Your Circle";
      add.disabled = true;
      add.setAttribute("aria-disabled", "true");
    } else {
      add.textContent = "Add to My Circle";
      add.addEventListener("click", (e) => {
        e.stopPropagation();
        if (add.disabled) return;
        state.friends = addMatchToCircle(match, breakdown.score);
        add.classList.add("in-circle");
        add.textContent = "In Your Circle";
        add.disabled = true;
        add.setAttribute("aria-disabled", "true");
      });
    }

    actions.appendChild(view);
    actions.appendChild(add);
    footer.appendChild(actions);

    const note = document.createElement("div");
    note.className = "m-card-note";
    note.innerHTML =
      "<strong>Tip:</strong> Click the card to update the snapshot →";
    footer.appendChild(note);

    body.appendChild(footer);

    inner.appendChild(hero);
    inner.appendChild(body);
    card.appendChild(inner);

    // selection behaviour
    card.addEventListener("click", () => selectEntry(entry));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectEntry(entry);
      }
    });

    return card;
  }

  function renderList() {
    if (!ui.list) return;
    ui.list.innerHTML = "";

    const entries = getFilteredSortedEntries();
    if (!entries.length) {
      renderEmptyState();
      return;
    }

    entries.forEach((entry) => {
      ui.list.appendChild(buildCard(state.baseSoul, entry));
    });

    // auto-select first card for a nicer "demo" feeling
    if (!state.selectedId && entries.length) {
      selectEntry(entries[0], { silentScroll: true });
    } else if (state.selectedId) {
      highlightSelectedCard(state.selectedId);
    }
  }

  function highlightSelectedCard(id) {
    if (!ui.list) return;
    const cards = $$(".match-card", ui.list);
    cards.forEach((card) => {
      const cid = card.dataset.matchId || "";
      const isSelected = normaliseText(cid) === normaliseText(id);
      if (isSelected) card.classList.add("is-selected");
      else card.classList.remove("is-selected");
    });
  }

  function renderSnapshot(entry) {
    if (!entry) return;
    const baseSoul = state.baseSoul || { name: "You" };
    const match = entry.match;
    const breakdown = entry.breakdown;

    const name = normaliseText(match.name) || "This connection";
    const cx = normaliseText(match.connectionType) || "Connection";

    if (ui.snapshotTitle) ui.snapshotTitle.textContent = name;
    if (ui.snapshotScore) {
      ui.snapshotScore.innerHTML = "<strong>" + breakdown.score + "%</strong> <span>compatibility</span>";
    }
    if (ui.snapshotFocus) {
      ui.snapshotFocus.textContent =
        cx.toLowerCase() === "friendship" ? "Friendship focus" : cx + " focus";
    }
    if (ui.snapshotBody) {
      ui.snapshotBody.innerHTML = "<p>" + escapeHTML(buildSnapshotBody(baseSoul, match, breakdown, state.snapshotMode)) + "</p>";
    }
    if (ui.snapshotHighlight) {
      ui.snapshotHighlight.textContent = buildSnapshotHighlight(baseSoul, match, breakdown, state.snapshotMode);
    }
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getEntryById(id) {
    const target = normaliseText(id);
    return state.entries.find((e) => normaliseText(e.id) === target) || null;
  }

  function selectEntry(entry, opts) {
    if (!entry) return;
    state.selectedId = entry.id;
    highlightSelectedCard(entry.id);
    renderSnapshot(entry);
    ensureSnapshotPicker();

    const silent = opts && opts.silentScroll;
    if (!silent && ui.snapshotTitle) {
      // Keep it gentle; no forced scroll on mobile.
    }
  }

  // ===================== Controls =====================

  function wireSort() {
    if (!ui.sortSelect) return;
    ui.sortSelect.addEventListener("change", () => {
      const v = normaliseText(ui.sortSelect.value).toLowerCase();
      state.sort = v === "name" || v === "spice" || v === "best" ? v : "best";
      renderList();
    });
  }

  function wireToggles() {
    if (!ui.toggles || !ui.toggles.length) return;

    ui.toggles.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = normaliseText(btn.getAttribute("data-connection-mode")).toLowerCase() || "all";
        state.filter = mode;

        ui.toggles.forEach((b) => {
          const active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-checked", active ? "true" : "false");
        });

        renderList();
      });
    });
  }

  // ===================== Init =====================

  function init() {
    if (!ui.list) return;

    state.friends = readFriendsList();
    prepareBaseSoul();
    prepareEntries();

    // read initial UI state
    if (ui.sortSelect && ui.sortSelect.value) {
      const v = normaliseText(ui.sortSelect.value).toLowerCase();
      state.sort = v === "name" || v === "spice" || v === "best" ? v : "best";
    }

    const activeToggle = ui.toggles.find((t) => t.classList.contains("is-active"));
    if (activeToggle) {
      const mode = normaliseText(activeToggle.getAttribute("data-connection-mode")).toLowerCase();
      if (mode === "romantic" || mode === "friendship" || mode === "all") state.filter = mode;
    }

    wireSort();
    wireToggles();
    ensureSnapshotPicker();
    renderList();

    // a11y / motion: no extra animations beyond CSS keyframes
    if (!prefersReducedMotion()) {
      // no-op: CSS handles entry fade-in
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
