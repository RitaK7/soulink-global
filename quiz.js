// quiz.js — Soulink Core Quiz Flow
// Firestore users/{uid} is the source of truth for logged-in users.

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

  const form =
    document.getElementById("quizForm") ||
    document.getElementById("quiz-form") ||
    document.querySelector("form");

  if (!form) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const byId = (id) => document.getElementById(id);

  let currentUser = null;
  let currentProfile = {};
  let initialised = false;

  const LOVE_LANGUAGE_LIST = [
    "Words of Affirmation",
    "Quality Time",
    "Acts of Service",
    "Physical Touch",
    "Receiving Gifts"
  ];

  const ARRAY_FIELDS = new Set([
    "loveLanguages",
    "hobbies",
    "interests",
    "values",
    "connectWith",
    "seekingGender"
  ]);

  function norm(value) {
    return value == null ? "" : String(value).trim();
  }

  function lower(value) {
    return norm(value).toLowerCase();
  }

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeArray(value) {
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

  function firstText(...values) {
    for (const value of values) {
      if (Array.isArray(value)) {
        const arr = normalizeArray(value);
        if (arr.length) return arr[0];
      } else {
        const text = norm(value);
        if (text) return text;
      }
    }
    return "";
  }

  function mergeArrays(...lists) {
    return normalizeArray(lists.flatMap((list) => normalizeArray(list)));
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
      receivinggifts: "Receiving Gifts"
    };

    if (map[s]) return map[s];

    const exact = LOVE_LANGUAGE_LIST.find((item) => lower(item) === lower(value));
    return exact || norm(value);
  }

  function normalizeLoveLanguages(rawList, rawPrimary) {
    const primary = normalizeLoveLanguage(rawPrimary);
    let list = normalizeArray(rawList).map(normalizeLoveLanguage).filter(Boolean);

    if (primary) {
      list = list.filter((item) => item !== primary);
      list.unshift(primary);
    }

    return normalizeArray(list).filter((item) => LOVE_LANGUAGE_LIST.includes(item));
  }

  function normalizeConnectionType(value) {
    const s = lower(value);
    if (!s) return "";
    if (s === "romantic" || s === "romantic relationship") return "Romantic";
    if (s === "friendship") return "Friendship";
    if (s === "both" || s.includes("romantic & friendship") || s.includes("romantic and friendship")) return "Both";
    if (s === "open" || s === "networking" || s.includes("open to any")) return "Open";
    return norm(value);
  }

  function parseBirthday(text) {
    const raw = norm(text);
    if (!raw) return null;

    const now = new Date();
    const currentYear = now.getFullYear();

    function valid(y, m, d) {
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
      if (y < 1000 || y > currentYear + 1 || m < 1 || m > 12 || d < 1 || d > 31) return null;
      const date = new Date(y, m - 1, d);
      if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
      if (date.getTime() > new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) return null;
      return { year: y, month: m, day: d };
    }

    const digits = raw.replace(/\D/g, "");
    if (/^\d{8}$/.test(digits)) {
      const yyyyFirst = valid(Number(digits.slice(0, 4)), Number(digits.slice(4, 6)), Number(digits.slice(6, 8)));
      const ddFirst = valid(Number(digits.slice(4, 8)), Number(digits.slice(2, 4)), Number(digits.slice(0, 2)));
      return yyyyFirst || ddFirst;
    }

    let match = raw.match(/^(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})$/);
    if (match) return valid(Number(match[1]), Number(match[2]), Number(match[3]));

    match = raw.match(/^(\d{1,2})[-.\/](\d{1,2})[-.\/](\d{4})$/);
    if (match) return valid(Number(match[3]), Number(match[2]), Number(match[1]));

    return null;
  }

  function computeAge(parts) {
    if (!parts) return "";
    const now = new Date();
    let age = now.getFullYear() - parts.year;
    const monthDiff = now.getMonth() + 1 - parts.month;
    const dayDiff = now.getDate() - parts.day;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
    return Number.isFinite(age) && age >= 0 && age < 130 ? age : "";
  }

  function computeZodiacSign(parts) {
    if (!parts) return "";
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
    return "";
  }

  function computeChineseZodiac(year) {
    if (!year || !Number.isFinite(year)) return "";
    const animals = [
      "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake",
      "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"
    ];
    const index = ((year - 1900) % 12 + 12) % 12;
    return animals[index];
  }

  function computeLifePathNumber(parts) {
    if (!parts) return "";
    const digits = `${parts.year}${String(parts.month).padStart(2, "0")}${String(parts.day).padStart(2, "0")}`;
    const isMaster = (n) => n === 11 || n === 22 || n === 33;
    const sumDigits = (value) => String(value).split("").reduce((sum, ch) => sum + Number(ch || 0), 0);
    let n = sumDigits(digits);
    while (n > 9 && !isMaster(n)) n = sumDigits(n);
    return String(n);
  }

  function addDerivedFields(profile) {
    const birthdayParts = parseBirthday(profile.birthday);
    const age = computeAge(birthdayParts);
    const zodiac = computeZodiacSign(birthdayParts);
    const chineseZodiac = birthdayParts ? computeChineseZodiac(birthdayParts.year) : "";
    const lifePath = computeLifePathNumber(birthdayParts);

    if (age !== "") profile.age = age;
    if (zodiac) profile.zodiac = zodiac;
    if (chineseZodiac) profile.chineseZodiac = chineseZodiac;
    if (lifePath) {
      profile.lifePath = lifePath;
      profile.lifePathNumber = lifePath;
    }

    return profile;
  }

  function normalizeProfile(raw) {
    const source = isPlainObject(raw) ? raw : {};
    const profile = { ...source };

    profile.name = firstText(source.name);
    profile.country = firstText(source.country);
    profile.birthday = firstText(source.birthday, source.birthdate, source.birthDate);
    profile.height = firstText(source.height);
    profile.weight = firstText(source.weight, source.kg);
    profile.kg = firstText(source.kg, source.weight);

    profile.connectionType = normalizeConnectionType(source.connectionType);

    profile.gender = firstText(source.gender, source.genderSelf);
    profile.genderSelf = firstText(source.genderSelf);

    profile.connectWith = mergeArrays(source.connectWith, source.seekingGender);
    profile.seekingGender = mergeArrays(source.seekingGender, source.connectWith);
    profile.connectWithCustom = firstText(source.connectWithCustom);

    profile.orientationChoice = firstText(source.orientationChoice, source.orientation);
    profile.orientationText = firstText(source.orientationText);
    profile.orientation = firstText(source.orientation, source.orientationText, source.orientationChoice);

    profile.hobbies = mergeArrays(source.hobbies, source.interests, source.hobbiesExtra);
    profile.interests = mergeArrays(source.interests, source.hobbies, source.hobbiesExtra);
    profile.values = mergeArrays(source.values, source.valuesExtra);

    profile.hobbiesExtra = firstText(source.hobbiesExtra);
    profile.valuesExtra = firstText(source.valuesExtra);

    profile.unacceptable = firstText(
      source.unacceptable,
      source.boundaries,
      source.unacceptableBehavior,
      source.notAllowed,
      source.noGo
    );
    profile.boundaries = profile.unacceptable;

    profile.about = firstText(source.about, source.aboutMe);
    profile.aboutMe = profile.about;

    profile.mantra = firstText(source.mantra);
    profile.spiritualBeliefs = firstText(source.spiritualBeliefs);
    profile.soulSummary = firstText(source.soulSummary);

    profile.profilePhoto1 = firstText(source.profilePhoto1);
    profile.profilePhoto2 = firstText(source.profilePhoto2);
    profile.profilePhoto3 = firstText(source.profilePhoto3);
    profile.mainPhotoSlot = source.mainPhotoSlot || source.primaryPhotoSlot || null;
    profile.primaryPhotoSlot = profile.mainPhotoSlot;

    const primaryLove = firstText(source.loveLanguage, Array.isArray(source.loveLanguages) ? source.loveLanguages[0] : "");
    profile.loveLanguages = normalizeLoveLanguages(source.loveLanguages, primaryLove);
    profile.loveLanguage = profile.loveLanguages[0] || normalizeLoveLanguage(primaryLove) || "";

    return addDerivedFields(profile);
  }

  function cachePayloadForUser(profile, user) {
    const copy = normalizeProfile(profile);
    if (user && user.uid) copy.__soulinkUid = user.uid;
    if (user && user.email) copy.email = user.email;
    return copy;
  }

  function saveLocalCache(profile, user) {
    try {
      const payload = cachePayloadForUser(profile, user);
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

  function patchLocalCache(fragment) {
    const base = currentUser ? readLocalCache(currentUser) : readLocalCache(null);
    const merged = normalizeProfile({ ...base, ...currentProfile, ...fragment });
    currentProfile = merged;
    saveLocalCache(merged, currentUser);
    return merged;
  }

  function waitForAuthUser(timeoutMs = 5000) {
    return new Promise((resolve) => {
      if (auth.currentUser) {
        currentUser = auth.currentUser;
        console.log("[Soulink] Auth user ready", currentUser.uid);
        resolve(currentUser);
        return;
      }

      let done = false;
      let unsubscribe = () => {};

      const finish = (user) => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        unsubscribe();
        currentUser = user || null;
        if (currentUser) console.log("[Soulink] Auth user ready", currentUser.uid);
        resolve(currentUser);
      };

      const timer = window.setTimeout(() => finish(auth.currentUser || null), timeoutMs);
      unsubscribe = onAuthStateChanged(auth, finish);
    });
  }

  async function loadSourceProfile() {
    const user = await waitForAuthUser();

    if (user) {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const profile = normalizeProfile(snap.data());
        currentProfile = profile;
        saveLocalCache(profile, user);
        console.log("[Soulink] Loaded profile from Firestore");
        return profile;
      }

      const sameUserLocal = readLocalCache(user);
      currentProfile = sameUserLocal;
      saveLocalCache(sameUserLocal, user);
      console.log("[Soulink] Using local fallback");
      return sameUserLocal;
    }

    const local = readLocalCache(null);
    currentProfile = local;
    console.log("[Soulink] Using local fallback");
    return local;
  }

  function showSaveStatus(message, ok = true) {
    let toast = document.getElementById("soulinkSaveToast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "soulinkSaveToast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
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
    toast.style.border = ok ? "1px solid rgba(0,253,216,1)" : "1px solid rgba(255,154,162,0.8)";
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    window.clearTimeout(toast._timer);
    toast._timer = window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
    }, 2200);
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
    return getInputValue(id);
  }

  function setSelectValue(id, value) {
    setInputValue(id, value);
  }

  function getRadio(name) {
    const node = $(`input[type="radio"][name="${name}"]:checked, input[type="radio"][name="${name}[]"]:checked`);
    return node ? node.value : "";
  }

  function setRadio(name, value) {
    const nodes = $$(`input[type="radio"][name="${name}"], input[type="radio"][name="${name}[]"]`);
    if (!nodes.length) return;
    const wanted = norm(value);
    nodes.forEach((node) => {
      node.checked = norm(node.value) === wanted;
    });
  }

  function getChecks(name) {
    return $$(`input[type="checkbox"][name="${name}"]:checked, input[type="checkbox"][name="${name}[]"]:checked`)
      .map((node) => node.value);
  }

  function setChecks(name, values) {
    const wanted = new Set(normalizeArray(values));
    $$(`input[type="checkbox"][name="${name}"], input[type="checkbox"][name="${name}[]"]`).forEach((node) => {
      node.checked = wanted.has(norm(node.value));
    });
  }

  function updateDerivedFromBirthday() {
    const parsed = parseBirthday(getInputValue("birthday"));
    setInputValue("zodiac", computeZodiacSign(parsed));
    setInputValue("chineseZodiac", parsed ? computeChineseZodiac(parsed.year) : "");
    setInputValue("lifePathNumber", computeLifePathNumber(parsed));
  }

  function prefillFromData(data) {
    const profile = normalizeProfile(data);

    setInputValue("name", profile.name);
    setInputValue("birthday", profile.birthday);
    setSelectValue("country", profile.country);
    setInputValue("height", profile.height);
    setInputValue("weight", profile.weight);
    setInputValue("genderSelf", profile.genderSelf);

    setRadio("gender", profile.genderSelf ? "Self-describe" : profile.gender);
    setRadio("connectionType", normalizeConnectionType(profile.connectionType));
    setRadio("orientation", profile.orientationChoice || profile.orientation);
    setInputValue("orientationText", profile.orientationText);

    setRadio("loveLanguage", profile.loveLanguage);
    setChecks("loveLanguages", profile.loveLanguages);

    setChecks("hobbies", profile.hobbies);
    setChecks("values", profile.values);
    setInputValue("hobbiesExtra", profile.hobbiesExtra);
    setInputValue("valuesExtra", profile.valuesExtra);

    setInputValue("unacceptable", profile.unacceptable);
    setInputValue("about", profile.about);
    setInputValue("mantra", profile.mantra);
    setInputValue("soulSummary", profile.soulSummary);

    setInputValue("zodiac", profile.zodiac);
    setInputValue("chineseZodiac", profile.chineseZodiac);
    setInputValue("lifePathNumber", profile.lifePathNumber || profile.lifePath);

    if (getInputValue("birthday") && !getInputValue("zodiac")) {
      updateDerivedFromBirthday();
    }
  }

  function collectQuizData() {
    updateDerivedFromBirthday();

    const primaryLove = normalizeLoveLanguage(getRadio("loveLanguage"));
    const secondaryLove = getChecks("loveLanguages").map(normalizeLoveLanguage).filter(Boolean);
    const loveLanguages = normalizeLoveLanguages(secondaryLove, primaryLove);

    const hobbiesExtra = getInputValue("hobbiesExtra");
    const valuesExtra = getInputValue("valuesExtra");
    const hobbies = mergeArrays(getChecks("hobbies"), hobbiesExtra);
    const values = mergeArrays(getChecks("values"), valuesExtra);

    const orientationChoice = getRadio("orientation");
    const orientationText = getInputValue("orientationText");
    const orientation = firstText(orientationText, orientationChoice);

    const unacceptable = getInputValue("unacceptable");
    const about = getInputValue("about");
    const weight = getInputValue("weight");

    const fragment = normalizeProfile({
      ...currentProfile,
      name: getInputValue("name"),
      birthday: getInputValue("birthday"),
      country: getSelectValue("country"),
      height: getInputValue("height"),
      weight,
      kg: weight,
      gender: getRadio("gender"),
      genderSelf: getInputValue("genderSelf"),
      connectionType: getRadio("connectionType"),
      orientation,
      orientationChoice,
      orientationText,
      loveLanguage: primaryLove,
      loveLanguages,
      hobbies,
      interests: hobbies,
      values,
      hobbiesExtra,
      valuesExtra,
      unacceptable,
      boundaries: unacceptable,
      about,
      aboutMe: about,
      mantra: getInputValue("mantra"),
      soulSummary: getInputValue("soulSummary"),
      zodiac: getInputValue("zodiac"),
      chineseZodiac: getInputValue("chineseZodiac"),
      lifePath: getInputValue("lifePathNumber"),
      lifePathNumber: getInputValue("lifePathNumber"),
      profilePhoto1: currentProfile.profilePhoto1 || "",
      profilePhoto2: currentProfile.profilePhoto2 || "",
      profilePhoto3: currentProfile.profilePhoto3 || "",
      mainPhotoSlot: currentProfile.mainPhotoSlot || currentProfile.primaryPhotoSlot || null
    });

    return fragment;
  }

  function bindAutosave() {
    const selector = "input, select, textarea";
    $$(selector, form).forEach((node) => {
      const handler = () => {
        const fragment = collectQuizData();
        patchLocalCache(fragment);
      };

      node.addEventListener("change", handler);
      node.addEventListener("blur", handler);
    });
  }

  function clearErrors() {
    ["error-name", "error-connectionType", "error-loveLanguage"].forEach((id) => {
      const el = byId(id);
      if (el) el.textContent = "";
    });
  }

  function validate() {
    clearErrors();
    let valid = true;

    if (!getInputValue("name")) {
      const el = byId("error-name");
      if (el) el.textContent = "Please add your name.";
      valid = false;
    }

    if (!getRadio("connectionType")) {
      const el = byId("error-connectionType");
      if (el) el.textContent = "Choose at least one connection type.";
      valid = false;
    }

    if (!getRadio("loveLanguage")) {
      const el = byId("error-loveLanguage");
      if (el) el.textContent = "Select your primary love language.";
      valid = false;
    }

    return valid;
  }

  function firestorePayload(profile, user) {
    const clean = normalizeProfile(profile);

    Object.keys(clean).forEach((key) => {
      if (clean[key] === undefined) delete clean[key];
      if (ARRAY_FIELDS.has(key) && !Array.isArray(clean[key])) clean[key] = normalizeArray(clean[key]);
    });

    return {
      ...clean,
      uid: user.uid,
      email: user.email || clean.email || "",
      profileCompleted: true,
      updatedAt: serverTimestamp()
    };
  }

  async function saveProfile(profile) {
    const user = currentUser || auth.currentUser || await waitForAuthUser();
    const clean = normalizeProfile(profile);

    if (!user) {
      currentProfile = clean;
      saveLocalCache(clean, null);
      console.log("[Soulink] Using local fallback");
      showSaveStatus("Saved to Soulink ✨", true);
      return clean;
    }

    await setDoc(doc(db, "users", user.uid), firestorePayload(clean, user), { merge: true });
    currentUser = user;
    currentProfile = clean;
    saveLocalCache(clean, user);
    console.log("[Soulink] Saved profile to Firestore");
    showSaveStatus("Saved to Soulink ✨", true);
    return clean;
  }

  function bindSubmit() {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!validate()) return;

      const nextUrl = form.getAttribute("data-next") || "edit-profile.html";
      const fragment = collectQuizData();
      patchLocalCache(fragment);

      try {
        await saveProfile(fragment);
        window.setTimeout(() => {
          window.location.href = nextUrl;
        }, 300);
      } catch (err) {
        console.error("[Soulink] Save failed", err);
        showSaveStatus("Save failed — check Console", false);
      }
    });
  }

  async function init() {
    if (initialised) return;
    initialised = true;

    try {
      const profile = await loadSourceProfile();
      prefillFromData(profile);
    } catch (err) {
      console.error("[Soulink] Save failed", err);
      const fallback = readLocalCache(null);
      currentProfile = fallback;
      prefillFromData(fallback);
      console.log("[Soulink] Using local fallback");
    }

    bindAutosave();
    bindSubmit();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
