(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const $ = (sel, root = document) => root.querySelector(sel);

  // ===================== Helpers =====================

  function normaliseText(v) {
    return v == null ? "" : String(v).trim();
  }

  function cleanDisplayText(v) {
    return normaliseText(v)
      .replace(/\bAffirmtion\b/gi, "Affirmation")
      .replace(/\bspituality\b/gi, "spirituality");
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

  function writeLocalSoulData(data) {
    if (!data || typeof data !== "object") return;
    try {
      if (typeof window.saveSoulData === "function") {
        window.saveSoulData(data);
        return;
      }
    } catch (_e) {}
    try {
      const json = JSON.stringify(data);
      localStorage.setItem("soulink.soulQuiz", json);
      localStorage.setItem("soulQuiz", json);
    } catch (_e) {}
  }

  function userFriendsKey(uid) {
    const cleanUid = normaliseText(uid);
    return cleanUid ? FRIENDS_KEY + "." + cleanUid : FRIENDS_KEY;
  }

  function writeLocalFriends(list, uid) {
    if (typeof localStorage === "undefined") return;
    try {
      const clean = Array.isArray(list) ? list.filter((x) => x && typeof x === "object") : [];
      const json = JSON.stringify(clean);
      localStorage.setItem(userFriendsKey(uid), json);
      localStorage.setItem(FRIENDS_KEY, json);
    } catch (_e) {}
  }

  async function getFirebaseContext() {
    try {
      const cfg = await import("./firebase-config.js");
      const authMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      const fsMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      return { auth: cfg.auth, db: cfg.db, onAuthStateChanged: authMod.onAuthStateChanged, doc: fsMod.doc, getDoc: fsMod.getDoc, setDoc: fsMod.setDoc, serverTimestamp: fsMod.serverTimestamp };
    } catch (err) {
      console.warn("[Soulink][Friends] Firebase unavailable, using local fallback", err);
      return null;
    }
  }

  async function waitForAuthUser(ctx, timeoutMs = 5000) {
    if (!ctx || !ctx.auth || !ctx.onAuthStateChanged) return null;
    if (ctx.auth.currentUser) return ctx.auth.currentUser;
    return new Promise((resolve) => {
      let settled = false;
      let unsubscribe = function () {};
      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        try { unsubscribe(); } catch (_e) {}
        resolve(ctx.auth.currentUser || null);
      }, timeoutMs);
      unsubscribe = ctx.onAuthStateChanged(ctx.auth, (user) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        try { unsubscribe(); } catch (_e) {}
        resolve(user || null);
      });
    });
  }

  function getFirestoreFriends(profile) {
    if (!profile || typeof profile !== "object") return [];
    const candidates = [profile.soulFriends, profile.friendCircle, profile.friendsList, profile.friends];
    for (const value of candidates) {
      const list = normaliseFriendsShape(value);
      if (list.length) return list;
    }
    return [];
  }

  async function loadProfileAndFriends() {
    const fallbackProfile = safeGetSoulData();
    const ctx = await getFirebaseContext();
    const user = await waitForAuthUser(ctx);
    if (!ctx || !user) return { user: null, profile: fallbackProfile, friends: safeGetFriendsList(null) };
    try {
      const ref = ctx.doc(ctx.db, "users", user.uid);
      const snap = await ctx.getDoc(ref);
      if (!snap.exists()) {
        writeLocalFriends([], user.uid);
        return { user, profile: {}, friends: [] };
      }
      const profile = snap.data() || {};
      writeLocalSoulData(profile);
      const firestoreFriends = getFirestoreFriends(profile);
      writeLocalFriends(firestoreFriends, user.uid);
      return { user, profile, friends: firestoreFriends };
    } catch (err) {
      console.warn("[Soulink][Friends] Firestore read failed, using local fallback", err);
      return { user, profile: fallbackProfile, friends: safeGetFriendsList(user && user.uid) };
    }
  }

  async function saveFriendsForCurrentUser(list) {
    const ctx = await getFirebaseContext();
    const user = await waitForAuthUser(ctx);
    writeLocalFriends(list, user && user.uid);
    if (!ctx || !user) return true;
    try {
      const clean = Array.isArray(list) ? list.filter((item) => item && typeof item === "object") : [];
      await ctx.setDoc(ctx.doc(ctx.db, "users", user.uid), { soulFriends: clean, friendCircle: clean, updatedAt: ctx.serverTimestamp() }, { merge: true });
      return true;
    } catch (err) {
      console.error("[Soulink][Friends] Could not save friends to Firestore", err);
      return false;
    }
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

  const LEGACY_FRIENDS_KEYS = ["soulink.friends", "soulFriends", "friends"];

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

  function safeGetFriendsList(uid) {
    if (typeof localStorage === "undefined") return [];
    try {
      const keys = [];
      const scoped = userFriendsKey(uid);
      if (scoped !== FRIENDS_KEY) keys.push(scoped);
      keys.push(FRIENDS_KEY, ...LEGACY_FRIENDS_KEYS);
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = safeParseJSON(raw);
        if (parsed == null) continue;
        const list = normaliseFriendsShape(parsed);
        if (list.length) return list;
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

  function computeHobbyOverlap(baseHobbies, matchHobbies) {
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

  function loveLanguageScore(baseSoul, candidate) {
    const a = canonicalLoveKey(getPrimaryLoveLanguage(baseSoul));
    const b = canonicalLoveKey(getPrimaryLoveLanguage(candidate));
    if (!a || !b) return { score: 0, match: false };
    if (a === b) return { score: WEIGHTS.love, match: true };
    return { score: Math.round(WEIGHTS.love * 0.25), match: false };
  }

  function zodiacCompatibility(baseZodiacRaw, otherZodiacRaw) {
    const a = normaliseZodiac(baseZodiacRaw);
    const b = normaliseZodiac(otherZodiacRaw);
    if (!a || !b) return { score: 0, label: "" };
    if (a === b) return { score: WEIGHTS.zodiac, label: "Same sign" };
    const ea = ZODIAC_ELEMENTS[a];
    const eb = ZODIAC_ELEMENTS[b];
    if (!ea || !eb) return { score: 0, label: "" };
    if (ea === eb) return { score: Math.round(WEIGHTS.zodiac * 0.7), label: "Same element" };
    const goodPairs = new Set(["fire-air", "air-fire", "earth-water", "water-earth"]);
    if (goodPairs.has(ea + "-" + eb)) {
      return { score: Math.round(WEIGHTS.zodiac * 0.55), label: "Complementary element" };
    }
    return { score: Math.round(WEIGHTS.zodiac * 0.25), label: "Different element" };
  }

  function chineseZodiacCompatibility(aRaw, bRaw) {
    const a = normaliseText(aRaw).toLowerCase();
    const b = normaliseText(bRaw).toLowerCase();
    if (!a || !b) return { score: 0, label: "" };
    if (a === b) return { score: WEIGHTS.chinese, label: "Same sign" };
    return { score: Math.round(WEIGHTS.chinese * 0.45), label: "Different sign" };
  }

  function numerologyCompatibility(aNum, bNum) {
    const a = numericLifePath(aNum);
    const b = numericLifePath(bNum);
    if (a == null || b == null) return { score: 0, label: "" };
    if (a === b) return { score: WEIGHTS.numerology, label: "Same life path" };
    const diff = Math.abs(a - b);
    if (diff <= 2) return { score: Math.round(WEIGHTS.numerology * 0.7), label: "Close numbers" };
    return { score: Math.round(WEIGHTS.numerology * 0.35), label: "Different numbers" };
  }

  function computeCompatibility(baseSoul, candidate) {
    const loveRes = loveLanguageScore(baseSoul, candidate);
    const valuesRes = computeValueOverlap(
      baseSoul.values || baseSoul.coreValues || [],
      candidate.values || candidate.coreValues || []
    );
    const hobbyRes = computeHobbyOverlap(
      baseSoul.hobbies || baseSoul.passions || baseSoul.interests || [],
      candidate.hobbies || candidate.passions || candidate.interests || []
    );

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

  async function handleRemoveFriend(friend) {
    const confirmed = window.confirm("Are you sure you want to remove this connection from your circle?");
    if (!confirmed) return;
    try {
      const current = Array.isArray(friendsRaw) ? friendsRaw.slice() : safeGetFriendsList();
      if (!current.length) return;
      const id = normaliseText(friend.id);
      const name = normaliseText(friend.name);
      const connType = normaliseText(friend.connectionType);
      let removed = false;
      const next = current.filter((item) => {
        if (removed) return true;
        const sameId = id && normaliseText(item.id) && normaliseText(item.id) === id;
        const sameNameType = !id && normaliseText(item.name) === name && normaliseText(item.connectionType) === connType;
        if (sameId || sameNameType) {
          removed = true;
          return false;
        }
        return true;
      });
      friendsRaw = next;
      writeLocalFriends(next, null);
      await saveFriendsForCurrentUser(next);
      rebuildFriendsWithMeta();
      sortFriends(currentSort);
    } catch (err) {
      console.error("Friends: failed to remove friend", err);
    }
  }

  function buildConnectionDescription(friend) {
    const existing =
      cleanDisplayText(friend.snapshot) ||
      cleanDisplayText(friend.summary) ||
      cleanDisplayText(friend.description);
    if (existing) return existing;

    const score = Number.isFinite(friend._score) ? friend._score : 0;
    const name = cleanDisplayText(friend.name) || "This connection";
    const love = cleanDisplayText(getPrimaryLoveLanguage(friend));
    const sharedValues = overlapList(
      baseSoul.values || baseSoul.coreValues || [],
      friend.values || friend.coreValues || []
    ).slice(0, 3).map(cleanDisplayText);
    const sharedJoys = overlapList(
      baseSoul.hobbies || baseSoul.passions || baseSoul.interests || [],
      friend.hobbies || friend.passions || friend.interests || []
    ).slice(0, 3).map(cleanDisplayText);

    const bits = [];
    if (love) bits.push("a " + love + " heart signal");
    if (sharedValues.length) bits.push("shared values around " + sharedValues.join(", "));
    if (sharedJoys.length) bits.push("shared joys like " + sharedJoys.join(", "));

    if (score >= 70 && bits.length) {
      return name + " feels like a warm circle connection — " + bits.join(" and ") + ". Let this stay gentle, mutual and respectful.";
    }

    if (bits.length) {
      return name + " may be a meaningful connection to explore through " + bits.join(" and ") + ". Stay curious and let trust grow slowly.";
    }

    return name + " is saved in your circle as a gentle connection to revisit. Let real communication, consent and boundaries matter more than any score.";
  }

  function connectionMatchesFilter(friend, filter) {
    const type = normaliseText(friend.connectionType || "Friendship").toLowerCase();
    if (filter === "all") return true;
    if (filter === "friendship") {
      return type.includes("friend") || type.includes("both");
    }
    if (filter === "romantic") {
      return type.includes("romantic") || type.includes("love") || type.includes("both");
    }
    return true;
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

    const avatar = createAvatar(friend);
    main.appendChild(avatar);

    const nameLine = document.createElement("div");
    nameLine.className = "friends-name-line";

    const nameRow = document.createElement("div");
    nameRow.className = "friends-name-row";

    const nameEl = document.createElement("h3");
    nameEl.className = "friends-name";
    nameEl.textContent = cleanDisplayText(friend.name) || "Soul friend";
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
    connPill.textContent = cleanDisplayText(connectionType);
    metaRow.appendChild(connPill);

    const score = Number.isFinite(friend._score) ? friend._score : 0;
    const vibeTag = overallVibeLabel(score, friend.vibeTag || friend.vibe);

    const vibePill = document.createElement("span");
    vibePill.className = "friends-meta-pill friends-vibe-pill";
    vibePill.textContent = cleanDisplayText(vibeTag);
    metaRow.appendChild(vibePill);

    nameLine.appendChild(metaRow);
    main.appendChild(nameLine);

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

    const desc = document.createElement("p");
    desc.className = "friends-description";
    desc.textContent = buildConnectionDescription(friend);

    const actions = document.createElement("div");
    actions.className = "friends-card-actions";

    const viewBtn = document.createElement("a");
    viewBtn.className = "btn";
    const idForLink = friendIdForLink(friend);
    viewBtn.href = idForLink ? "match-profile.html#id=" + idForLink : "match-profile.html";
    viewBtn.textContent = "View Match Profile";


    const removeBtn = document.createElement("button");
    removeBtn.className = "friends-remove-btn";
    removeBtn.type = "button";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", function () {
      handleRemoveFriend(friend);
    });

    actions.appendChild(viewBtn);
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

    const filtered = allSorted.filter((friend) => connectionMatchesFilter(friend, currentFilter));

    if (!filtered.length) {
      if (ui.empty) {
        ui.empty.hidden = false;

        if (friendsWithMeta.length === 0) {
          setEmptySubtitle("No friends saved in your Soulink circle yet.");
        } else if (currentFilter === "romantic") {
          setEmptySubtitle("No romantic connections saved in your circle yet.");
        } else if (currentFilter === "friendship") {
          setEmptySubtitle("No friendship connections saved in your circle yet.");
        } else {
          setEmptySubtitle("No connections match this filter yet.");
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
        return bi - ai;
      });
    } else {
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

  async function init() {
    try {
      const loaded = await loadProfileAndFriends();
      baseSoul = loaded.profile || {};
      friendsRaw = loaded.friends || [];
      rebuildFriendsWithMeta();

      filterButtons = Array.from(document.querySelectorAll(".friends-filter-tab"));
      updateFilterUI();

      const initialSort = (ui.sortSelect && ui.sortSelect.value) || currentSort || "score";
      currentSort = initialSort;
      sortFriends(initialSort);

      if (ui.sortSelect) {
        ui.sortSelect.addEventListener("change", function (e) { sortFriends(e.target.value); });
      }
      if (filterButtons && filterButtons.length) {
        filterButtons.forEach((btn) => {
          btn.addEventListener("click", function () {
            const mode = btn.getAttribute("data-filter") || "all";
            setFilter(mode);
          });
        });
      }
      if (!friendsWithMeta.length && ui.empty) {
        setEmptySubtitle("No friends saved in your Soulink circle yet.");
        ui.empty.hidden = false;
      }
    } catch (err) {
      console.error("Friends: init failed", err);
      if (ui.empty) {
        ui.empty.hidden = false;
        ui.empty.textContent = "We couldn’t load your soul friends right now. Please refresh the page or try again later.";
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
