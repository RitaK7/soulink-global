import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

(function () {
  "use strict";

  const PRIMARY_KEY = "soulink.soulQuiz";
  const LEGACY_KEY = "soulQuiz";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const byId = (id) => document.getElementById(id);

  let state = {};
  let currentUser = null;

  const PHOTO_KEYS = ["profilePhoto1", "profilePhoto2", "profilePhoto3"];

  function activeUid() {
    return (currentUser && currentUser.uid) || (auth.currentUser && auth.currentUser.uid) || "";
  }

  function ownsLocalCache(data, user) {
    if (!user || !data || typeof data !== "object") return true;
    const owner = data.__soulinkUid || data.uid || data.ownerUid || "";
    return owner === user.uid;
  }

  function readLocalSoulDataForUser(user) {
    const local = readLocalSoulData();
    return ownsLocalCache(local, user) ? local : {};
  }

  function stripPhotoKeys(obj) {
    const clean = Object.assign({}, obj || {});
    PHOTO_KEYS.forEach((key) => delete clean[key]);
    delete clean.mainPhotoSlot;
    delete clean.primaryPhotoSlot;
    return clean;
  }

  function showSaveStatus(message, ok = true) {
    let toast = document.getElementById("soulinkSaveToast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "soulinkSaveToast";
      toast.setAttribute("role", "status");
      toast.style.position = "fixed";
      toast.style.right = "18px";
      toast.style.bottom = "18px";
      toast.style.zIndex = "9999";
      toast.style.padding = "12px 16px";
      toast.style.borderRadius = "999px";
      toast.style.fontWeight = "800";
      toast.style.fontSize = "0.9rem";
      toast.style.boxShadow = "0 0 22px rgba(0,253,216,0.75)";
      toast.style.transition = "opacity 0.2s ease, transform 0.2s ease";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.color = ok ? "#003c43" : "#ffd4dc";
    toast.style.background = ok ? "#00fdd8" : "rgba(80,0,20,0.95)";
    toast.style.border = ok
      ? "1px solid rgba(0,253,216,1)"
      : "1px solid rgba(255,154,162,0.8)";
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    window.clearTimeout(toast._timer);
    toast._timer = window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
    }, 2200);
  }

  const QUIZ_TO_CANONICAL_CONNECTION = {
    "Romantic": "Romantic relationship",
    "Friendship": "Friendship",
    "Both": "Both (romantic & friendship)",
    "Not sure yet": "Open to any connection",
    "Open to any connection": "Open to any connection",
    "Romantic relationship": "Romantic relationship",
    "Both (romantic & friendship)": "Both (romantic & friendship)"
  };

  const CANONICAL_TO_QUIZ_CONNECTION = {
    "Romantic relationship": "Romantic",
    "Friendship": "Friendship",
    "Both (romantic & friendship)": "Both",
    "Open to any connection": "Not sure yet"
  };

  function norm(value) {
    return value == null ? "" : String(value).trim();
  }

  function toArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.slice();
    return [value];
  }

  function uniq(list) {
    const out = [];
    const seen = new Set();

    (list || []).forEach((item) => {
      const clean = norm(item);
      if (!clean || seen.has(clean)) return;
      seen.add(clean);
      out.push(clean);
    });

    return out;
  }

  function safeParse(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function readLocalSoulData() {
    try {
      if (typeof window.getSoulData === "function") {
        const data = window.getSoulData({ ensureShape: true });
        if (data && typeof data === "object") return data;
      }
    } catch (err) {
      console.warn("[Soulink] Local helper read failed", err);
    }

    return (
      safeParse(localStorage.getItem(PRIMARY_KEY)) ||
      safeParse(localStorage.getItem(LEGACY_KEY)) ||
      {}
    );
  }

  function writeLocalSoulData(data) {
    if (!data || typeof data !== "object") return;

    const uid = activeUid();
    const payload = uid ? Object.assign({}, data, { __soulinkUid: uid }) : Object.assign({}, data);

    try {
      if (typeof window.saveSoulData === "function") {
        window.saveSoulData(payload);
        return;
      }
    } catch (err) {
      console.warn("[Soulink] Local helper save failed", err);
    }

    try {
      const json = JSON.stringify(payload);
      localStorage.setItem(PRIMARY_KEY, json);
      localStorage.setItem(LEGACY_KEY, json);
    } catch (err) {
      console.warn("[Soulink] Local fallback save failed", err);
    }
  }

  function patchLocalSoulData(fragment) {
    if (!fragment || typeof fragment !== "object") return state;
    const merged = Object.assign({}, state || {}, fragment);
    writeLocalSoulData(merged);
    return merged;
  }

  function waitForAuthUser(timeoutMs = 5000) {
    return new Promise((resolve) => {
      if (auth.currentUser) {
        currentUser = auth.currentUser;
        console.log("[Soulink] Auth user ready", auth.currentUser.uid);
        resolve(auth.currentUser);
        return;
      }

      let settled = false;

      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        unsubscribe();
        currentUser = auth.currentUser || null;
        console.log("[Soulink] Auth user ready", currentUser ? currentUser.uid : "none");
        resolve(currentUser);
      }, timeoutMs);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        unsubscribe();
        currentUser = user || null;
        console.log("[Soulink] Auth user ready", currentUser ? currentUser.uid : "none");
        resolve(currentUser);
      });
    });
  }

  async function readFirestoreProfile(user) {
    if (!user) return null;

    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return null;

    console.log("[Soulink] Loaded profile from Firestore");
    return snap.data() || null;
  }

  function getFieldValue(id) {
    const el = byId(id);
    return el ? norm(el.value) : "";
  }

  function setFieldValue(id, value) {
    const el = byId(id);
    if (!el) return;
    el.value = value == null ? "" : String(value);
  }

  function getRadioValue(name) {
    const checked =
      $(`input[type="radio"][name="${name}"]:checked`) ||
      $(`input[type="radio"][name="${name}[]"]:checked`);
    return checked ? norm(checked.value) : "";
  }

  function setRadioValue(name, value) {
    const nodes = $$(
      `input[type="radio"][name="${name}"], input[type="radio"][name="${name}[]"]`
    );
    const wanted = String(value || "");
    nodes.forEach((node) => {
      node.checked = String(node.value) === wanted;
    });
  }

  function getCheckboxValues(name) {
    return $$(
      `input[type="checkbox"][name="${name}"]:checked, input[type="checkbox"][name="${name}[]"]:checked`
    )
      .map((n) => norm(n.value))
      .filter(Boolean);
  }

  function setCheckboxValues(name, values) {
    const set = new Set((values || []).map((v) => String(v)));
    $$(
      `input[type="checkbox"][name="${name}"], input[type="checkbox"][name="${name}[]"]`
    ).forEach((node) => {
      node.checked = set.has(String(node.value));
    });
  }

  function normalizeConnectionTypeToCanonical(value) {
    const raw = norm(value);
    if (!raw) return "";
    return QUIZ_TO_CANONICAL_CONNECTION[raw] || raw;
  }

  function normalizeConnectionTypeToQuizValue(value) {
    const raw = norm(value);
    if (!raw) return "";
    return CANONICAL_TO_QUIZ_CONNECTION[raw] || raw;
  }

  function parseBirthday(raw) {
    const text = norm(raw);
    if (!text) return null;

    let m = text.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
    if (m) {
      return {
        year: parseInt(m[1], 10),
        month: parseInt(m[2], 10),
        day: parseInt(m[3], 10)
      };
    }

    m = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (m) {
      return {
        day: parseInt(m[1], 10),
        month: parseInt(m[2], 10),
        year: parseInt(m[3], 10)
      };
    }

    if (/^\d{8}$/.test(text)) {
      return {
        year: Number(text.slice(0, 4)),
        month: Number(text.slice(4, 6)),
        day: Number(text.slice(6, 8))
      };
    }

    return null;
  }

  function computeZodiacSign(parts) {
    if (!parts) return "";

    const { day, month } = parts;

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Pisces";

    return "";
  }

  function computeChineseZodiac(year) {
    if (!year || !Number.isFinite(year)) return "";

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
      "Pig"
    ];

    const index = (year - 1900) % 12;
    return animals[((index % 12) + 12) % 12];
  }

  function computeLifePathNumber(parts) {
    if (!parts) return "";

    const digits = `${parts.year}${String(parts.month).padStart(2, "0")}${String(parts.day).padStart(2, "0")}`;

    const sumDigits = (str) =>
      String(str)
        .split("")
        .reduce((acc, ch) => acc + Number(ch || 0), 0);

    let n = sumDigits(digits);
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
      n = sumDigits(String(n));
    }

    return String(n);
  }

  function computeAge(parts) {
    if (!parts) return "";

    const birth = new Date(parts.year, parts.month - 1, parts.day);
    if (isNaN(birth.getTime())) return "";

    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
    return age >= 0 && age < 130 ? String(age) : "";
  }

  function updateDerivedFromBirthday() {
    const birthdayText = getFieldValue("birthday");
    const parsed = parseBirthday(birthdayText);

    if (!parsed) {
      setFieldValue("zodiac", "");
      setFieldValue("chineseZodiac", "");
      setFieldValue("lifePathNumber", "");
      return {
        age: "",
        zodiac: "",
        chineseZodiac: "",
        lifePathNumber: "",
        lifePath: ""
      };
    }

    const zodiac = computeZodiacSign(parsed);
    const chineseZodiac = computeChineseZodiac(parsed.year);
    const lifePathNumber = computeLifePathNumber(parsed);
    const age = computeAge(parsed);

    setFieldValue("zodiac", zodiac);
    setFieldValue("chineseZodiac", chineseZodiac);
    setFieldValue("lifePathNumber", lifePathNumber);

    return {
      age,
      zodiac,
      chineseZodiac,
      lifePathNumber,
      lifePath: lifePathNumber
    };
  }

  function normalizeList(value) {
    return uniq(
      (Array.isArray(value) ? value : String(value || "").split(/[\n,;]+/))
        .map((v) => norm(v))
        .filter(Boolean)
    );
  }

  function prefillFromData(data) {
    if (!data || typeof data !== "object") return;

    setFieldValue("name", data.name || "");
    setFieldValue("birthday", data.birthday || "");
    setFieldValue("height", data.height || "");
    setFieldValue("weight", data.weight || data.kg || "");
    setFieldValue("genderSelf", data.genderSelf || "");
    setFieldValue("orientationText", data.orientationText || "");
    setFieldValue("unacceptable", data.unacceptable || data.boundaries || "");
    setFieldValue("about", data.about || data.aboutMe || "");
    setFieldValue("mantra", data.mantra || "");
    setFieldValue("soulSummary", data.soulSummary || "");
    setFieldValue("hobbiesExtra", data.hobbiesExtra || "");
    setFieldValue("valuesExtra", data.valuesExtra || "");

    const country = byId("country");
    if (country) country.value = data.country || "";

    setRadioValue("gender", data.gender || "");
    setRadioValue("connectionType", normalizeConnectionTypeToQuizValue(data.connectionType || ""));
    setRadioValue("orientation", data.orientationChoice || data.orientation || "");
    setRadioValue("loveLanguage", data.loveLanguage || "");

    setCheckboxValues("loveLanguages", normalizeList(data.loveLanguages || []));
    setCheckboxValues("hobbies", normalizeList(data.hobbies || data.interests || []));
    setCheckboxValues("values", normalizeList(data.values || []));

    setFieldValue("zodiac", data.zodiac || "");
    setFieldValue("chineseZodiac", data.chineseZodiac || "");
    setFieldValue("lifePathNumber", data.lifePathNumber || data.lifePath || "");

    if (getFieldValue("birthday")) {
      const derived = updateDerivedFromBirthday();

      if (!getFieldValue("zodiac") && derived.zodiac) setFieldValue("zodiac", derived.zodiac);
      if (!getFieldValue("chineseZodiac") && derived.chineseZodiac) setFieldValue("chineseZodiac", derived.chineseZodiac);
      if (!getFieldValue("lifePathNumber") && derived.lifePathNumber) setFieldValue("lifePathNumber", derived.lifePathNumber);
    }
  }

  function collectQuizData() {
    const derived = updateDerivedFromBirthday();

    const connectionType = normalizeConnectionTypeToCanonical(getRadioValue("connectionType"));
    const loveLanguage = getRadioValue("loveLanguage");
    const loveLanguages = uniq(
      [loveLanguage]
        .concat(getCheckboxValues("loveLanguages"))
        .map((x) => norm(x))
        .filter(Boolean)
    );

    const hobbies = uniq(
      getCheckboxValues("hobbies")
        .concat(norm(getFieldValue("hobbiesExtra")) || [])
        .filter(Boolean)
    );

    const values = uniq(
      getCheckboxValues("values")
        .concat(norm(getFieldValue("valuesExtra")) || [])
        .filter(Boolean)
    );

    const orientationChoice = getRadioValue("orientation");
    const orientationText = getFieldValue("orientationText");
    const orientation = orientationChoice || orientationText;

    return {
      name: getFieldValue("name"),
      birthday: getFieldValue("birthday"),
      country: getFieldValue("country"),
      height: getFieldValue("height"),
      weight: getFieldValue("weight"),
      kg: getFieldValue("weight"),

      age: derived.age,
      zodiac: derived.zodiac,
      chineseZodiac: derived.chineseZodiac,
      lifePathNumber: derived.lifePathNumber,
      lifePath: derived.lifePath,

      gender: getRadioValue("gender"),
      genderSelf: getFieldValue("genderSelf"),

      connectionType,

      orientation,
      orientationChoice,
      orientationText,

      loveLanguage,
      loveLanguages,

      hobbies,
      interests: hobbies,
      hobbiesExtra: getFieldValue("hobbiesExtra"),

      values,
      valuesExtra: getFieldValue("valuesExtra"),

      unacceptable: getFieldValue("unacceptable"),
      boundaries: getFieldValue("unacceptable"),
      unacceptableBehavior: getFieldValue("unacceptable"),

      about: getFieldValue("about"),
      aboutMe: getFieldValue("about"),

      mantra: getFieldValue("mantra"),
      soulSummary: getFieldValue("soulSummary"),

      profilePhoto1: state.profilePhoto1 || "",
      profilePhoto2: state.profilePhoto2 || "",
      profilePhoto3: state.profilePhoto3 || "",
      mainPhotoSlot: state.mainPhotoSlot || null,
      primaryPhotoSlot: state.mainPhotoSlot || state.primaryPhotoSlot || null
    };
  }

   function syncLocalFromDom() {
  const fragment = collectQuizData();
  state = Object.assign({}, state, fragment);
  writeLocalSoulData(state);
  return fragment;
}

