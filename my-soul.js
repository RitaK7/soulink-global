import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

(function () {
  "use strict";

  const PRIMARY_KEY = "soulink.soulQuiz";
  const LEGACY_KEY = "soulQuiz";

  const $ = (selector) => document.querySelector(selector);

  const ui = {
    content: $("#mySoulContent"),
    empty: $("#mySoulEmpty"),
    startQuiz: $("#mySoulStartQuiz"),

    avatar: $("#msAvatar"),
    photo1: $("#msPhoto1"),
    photo2: $("#msPhoto2"),
    photo3: $("#msPhoto3"),

    heroTitle: $("#msHeroTitle"),
    heroSubtitle: $("#msHeroSubtitle"),

    zodiacTag: $("#msZodiacTag"),
    chineseTag: $("#msChineseTag"),
    lifePathTag: $("#msLifePathTag"),
    connectionTag: $("#msConnectionTag"),

    snapshotName: $("#msSnapshotName"),
    snapshotAge: $("#msSnapshotAge"),
    snapshotCountry: $("#msSnapshotCountry"),
    snapshotConnection: $("#msSnapshotConnection"),
    snapshotLoveLanguage: $("#msSnapshotLoveLanguage"),
    snapshotValues: $("#msSnapshotValues"),
    snapshotHobbies: $("#msSnapshotHobbies"),

    soulSummary: $("#msSoulSummary"),
    energyText: $("#msEnergyText"),
    loveLanguages: $("#msLoveLanguages"),
    connectWith: $("#msConnectWith"),
    boundariesText: $("#msBoundariesText"),
    aboutText: $("#msAboutText"),
    mantraText: $("#msMantraText"),

    backQuizTop: $("#msBackToQuizTop"),
    backQuizBottom: $("#msBackToQuizBottom"),
    goToChart: $("#msGoToChart"),
  };

  const LOVE_DESCRIPTIONS = {
    "Words of Affirmation":
      "You feel loved through kind words, encouragement and sincere appreciation.",
    "Quality Time":
      "You value presence, deep conversations and shared moments without distraction.",
    "Acts of Service":
      "Support, thoughtful help and practical care speak love to you.",
    "Physical Touch":
      "Warm hugs, gentle touch and physical closeness nourish your heart.",
    "Receiving Gifts":
      "Meaningful, thoughtful gifts make you feel seen and remembered.",
  };

  const LOVE_LANGUAGE_LIST = Object.keys(LOVE_DESCRIPTIONS);

  function norm(value) {
    return value == null ? "" : String(value).trim();
  }

  function lower(value) {
    return norm(value).toLowerCase();
  }

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeList(value) {
    if (!value) return [];
    const raw = Array.isArray(value) ? value : String(value).split(/[\n,;]+/);
    const out = [];
    const seen = new Set();

    raw.forEach((item) => {
      const clean = norm(item);
      if (!clean) return;
      const key = clean.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(clean);
    });

    return out;
  }

  function mergeLists(...lists) {
    return normalizeList(lists.flatMap((list) => normalizeList(list)));
  }

  function firstText(...values) {
    for (const value of values) {
      if (Array.isArray(value)) {
        const list = normalizeList(value);
        if (list.length) return list[0];
      } else {
        const text = norm(value);
        if (text) return text;
      }
    }
    return "";
  }

  function normalizeLoveLanguage(value) {
    const s = lower(value).replace(/[\s_\-\/()]+/g, "");
    if (!s) return "";

    const map = {
      words: "Words of Affirmation",
      wordsofaffirmation: "Words of Affirmation",
      quality: "Quality Time",
      qualitytime: "Quality Time",
      service: "Acts of Service",
      actsofservice: "Acts of Service",
      touch: "Physical Touch",
      physicaltouch: "Physical Touch",
      gift: "Receiving Gifts",
      gifts: "Receiving Gifts",
      receivinggift: "Receiving Gifts",
      receivinggifts: "Receiving Gifts",
    };

    if (map[s]) return map[s];

    const exact = LOVE_LANGUAGE_LIST.find((label) => lower(label) === lower(value));
    return exact || norm(value);
  }

  function normalizeLoveLanguages(rawList, rawPrimary) {
    const primary = normalizeLoveLanguage(rawPrimary);
    let list = normalizeList(rawList).map(normalizeLoveLanguage).filter(Boolean);

    if (primary) {
      list = list.filter((item) => item !== primary);
      list.unshift(primary);
    }

    return normalizeList(list).filter((item) => LOVE_LANGUAGE_LIST.includes(item));
  }

  function normalizeConnectionType(value) {
    const s = lower(value);
    if (!s) return "";
    if (s === "romantic" || s === "romantic relationship") return "Romantic relationship";
    if (s === "friendship") return "Friendship";
    if (s === "both" || s.includes("romantic & friendship") || s.includes("romantic and friendship")) return "Both (romantic & friendship)";
    if (s === "open" || s === "networking" || s.includes("open to any")) return "Open to any connection";
    return norm(value);
  }

  function parseBirthdayToParts(rawValue) {
    const raw = norm(rawValue);
    if (!raw) return null;
    const now = new Date();
    const currentYear = now.getFullYear();

    function valid(y, m, d) {
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
      if (y < 1000 || y > currentYear + 1 || m < 1 || m > 12 || d < 1 || d > 31) return null;
      const date = new Date(y, m - 1, d);
      if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
      if (date.getTime() > new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) return null;
      return { year: y, month: m, day: d, date };
    }

    const digits = raw.replace(/\D/g, "");
    if (/^\d{8}$/.test(digits)) {
      return (
        valid(Number(digits.slice(0, 4)), Number(digits.slice(4, 6)), Number(digits.slice(6, 8))) ||
        valid(Number(digits.slice(4, 8)), Number(digits.slice(2, 4)), Number(digits.slice(0, 2)))
      );
    }

    let match = raw.match(/^(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})$/);
    if (match) return valid(Number(match[1]), Number(match[2]), Number(match[3]));

    match = raw.match(/^(\d{1,2})[-.\/](\d{1,2})[-.\/](\d{4})$/);
    if (match) return valid(Number(match[3]), Number(match[2]), Number(match[1]));

    return null;
  }

  function calculateAge(parts) {
    if (!parts) return null;
    const now = new Date();
    let age = now.getFullYear() - parts.year;
    const monthDiff = now.getMonth() + 1 - parts.month;
    const dayDiff = now.getDate() - parts.day;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
    return age >= 0 && age < 130 ? age : null;
  }

  function getWesternZodiac(parts) {
    if (!parts) return null;
    const md = parts.month * 100 + parts.day;
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
    return null;
  }

  function getChineseZodiac(year) {
    if (!year || !Number.isFinite(year)) return null;
    const animals = [
      "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake",
      "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig",
    ];
    const index = ((year - 1900) % 12 + 12) % 12;
    return animals[index];
  }

  function getLifePathNumber(rawBirthday) {
    if (!rawBirthday) return null;
    const digits = String(rawBirthday).replace(/\D/g, "");
    if (!digits) return null;

    const isMaster = (n) => n === 11 || n === 22 || n === 33;
    const sumDigits = (value) => String(value).split("").reduce((acc, ch) => acc + Number(ch || 0), 0);

    let n = sumDigits(digits);
    while (n > 9 && !isMaster(n)) n = sumDigits(n);
    return n;
  }

  function normalizeProfile(raw) {
    const source = isPlainObject(raw) ? raw : {};
    const birthday = firstText(source.birthday, source.birthdate, source.birthDate);
    const birthdayParts = parseBirthdayToParts(birthday);
    const lifePath = firstText(source.lifePath, source.lifePathNumber, source.lifePathNum) || (getLifePathNumber(birthday) || "");
    const zodiac = firstText(source.zodiac, source.zodiacSign, source.sunSign) || getWesternZodiac(birthdayParts) || "";
    const chineseZodiac = firstText(source.chineseZodiac, source.chineseSign) || (birthdayParts ? getChineseZodiac(birthdayParts.year) : "") || "";
    const primaryLove = firstText(source.loveLanguage, Array.isArray(source.loveLanguages) ? source.loveLanguages[0] : "");
    const loveLanguages = normalizeLoveLanguages(source.loveLanguages, primaryLove);
    const unacceptable = firstText(source.unacceptable, source.boundaries, source.unacceptableBehavior, source.notAllowed, source.noGo);
    const about = firstText(source.about, source.aboutMe, source.story);
    const connectWith = mergeLists(source.connectWith, source.seekingGender, source.whoYouWantToConnectWith, source.connectionPreferences);
    const hobbies = mergeLists(source.hobbies, source.interests, source.hobbiesExtra);

    const profile = {
      ...source,
      name: firstText(source.name),
      country: firstText(source.country),
      birthday,
      height: firstText(source.height),
      weight: firstText(source.weight, source.kg),
      kg: firstText(source.kg, source.weight),
      connectionType: normalizeConnectionType(source.connectionType),
      gender: firstText(source.gender, source.genderSelf),
      genderSelf: firstText(source.genderSelf),
      connectWith,
      seekingGender: mergeLists(source.seekingGender, source.connectWith),
      connectWithCustom: firstText(source.connectWithCustom),
      orientation: firstText(source.orientation, source.orientationText, source.orientationChoice),
      orientationText: firstText(source.orientationText),
      orientationChoice: firstText(source.orientationChoice, source.orientation),
      loveLanguage: loveLanguages[0] || normalizeLoveLanguage(primaryLove) || "",
      loveLanguages,
      hobbies,
      interests: hobbies,
      values: mergeLists(source.values, source.valuesExtra),
      unacceptable,
      boundaries: unacceptable,
      about,
      aboutMe: about,
      mantra: firstText(source.mantra, source.intention),
      spiritualBeliefs: firstText(source.spiritualBeliefs),
      soulSummary: firstText(source.soulSummary),
      profilePhoto1: firstText(source.profilePhoto1),
      profilePhoto2: firstText(source.profilePhoto2),
      profilePhoto3: firstText(source.profilePhoto3),
      mainPhotoSlot: source.mainPhotoSlot || source.primaryPhotoSlot || null,
      primaryPhotoSlot: source.mainPhotoSlot || source.primaryPhotoSlot || null,
      zodiac,
      chineseZodiac,
      lifePath,
      lifePathNumber: lifePath,
    };

    const age = calculateAge(birthdayParts);
    if (age != null) profile.age = age;

    return profile;
  }

  function saveLocalCache(profile, user) {
    try {
      const payload = normalizeProfile(profile);
      if (user && user.uid) payload.__soulinkUid = user.uid;
      if (user && user.email) payload.email = user.email;
      const json = JSON.stringify(payload);
      localStorage.setItem(PRIMARY_KEY, json);
      localStorage.setItem(LEGACY_KEY, json);
    } catch (err) {
      console.warn("[Soulink] Failed to update local profile cache", err);
    }
  }

  function readLocalCache(user) {
    try {
      const rawText = localStorage.getItem(PRIMARY_KEY) || localStorage.getItem(LEGACY_KEY);
      if (!rawText) return {};
      const parsed = JSON.parse(rawText);
      if (!isPlainObject(parsed)) return {};

      if (user && user.uid) {
        const cacheUid = parsed.__soulinkUid || parsed.uid || "";
        if (cacheUid && cacheUid !== user.uid) return {};
        if (!cacheUid) return {};
      }

      return normalizeProfile(parsed);
    } catch (err) {
      console.warn("[Soulink] Failed to read local profile cache", err);
      return {};
    }
  }

  function waitForAuthUser(timeoutMs = 5000) {
    return new Promise((resolve) => {
      if (auth.currentUser) {
        console.log("[Soulink] Auth user ready", auth.currentUser.uid);
        resolve(auth.currentUser);
        return;
      }

      let done = false;
      let unsubscribe = () => {};

      const finish = (user) => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        unsubscribe();
        if (user) console.log("[Soulink] Auth user ready", user.uid);
        resolve(user || null);
      };

      const timer = window.setTimeout(() => finish(auth.currentUser || null), timeoutMs);
      unsubscribe = onAuthStateChanged(auth, finish);
    });
  }

  async function loadSourceProfile() {
    const user = await waitForAuthUser();

    if (user) {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          const profile = normalizeProfile(snap.data());
          saveLocalCache(profile, user);
          console.log("[Soulink] Loaded profile from Firestore");
          return profile;
        }
      } catch (err) {
        console.error("[Soulink] Save failed", err);
        console.warn("[Soulink] Firestore load failed, checking same-user local fallback", err);
      }

      const local = readLocalCache(user);
      console.log("[Soulink] Using local fallback");
      return local;
    }

    const local = readLocalCache(null);
    console.log("[Soulink] Using local fallback");
    return local;
  }

  function hasMeaningfulData(data) {
    if (!data) return false;
    const profile = normalizeProfile(data);
    const keys = [
      "name",
      "birthday",
      "country",
      "connectionType",
      "loveLanguage",
      "loveLanguages",
      "values",
      "hobbies",
      "about",
      "aboutMe",
      "soulSummary",
      "profilePhoto1",
      "profilePhoto2",
      "profilePhoto3",
    ];

    return keys.some((key) => {
      const value = profile[key];
      if (Array.isArray(value)) return value.length > 0;
      return norm(value).length > 0;
    });
  }

  function formatListForSentence(items, max) {
    const values = normalizeList(items);
    if (!values.length) return "";
    const arr = values.slice(0, max || 3);
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
    return `${arr.slice(0, -1).join(", ")}, and ${arr[arr.length - 1]}`;
  }

  function buildSoulSummary(data) {
    if (data.soulSummary) return norm(data.soulSummary);

    const name = data.name || "Your soul";
    const connectionType = data.connectionType || "meaningful connections with aligned souls";
    const loves = normalizeList(data.loveLanguages || data.loveLanguage);
    const primaryLove = loves[0] || null;
    const topValues = formatListForSentence(data.values, 3);
    const topHobbies = formatListForSentence(data.hobbies, 3);
    const parts = [];

    parts.push(
      primaryLove
        ? `${name} is seeking ${connectionType.toLowerCase()}, with a heart that speaks mainly in ${primaryLove}.`
        : `${name} is seeking ${connectionType.toLowerCase()}, guided by quiet inner truth.`
    );

    if (topValues) parts.push(`Core values like ${topValues} keep this path aligned.`);
    if (topHobbies) parts.push(`Joy flows through ${topHobbies}, making everyday life feel more alive.`);

    parts.push("As you refine your profile, this summary will grow with you – a living reflection of your current chapter.");
    return parts.join(" ");
  }

  function buildEnergyText(data) {
    const birthdayParts = parseBirthdayToParts(data.birthday);
    const zodiac = data.zodiac || getWesternZodiac(birthdayParts);
    const chinese = data.chineseZodiac || (birthdayParts ? getChineseZodiac(birthdayParts.year) : null);
    const lifePath = data.lifePath || data.lifePathNumber || getLifePathNumber(data.birthday);

    const tokens = [];
    if (zodiac) tokens.push(zodiac);
    if (chinese) tokens.push(chinese);
    if (lifePath) tokens.push(`Life Path ${lifePath}`);

    if (!tokens.length) {
      return {
        text: "Add your birthday in the Quiz to unlock your zodiac, Chinese sign and life path number here.",
        zodiac,
        chinese,
        lifePath,
      };
    }

    const flavor = [];
    if (zodiac) flavor.push("a unique way of seeing the world");
    if (lifePath) flavor.push("a quiet inner compass");
    if (chinese) flavor.push("a particular flavor of courage and playfulness");

    return {
      text: `${tokens.join(" • ")} — together they describe your energy pattern: ${formatListForSentence(flavor, flavor.length)}.`,
      zodiac,
      chinese,
      lifePath,
    };
  }

  function renderChips(list, container, options) {
    if (!container) return;
    const opts = options || {};
    const max = typeof opts.max === "number" ? opts.max : 6;
    const placeholderLabel = opts.placeholder || "Not set yet";
    container.innerHTML = "";

    const values = normalizeList(list);
    if (!values.length) {
      const chip = document.createElement("span");
      chip.className = "ms-chip ghost";
      chip.textContent = placeholderLabel;
      container.appendChild(chip);
      return;
    }

    values.slice(0, max).forEach((item, index) => {
      const chip = document.createElement("span");
      chip.className = "ms-chip" + (opts.primary && index === 0 ? " primary" : "");
      chip.textContent = item;
      container.appendChild(chip);
    });

    if (values.length > max) {
      const moreChip = document.createElement("span");
      moreChip.className = "ms-chip ghost";
      moreChip.textContent = `+${values.length - max} more`;
      container.appendChild(moreChip);
    }
  }

  function renderLoveLanguageChips(loves, container) {
    if (!container) return;
    container.innerHTML = "";
    const list = normalizeList(loves).map(normalizeLoveLanguage).filter(Boolean);

    if (!list.length) {
      const chip = document.createElement("span");
      chip.className = "ms-chip ghost";
      chip.textContent = "Add love languages in Quiz or Edit Profile.";
      container.appendChild(chip);
      return;
    }

    list.forEach((label, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "ms-chip" + (index === 0 ? " primary" : "");

      const title = document.createElement("div");
      title.style.fontSize = "0.9rem";
      title.style.fontWeight = "600";
      title.textContent = index === 0 ? `${label} · primary` : label;

      const desc = document.createElement("div");
      desc.style.fontSize = "0.8rem";
      desc.style.opacity = "0.9";
      desc.textContent = LOVE_DESCRIPTIONS[label] || "A personal way your heart likes to both give and receive care.";

      wrapper.appendChild(title);
      wrapper.appendChild(desc);
      container.appendChild(wrapper);
    });
  }

  function renderPhoto(img, url) {
    if (!img) return;
    if (url) {
      img.src = url;
      img.alt = "Soul photo";
      img.classList.remove("is-empty");
    } else {
      img.removeAttribute("src");
      img.alt = "";
      img.classList.add("is-empty");
    }
  }

  function setTag(el, value, prefix) {
    if (!el) return;
    if (value != null && norm(value)) {
      el.textContent = prefix ? `${prefix}${value}` : String(value);
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  }

  function render(data) {
    const profile = normalizeProfile(data);
    const name = profile.name || "My Soul";
    const birthdayParts = parseBirthdayToParts(profile.birthday);
    const age = profile.age || calculateAge(birthdayParts);
    const energy = buildEnergyText(profile);

    if (ui.heroTitle) ui.heroTitle.textContent = name ? `My Soul • ${name}` : "My Soul";
    if (ui.heroSubtitle) {
      ui.heroSubtitle.textContent = "Your core soul snapshot – built from your answers and updated each time you change your profile.";
    }

    const slot = Number(profile.mainPhotoSlot || profile.primaryPhotoSlot || 1);
    const photo1 = profile.profilePhoto1 || "";
    const photo2 = profile.profilePhoto2 || "";
    const photo3 = profile.profilePhoto3 || "";
    const avatarUrl = profile[`profilePhoto${slot}`] || photo1 || photo2 || photo3 || "";

    if (ui.avatar) {
      if (avatarUrl) {
        ui.avatar.src = avatarUrl;
        ui.avatar.alt = "Soul avatar";
      } else {
        ui.avatar.removeAttribute("src");
        ui.avatar.alt = "";
      }
    }

    renderPhoto(ui.photo1, photo1);
    renderPhoto(ui.photo2, photo2);
    renderPhoto(ui.photo3, photo3);

    if (ui.energyText) {
      ui.energyText.textContent = energy.text;
      ui.energyText.classList.remove("ms-placeholder");
    }

    setTag(ui.zodiacTag, energy.zodiac || profile.zodiac, "");
    setTag(ui.chineseTag, energy.chinese || profile.chineseZodiac, "");
    setTag(ui.lifePathTag, energy.lifePath || profile.lifePath || profile.lifePathNumber, "Life Path ");
    setTag(ui.connectionTag, profile.connectionType, "");

    if (ui.snapshotName) ui.snapshotName.textContent = profile.name || "—";
    if (ui.snapshotAge) ui.snapshotAge.textContent = age != null && age !== "" ? `${age}` : "—";
    if (ui.snapshotCountry) ui.snapshotCountry.textContent = profile.country || "—";
    if (ui.snapshotConnection) ui.snapshotConnection.textContent = profile.connectionType || "Not chosen yet";

    const loveArray = normalizeLoveLanguages(profile.loveLanguages, profile.loveLanguage);
    if (ui.snapshotLoveLanguage) ui.snapshotLoveLanguage.textContent = loveArray[0] || "Not chosen yet";

    renderChips(profile.values, ui.snapshotValues, {
      max: 6,
      placeholder: "No values selected yet.",
    });

    renderChips(profile.hobbies, ui.snapshotHobbies, {
      max: 6,
      placeholder: "No hobbies added yet.",
    });

    if (ui.soulSummary) {
      const summary = buildSoulSummary(profile);
      ui.soulSummary.textContent = summary;
      ui.soulSummary.classList.toggle("ms-placeholder", !summary || !summary.trim());
    }

    renderLoveLanguageChips(loveArray, ui.loveLanguages);

    renderChips(mergeLists(profile.connectWith, profile.seekingGender, profile.connectWithCustom), ui.connectWith, {
      max: 6,
      placeholder: "You can describe who you want to meet in Edit Profile.",
    });

    if (ui.boundariesText) {
      if (profile.boundaries) {
        ui.boundariesText.textContent = profile.boundaries;
        ui.boundariesText.classList.remove("ms-placeholder");
      } else {
        ui.boundariesText.textContent = "You haven’t written your boundaries yet. When you add them, they will appear here.";
        ui.boundariesText.classList.add("ms-placeholder");
      }
    }

    if (ui.aboutText) {
      if (profile.about) {
        ui.aboutText.textContent = profile.about;
        ui.aboutText.classList.remove("ms-placeholder");
      } else {
        ui.aboutText.textContent = "Share a few lines about yourself in the Quiz or Edit Profile – your story will be reflected here.";
        ui.aboutText.classList.add("ms-placeholder");
      }
    }

    if (ui.mantraText) {
      if (profile.mantra) {
        ui.mantraText.textContent = profile.mantra;
        ui.mantraText.classList.remove("ms-placeholder");
      } else {
        ui.mantraText.textContent = "Add a mantra to carry with you – something short you can return to on difficult days.";
        ui.mantraText.classList.add("ms-placeholder");
      }
    }
  }

  function renderEmpty() {
    if (ui.content) ui.content.hidden = true;
    if (ui.empty) ui.empty.hidden = false;
  }

  function renderFull(data) {
    if (ui.empty) ui.empty.hidden = true;
    if (ui.content) ui.content.hidden = false;
    render(data);
  }

  function bindStaticLinks() {
    if (ui.goToChart) {
      ui.goToChart.addEventListener("click", function (event) {
        event.preventDefault();
        window.location.href = "soul-chart.html";
      });
    }

    [ui.backQuizTop, ui.backQuizBottom].forEach((btn) => {
      if (!btn) return;
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        window.location.href = "quiz.html";
      });
    });
  }

  async function init() {
    bindStaticLinks();

    try {
      const profile = await loadSourceProfile();

      if (!hasMeaningfulData(profile)) {
        renderEmpty();
      } else {
        renderFull(profile);
      }
    } catch (err) {
      console.error("[Soulink] Save failed", err);
      renderEmpty();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
