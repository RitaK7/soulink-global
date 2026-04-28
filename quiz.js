// quiz.js — Soulink Core Quiz Flow
// Firestore is the source of truth for logged-in users.
// localStorage remains as fallback/cache only.

import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

(function () {
  "use strict";

  const PRIMARY_KEY = "soulink.soulQuiz";
  const LEGACY_KEY = "soulQuiz";

  const form =
    document.getElementById("quizForm") ||
    document.getElementById("quiz-form") ||
    document.querySelector("form");

  if (!form) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));
  const byId = (id) => document.getElementById(id);

  let currentUser = null;
  let state = {};

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

  function lower(value) {
    return norm(value).toLowerCase();
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
    } catch (e) {
      return null;
    }
  }

  function readLocalSoulData() {
    try {
      if (typeof window.getSoulData === "function") {
        const data = window.getSoulData({ ensureShape: true });
        if (data && typeof data === "object") return data;
      }
    } catch (e) {
      console.warn("[Soulink] Local helper read failed", e);
    }

    return (
      safeParse(localStorage.getItem(PRIMARY_KEY)) ||
      safeParse(localStorage.getItem(LEGACY_KEY)) ||
      {}
    );
  }

  function writeLocalSoulData(data) {
    if (!data || typeof data !== "object") return;

    try {
      if (typeof window.saveSoulData === "function") {
        window.saveSoulData(data);
        return;
      }
    } catch (e) {
      console.warn("[Soulink] Local helper save failed", e);
    }

    try {
      const json = JSON.stringify(data);
      localStorage.setItem(PRIMARY_KEY, json);
      localStorage.setItem(LEGACY_KEY, json);
    } catch (e) {
      console.warn("[Soulink] Local fallback save failed", e);
    }
  }

  function patchLocalSoulData(fragment) {
    if (!fragment || typeof fragment !== "object") return state;
    const merged = Object.assign({}, readLocalSoulData() || {}, fragment);
    writeLocalSoulData(merged);
    return merged;
  }

  function getInputValue(id) {
    const el = byId(id);
    if (!el) return "";
    return norm(el.value);
  }

  function setInputValue(id, value) {
    const el = byId(id);
    if (!el) return;
    el.value = value != null ? String(value) : "";
  }

  function getSelectValue(id) {
    const el = byId(id);
    if (!el) return "";
    return norm(el.value);
  }

  function setSelectValue(id, value) {
    const el = byId(id);
    if (!el) return;
    el.value = value != null ? String(value) : "";
  }

  function getRadio(name) {
    const node =
      $(`input[type="radio"][name="${name}"]:checked`) ||
      $(`input[type="radio"][name="${name}[]"]:checked`);
    return node ? norm(node.value) : "";
  }

  function setRadio(name, value) {
    const nodes = $$(
      `input[type="radio"][name="${name}"], input[type="radio"][name="${name}[]"]`
    );
    if (!nodes.length) return;
    const v = value != null ? String(value) : "";
    nodes.forEach((n) => {
      n.checked = String(n.value) === v;
    });
  }

  function getChecks(name) {
    const nodes = $$(
      `input[type="checkbox"][name="${name}"]:checked, input[type="checkbox"][name="${name}[]"]:checked`
    );
    return nodes.map((n) => norm(n.value)).filter(Boolean);
  }

  function setChecks(name, values) {
    const nodes = $$(
      `input[type="checkbox"][name="${name}"], input[type="checkbox"][name="${name}[]"]`
    );
    if (!nodes.length) return;

    const set = new Set(
      Array.isArray(values) ? values.map((v) => String(v)) : []
    );

    nodes.forEach((n) => {
      n.checked = set.has(String(n.value));
    });
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
      const year = parseInt(m[1], 10);
      const month = parseInt(m[2], 10);
      const day = parseInt(m[3], 10);
      if (year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return { year, month, day };
      }
    }

    m = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10);
      const year = parseInt(m[3], 10);
      if (year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return { year, month, day };
      }
    }

    if (/^\d{8}$/.test(text)) {
      const year = Number(text.slice(0, 4));
      const month = Number(text.slice(4, 6));
      const day = Number(text.slice(6, 8));
      if (year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return { year, month, day };
      }
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
        .reduce((acc, ch) => acc + parseInt(ch, 10), 0);

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
    const birthdayText = getInputValue("birthday");
    const parsed = parseBirthday(birthdayText);

    if (!parsed) {
      setInputValue("zodiac", "");
      setInputValue("chineseZodiac", "");
      setInputValue("lifePathNumber", "");
      return {
        age: "",
        zodiac: "",
        chineseZodiac: "",
        lifePathNumber: "",
        lifePath: ""
      };
    }

    const zodiac = computeZodiacSign(parsed);
    const chinese = computeChineseZodiac(parsed.year);
    const lifePath = computeLifePathNumber(parsed);
    const age = computeAge(parsed);

    setInputValue("zodiac", zodiac);
    setInputValue("chineseZodiac", chinese);
    setInputValue("lifePathNumber", lifePath);

    return {
      age,
      zodiac,
      chineseZodiac: chinese,
      lifePathNumber: lifePath,
      lifePath
    };
  }

  function normalizeListFromData(value) {
    return uniq(
      (Array.isArray(value) ? value : String(value || "").split(/[\n,;]+/))
        .map((v) => norm(v))
        .filter(Boolean)
    );
  }

  function prefillFromData(data) {
    if (!data || typeof data !== "object") return;

    setInputValue("name", data.name || "");
    setInputValue("birthday", data.birthday || "");
    setSelectValue("country", data.country || "");
    setInputValue("height", data.height || "");
    setInputValue("weight", data.weight || data.kg || "");
    setInputValue("genderSelf", data.genderSelf || "");
    setInputValue("orientationText", data.orientationText || "");
    setInputValue("unacceptable", data.unacceptable || data.boundaries || "");
    setInputValue("about", data.about || data.aboutMe || "");
    setInputValue("mantra", data.mantra || "");
    setInputValue("soulSummary", data.soulSummary || "");
    setInputValue("hobbiesExtra", data.hobbiesExtra || "");
    setInputValue("valuesExtra", data.valuesExtra || "");

    setRadio("gender", data.gender || "");
    setRadio("connectionType", normalizeConnectionTypeToQuizValue(data.connectionType || ""));
    setRadio("orientation", data.orientationChoice || data.orientation || "");
    setRadio("loveLanguage", data.loveLanguage || "");

    setChecks("loveLanguages", normalizeListFromData(data.loveLanguages || []));
    setChecks("hobbies", normalizeListFromData(data.hobbies || data.interests || []));
    setChecks("values", normalizeListFromData(data.values || []));

    setInputValue("zodiac", data.zodiac || "");
    setInputValue("chineseZodiac", data.chineseZodiac || "");
    setInputValue("lifePathNumber", data.lifePathNumber || data.lifePath || "");

    if (getInputValue("birthday")) {
      const derived = updateDerivedFromBirthday();

      if (!getInputValue("zodiac") && derived.zodiac) {
        setInputValue("zodiac", derived.zodiac);
      }
      if (!getInputValue("chineseZodiac") && derived.chineseZodiac) {
        setInputValue("chineseZodiac", derived.chineseZodiac);
      }
      if (!getInputValue("lifePathNumber") && derived.lifePathNumber) {
        setInputValue("lifePathNumber", derived.lifePathNumber);
      }
    }
  }

  function collectQuizData() {
    const birthday = getInputValue("birthday");
    const derived = updateDerivedFromBirthday();

    const rawConnectionType = getRadio("connectionType");
    const canonicalConnectionType = normalizeConnectionTypeToCanonical(rawConnectionType);

    const loveLanguage = getRadio("loveLanguage");
    const secondaryLoveLanguages = getChecks("loveLanguages");
    const loveLanguages = uniq(
      [loveLanguage].concat(secondaryLoveLanguages).map((x) => norm(x)).filter(Boolean)
    );

    const hobbies = uniq(getChecks("hobbies").concat(norm(getInputValue("hobbiesExtra")) || []).filter(Boolean));
    const values = uniq(getChecks("values").concat(norm(getInputValue("valuesExtra")) || []).filter(Boolean));

    const orientationChoice = getRadio("orientation");
    const orientationText = getInputValue("orientationText");
    const orientation = orientationChoice || orientationText;

    const fragment = {
      name: getInputValue("name"),
      birthday,
      country: getSelectValue("country"),
      height: getInputValue("height"),
      weight: getInputValue("weight"),
      kg: getInputValue("weight"),

      age: derived.age,
      zodiac: derived.zodiac,
      chineseZodiac: derived.chineseZodiac,
      lifePathNumber: derived.lifePathNumber,
      lifePath: derived.lifePath,

      genderSelf: getInputValue("genderSelf"),
      gender: getRadio("gender"),

      connectionType: canonicalConnectionType,

      orientation,
      orientationChoice,
      orientationText,

      loveLanguage,
      loveLanguages,

      hobbies,
      interests: hobbies,
      hobbiesExtra: getInputValue("hobbiesExtra"),

      values,
      valuesExtra: getInputValue("valuesExtra"),

      unacceptable: getInputValue("unacceptable"),
      boundaries: getInputValue("unacceptable"),
      unacceptableBehavior: getInputValue("unacceptable"),

      about: getInputValue("about"),
      aboutMe: getInputValue("about"),

      mantra: getInputValue("mantra"),
      soulSummary: getInputValue("soulSummary"),

      profilePhoto1: state.profilePhoto1 || "",
      profilePhoto2: state.profilePhoto2 || "",
      profilePhoto3: state.profilePhoto3 || "",
      mainPhotoSlot: state.mainPhotoSlot || null,
      primaryPhotoSlot: state.mainPhotoSlot || state.primaryPhotoSlot || null
    };

    return fragment;
  }

  function clearErrors() {
    [
      byId("error-name"),
      byId("error-connectionType"),
      byId("error-loveLanguage")
    ].forEach((el) => {
      if (el) el.textContent = "";
    });
  }

  function validate() {
    clearErrors();
    let valid = true;

    const name = getInputValue("name");
    const connectionType = getRadio("connectionType");
    const loveLanguage = getRadio("loveLanguage");

    if (!name) {
      const el = byId("error-name");
      if (el) el.textContent = "Please add your name.";
      valid = false;
    }

    if (!connectionType) {
      const el = byId("error-connectionType");
      if (el) el.textContent = "Choose at least one connection type.";
      valid = false;
    }

    if (!loveLanguage) {
      const el = byId("error-loveLanguage");
      if (el) el.textContent = "Select your primary love language.";
      valid = false;
    }

    return valid;
  }

  function syncStateFromDom() {
    const fragment = collectQuizData();
    state = Object.assign({}, state, fragment);
    writeLocalSoulData(state);
    return fragment;
  }

  function bindAutosave() {
    const textIds = [
      "name",
      "birthday",
      "country",
      "height",
      "weight",
      "orientationText",
      "unacceptable",
      "about",
      "genderSelf",
      "mantra",
      "soulSummary",
      "hobbiesExtra",
      "valuesExtra"
    ];

    textIds.forEach((id) => {
      const el = byId(id);
      if (!el) return;

      const handler = () => {
        syncStateFromDom();
      };

      el.addEventListener("change", handler);
      el.addEventListener("blur", handler);
    });

    ["gender", "connectionType", "orientation", "loveLanguage"].forEach((name) => {
      const radios = $$(
        `input[type="radio"][name="${name}"], input[type="radio"][name="${name}[]"]`
      );
      radios.forEach((n) => {
        n.addEventListener("change", () => {
          syncStateFromDom();
        });
      });
    });

    ["loveLanguages", "hobbies", "values"].forEach((name) => {
      const boxes = $$(
        `input[type="checkbox"][name="${name}"], input[type="checkbox"][name="${name}[]"]`
      );
      boxes.forEach((n) => {
        n.addEventListener("change", () => {
          syncStateFromDom();
        });
      });
    });
  }

  async function saveQuizToFirestore(fragment) {
    const user = await waitForAuthUser();

    if (!user) {
      console.log("[Soulink] Using local fallback");
      return;
    }

    await setDoc(
      doc(db, "users", user.uid),
      {
        ...fragment,
        uid: user.uid,
        email: user.email || "",
        updatedAt: serverTimestamp(),
        profileCompleted: true
      },
      { merge: true }
    );

    console.log("[Soulink] Saved profile to Firestore");
  }

  function bindSubmit() {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!validate()) return;

      const fragment = syncStateFromDom();

      let nextUrl = "edit-profile.html";
      const attrNext = form.getAttribute("data-next");
      if (attrNext) nextUrl = attrNext;

      saveQuizToFirestore(fragment)
        .catch((err) => {
          console.error("[Soulink] Save failed", err);
        })
        .finally(() => {
          window.location.href = nextUrl;
        });
    });
  }

  async function init() {
    try {
      const local = readLocalSoulData();
      const user = await waitForAuthUser();

      if (user) {
        const fire = await readFirestoreProfile(user);
        if (fire && typeof fire === "object") {
          state = Object.assign({}, local || {}, fire);
          writeLocalSoulData(state);
        } else {
          console.log("[Soulink] Using local fallback");
          state = local || {};
        }
      } else {
        console.log("[Soulink] Using local fallback");
        state = local || {};
      }

      prefillFromData(state);
      bindAutosave();
      bindSubmit();
    } catch (err) {
      console.error("[Soulink][quiz] init failed", err);
      state = readLocalSoulData() || {};
      prefillFromData(state);
      bindAutosave();
      bindSubmit();
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