async function saveQuizToFirestore(fragment, options = {}) {
  const user = await waitForAuthUser();
  const shouldToast = !!options.showToast;

  console.log("[Soulink][Quiz] saveQuizToFirestore start", {
    uid: user ? user.uid : null,
    name: fragment?.name || "",
    birthday: fragment?.birthday || "",
    country: fragment?.country || "",
    about: fragment?.about || ""
  });

  if (!user) {
    console.log("[Soulink] Using local fallback");
    if (shouldToast) showSaveStatus("Saved locally ✨", true);
    return true;
  }

  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data() || {} : {};

    // Quiz does not edit photos. Never let stale localStorage photo fields
    // overwrite Firestore profilePhoto1/2/3 from this page.
    const payload = stripPhotoKeys(fragment);

    await setDoc(
      ref,
      {
        ...payload,
        uid: user.uid,
        email: user.email || "",
        profileCompleted: true,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    const mergedForCache = Object.assign({}, existing, payload, {
      uid: user.uid,
      email: user.email || existing.email || "",
      profileCompleted: true
    });

    state = Object.assign({}, state, mergedForCache);
    writeLocalSoulData(state);

    console.log("[Soulink] Saved profile to Firestore");
    if (shouldToast) showSaveStatus("Saved to Soulink ✨", true);
    return true;
  } catch (err) {
    console.error("[Soulink] Save failed", err);
    if (shouldToast) showSaveStatus("Save failed — check Console", false);
    return false;
  }
}

let autosaveTimer = null;

function scheduleFirestoreAutosave() {
  window.clearTimeout(autosaveTimer);

  autosaveTimer = window.setTimeout(async () => {
    try {
      const fragment = syncLocalFromDom();
      await saveQuizToFirestore(fragment);
    } catch (err) {
      console.error("[Soulink] Autosave failed", err);
    }
  }, 900);
}

function bindAutosave() {
  [
    "name",
    "birthday",
    "country",
    "height",
    "weight",
    "genderSelf",
    "orientationText",
    "unacceptable",
    "about",
    "mantra",
    "soulSummary",
    "hobbiesExtra",
    "valuesExtra"
  ].forEach((id) => {
    const el = byId(id);
    if (!el) return;

    const handler = () => {
      syncLocalFromDom();
      scheduleFirestoreAutosave();
    };

    el.addEventListener("change", handler);
    el.addEventListener("blur", handler);
    el.addEventListener("input", handler);
  });

  ["gender", "connectionType", "orientation", "loveLanguage"].forEach((name) => {
    $$(
      `input[type="radio"][name="${name}"], input[type="radio"][name="${name}[]"]`
    ).forEach((node) => {
      node.addEventListener("change", () => {
        syncLocalFromDom();
        scheduleFirestoreAutosave();
      });
    });
  });

  ["loveLanguages", "hobbies", "values"].forEach((name) => {
    $$(
      `input[type="checkbox"][name="${name}"], input[type="checkbox"][name="${name}[]"]`
    ).forEach((node) => {
      node.addEventListener("change", () => {
        syncLocalFromDom();
        scheduleFirestoreAutosave();
      });
    });
  });
}
function bindNavSave() {
  // Intentionally disabled.
  // Navbar should navigate normally and must not overwrite Firestore
  // with partial or stale quiz form data.
}

function bindNextFlow() {
  const nextUrl = "edit-profile.html";
  const form = byId("quizForm") || byId("quiz-form") || $("form");

  if (!form || form.dataset.boundNextFlow === "1") return;
  form.dataset.boundNextFlow = "1";

  const nextButton =
    form.querySelector('button[type="submit"]') ||
    form.querySelector('input[type="submit"]');

  let isSavingAndNavigating = false;

  async function handleNext(event) {
    if (event) event.preventDefault();

    if (isSavingAndNavigating) {
      console.log("[Soulink][Quiz] Next already running, ignored duplicate click");
      return;
    }

    isSavingAndNavigating = true;

    const originalText = nextButton ? nextButton.textContent : "";

    if (nextButton) {
      nextButton.disabled = true;
      if (nextButton.tagName === "BUTTON") {
        nextButton.textContent = "Saving...";
      }
    }

    console.log("[Soulink][Quiz] handleNext fired");

    try {
      const fragment = syncLocalFromDom();

      console.log("[Soulink][Quiz] fragment before Firestore save", fragment);

      const ok = await saveQuizToFirestore(fragment, { showToast: true });

      if (ok) {
        console.log("[Soulink][Quiz] Saved, navigating to Edit Profile");
        window.location.assign(nextUrl);
        return;
      }

      console.warn("[Soulink][Quiz] Save returned false, navigation stopped");
    } catch (err) {
      console.error("[Soulink][Quiz] Next save/navigation failed", err);
    }

    isSavingAndNavigating = false;

    if (nextButton) {
      nextButton.disabled = false;
      if (nextButton.tagName === "BUTTON") {
        nextButton.textContent = originalText || "Next → Edit Profile";
      }
    }
  }

  form.addEventListener("submit", handleNext);
}

  async function init() {
    try {
      const user = await waitForAuthUser();
      const local = readLocalSoulDataForUser(user);

      if (user) {
        const fire = await readFirestoreProfile(user);
        if (fire && typeof fire === "object") {
          // Firestore is the source of truth for logged-in users.
          // Local cache is refreshed FROM Firestore, never merged over it on page load.
          state = Object.assign({}, fire, { __soulinkUid: user.uid });
          writeLocalSoulData(state);
        } else {
          console.log("[Soulink] No Firestore profile yet; using only this user's local draft");
          state = ownsLocalCache(local, user) ? local || {} : {};
          state.__soulinkUid = user.uid;
          writeLocalSoulData(state);
        }
      } else {
        console.log("[Soulink] Using local fallback");
        state = local || {};
      }

      prefillFromData(state);
      bindAutosave();
      bindNextFlow();
      bindNavSave();
    } catch (err) {
      console.error("[Soulink][quiz] init failed", err);
      const user = auth.currentUser || currentUser || null;
      state = readLocalSoulDataForUser(user) || {};
      prefillFromData(state);
      bindAutosave();
      bindNextFlow();
      bindNavSave();
    }
  }

  onAuthStateChanged(auth, (user) => {
    currentUser = user || null;
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();