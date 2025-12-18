(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const $ = (sel, root = document) => root.querySelector(sel);

  // ===================== Helpers =====================

  function normaliseText(v) {
    return v == null ? "" : String(v).trim();
  }

  function toArray(v) {
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
  }

  function safeParseJSON(raw) {
    if (!raw || typeof raw !== "string") return null;
    try {
      return JSON.parse(raw);
    } catch (_err) {
      return null;
    }
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

  function cleanList(listLike) {
    const out = [];
    const seen = new Set();
    toArray(listLike).forEach((item) => {
      const t = normaliseText(item);
      if (!t) return;
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

  // ===================== Soul data helpers =====================

  function safeGetSoulData() {
    let data = {};
    try {
      if (typeof getSoulData === "function") {
        try {
          data = getSoulData({ ensureShape: true }) || {};
        } catch (_e) {
          data = getSoulData() || {};
        }
      } else if (typeof localStorage !== "undefined") {
        const primary = localStorage.getItem("soulink.soulQuiz");
        const legacy = localStorage.getItem("soulQuiz");
        const raw = primary || legacy;
        data = raw ? JSON.parse(raw) : {};
      }
    } catch (err) {
      console.warn("Friends: failed to read soul data", err);
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
    if (toArray(soul.loveLanguages || []).length) return true;
    if (cleanList(soul.values || soul.coreValues || []).length) return true;
    if (cleanList(soul.hobbies || soul.passions || soul.interests || []).length)
      return true;
    if (
      normaliseText(soul.westernZodiac || soul.zodiac) ||
      normaliseText(soul.chineseZodiac)
    )
      return true;
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

  function normaliseZodiac(name) {
    const s = normaliseText(name).toLowerCase();
    if (!s) return "";
    return s;
  }

  // ===================== Data source: friends =====================

  const FRIENDS_KEY = "soulink.friends.list";

  const LEGACY_FRIENDS_KEYS = [
    "soulink.friends",
    "soulFriends",
    "friends",
  ];

  // (Kept for possible future demo usage; not used for real data)
  const DEMO_FRIENDS = [
    {
      id: "match-sage",
      name: "Sage",
      connectionType: "Friendship",
      vibeTag: "Quiet thinker",
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
      id: "match-river",
      name: "River",
      connectionType: "Friendship",
      vibeTag: "Warm energy",
      loveLanguage: "Quality Time",
      loveLanguages: ["Quality Time", "Physical Touch"],
      values: ["Growth", "Spirituality", "Authenticity"],
      hobbies: ["Meditation", "Hiking", "Art"],
      westernZodiac: "Pisces",
      chineseZodiac: "Goat",
      lifePathNumber: 11,
      birthday: "1992-03-15",
    },
  ];

  function normaliseFriendsShape(parsed) {
    if (!parsed) return [];
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && typeof item === "object");
    }
    if (parsed && typeof parsed === "object") {
      const probeKeys = ["list", "friends", "items", "data"];
      for (const k of probeKeys) {
        if (Array.isArray(parsed[k])) {
          return parsed[k].filter((item) => item && typeof item === "object");
        }
      }

      const vals = Object.values(parsed);
      if (vals && vals.length) {
        const arr = vals.filter((v) => v && typeof v === "object");
        if (arr.length) return arr;
      }
    }
    return [];
  }

  function safeGetFriendsList() {
    if (typeof localStorage === "undefined") return [];

    try {
      const primaryRaw = localStorage.getItem(FRIENDS_KEY);
      const primaryParsed = safeParseJSON(primaryRaw);
      const primaryList =
        primaryParsed != null ? normaliseFriendsShape(primaryParsed) : [];

      if (primaryList.length) return primaryList;

      const primaryIsEmpty =
        !primaryRaw || primaryParsed == null || primaryList.length === 0;

      for (const legacyKey of LEGACY_FRIENDS_KEYS) {
        const legacyRaw = localStorage.getItem(legacyKey);
        if (!legacyRaw) continue;

        const legacyParsed = safeParseJSON(legacyRaw);
        if (legacyParsed == null) continue;

        if (primaryIsEmpty) {
          try {
            localStorage.setItem(FRIENDS_KEY, legacyRaw);
          } catch (_err) {}
        }

        return normaliseFriendsShape(legacyParsed);
      }

      return [];
    } catch (err) {
      console.warn("Friends: failed to read friends list", err);
      return [];
    }
  }

  // ===================== Compatibility scoring (same model as Match) =====================

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
      label =
        "Related but distinct life paths — potential for complementary growth.";
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

  function overallVibeLabel(score, existingVibeRaw) {
    const existing = normaliseText(existingVibeRaw);
    if (existing) return existing;
    if (score >= 80) return "Bright connection";
    if (score >= 60) return "Warm energy";
    if (score >= 40) return "Curious potential";
    return "Gentle learning connection";
  }

  // ===================== DOM cache & state =====================

  const ui = {
    page: $(".friends-page"),
    grid: $("#friendsGrid"),
    empty: $("#friendsEmpty"),
    sortSelect: $("#friendsSortSelect"),
    countLabel: $("#friendsCountLabel"),
  };

  let baseSoul = {};
  let friendsRaw = [];
  let friendsWithMeta = [];
  let currentFilter = "all";
  let currentSort = "score";
  let filterButtons = [];

  // ===================== UI helpers =====================

  function updateCircleSize(count) {
    if (!ui.countLabel) return;
    const n = Number.isFinite(count) ? count : 0;
    const word = n === 1 ? "soul friend" : "soul friends";
    ui.countLabel.textContent = "You have " + n + " " + word + ".";
  }

  function setEmptySubtitle(text) {
    if (!ui.empty) return;
    const p = ui.empty.querySelector(".friends-empty-subtitle");
    if (!p) return;
    p.textContent = normaliseText(text) || "";
  }

  function updateFilterUI() {
    if (!filterButtons || !filterButtons.length) return;
    filterButtons.forEach((btn) => {
      const mode = (btn.getAttribute("data-filter") || "all").toLowerCase();
      const active = mode === currentFilter;
      btn.classList.toggle("friends-filter-tab-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function rebuildFriendsWithMeta() {
    const hasSoul = hasAnyCoreData(baseSoul);
    friendsWithMeta = friendsRaw.map((f, index) => {
      const clone = Object.assign({}, f);
      clone._index = index;
      const breakdown = hasSoul ? computeCompatibility(baseSoul, clone) : null;
      clone._score = breakdown ? breakdown.score : 0;
      return clone;
    });
    updateCircleSize(friendsWithMeta.length);
  }

  // ===================== Rendering =====================

  function friendIdForLink(friend) {
    const idRaw = normaliseText(friend.id);
    if (idRaw) return encodeURIComponent(idRaw);
    const name = normaliseText(friend.name);
    if (name) return encodeURIComponent(name);
    return "";
  }

  function createAvatar(friend) {
    const wrap = document.createElement("div");
    wrap.className = "friends-avatar-wrap";

    const avatar = document.createElement("div");
    avatar.className = "friends-avatar";

    const photo = normaliseText(friend.profilePhoto || friend.avatarUrl || "");
    if (photo) {
      const img = document.createElement("img");
      img.className = "friends-avatar-img";
      img.src = photo;
      img.alt = normaliseText(friend.name) || "Friend avatar";
      avatar.appendChild(img);
    } else {
      const initialSpan = document.createElement("span");
      initialSpan.className = "friends-avatar-initial";
      const name = normaliseText(friend.name);
      const initial = name ? name.charAt(0).toUpperCase() : "★";
      initialSpan.textContent = initial;
      avatar.appendChild(initialSpan);
    }

    wrap.appendChild(avatar);
    return wrap;
  }

  function handleRemoveFriend(friend) {
    if (typeof localStorage === "undefined") return;

    const confirmed = window.confirm(
      "Are you sure you want to remove this connection from your circle?"
    );
    if (!confirmed) return;

    try {
      const current = safeGetFriendsList();
      if (!current.length) return;

      const id = normaliseText(friend.id);
      const name = normaliseText(friend.name);
      const connType = normaliseText(friend.connectionType);

      let removed = false;
      const next = current.filter((item) => {
        if (removed) return true;
        const sameId =
          id && normaliseText(item.id) && normaliseText(item.id) === id;
        const sameNameType =
          !id &&
          normaliseText(item.name) === name &&
          normaliseText(item.connectionType) === connType;
        if (sameId || sameNameType) {
          removed = true;
          return false;
        }
        return true;
      });

      localStorage.setItem(FRIENDS_KEY, JSON.stringify(next));

      friendsRaw = next;
      rebuildFriendsWithMeta();
      sortFriends(currentSort);
    } catch (err) {
      console.error("Friends: failed to remove friend", err);
    }
  }

  function createFriendCard(friend) {
    const card = document.createElement("article");
    card.className = "friends-card friends-card-animated";

    const inner = document.createElement("div");
    inner.className = "friends-card-inner";

    const top = document.createElement("div");
    top.className = "friends-card-top";

    const main = document.createElement("div");
    main.className = "friends-card-main";

    // Avatar
    const avatar = createAvatar(friend);
    main.appendChild(avatar);

    // Name + meta
    const nameLine = document.createElement("div");
    nameLine.className = "friends-name-line";

    const nameRow = document.createElement("div");
    nameRow.className = "friends-name-row";

    const nameEl = document.createElement("h3");
    nameEl.className = "friends-name";
    nameEl.textContent = normaliseText(friend.name) || "Soul friend";
    nameRow.appendChild(nameEl);

    const pronounsRaw =
      normaliseText(friend.pronouns) || normaliseText(friend.pronoun);
    if (pronounsRaw) {
      const pr = document.createElement("span");
      pr.className = "friends-pronouns";
      pr.textContent = pronounsRaw;
      nameRow.appendChild(pr);
    }

    nameLine.appendChild(nameRow);

    const metaRow = document.createElement("div");
    metaRow.className = "friends-meta-row";

    const connectionType = normaliseText(friend.connectionType) || "Friendship";
    const connPill = document.createElement("span");
    connPill.className = "friends-meta-pill";
    connPill.textContent = connectionType;
    metaRow.appendChild(connPill);

    const score = Number.isFinite(friend._score) ? friend._score : 0;
    const vibeTag = overallVibeLabel(score, friend.vibeTag || friend.vibe);

    const vibePill = document.createElement("span");
    vibePill.className = "friends-meta-pill friends-vibe-pill";
    vibePill.textContent = vibeTag;
    metaRow.appendChild(vibePill);

    nameLine.appendChild(metaRow);
    main.appendChild(nameLine);

    // Score pill
    const scorePill = document.createElement("div");
    scorePill.className = "friends-score-pill";
    const labelSpan = document.createElement("span");
    labelSpan.className = "friends-score-label";
    labelSpan.textContent = "Score";
    const valueSpan = document.createElement("span");
    valueSpan.className = "friends-score-value";
    valueSpan.textContent = Number.isFinite(score) ? score + "%" : "--%";
    scorePill.appendChild(labelSpan);
    scorePill.appendChild(valueSpan);

    top.appendChild(main);
    top.appendChild(scorePill);

    // Description
    const desc = document.createElement("p");
    desc.className = "friends-description";

    const baseName = normaliseText(baseSoul.name) || "You";
    const friendName = normaliseText(friend.name) || "this person";

    if (score >= 80) {
      desc.textContent =
        baseName +
        " and " +
        friendName +
        " feel like a high-harmony connection. Keep the communication kind, honest and grounded, and this can stay a very nourishing friendship.";
    } else if (score >= 60) {
      desc.textContent =
        "There’s solid potential here — with " +
        friendName +
        " the bond can grow deeper through small, consistent gestures rather than big dramas.";
    } else if (score >= 40) {
      desc.textContent =
        "This seems like an exploration match. Let the connection unfold slowly, notice how your body feels around them, and move at a pace that feels safe.";
    } else {
      desc.textContent =
        "This friendship may be more about learning than perfect harmony. Treat it as a place to practice boundaries, honesty and soft curiosity.";
    }

    // Actions
    const actions = document.createElement("div");
    actions.className = "friends-card-actions";

    const idForLink = friendIdForLink(friend);
    const viewBtn = document.createElement("a");
    viewBtn.className = "btn outline";
    viewBtn.textContent = "View Match Profile";
    viewBtn.href = idForLink
      ? "match-profile.html?id=" + idForLink
      : "match.html";
    viewBtn.setAttribute(
      "aria-label",
      "View detailed match profile for " + (friendName || "this connection")
    );

    const msgBtn = document.createElement("button");
    msgBtn.className = "btn friends-btn-disabled";
    msgBtn.type = "button";
    msgBtn.disabled = true;
    msgBtn.setAttribute("aria-disabled", "true");
    msgBtn.textContent = "Message (coming soon)";

    const removeBtn = document.createElement("button");
    removeBtn.className = "friends-remove-btn";
    removeBtn.type = "button";
    removeBtn.textContent = "Remove";
    removeBtn.setAttribute(
      "aria-label",
      "Remove this connection from your circle"
    );
    removeBtn.addEventListener("click", function () {
      handleRemoveFriend(friend);
    });

    actions.appendChild(viewBtn);
    actions.appendChild(msgBtn);
    actions.appendChild(removeBtn);

    inner.appendChild(top);
    inner.appendChild(desc);
    inner.appendChild(actions);

    card.appendChild(inner);
    return card;
  }

  function renderFriends(list) {
    if (!ui.grid) return;
    ui.grid.innerHTML = "";

    const allSorted = Array.isArray(list) ? list : [];

    const filtered = allSorted.filter((friend) => {
      if (currentFilter === "all") return true;
      const type = normaliseText(friend.connectionType || "Friendship").toLowerCase();
      if (currentFilter === "friendship") return type === "friendship";
      if (currentFilter === "romantic") return type === "romantic";
      return true;
    });

    if (!filtered.length) {
      if (ui.empty) {
        ui.empty.hidden = friendsWithMeta.length !== 0 ? true : false;
        if (friendsWithMeta.length === 0 && ui.empty.hidden === false) {
          setEmptySubtitle("No friends saved on this device yet.");
        }
      }
      return;
    }

    if (ui.empty) {
      ui.empty.hidden = true;
    }

    filtered.forEach((friend) => {
      const card = createFriendCard(friend);
      ui.grid.appendChild(card);
    });

    if (ui.page && !prefersReducedMotion()) {
      window.requestAnimationFrame(function () {
        ui.page.classList.add("friends-animate");
      });
    }
  }

  // ===================== Sorting =====================

  function sortFriends(mode) {
    const modeClean = (normaliseText(mode) || "score").toLowerCase();
    currentSort = modeClean;

    const arr = friendsWithMeta.slice();

    if (modeClean === "name") {
      arr.sort((a, b) => {
        const an = normaliseText(a.name).toLowerCase();
        const bn = normaliseText(b.name).toLowerCase();
        if (!an && !bn) return 0;
        if (!an) return 1;
        if (!bn) return -1;
        return an.localeCompare(bn);
      });
    } else if (modeClean === "newest") {
      arr.sort((a, b) => {
        const ai = Number.isFinite(a._index) ? a._index : -Infinity;
        const bi = Number.isFinite(b._index) ? b._index : -Infinity;
        return bi - ai; // newest first
      });
    } else {
      // score (default)
      arr.sort((a, b) => {
        const as = Number.isFinite(a._score) ? a._score : 0;
        const bs = Number.isFinite(b._score) ? b._score : 0;
        if (bs === as) {
          const ai = Number.isFinite(a._index) ? a._index : -Infinity;
          const bi = Number.isFinite(b._index) ? b._index : -Infinity;
          return bi - ai;
        }
        return bs - as;
      });
    }

    renderFriends(arr);
  }

  function setFilter(mode) {
    const m = (normaliseText(mode) || "all").toLowerCase();
    currentFilter = m;
    updateFilterUI();
    sortFriends(currentSort);
  }

  // ===================== Init =====================

  function init() {
    try {
      baseSoul = safeGetSoulData();
      friendsRaw = safeGetFriendsList();
      rebuildFriendsWithMeta();

      filterButtons = Array.from(
        document.querySelectorAll(".friends-filter-tab")
      );
      updateFilterUI();

      const initialSort =
        (ui.sortSelect && ui.sortSelect.value) || currentSort || "score";
      currentSort = initialSort;
      sortFriends(initialSort);

      if (ui.sortSelect) {
        ui.sortSelect.addEventListener("change", function (e) {
          sortFriends(e.target.value);
        });
      }

      if (filterButtons && filterButtons.length) {
        filterButtons.forEach((btn) => {
          btn.addEventListener("click", function () {
            const mode = btn.getAttribute("data-filter") || "all";
            setFilter(mode);
          });
        });
      }

      // If there are no friends at all, ensure empty state is shown.
      if (!friendsWithMeta.length && ui.empty) {
        setEmptySubtitle("No friends saved on this device yet.");
        ui.empty.hidden = false;
      }
    } catch (err) {
      console.error("Friends: init failed", err);
      if (ui.empty) {
        ui.empty.hidden = false;
        ui.empty.textContent =
          "We couldn’t load your soul friends right now. Please refresh the page or try again later.";
      }
      updateCircleSize(0);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
