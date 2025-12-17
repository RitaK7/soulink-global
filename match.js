(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const $ = (sel, root = document) => root.querySelector(sel);

  const ui = {
    page: $(".match-page"),
    empty: $("#matchEmpty"),
    layout: $("#matchLayout"),
    modeLabel: $("#matchModeLabel"),
    baseSoulStatus: $("#baseSoulStatus"),
    list: $("#matchList"),
    sortSelect: $("#matchSortSelect"),
    toggles: Array.from(document.querySelectorAll(".match-toggle")),
    snapshotTitle: $("#matchSnapshotTitle"),
    snapshotBody: $("#matchSnapshotBody"),
    snapshotScore: $("#matchSnapshotScore"),
    snapshotFocus: $("#matchSnapshotFocus"),
    snapshotHighlight: $("#matchSnapshotHighlight"),
    snapshotPicker: $("#matchSnapshotPicker"),
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

  const FRIENDS_KEY = "soulink.friends.list";

  const DEMO_MATCHES = [
    {
      id: "match-aurora",
      name: "Aurora",
      connectionType: "Romantic",
      vibeTag: "Warm horizon seeker",
      loveLanguage: "Quality Time",
      values: ["Honesty", "Growth", "Adventure"],
      hobbies: ["Hiking", "Books", "Music"],
      westernZodiac: "Sagittarius",
      chineseZodiac: "Dragon",
      lifePathNumber: 7,
      birthday: "1986-12-03",
      contactHandle: "@aurora_soul",
      contactPlatform: "Telegram",
    },
    {
      id: "match-luna",
      name: "Luna",
      connectionType: "Romantic",
      vibeTag: "Soft moonlight protector",
      loveLanguage: "Acts of Service",
      values: ["Kindness", "Family", "Stability"],
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
      vibeTag: "Quiet, grounded presence",
      loveLanguage: "Quality Time",
      values: ["Spirituality", "Authenticity", "Growth"],
      hobbies: ["Meditation", "Hiking", "Art"],
      westernZodiac: "Pisces",
      chineseZodiac: "Goat",
      lifePathNumber: 11,
      birthday: "1992-03-15",
      contactHandle: "river@demo.soulink.global",
      contactPlatform: "Email",
    },
    {
      id: "match-nova",
      name: "Nova",
      connectionType: "Romantic",
      vibeTag: "Spark of playful light",
      loveLanguage: "Receiving Gifts",
      values: ["Creativity", "Freedom", "Joy"],
      hobbies: ["Art", "Design", "Music"],
      westernZodiac: "Libra",
      chineseZodiac: "Monkey",
      lifePathNumber: 3,
      birthday: "1987-10-10",
    },
    {
      id: "match-sage",
      name: "Sage",
      connectionType: "Friendship",
      vibeTag: "Thoughtful pattern spotter",
      loveLanguage: "Words of Affirmation",
      values: ["Honesty", "Curiosity", "Freedom"],
      hobbies: ["Podcasts", "Yoga", "Nature"],
      westernZodiac: "Aquarius",
      chineseZodiac: "Rabbit",
      lifePathNumber: 9,
      birthday: "1990-02-11",
    },
    {
      id: "match-leo",
      name: "Leo",
      connectionType: "Romantic",
      vibeTag: "Bold heart, bright fire",
      loveLanguage: "Physical Touch",
      values: ["Passion", "Adventure", "Authenticity"],
      hobbies: ["Travel", "Dancing", "Cooking"],
      westernZodiac: "Leo",
      chineseZodiac: "Tiger",
      lifePathNumber: 5,
      birthday: "1984-08-01",
      contactHandle: "@leo_vibes",
      contactPlatform: "Telegram",
    },
  ];

  const state = {
    connectionMode: "all",
    sortMode: "best",
    selectedId: null,
    snapshotFocus: "overview",
    baseSoul: null,
    matches: [],
    friends: [],
  };

  function normaliseText(v) {
    return (v == null ? "" : String(v)).trim();
  }

  function toArray(v) {
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
  }

  function safeParseJSON(raw) {
    if (!raw || typeof raw !== "string") return null;
    try {
      return JSON.parse(raw);
    } catch (_e) {
      return null;
    }
  }

  function prefersReducedMotion() {
    try {
      return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (_e) {
      return false;
    }
  }

  function clamp(n, a, b) {
    const x = Number.isFinite(n) ? n : a;
    return Math.max(a, Math.min(b, x));
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
    const raw = toArray(listLike).flatMap((x) => {
      const t = normaliseText(x);
      if (!t) return [];
      if (t.includes(",")) return t.split(",").map((p) => normaliseText(p)).filter(Boolean);
      return [t];
    });

    raw.forEach((item) => {
      if (!item) return;
      if (isContactLike(item)) return;
      const key = item.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(item);
    });

    return out;
  }

  function normalisedSet(arr) {
    const set = new Set();
    cleanList(arr).forEach((item) => set.add(item.toLowerCase()));
    return set;
  }

  function overlapList(a, b) {
    const as = normalisedSet(a);
    const out = [];
    cleanList(b).forEach((item) => {
      const k = item.toLowerCase();
      if (as.has(k)) out.push(item);
    });
    return out;
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

  function getPrimaryLoveLanguage(person) {
    if (!person || typeof person !== "object") return "";
    const direct = normaliseText(person.loveLanguage);
    if (direct) return direct;
    const list = toArray(person.loveLanguages || person.love_language || person.love_languages || []);
    if (list.length) return normaliseText(list[0]);
    return "";
  }

  function getValues(person) {
    if (!person || typeof person !== "object") return [];
    return cleanList(person.values || person.coreValues || person.core_values || person.valueList || person.value_list || []);
  }

  function getHobbies(person) {
    if (!person || typeof person !== "object") return [];
    return cleanList(person.hobbies || person.interests || person.passions || person.hobbyList || person.hobby_list || []);
  }

  function normaliseZodiac(name) {
    return normaliseText(name).toLowerCase();
  }

  function zodiacSymbol(name) {
    const key = normaliseZodiac(name);
    return ZODIAC_SYMBOLS[key] || "★";
  }

  function zodiacElement(name) {
    const key = normaliseZodiac(name);
    return ZODIAC_ELEMENTS[key] || "";
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

  function toLifePath(value) {
    if (value == null) return null;
    let n = value;
    if (typeof n === "string") n = parseInt(n, 10);
    if (!Number.isFinite(n)) return null;
    return n;
  }

  function computeJaccardScore(aList, bList) {
    const a = normalisedSet(aList);
    const b = normalisedSet(bList);
    const union = new Set([...a, ...b]);
    if (!union.size) return 60;
    let inter = 0;
    a.forEach((x) => {
      if (b.has(x)) inter += 1;
    });
    const ratio = inter / union.size;
    return clamp(Math.round(35 + ratio * 60), 35, 95);
  }

  function loveScore(baseSoul, match) {
    const a = canonicalLoveKey(getPrimaryLoveLanguage(baseSoul));
    const b = canonicalLoveKey(getPrimaryLoveLanguage(match));
    if (!a || !b) return 60;
    if (a === b) return 92;
    const pair = a + "-" + b;
    const rev = b + "-" + a;
    const goodPairs = new Set([
      "words-quality",
      "words-service",
      "quality-touch",
      "quality-service",
      "service-gifts",
      "touch-words",
      "gifts-words",
      "gifts-quality",
    ]);
    if (goodPairs.has(pair) || goodPairs.has(rev)) return 78;
    return 62;
  }

  function astroScore(baseSoul, match) {
    const aZ = normaliseText(baseSoul.westernZodiac || baseSoul.zodiac || baseSoul.hiddenZodiac || baseSoul.western_sign || "");
    const bZ = normaliseText(match.westernZodiac || match.zodiac || "");
    const aE = zodiacElement(aZ);
    const bE = zodiacElement(bZ);
    if (!aE || !bE) return 65;
    if (aE === bE) return 80;
    const combo = aE + "-" + bE;
    const rev = bE + "-" + aE;
    const harmonies = new Set(["fire-air", "earth-water"]);
    const frictions = new Set(["fire-water", "earth-air"]);
    if (harmonies.has(combo) || harmonies.has(rev)) return 76;
    if (frictions.has(combo) || frictions.has(rev)) return 58;
    return 66;
  }

  function numbersScore(baseSoul, match) {
    const a = toLifePath(baseSoul.lifePathNumber || baseSoul.lifePath || baseSoul.life_path || null);
    const b = toLifePath(match.lifePathNumber || match.lifePath || null);
    if (a == null || b == null) return 60;
    const d = Math.abs(a - b);
    if (d === 0) return 80;
    if (d === 1) return 74;
    if (d === 2) return 68;
    if (d === 3) return 62;
    return 55;
  }

  function computeCompatibility(baseSoul, match) {
    const baseValues = getValues(baseSoul);
    const baseHobbies = getHobbies(baseSoul);

    const matchValues = getValues(match);
    const matchHobbies = getHobbies(match);

    const values = computeJaccardScore(baseValues, matchValues);
    const joy = computeJaccardScore(baseHobbies, matchHobbies);
    const love = loveScore(baseSoul, match);
    const astro = astroScore(baseSoul, match);
    const numbers = numbersScore(baseSoul, match);

    const overall = clamp(
      Math.round(values * 0.28 + love * 0.24 + joy * 0.18 + astro * 0.18 + numbers * 0.12),
      18,
      95
    );

    const commonValues = overlapList(baseValues, matchValues);
    const commonHobbies = overlapList(baseHobbies, matchHobbies);

    const spice = clamp(Math.round(Math.abs(60 - overall) + Math.abs(love - values) * 0.12), 0, 100);

    return {
      overall,
      spice,
      subscores: { love, values, joy, astro, numbers },
      overlaps: { values: commonValues, hobbies: commonHobbies },
    };
  }

  function getContactHandle(match) {
    if (!match || typeof match !== "object") return "";
    const a = normaliseText(match.contactHandle);
    if (a) return a;
    const b = normaliseText(match.contact && match.contact.handle);
    if (b) return b;
    return "";
  }

  function stableIdForMatch(match) {
    const id = normaliseText(match.id);
    if (id) return id;
    const name = normaliseText(match.name);
    if (!name) return "match-" + String(Date.now());
    return "match-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function loadBaseSoul() {
    let base = null;
    try {
      if (typeof window.getSoulData === "function") {
        try {
          base = window.getSoulData({ ensureShape: true });
        } catch (_e) {
          base = window.getSoulData();
        }
      }
    } catch (_e) {
      base = null;
    }
    if (!base || typeof base !== "object") base = {};
    return base;
  }

  function loadMatchesDataSource() {
    return DEMO_MATCHES.slice().map((m) => ({ ...m }));
  }

  function safeReadFriends() {
    if (typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(FRIENDS_KEY);
      const parsed = safeParseJSON(raw);
      if (!parsed || !Array.isArray(parsed)) return [];
      return parsed.filter((item) => item && typeof item === "object");
    } catch (_e) {
      return [];
    }
  }

  function safeWriteFriends(list) {
    if (typeof localStorage === "undefined") return;
    try {
      const clean = Array.isArray(list) ? list.filter((x) => x && typeof x === "object") : [];
      localStorage.setItem(FRIENDS_KEY, JSON.stringify(clean));
    } catch (_e) {}
  }

  function isInFriends(match, friendsList) {
    const id = stableIdForMatch(match);
    const name = normaliseText(match.name).toLowerCase();
    return friendsList.some((f) => {
      const fid = normaliseText(f.id);
      const fname = normaliseText(f.name).toLowerCase();
      if (fid && fid === id) return true;
      if (fname && fname === name) return true;
      return false;
    });
  }

  function addMatchToFriends(match) {
    const friends = safeReadFriends();
    if (isInFriends(match, friends)) return { added: false, already: true };

    const payload = {
      id: stableIdForMatch(match),
      name: normaliseText(match.name) || "Unknown",
      connectionType: normaliseText(match.connectionType) || null,
      score: Number.isFinite(match.score) ? match.score : null,
      vibeTag: normaliseText(match.vibeTag) || null,
      values: getValues(match),
      hobbies: getHobbies(match),
      westernZodiac: normaliseText(match.westernZodiac || match.zodiac) || null,
      chineseZodiac: normaliseText(match.chineseZodiac) || null,
      lifePathNumber: toLifePath(match.lifePathNumber),
      contactHandle: normaliseText(getContactHandle(match)) || null,
      contactPlatform: normaliseText(match.contactPlatform) || null,
      createdAt: new Date().toISOString(),
    };

    friends.push(payload);
    safeWriteFriends(friends);
    return { added: true, already: false };
  }

  function overallVibeLabel(score) {
    if (!Number.isFinite(score)) return "Exploration match";
    if (score >= 82) return "High harmony";
    if (score >= 65) return "Good potential";
    if (score >= 48) return "Exploration match";
    return "Learning connection";
  }

  function highlightText(score) {
    if (!Number.isFinite(score)) {
      return "Ask: “What would make this connection 5% kinder today?” and act on one small piece.";
    }
    if (score >= 78) {
      return "Protect shared rituals and honest conversations rather than chasing constant intensity.";
    }
    if (score >= 60) {
      return "With gentle check-ins and clear boundaries, this connection can deepen steadily.";
    }
    return "Stay curious and kind to yourself — let your body’s signals guide how close you want to be.";
  }

  function overviewText(baseSoul, match) {
    const score = match && Number.isFinite(match.score) ? match.score : null;
    const baseLove = getPrimaryLoveLanguage(baseSoul);
    const matchLove = getPrimaryLoveLanguage(match);
    const commonV = match && match.metrics ? match.metrics.overlaps.values.slice(0, 3) : [];
    const commonH = match && match.metrics ? match.metrics.overlaps.hobbies.slice(0, 3) : [];

    const parts = [];
    parts.push("This connection reads as " + overallVibeLabel(score).toLowerCase() + ".");
    if (baseLove && matchLove) parts.push("Love language: " + baseLove + " ↔ " + matchLove + ".");
    if (commonV && commonV.length) parts.push("Shared values: " + commonV.join(", ") + ".");
    if (commonH && commonH.length) parts.push("Shared joys: " + commonH.join(", ") + ".");
    parts.push("Scores are information, not fate — communication and boundaries matter more than any number.");
    return parts.join(" ");
  }

  function loveText(baseSoul, match) {
    const baseLove = getPrimaryLoveLanguage(baseSoul);
    const matchLove = getPrimaryLoveLanguage(match);
    const s = match && match.metrics ? match.metrics.subscores.love : null;

    if (!baseLove && !matchLove) {
      return "Love language isn’t clearly defined yet. Explore what brings calm, warmth, and trust for both of you — then name it gently.";
    }
    if (!baseLove) {
      return "Your love language is not set yet. This match leans toward " + (matchLove || "a blended style") + ". Try naming what feels caring to you and see what lands for them.";
    }
    if (!matchLove) {
      return "You lean toward " + baseLove + ". This match’s love language isn’t visible yet — watch for the small gestures they repeat and ask what makes them feel safe.";
    }
    const tone = Number.isFinite(s) ? (s >= 85 ? "Very aligned." : s >= 70 ? "Mostly compatible." : "Different, but workable.") : "";
    return "You: " + baseLove + ". Them: " + matchLove + ". " + tone + " Build simple rituals that satisfy both styles without guessing.";
  }

  function valuesText(baseSoul, match) {
    const common = match && match.metrics ? match.metrics.overlaps.values : [];
    const yours = getValues(baseSoul);
    const theirs = getValues(match);

    if (!yours.length && !theirs.length) return "Values aren’t visible yet. Over time, you’ll learn what each of you refuses to compromise on — that’s where trust forms.";
    if (!yours.length) return "Your values list is empty right now. This match shows values like: " + (theirs.slice(0, 4).join(", ") || "—") + ". Add your own values to improve scoring.";
    if (!theirs.length) return "This match’s values aren’t listed yet. Your values include: " + (yours.slice(0, 4).join(", ") || "—") + ". Ask what they care about when life gets hard.";
    if (common.length) return "Shared values: " + common.slice(0, 6).join(", ") + ". Where values overlap, decisions become easier and conflict becomes softer.";
    return "Your values and their values don’t overlap strongly yet. That can still work if you name your non-negotiables early and listen for theirs.";
  }

  function joyText(baseSoul, match) {
    const common = match && match.metrics ? match.metrics.overlaps.hobbies : [];
    const yours = getHobbies(baseSoul);
    const theirs = getHobbies(match);

    if (!yours.length && !theirs.length) return "Shared joy is still a blank canvas. Try low-pressure rituals: short walks, simple meals, or calm side-by-side time.";
    if (!yours.length) return "Your hobbies list is empty right now. This match enjoys: " + (theirs.slice(0, 4).join(", ") || "—") + ". Add your joys to improve scoring.";
    if (!theirs.length) return "Their hobbies aren’t listed yet. Your joys include: " + (yours.slice(0, 4).join(", ") || "—") + ". Suggest one shared activity and see what happens.";
    if (common.length) return "Shared joys: " + common.slice(0, 6).join(", ") + ". Small repeated moments create the strongest bonding over time.";
    return "You don’t share many hobbies on paper, but joy can still appear in new rituals you create together.";
  }

  function astroText(baseSoul, match) {
    const aZ = normaliseText(baseSoul.westernZodiac || baseSoul.zodiac || baseSoul.hiddenZodiac || "");
    const bZ = normaliseText(match.westernZodiac || match.zodiac || "");
    const aE = zodiacElement(aZ);
    const bE = zodiacElement(bZ);
    const aC = normaliseText(baseSoul.chineseZodiac || baseSoul.chinese_zodiac || "");
    const bC = normaliseText(match.chineseZodiac || "");
    const aL = toLifePath(baseSoul.lifePathNumber || baseSoul.lifePath || null);
    const bL = toLifePath(match.lifePathNumber || null);

    const bits = [];
    if (aZ) bits.push("You: " + zodiacSymbol(aZ) + " " + aZ + (aE ? " (" + aE + ")" : ""));
    if (bZ) bits.push("Them: " + zodiacSymbol(bZ) + " " + bZ + (bE ? " (" + bE + ")" : ""));
    if (aC) bits.push("You: " + chineseEmoji(aC) + " " + aC);
    if (bC) bits.push("Them: " + chineseEmoji(bC) + " " + bC);
    if (aL != null) bits.push("Your Life Path " + aL);
    if (bL != null) bits.push("Their Life Path " + bL);

    if (!bits.length) {
      return "Astro & numbers are optional lenses. They can spark language for tendencies, but never override choices, consent, or communication.";
    }
    return bits.join(" · ") + ". Treat symbols as inspiration, not rules — real safety and honesty are the true compatibility.";
  }

  function setSnapshotFocus(focus) {
    state.snapshotFocus = focus;
    if (!ui.snapshotPicker) return;
    Array.from(ui.snapshotPicker.querySelectorAll(".m-snapshot-chip")).forEach((chip) => {
      chip.classList.toggle("is-active", (chip.getAttribute("data-focus") || "overview") === focus);
    });
  }

  function renderSnapshot(match) {
    const hasMatch = !!(match && typeof match === "object");
    if (!hasMatch) {
      if (ui.snapshotTitle) ui.snapshotTitle.textContent = "No match selected yet";
      if (ui.snapshotScore) ui.snapshotScore.textContent = "–%";
      if (ui.snapshotBody) ui.snapshotBody.textContent = "Tap a card in the Match Lab to see a gentle compatibility portrait — love language, values, joys, and symbolic astro & numbers.";
      if (ui.snapshotFocus) ui.snapshotFocus.textContent = "Romantic & Friendship";
      if (ui.snapshotHighlight) ui.snapshotHighlight.textContent = "Scores are information, not fate. Communication and boundaries matter more than any number.";
      return;
    }

    const score = Number.isFinite(match.score) ? match.score : null;
    if (ui.snapshotTitle) ui.snapshotTitle.textContent = normaliseText(match.name) || "Selected match";
    if (ui.snapshotScore) ui.snapshotScore.textContent = score != null ? score + "%" : "–%";
    if (ui.snapshotFocus) ui.snapshotFocus.textContent = normaliseText(match.connectionType) || "Connection";
    if (ui.snapshotHighlight) ui.snapshotHighlight.textContent = highlightText(score);

    const focus = state.snapshotFocus || "overview";
    let body = "";
    if (focus === "love") body = loveText(state.baseSoul, match);
    else if (focus === "values") body = valuesText(state.baseSoul, match);
    else if (focus === "joy") body = joyText(state.baseSoul, match);
    else if (focus === "astro") body = astroText(state.baseSoul, match);
    else body = overviewText(state.baseSoul, match);

    if (ui.snapshotBody) ui.snapshotBody.textContent = body;
  }

  function createScoreRing(score) {
    const ring = document.createElement("div");
    ring.className = "m-score-ring";
    const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
    ring.style.setProperty("--score", String(safeScore));

    const inner = document.createElement("div");
    inner.className = "m-score-inner";

    const valueSpan = document.createElement("span");
    valueSpan.className = "m-score-value";
    valueSpan.textContent = safeScore ? safeScore + "%" : "–%";

    const labelSpan = document.createElement("span");
    labelSpan.className = "m-score-label";
    labelSpan.textContent = "Compat";

    inner.appendChild(valueSpan);
    inner.appendChild(labelSpan);
    ring.appendChild(inner);
    return ring;
  }

  function updateSelectedCardHighlight() {
    if (!ui.list) return;
    Array.from(ui.list.querySelectorAll(".m-card")).forEach((card) => {
      card.classList.toggle("is-selected", (card.getAttribute("data-id") || "") === (state.selectedId || ""));
    });
  }

  function toggleEmptyState(showEmpty) {
    if (ui.empty) ui.empty.hidden = !showEmpty;
    if (ui.layout) ui.layout.hidden = !!showEmpty;
  }

  function sortAndFilterMatches() {
    const all = state.matches.slice();
    const mode = (state.connectionMode || "all").toLowerCase();

    let filtered = all;
    if (mode === "romantic" || mode === "friendship") {
      filtered = all.filter((m) => normaliseText(m.connectionType).toLowerCase() === mode);
    }

    const sortMode = state.sortMode || "best";
    if (sortMode === "name") {
      filtered.sort((a, b) => normaliseText(a.name).toLowerCase().localeCompare(normaliseText(b.name).toLowerCase()));
    } else if (sortMode === "spice") {
      filtered.sort((a, b) => (Number.isFinite(a.metrics?.spice) ? a.metrics.spice : 0) - (Number.isFinite(b.metrics?.spice) ? b.metrics.spice : 0));
    } else {
      filtered.sort((a, b) => (Number.isFinite(b.score) ? b.score : 0) - (Number.isFinite(a.score) ? a.score : 0));
    }

    return filtered;
  }

  function copyToClipboard(text) {
    const t = normaliseText(text);
    if (!t) return Promise.resolve(false);
    if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      return navigator.clipboard.writeText(t).then(() => true).catch(() => false);
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.setAttribute("readonly", "true");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return Promise.resolve(!!ok);
    } catch (_e) {
      return Promise.resolve(false);
    }
  }

  function renderMatchCard(match) {
    const sid = stableIdForMatch(match);
    const inCircle = isInFriends(match, state.friends);

    const card = document.createElement("article");
    card.className = "m-card";
    card.setAttribute("tabindex", "0");
    card.setAttribute("data-id", sid);
    card.setAttribute("data-connection-type", normaliseText(match.connectionType) || "");
    card.setAttribute("data-score", Number.isFinite(match.score) ? String(match.score) : "");
    if (state.selectedId && state.selectedId === sid) card.classList.add("is-selected");

    const header = document.createElement("header");
    header.className = "m-card-header";

    const left = document.createElement("div");
    left.className = "m-card-left";

    const avatar = document.createElement("div");
    avatar.className = "m-avatar-circle";
    const initialSpan = document.createElement("span");
    initialSpan.className = "m-avatar-initial";
    const initialSource = normaliseText(match.name) || "?";
    initialSpan.textContent = initialSource.charAt(0).toUpperCase();
    avatar.appendChild(initialSpan);

    const meta = document.createElement("div");
    meta.className = "m-card-meta";

    const nameRow = document.createElement("div");
    nameRow.className = "m-card-name-row";

    const nameEl = document.createElement("div");
    nameEl.className = "m-card-name";
    nameEl.title = normaliseText(match.name) || "";
    nameEl.textContent = normaliseText(match.name) || "Unnamed match";

    const vibeEl = document.createElement("div");
    vibeEl.className = "m-card-vibe";
    vibeEl.title = normaliseText(match.vibeTag) || "";
    vibeEl.textContent = normaliseText(match.vibeTag) || "Soft, emerging vibe";

    nameRow.appendChild(nameEl);
    nameRow.appendChild(vibeEl);

    const tagRow = document.createElement("div");
    tagRow.className = "m-card-tag-row";

    const connectionTag = document.createElement("span");
    connectionTag.className = "m-tag-pill m-tag-connection";
    connectionTag.textContent = normaliseText(match.connectionType) || "Connection";
    tagRow.appendChild(connectionTag);

    const love = getPrimaryLoveLanguage(match);
    if (love) {
      const loveTag = document.createElement("span");
      loveTag.className = "m-tag-pill";
      loveTag.textContent = "Love: " + love;
      tagRow.appendChild(loveTag);
    }

    const zodiac = normaliseText(match.westernZodiac || match.zodiac);
    if (zodiac) {
      const zTag = document.createElement("span");
      zTag.className = "m-tag-pill";
      zTag.textContent = "Sign: " + zodiacSymbol(zodiac) + " " + zodiac;
      tagRow.appendChild(zTag);
    }

    const life = toLifePath(match.lifePathNumber);
    if (life != null) {
      const nTag = document.createElement("span");
      nTag.className = "m-tag-pill";
      nTag.textContent = "Life Path " + life;
      tagRow.appendChild(nTag);
    }

    meta.appendChild(nameRow);
    meta.appendChild(tagRow);

    left.appendChild(avatar);
    left.appendChild(meta);

    const scoreWrap = document.createElement("div");
    scoreWrap.className = "m-score";
    scoreWrap.appendChild(createScoreRing(match.score));

    header.appendChild(left);
    header.appendChild(scoreWrap);

    const body = document.createElement("div");
    body.className = "m-card-body";

    const p1 = document.createElement("p");
    p1.textContent = overviewText(state.baseSoul, match);

    const p2 = document.createElement("p");
    p2.textContent = highlightText(match.score);

    body.appendChild(p1);
    body.appendChild(p2);

    const metaGrid = document.createElement("div");
    metaGrid.className = "m-card-meta-grid";

    const valuesBlock = document.createElement("div");
    const valuesLabel = document.createElement("div");
    valuesLabel.className = "m-meta-item-label";
    valuesLabel.textContent = "Shared values";
    const valuesRow = document.createElement("div");
    valuesRow.className = "m-meta-pill-row";
    const sharedValues = match.metrics ? match.metrics.overlaps.values : [];
    if (sharedValues && sharedValues.length) {
      sharedValues.slice(0, 3).forEach((v) => {
        const pill = document.createElement("span");
        pill.className = "m-meta-pill";
        pill.textContent = v;
        valuesRow.appendChild(pill);
      });
    } else {
      const pill = document.createElement("span");
      pill.className = "m-meta-pill";
      pill.textContent = "Exploring";
      valuesRow.appendChild(pill);
    }
    valuesBlock.appendChild(valuesLabel);
    valuesBlock.appendChild(valuesRow);

    const joysBlock = document.createElement("div");
    const joysLabel = document.createElement("div");
    joysLabel.className = "m-meta-item-label";
    joysLabel.textContent = "Shared joys";
    const joysRow = document.createElement("div");
    joysRow.className = "m-meta-pill-row";
    const sharedHobbies = match.metrics ? match.metrics.overlaps.hobbies : [];
    if (sharedHobbies && sharedHobbies.length) {
      sharedHobbies.slice(0, 3).forEach((h) => {
        const pill = document.createElement("span");
        pill.className = "m-meta-pill";
        pill.textContent = h;
        joysRow.appendChild(pill);
      });
    } else {
      const pill = document.createElement("span");
      pill.className = "m-meta-pill";
      pill.textContent = "Discovering";
      joysRow.appendChild(pill);
    }
    joysBlock.appendChild(joysLabel);
    joysBlock.appendChild(joysRow);

    const hi = document.createElement("div");
    hi.className = "m-highlight-box";
    hi.textContent = "Love " + (match.metrics ? match.metrics.subscores.love : "—") + " • Values " + (match.metrics ? match.metrics.subscores.values : "—") + " • Joy " + (match.metrics ? match.metrics.subscores.joy : "—");

    metaGrid.appendChild(valuesBlock);
    metaGrid.appendChild(joysBlock);
    metaGrid.appendChild(hi);

    const footer = document.createElement("footer");
    footer.className = "m-card-footer";

    const actions = document.createElement("div");
    actions.className = "m-card-actions";

    const viewBtn = document.createElement("a");
    viewBtn.href = "match-profile.html?id=" + encodeURIComponent(sid);
    viewBtn.className = "btn outline";
    viewBtn.textContent = "View Match Profile";
    viewBtn.setAttribute("aria-label", "View detailed match profile for " + (normaliseText(match.name) || "this match"));

    actions.appendChild(viewBtn);

    const contact = getContactHandle(match);
    if (contact) {
      const msgBtn = document.createElement("button");
      msgBtn.type = "button";
      msgBtn.className = "btn outline";
      msgBtn.textContent = "Message";
      msgBtn.setAttribute("aria-label", "Copy contact handle for " + (normaliseText(match.name) || "this match"));
      msgBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        copyToClipboard(contact).then((ok) => {
          const platform = normaliseText(match.contactPlatform) || "Contact";
          const text = platform + ": " + contact;
          if (!ok) alert(text);
          else alert("Copied: " + text);
        });
      });
      actions.appendChild(msgBtn);
    }

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn outline m-add-circle-btn";
    addBtn.textContent = inCircle ? "In Your Circle" : "Add to My Circle";
    addBtn.disabled = inCircle;
    addBtn.setAttribute("aria-disabled", inCircle ? "true" : "false");

    addBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (addBtn.disabled) return;
      const res = addMatchToFriends(match);
      if (res.added || res.already) {
        state.friends = safeReadFriends();
        addBtn.textContent = "In Your Circle";
        addBtn.disabled = true;
        addBtn.setAttribute("aria-disabled", "true");
      }
    });

    actions.appendChild(addBtn);

    const tip = document.createElement("div");
    tip.className = "m-card-tip";
    tip.textContent = "Tip: Click the card to update the snapshot →";

    footer.appendChild(actions);
    footer.appendChild(tip);

    function selectCard() {
      state.selectedId = sid;
      updateSelectedCardHighlight();
      renderSnapshot(match);
    }

    card.addEventListener("click", selectCard);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectCard();
      }
    });

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(metaGrid);
    card.appendChild(footer);

    return card;
  }

  function renderMatchList() {
    if (!ui.list) return;

    const matches = sortAndFilterMatches();

    ui.list.innerHTML = "";

    if (!state.matches.length) {
      toggleEmptyState(true);
      renderSnapshot(null);
      return;
    }

    toggleEmptyState(false);

    if (!matches.length) {
      const note = document.createElement("p");
      note.textContent = "No matches fit this filter yet. Try another type or sort.";
      ui.list.appendChild(note);
      return;
    }

    matches.forEach((m) => {
      ui.list.appendChild(renderMatchCard(m));
    });

    updateSelectedCardHighlight();
  }

  function updateModeLabel() {
    if (!ui.modeLabel) return;
    const mode = (state.connectionMode || "all").toLowerCase();
    if (mode === "romantic") ui.modeLabel.textContent = "Romantic focus";
    else if (mode === "friendship") ui.modeLabel.textContent = "Friendship focus";
    else ui.modeLabel.textContent = "All connections";
  }

  function onToggleClick(e) {
    const btn = e.currentTarget;
    const mode = (btn.getAttribute("data-connection-mode") || "all").toLowerCase();
    state.connectionMode = mode;

    ui.toggles.forEach((t) => {
      t.classList.toggle("is-active", (t.getAttribute("data-connection-mode") || "").toLowerCase() === mode);
    });

    updateModeLabel();
    renderMatchList();

    const current = state.matches.find((m) => stableIdForMatch(m) === state.selectedId);
    if (current) renderSnapshot(current);
  }

  function onSortChange(e) {
    const v = (e.target.value || "best").toLowerCase();
    state.sortMode = v === "name" || v === "spice" ? v : "best";
    renderMatchList();

    const current = state.matches.find((m) => stableIdForMatch(m) === state.selectedId);
    if (current) renderSnapshot(current);
  }

  function wireSnapshotPicker() {
    if (!ui.snapshotPicker) return;
    Array.from(ui.snapshotPicker.querySelectorAll(".m-snapshot-chip")).forEach((chip) => {
      chip.addEventListener("click", () => {
        const focus = chip.getAttribute("data-focus") || "overview";
        setSnapshotFocus(focus);
        const current = state.matches.find((m) => stableIdForMatch(m) === state.selectedId);
        if (current) renderSnapshot(current);
      });
    });
  }

  function animatePageOnce() {
    if (!ui.page) return;
    if (prefersReducedMotion()) return;
    window.requestAnimationFrame(() => {
      ui.page.classList.add("m-animate");
    });
  }

  function computeMatches() {
    const base = state.baseSoul || {};
    const source = loadMatchesDataSource();
    const computed = source.map((m) => {
      const metrics = computeCompatibility(base, m);
      const score = metrics.overall;
      return { ...m, id: stableIdForMatch(m), metrics, score };
    });
    state.matches = computed;
  }

  function updateBaseSoulStatus() {
    if (!ui.baseSoulStatus) return;
    const base = state.baseSoul || {};
    const hasAny = !!(getPrimaryLoveLanguage(base) || getValues(base).length || getHobbies(base).length || normaliseText(base.zodiac || base.westernZodiac || base.hiddenZodiac));
    ui.baseSoulStatus.textContent = hasAny ? "Loaded" : "Empty";
  }

  function init() {
    try {
      state.friends = safeReadFriends();
      state.baseSoul = loadBaseSoul();
      updateBaseSoulStatus();
      computeMatches();

      if (ui.toggles && ui.toggles.length) ui.toggles.forEach((b) => b.addEventListener("click", onToggleClick));
      if (ui.sortSelect) ui.sortSelect.addEventListener("change", onSortChange);

      wireSnapshotPicker();
      updateModeLabel();
      renderMatchList();
      renderSnapshot(null);

      if (state.matches.length) {
        state.selectedId = stableIdForMatch(state.matches[0]);
        updateSelectedCardHighlight();
        renderSnapshot(state.matches[0]);
      }

      animatePageOnce();
    } catch (_e) {
      if (ui.empty) ui.empty.hidden = false;
      if (ui.layout) ui.layout.hidden = true;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
