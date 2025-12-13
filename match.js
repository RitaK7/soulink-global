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

  // ===================== DEMO MATCHES =====================

  const DEMO_MATCHES = [
    {
      id: "match-aurora",
      name: "Aurora",
      connectionType: "Romantic",
      vibeTag: "Warm horizon seeker",
      loveLanguage: "Quality Time",
      loveLanguages: ["Quality Time", "Words of Affirmation"],
      values: ["Honesty", "Growth", "Adventure"],
      hobbies: ["Hiking", "Books", "Music"],
      westernZodiac: "Sagittarius",
      chineseZodiac: "Dragon",
      lifePathNumber: 7,
      birthday: "1986-12-03",
      score: 82,
    },
    {
      id: "match-luna",
      name: "Luna",
      connectionType: "Romantic",
      vibeTag: "Soft moonlight protector",
      loveLanguage: "Acts of Service",
      loveLanguages: ["Acts of Service", "Receiving Gifts"],
      values: ["Kindness", "Family", "Stability"],
      hobbies: ["Cooking", "Gardening", "Films"],
      westernZodiac: "Cancer",
      chineseZodiac: "Horse",
      lifePathNumber: 6,
      birthday: "1988-07-05",
      score: 62,
    },
    {
      id: "match-river",
      name: "River",
      connectionType: "Friendship",
      vibeTag: "Quiet, grounded presence",
      loveLanguage: "Quality Time",
      loveLanguages: ["Quality Time", "Physical Touch"],
      values: ["Spirituality", "Authenticity", "Growth"],
      hobbies: ["Meditation", "Hiking", "Art"],
      westernZodiac: "Pisces",
      chineseZodiac: "Goat",
      lifePathNumber: 11,
      birthday: "1992-03-15",
      score: 71,
    },
    {
      id: "match-nova",
      name: "Nova",
      connectionType: "Romantic",
      vibeTag: "Spark of playful light",
      loveLanguage: "Receiving Gifts",
      loveLanguages: ["Receiving Gifts", "Acts of Service"],
      values: ["Creativity", "Freedom", "Joy"],
      hobbies: ["Art", "Design", "Music"],
      westernZodiac: "Libra",
      chineseZodiac: "Monkey",
      lifePathNumber: 3,
      birthday: "1987-10-10",
      score: 47,
    },
    {
      id: "match-sage",
      name: "Sage",
      connectionType: "Friendship",
      vibeTag: "Thoughtful pattern spotter",
      loveLanguage: "Words of Affirmation",
      loveLanguages: ["Words of Affirmation", "Quality Time"],
      values: ["Honesty", "Curiosity", "Freedom"],
      hobbies: ["Podcasts", "Yoga", "Nature"],
      westernZodiac: "Aquarius",
      chineseZodiac: "Rabbit",
      lifePathNumber: 9,
      birthday: "1990-02-11",
      score: 68,
    },
    {
      id: "match-leo",
      name: "Leo",
      connectionType: "Romantic",
      vibeTag: "Bold heart, bright fire",
      loveLanguage: "Physical Touch",
      loveLanguages: ["Physical Touch", "Acts of Service"],
      values: ["Passion", "Adventure", "Authenticity"],
      hobbies: ["Travel", "Dancing", "Cooking"],
      westernZodiac: "Leo",
      chineseZodiac: "Tiger",
      lifePathNumber: 5,
      birthday: "1984-08-01",
      score: 44,
    },
  ];

  function getDemoMatches() {
    // Future: replace this with real matches without changing downstream logic
    return DEMO_MATCHES.slice();
  }

  // ===================== Friends (circle) storage =====================

  const FRIENDS_KEY = "soulink.friends.list";

  function safeReadFriends() {
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

  function safeWriteFriends(list) {
    if (typeof localStorage === "undefined") return;
    try {
      const clean = Array.isArray(list) ? list.filter((x) => x && typeof x === "object") : [];
      localStorage.setItem(FRIENDS_KEY, JSON.stringify(clean));
    } catch (err) {
      console.warn("Match: failed to write friends list", err);
    }
  }

  function isInFriends(match, friendsList) {
    if (!match) return false;
    const id = normaliseText(match.id);
    const name = normaliseText(match.name).toLowerCase();
    return friendsList.some((f) => {
      const fid = normaliseText(f.id);
      const fname = normaliseText(f.name).toLowerCase();
      if (id && fid && fid === id) return true;
      if (name && fname && fname === name) return true;
      return false;
    });
  }

  function stableIdForMatch(match) {
    const id = normaliseText(match.id);
    if (id) return id;
    const name = normaliseText(match.name);
    if (!name) return "match-" + String(Date.now());
    return "match-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function addMatchToFriends(match) {
    if (!match) return { added: false, already: false };
    const friends = safeReadFriends();
    if (isInFriends(match, friends)) {
      return { added: false, already: true };
    }

    const payload = {
      id: stableIdForMatch(match),
      name: normaliseText(match.name) || "Unknown",
      connectionType: normaliseText(match.connectionType) || null,
      score: Number.isFinite(match.score) ? match.score : null,
      vibeTag: normaliseText(match.vibeTag) || null,
      values: cleanList(match.values || match.coreValues || []),
      hobbies: cleanList(match.hobbies || match.passions || match.interests || []),
      westernZodiac: normaliseText(match.westernZodiac || match.zodiac) || null,
      chineseZodiac: normaliseText(match.chineseZodiac) || null,
      lifePathNumber: numericLifePath(match.lifePathNumber),
      profilePhoto: normaliseText(match.profilePhoto) || null,
      createdAt: new Date().toISOString(),
    };

    friends.push(payload);
    safeWriteFriends(friends);
    return { added: true, already: false };
  }

  // ===================== Snapshot text generators =====================

  function overallVibeLabel(score) {
    if (!Number.isFinite(score)) return "Exploration match";
    if (score >= 80) return "High harmony";
    if (score >= 60) return "Good potential";
    if (score >= 40) return "Exploration match";
    return "Learning connection";
  }

  function buildOverviewText(match) {
    const name = normaliseText(match.name) || "this person";
    const connection = normaliseText(match.connectionType) || "connection";
    const score = Number.isFinite(match.score) ? match.score : null;
    const love = getPrimaryLoveLanguage(match);
    const age = computeAge(match.birthday);
    const vibe = normaliseText(match.vibeTag);

    let sentence =
      "This " + connection.toLowerCase() + " currently reads as " + overallVibeLabel(score).toLowerCase() + ". ";

    if (love) {
      sentence += "Their primary love language seems to lean toward " + love.toLowerCase() + ". ";
    }

    if (vibe) {
      sentence += name + " carries a \"" + vibe.toLowerCase() + "\" kind of energy. ";
    }

    if (age != null) {
      sentence += "Age-wise, they feel like someone navigating life in their " + age + " year frame. ";
    }

    sentence +=
      "Scores are information, not fate — honest communication and small consistent actions will always matter more than numbers.";

    return sentence;
  }

  function buildLoveText(match) {
    const love = getPrimaryLoveLanguage(match);
    if (!love) {
      return (
        "Their love language isn’t clearly named yet. You can gently explore what makes them visibly relax and feel cared for — " +
        "often it shows up in the small gestures they repeat for others."
      );
    }

    const key = canonicalLoveKey(love);
    if (key === "words") {
      return (
        "Words of Affirmation: this match likely softens when their efforts or inner world are named out loud. " +
        "Short, sincere sentences land better than grand speeches."
      );
    }
    if (key === "quality") {
      return (
        "Quality Time: shared presence is their main currency. Even 20–30 focused minutes, with phones away, " +
        "can feel more nourishing than big dramatic plans."
      );
    }
    if (key === "service") {
      return (
        "Acts of Service: they often feel loved when practical weight is lifted from their shoulders. " +
        "Small, thoughtful actions count more than big, irregular gestures."
      );
    }
    if (key === "touch") {
      return (
        "Physical Touch: safe, consensual closeness helps their nervous system relax. " +
        "Checking in with clear consent keeps this language gentle rather than overwhelming."
      );
    }
    if (key === "gifts") {
      return (
        "Receiving Gifts: symbolic gestures matter — not price tags. Tiny, meaningful tokens that say “I remembered you” carry the largest weight."
      );
    }

    return (
      "Their way of giving and receiving care may blend several love languages at once. " +
      "Staying curious and naming what feels good for both of you can turn this into a living conversation rather than a fixed category."
    );
  }

  function buildValuesText(match) {
    const values = cleanList(match.values || match.coreValues || []);
    if (!values.length) {
      return (
        "Their core values aren’t fully visible yet. You may gradually discover what they refuse to compromise on — " +
        "that’s usually where their inner compass lives."
      );
    }

    const main = values.slice(0, 3);
    const joined =
      main.length === 1
        ? main[0].toLowerCase()
        : main.slice(0, -1).join(", ").toLowerCase() + " and " + main[main.length - 1].toLowerCase();

    return (
      "This person seems anchored in values like " +
      joined +
      ". " +
      "When these are honoured in daily life, the connection tends to feel steadier and more trustworthy."
    );
  }

  function buildJoyText(match) {
    const hobbies = cleanList(match.hobbies || match.passions || match.interests || []);
    if (!hobbies.length) {
      return (
        "Shared joy with this person may still be emerging. You can experiment with low-pressure activities — " +
        "short walks, simple meals, or quiet side-by-side time — to see where both of you naturally relax."
      );
    }

    const main = hobbies.slice(0, 4);
    const joined =
      main.length === 1
        ? main[0]
        : main.slice(0, -1).join(", ") + " and " + main[main.length - 1];

    return (
      "You’ll likely find lighter, more playful energy together around: " +
      joined +
      ". These don’t have to turn into big plans — even brief, repeated rituals can reset the emotional tone."
    );
  }

  function buildAstroText(match) {
    const z = normaliseText(match.westernZodiac || match.zodiac);
    const cz = normaliseText(match.chineseZodiac);
    const life = numericLifePath(match.lifePathNumber);

    const bits = [];

    if (z) {
      bits.push("Western sign " + zodiacSymbol(z) + " " + z);
    }
    if (cz) {
      bits.push("Chinese sign " + chineseEmoji(cz) + " " + cz);
    }
    if (life != null) {
      bits.push("Life Path " + life);
    }

    if (!bits.length) {
      return (
        "Astrology and numerology here are optional lenses — they can offer language for tendencies, " +
        "but they never override your choices, communication or consent."
      );
    }

    return (
      bits.join(" · ") +
      ". " +
      "Treat these as symbols, not rules — they can inspire curiosity, as long as they leave space for both of you to grow beyond any description."
    );
  }

  function buildHighlight(match) {
    const score = Number.isFinite(match.score) ? match.score : null;
    if (score == null) {
      return "Ask yourself: “What would make this connection feel 5% kinder today?” and act on one small piece.";
    }
    if (score >= 75) {
      return "Nurture what already works — protect shared rituals and honest conversations, rather than chasing constant intensity.";
    }
    if (score >= 55) {
      return "Treat this as fertile ground: with gentle check-ins and clear boundaries, this connection can deepen in a steady way.";
    }
    return "Stay curious but kind to yourself — notice how your body feels around this person and let that guide how close you want to be.";
  }

  // ===================== DOM cache =====================

  const ui = {
    page: $(".match-page"),
    empty: $("#matchEmpty"),
    layout: $("#matchLayout"),
    modeLabel: $("#matchModeLabel"),

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

  // ===================== State =====================

  const state = {
    connectionMode: "all",
    sortMode: "best",
    selectedId: null,
    snapshotFocus: "overview",
    friends: [],
  };

  // ===================== Rendering: snapshot =====================

  function setSnapshotFocus(focus) {
    state.snapshotFocus = focus;
    if (!ui.snapshotPicker) return;
    const chips = Array.from(ui.snapshotPicker.querySelectorAll(".m-snapshot-chip"));
    chips.forEach((chip) => {
      const value = chip.getAttribute("data-focus") || "overview";
      chip.classList.toggle("is-active", value === focus);
    });
  }

  function renderSnapshot(match) {
    const hasMatch = !!(match && typeof match === "object");

    if (!hasMatch) {
      if (ui.snapshotTitle) ui.snapshotTitle.textContent = "No match selected yet";
      if (ui.snapshotScore) ui.snapshotScore.textContent = "–%";
      if (ui.snapshotBody) {
        ui.snapshotBody.textContent =
          "Tap a card in the Match Lab to see a gentle AI-style portrait of that connection — how your love languages, values and joys might interact, plus a symbolic look at astrology and numerology.";
      }
      if (ui.snapshotFocus) ui.snapshotFocus.textContent = "Romantic & Friendship";
      if (ui.snapshotHighlight) {
        ui.snapshotHighlight.textContent =
          "Scores are information, not fate. Honest communication and small consistent actions will always matter more than any number.";
      }
      return;
    }

    const score = Number.isFinite(match.score) ? match.score : null;
    const connection = normaliseText(match.connectionType) || "Connection";

    if (ui.snapshotTitle) {
      ui.snapshotTitle.textContent = normaliseText(match.name) || "Selected match";
    }

    if (ui.snapshotScore) {
      ui.snapshotScore.textContent = score != null ? score + "%" : "–%";
    }

    if (ui.snapshotFocus) {
      ui.snapshotFocus.textContent = connection;
    }

    let bodyText = "";
    const focus = state.snapshotFocus || "overview";
    if (focus === "love") {
      bodyText = buildLoveText(match);
    } else if (focus === "values") {
      bodyText = buildValuesText(match);
    } else if (focus === "joy") {
      bodyText = buildJoyText(match);
    } else if (focus === "astro") {
      bodyText = buildAstroText(match);
    } else {
      bodyText = buildOverviewText(match);
    }

    if (ui.snapshotBody) {
      ui.snapshotBody.textContent = bodyText;
    }

    if (ui.snapshotHighlight) {
      ui.snapshotHighlight.textContent = buildHighlight(match);
    }
  }

  // ===================== Rendering: cards =====================

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

  function renderMatchCard(match, isSelected, friendsList) {
    const inCircle = isInFriends(match, friendsList);

    const card = document.createElement("article");
    card.className = "m-card";
    card.setAttribute("tabindex", "0");
    card.setAttribute("data-id", normaliseText(match.id) || "");
    card.setAttribute("data-connection-type", normaliseText(match.connectionType) || "");
    card.setAttribute("data-score", Number.isFinite(match.score) ? String(match.score) : "");
    if (isSelected) card.classList.add("is-selected");

    // Header
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
    nameEl.textContent = normaliseText(match.name) || "Unnamed match";

    const vibeEl = document.createElement("div");
    vibeEl.className = "m-card-vibe";
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

    const life = numericLifePath(match.lifePathNumber);
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
    const scoreRing = createScoreRing(match.score);
    scoreWrap.appendChild(scoreRing);

    header.appendChild(left);
    header.appendChild(scoreWrap);

    // Body
    const body = document.createElement("div");
    body.className = "m-card-body";

    const bodyP1 = document.createElement("p");
    bodyP1.textContent =
      "This romantic currently reads as a exploration match match. Scores are information, not fate — honest communication and small consistent actions will always matter more than numbers.";

    const bodyP2 = document.createElement("p");
    bodyP2.textContent = "Ask yourself: “What would make this connection feel 5% kinder today?” and act on one small piece.";

    body.appendChild(bodyP1);
    body.appendChild(bodyP2);

    // Meta grid
    const metaGrid = document.createElement("div");
    metaGrid.className = "m-card-meta-grid";

    const valuesBlock = document.createElement("div");
    const valuesLabel = document.createElement("div");
    valuesLabel.className = "m-meta-item-label";
    valuesLabel.textContent = "Values";

    const valuesRow = document.createElement("div");
    valuesRow.className = "m-meta-pill-row";
    const valuesList = cleanList(match.values || match.coreValues || []);
    if (valuesList.length) {
      valuesList.slice(0, 3).forEach((v) => {
        const pill = document.createElement("span");
        pill.className = "m-meta-pill";
        pill.textContent = v;
        valuesRow.appendChild(pill);
      });
    } else {
      const pill = document.createElement("span");
      pill.className = "m-meta-pill";
      pill.textContent = "Still emerging";
      valuesRow.appendChild(pill);
    }
    valuesBlock.appendChild(valuesLabel);
    valuesBlock.appendChild(valuesRow);

    const joysBlock = document.createElement("div");
    const joysLabel = document.createElement("div");
    joysLabel.className = "m-meta-item-label";
    joysLabel.textContent = "Joy & energy";

    const joysRow = document.createElement("div");
    joysRow.className = "m-meta-pill-row";
    const hobbies = cleanList(match.hobbies || match.passions || match.interests || []);
    if (hobbies.length) {
      hobbies.slice(0, 3).forEach((h) => {
        const pill = document.createElement("span");
        pill.className = "m-meta-pill";
        pill.textContent = h;
        joysRow.appendChild(pill);
      });
    } else {
      const pill = document.createElement("span");
      pill.className = "m-meta-pill";
      pill.textContent = "Soft joys not obvious yet";
      joysRow.appendChild(pill);
    }
    joysBlock.appendChild(joysLabel);
    joysBlock.appendChild(joysRow);

    const highlightBlock = document.createElement("div");
    highlightBlock.className = "m-highlight-box";
    highlightBlock.textContent = buildHighlight(match);

    metaGrid.appendChild(valuesBlock);
    metaGrid.appendChild(joysBlock);
    metaGrid.appendChild(highlightBlock);

    // Footer actions
    const footer = document.createElement("footer");
    footer.className = "m-card-footer";

    const actions = document.createElement("div");
    actions.className = "m-card-actions";

    const viewBtn = document.createElement("a");
    viewBtn.href = "match-profile.html?id=" + encodeURIComponent(stableIdForMatch(match));
    viewBtn.className = "btn outline";
    viewBtn.textContent = "View Match Profile";
    viewBtn.setAttribute("aria-label", "View detailed match profile for " + (normaliseText(match.name) || "this match"));

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn outline m-add-circle-btn";
    addBtn.textContent = inCircle ? "In Your Circle" : "Add to My Circle";
    addBtn.disabled = inCircle;
    addBtn.setAttribute("aria-disabled", inCircle ? "true" : "false");

    addBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      event.preventDefault();
      if (addBtn.disabled) return;

      const result = addMatchToFriends(match);
      if (result.added || result.already) {
        addBtn.textContent = "In Your Circle";
        addBtn.disabled = true;
        addBtn.setAttribute("aria-disabled", "true");
      }
    });

    actions.appendChild(viewBtn);
    actions.appendChild(addBtn);

    const tip = document.createElement("div");
    tip.className = "m-card-tip";
    tip.textContent = "Tip: Click the card to update the snapshot →";

    footer.appendChild(actions);
    footer.appendChild(tip);

    // Assemble card
    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(metaGrid);
    card.appendChild(footer);

    // Card click to select
    function handleSelect() {
      state.selectedId = stableIdForMatch(match);
      updateSelectedCardHighlight();
      renderSnapshot(match);
    }

    card.addEventListener("click", handleSelect);
    card.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleSelect();
      }
    });

    return card;
  }

  function updateSelectedCardHighlight() {
    if (!ui.list) return;
    const cards = Array.from(ui.list.querySelectorAll(".m-card"));
    cards.forEach((card) => {
      const id = card.getAttribute("data-id") || "";
      card.classList.toggle("is-selected", !!state.selectedId && state.selectedId === id);
    });
  }

  function filteredAndSortedMatches() {
    const allMatches = getDemoMatches();

    let filtered = allMatches;
    const mode = (state.connectionMode || "all").toLowerCase();
    if (mode === "romantic" || mode === "friendship") {
      filtered = allMatches.filter((m) => {
        const type = normaliseText(m.connectionType).toLowerCase();
        return type === mode;
      });
    }

    const sortMode = state.sortMode || "best";
    const arr = filtered.slice();

    if (sortMode === "name") {
      arr.sort((a, b) => {
        const an = normaliseText(a.name).toLowerCase();
        const bn = normaliseText(b.name).toLowerCase();
        if (an < bn) return -1;
        if (an > bn) return 1;
        return 0;
      });
    } else if (sortMode === "spice") {
      arr.sort((a, b) => {
        const as = Number.isFinite(a.score) ? a.score : 0;
        const bs = Number.isFinite(b.score) ? b.score : 0;
        const aSpice = Math.abs(60 - as);
        const bSpice = Math.abs(60 - bs);
        return aSpice - bSpice;
      });
    } else {
      arr.sort((a, b) => {
        const as = Number.isFinite(a.score) ? a.score : 0;
        const bs = Number.isFinite(b.score) ? b.score : 0;
        return bs - as;
      });
    }

    return arr;
  }

  function renderMatchList() {
    if (!ui.list) return;

    const matches = filteredAndSortedMatches();
    const friendsList = state.friends || [];

    ui.list.innerHTML = "";

    if (!matches.length) {
      const note = document.createElement("p");
      note.textContent = "No matches fit this filter yet. Try switching to another type or sort.";
      ui.list.appendChild(note);
      return;
    }

    matches.forEach((m) => {
      const isSelected = !!state.selectedId && stableIdForMatch(m) === state.selectedId;
      const card = renderMatchCard(m, isSelected, friendsList);
      ui.list.appendChild(card);
    });

    updateSelectedCardHighlight();
  }

  // ===================== Filters / sort handlers =====================

  function updateModeLabel() {
    if (!ui.modeLabel) return;
    const mode = (state.connectionMode || "all").toLowerCase();
    if (mode === "romantic") {
      ui.modeLabel.textContent = "Romantic focus";
    } else if (mode === "friendship") {
      ui.modeLabel.textContent = "Friendship focus";
    } else {
      ui.modeLabel.textContent = "All connections";
    }
  }

  function handleToggleClick(event) {
    const btn = event.currentTarget;
    const mode = (btn.getAttribute("data-connection-mode") || "all").toLowerCase();
    state.connectionMode = mode;

    ui.toggles.forEach((el) => {
      const value = (el.getAttribute("data-connection-mode") || "").toLowerCase();
      el.classList.toggle("is-active", value === mode);
    });

    updateModeLabel();
    renderMatchList();
  }

  function handleSortChange(event) {
    const value = (event.target.value || "best").toLowerCase();
    if (value === "name" || value === "spice" || value === "best") {
      state.sortMode = value;
    } else {
      state.sortMode = "best";
    }
    renderMatchList();
  }

  function wireSnapshotPicker() {
    if (!ui.snapshotPicker) return;
    const chips = Array.from(ui.snapshotPicker.querySelectorAll(".m-snapshot-chip"));
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const focus = chip.getAttribute("data-focus") || "overview";
        setSnapshotFocus(focus);
        const matches = filteredAndSortedMatches();
        const current = matches.find((m) => stableIdForMatch(m) === state.selectedId);
        if (current) {
          renderSnapshot(current);
        }
      });
    });
  }

  // ===================== Animations =====================

  function animatePageOnce() {
    if (!ui.page) return;
    if (prefersReducedMotion()) return;
    window.requestAnimationFrame(function () {
      ui.page.classList.add("m-animate");
    });
  }

  // ===================== Init =====================

  function init() {
    try {
      state.friends = safeReadFriends();

      if (ui.toggles && ui.toggles.length) {
        ui.toggles.forEach((btn) => {
          btn.addEventListener("click", handleToggleClick);
        });
      }

      if (ui.sortSelect) {
        ui.sortSelect.addEventListener("change", handleSortChange);
      }

      wireSnapshotPicker();
      updateModeLabel();
      renderMatchList();
      renderSnapshot(null);
      animatePageOnce();
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
