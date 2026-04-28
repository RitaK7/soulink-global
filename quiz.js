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
  let authReadyPromise = null;

  const LOVE_LANGUAGE_CANON = [
    "Words of Affirmation",
    "Quality Time",
    "Acts of Service",
    "Physical Touch",
    "Receiving Gifts"
  ];

  const CONNECTION_MAP = {
    romantic: "Romantic relationship",
    friendship: "Friendship",
    both: "Both (romantic & friendship)",
    networking: "Open to any connection",
    "open to any connection": "Open to any connection",
    "both (romantic & friendship)": "Both (romantic & friendship)"
  };

  const GENDER_MAP = {
    woman: "Woman",
    man: "Man",
    nonbinary: "Non-binary",
    "non-binary": "Non-binary",
    "prefer not to say": "Prefer not to say",
    "self-describe": "Self-describe"
  };

  const CONNECT_WITH_MAP = {
    women: "Women",
    men: "Men",
    nonbinary: "Non-binary",
    "non-binary": "Non-binary",
    all: "Open to all",
    "open to all": "Open to all",
    custom: "Custom preference",
    "custom preference": "Custom preference"
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
      if (!clean) return;
      const key = clean.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(clean);
    });

    return out;
  }

  function readLocalProfile() {
    try {
      if (typeof window.getSoulData === "function") {
        const data = window.getSoulData({ ensureShape: false });
        if (data && typeof data === "object") return data;
      }
    } catch (err) {
      console.warn("[Soulink] Local read via data-helpers failed", err);
    }

    try {
      const raw = localStorage.getItem(PRIMARY_KEY) || localStorage.getItem(LEGACY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn("[Soulink] Local read failed", err);
      return {};
    }
  }

  function writeLocalProfile(profile) {
    if (!profile || typeof profile !== "object") return profile;

    try {
      if (typeof window.saveSoulData === "function") {
        window.saveSoulData(profile);
        return profile;
      }
    } catch (err) {
      console.warn("[Soulink] Local write via data-helpers failed", err);
    }

    try {
      const json = JSON.stringify(profile);
      localStorage.setItem(PRIMARY_KEY, json);
      localStorage.setItem(LEGACY_KEY, json);
    } catch (err) {
      console.warn("[Soulink] Local write failed", err);
    }

    return profile;
  }

  function patchLocalProfile(fragment) {
    const current = readLocalProfile() || {};
    const merged = { ...current, ...fragment };
    writeLocalProfile(merged);
    return merged;
  }

  function normalizeLoveLanguageOne(value) {
    const s = lower(value);
    if (!s) return "";

    if (s === "words" || s === "wordsofaffirmation" || s === "words of affirmation") {
      return "Words of Affirmation";
    }
    if (s === "quality" || s === "qualitytime" || s === "quality time") {
      return "Quality Time";
    }
    if (s === "service" || s === "actsofservice" || s === "acts of service") {
      return "Acts of Service";
    }
    if (s === "touch" || s === "physicaltouch" || s === "physical touch") {
      return "Physical Touch";
    }
    if (
      s === "gifts" ||
      s === "gift" ||
      s === "receivinggifts" ||
      s === "receiving gifts" ||
      s === "gifts (receiving)" ||
      s === "gifts/receiving"
    ) {
      return "Receiving Gifts";
    }

    const found = LOVE_LANGUAGE_CANON.find((item) => lower(item) === s);
    return found || norm(value);
  }

  function normalizeLoveLanguages(rawList, rawPrimary) {
    const primary = normalizeLoveLanguageOne(rawPrimary);
    let list = uniq(toArray(rawList).map(normalizeLoveLanguageOne)).filter(Boolean);

    if (primary) {
      list = list.filter((item) => item !== primary);
      list.unshift(primary);
    }

    list = list.filter((item) => LOVE_LANGUAGE_CANON.includes(item));
    return uniq(list);
  }

  function normalizeConnectionType(value) {
    const s = lower(value);
    if (!s) return "";
    return CONNECTION_MAP[s] || norm(value);
  }

  function normalizeGender(value) {
    const s = lower(value);
    if (!s) return "";
    return GENDER_MAP[s] || norm(value);
  }

  function normalizeConnectWithList(values) {
    return uniq(
      toArray(values).map((item) => {
        const s = lower(item);
        return CONNECT_WITH_MAP[s] || norm(item);
      })
    );
  }

  function normalizeOrientation(value) {
    return norm(value);
  }

  function parseBirthday(raw) {
    const value = norm(raw);
    if (!value) return null;

    const digits = value.replace(/[^\d]/g, "");

    if (/^\d{8}$/.test(digits)) {
      let year = Number(digits.slice(0, 4));
      let month = Number(digits.slice(4, 6));
      let day = Number(digits.slice(6, 8));

      let date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return { year, month, day, date };
      }

      day = Number(digits.slice(0, 2));
      month = Number(digits.slice(2, 4));
      year = Number(digits.slice(4, 8));
      date = new Date(year, month - 1, day);

      if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return { year, month, day, date };
      }
    }

    let match = value.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return { year, month, day, date };
      }
    }

    match = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (match) {
      const day = Number(match[1]);
      const month = Number(match[2]);
      const year = Number(match[3]);
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return { year, month, day, date };
      }
    }

    return null;
  }

  function calculateAge(parts) {
    if (!parts || !parts.date) return "";
    const now = new Date();
    let age = now.getFullYear() - parts.year;
    const m = now.getMonth() - (parts.month - 1);
    if (m < 0 || (m === 0 && now.getDate() < parts.day)) age -= 1;
    return age >= 0 && age < 130 ? age : "";
  }

  function computeZodiac(parts) {
    if (!parts) return "";
    const { month, day } = parts;

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

  function computeChineseZodiac(parts) {
    if (!parts || !parts.year) return "";
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
    const index = (parts.year - 1900) % 12;
    return animals[(index + 12) % 12] || "";
  }

  function computeLifePath(rawBirthday) {
    const digits = norm(rawBirthday).replace(/\D/g, "");
    if (!digits) return "";

    const sumDigits = (text) =>
      text.split("").reduce((acc, char) => acc + Number(char || 0), 0);

    let n = sumDigits(digits);
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
      n = sumDigits(String(n));
    }
    return n ? String(n) : "";
  }

  function normalizeProfile(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const birthday = norm(source.birthday || source.birthdate);
    const connectWith = normalizeConnectWithList(
      source.connectWith ||
      source.seekingGender ||
      source.matchPreference ||
      []
    );

    const hobbies = uniq(toArray(source.hobbies || source.interests));
    const values = uniq(toArray(source.values));

    const loveLanguages = normalizeLoveLanguages(
      source.loveLanguages || source.loveLanguage || [],
      source.loveLanguage || (Array.isArray(source.loveLanguages) ? source.loveLanguages[0] : "")
    );

    const genderRaw = norm(source.genderSelf || source.gender);
    let gender = "";
    let genderSelf = "";

    if (genderRaw) {
      const normalizedGender = normalizeGender(genderRaw);
      if (normalizedGender === "Self-describe") {
        gender = "";
      } else if (["Woman", "Man", "Non-binary", "Prefer not to say"].includes(normalizedGender)) {
        gender = normalizedGender;
      } else {
        gender = normalizedGender;
        genderSelf = normalizedGender;
      }
    }

    if (!genderSelf && norm(source.genderSelf)) {
      genderSelf = norm(source.genderSelf);
    }

    const parts = parseBirthday(birthday);

    const normalized = {
      uid: norm(source.uid),
      email: norm(source.email),
      name: norm(source.name),
      country: norm(source.country),
      birthday,
      height: norm(source.height),
      weight: norm(source.weight),
      kg: norm(source.kg || source.weightKg),
      connectionType: normalizeConnectionType(source.connectionType),
      loveLanguages,
      loveLanguage: loveLanguages[0] || "",
      gender: gender || normalizeGender(source.gender),
      genderSelf,
      connectWith,
      seekingGender: connectWith,
      connectWithCustom: norm(source.connectWithCustom),
      orientation: normalizeOrientation(source.orientation || source.orientationText || source.orientationChoice),
      hobbies,
      interests: hobbies,
      values,
      unacceptable: norm(
        source.unacceptable ||
        source.boundaries ||
        source.unacceptableBehavior ||
        source.notAllowed ||
        source.noGo
      ),
      boundaries: norm(
        source.boundaries ||
        source.unacceptable ||
        source.unacceptableBehavior ||
        source.notAllowed ||
        source.noGo
      ),
      about: norm(source.about || source.aboutMe),
      aboutMe: norm(source.aboutMe || source.about),
      mantra: norm(source.mantra),
      spiritualBeliefs: norm(source.spiritualBeliefs),
      soulSummary: norm(source.soulSummary),
      profilePhoto1: norm(source.profilePhoto1),
      profilePhoto2: norm(source.profilePhoto2),
      profilePhoto3: norm(source.profilePhoto3),
      mainPhotoSlot: source.mainPhotoSlot || source.primaryPhotoSlot || null,
      primaryPhotoSlot: source.mainPhotoSlot || source.primaryPhotoSlot || null,
      zodiac: norm(source.zodiac) || computeZodiac(parts),
      chineseZodiac: norm(source.chineseZodiac) || computeChineseZodiac(parts),
      lifePath: norm(source.lifePath || source.lifePathNumber) || computeLifePath(birthday),
      lifePathNumber: norm(source.lifePathNumber || source.lifePath) || computeLifePath(birthday),
      age: norm(source.age) || String(calculateAge(parts) || ""),
      profileCompleted: !!source.profileCompleted
    };

    return normalized;
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

  function waitForAuthUser(timeoutMs = 5000) {
    if (authReadyPromise) return authReadyPromise;

    authReadyPromise = new Promise((resolve) => {
      if (auth.currentUser) {
        currentUser = auth.currentUser;
        console.log("[Soulink] Auth user ready");
        resolve(auth.currentUser);
        return;
      }

      let settled = false;

      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        unsubscribe();
        currentUser = auth.currentUser || null;
        if (currentUser) {
          console.log("[Soulink] Auth user ready");
        }
        resolve(currentUser);
      }, timeoutMs);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        unsubscribe();
        currentUser = user || null;
        if (currentUser) {
          console.log("[Soulink] Auth user ready");
        }
        resolve(currentUser);
      });
    });

    return authReadyPromise;
  }

  async function loadProfileSource() {
    const localProfile = normalizeProfile(readLocalProfile());

    const user = await waitForAuthUser();

    if (!user) {
      console.log("[Soulink] Using local fallback");
      return localProfile;
    }

    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const firestoreProfile = normalizeProfile({
          ...snap.data(),
          uid: user.uid,
          email: user.email || snap.data().email || ""
        });

        currentProfile = firestoreProfile;
        writeLocalProfile(firestoreProfile);
        console.log("[Soulink] Loaded profile from Firestore");
        return firestoreProfile;
      }
    } catch (err) {
      console.error("[Soulink] Firestore load failed", err);
    }

    const fallback = normalizeProfile({
      ...localProfile,
      uid: user.uid,
      email: user.email || localProfile.email || ""
    });

    writeLocalProfile(fallback);
    console.log("[Soulink] Using local fallback");
    return fallback;
  }

  function getInputValue(id) {
    const el = byId(id);
    return el ? norm(el.value) : "";
  }

  function setInputValue(id, value) {
    const el = byId(id);
    if (el) el.value = value != null ? String(value) : "";
  }

  function getSelectedRadioValue(name) {
    const checked =
      $(`input[type="radio"][name="${name}"]:checked`, form) ||
      $(`input[type="radio"][name="${name}[]"]:checked`, form);
    return checked ? norm(checked.value) : "";
  }

  function setSelectedRadioValue(name, value) {
    const wanted = norm(value);
    const radios = $$(
      `input[type="radio"][name="${name}"], input[type="radio"][name="${name}[]"]`,
      form
    );

    radios.forEach((radio) => {
      radio.checked = norm(radio.value) === wanted;
    });
  }

  function getCheckedValues(name) {
    return $$(
      `input[type="checkbox"][name="${name}"]:checked, input[type="checkbox"][name="${name}[]"]:checked`,
      form
    ).map((node) => norm(node.value)).filter(Boolean);
  }

  function setCheckedValues(name, values) {
    const set = new Set(toArray(values).map((item) => norm(item)));
    const boxes = $$(
      `input[type="checkbox"][name="${name}"], input[type="checkbox"][name="${name}[]"]`,
      form
    );

    boxes.forEach((box) => {
      box.checked = set.has(norm(box.value));
    });
  }

  function firstExistingInputValue(ids) {
    for (const id of ids) {
      const el = byId(id);
      if (el && norm(el.value)) return norm(el.value);
    }
    return "";
  }

  function setFirstExistingInputValue(ids, value) {
    for (const id of ids) {
      const el = byId(id);
      if (el) {
        el.value = value != null ? String(value) : "";
        return true;
      }
    }
    return false;
  }

  function prefillFromProfile(profile) {
    currentProfile = normalizeProfile(profile);

    setInputValue("name", currentProfile.name);
    setInputValue("country", currentProfile.country);
    setInputValue("birthday", currentProfile.birthday);
    setInputValue("height", currentProfile.height);
    setInputValue("weight", currentProfile.weight);
    setInputValue("kg", currentProfile.kg);
    setInputValue("genderSelf", currentProfile.genderSelf);
    setInputValue("connectWithCustom", currentProfile.connectWithCustom);
    setInputValue("about", currentProfile.about);
    setInputValue("aboutMe", currentProfile.aboutMe);
    setInputValue("mantra", currentProfile.mantra);
    setInputValue("spiritualBeliefs", currentProfile.spiritualBeliefs);
    setInputValue("soulSummary", currentProfile.soulSummary);
    setInputValue("zodiac", currentProfile.zodiac);
    setInputValue("chineseZodiac", currentProfile.chineseZodiac);
    setInputValue("lifePathNumber", currentProfile.lifePathNumber);

    const connectionValue =
      currentProfile.connectionType ||
      firstExistingInputValue(["connectionType"]);

    if (connectionValue) {
      setSelectedRadioValue("connectionType", connectionValue);
      setInputValue("connectionType", connectionValue);
    }

    if (currentProfile.gender) {
      setSelectedRadioValue("gender", currentProfile.gender);
      setInputValue("gender", currentProfile.gender);
    }

    if (currentProfile.orientation) {
      setSelectedRadioValue("orientation", currentProfile.orientation);
      setInputValue("orientation", currentProfile.orientation);
      setInputValue("orientationText", currentProfile.orientation);
      setInputValue("orientationChoice", currentProfile.orientation);
      const orientationSelect =
        byId("orientation") ||
        form.querySelector('select[name="orientation"]') ||
        form.querySelector('select[name="orientationText"]') ||
        form.querySelector('select[name="orientationChoice"]');
      if (orientationSelect) orientationSelect.value = currentProfile.orientation;
    }

    if (currentProfile.loveLanguage) {
      setSelectedRadioValue("loveLanguage", currentProfile.loveLanguage);
      setInputValue("loveLanguage", currentProfile.loveLanguage);
    }

    setCheckedValues("loveLanguages", currentProfile.loveLanguages);
    setCheckedValues("hobbies", currentProfile.hobbies);
    setCheckedValues("values", currentProfile.values);
    setCheckedValues("connectWith", currentProfile.connectWith);
    setCheckedValues("seekingGender", currentProfile.seekingGender);

    if (!currentProfile.connectWith.length && currentProfile.connectWithCustom) {
      setCheckedValues("connectWith", ["Custom preference"]);
      setCheckedValues("seekingGender", ["Custom preference"]);
    }
  }

  function collectQuizData() {
    const birthday = firstExistingInputValue(["birthday", "birthdate"]);
    const parts = parseBirthday(birthday);

    let connectionType =
      getSelectedRadioValue("connectionType") ||
      firstExistingInputValue(["connectionType"]);

    connectionType = normalizeConnectionType(connectionType);

    let loveLanguage =
      getSelectedRadioValue("loveLanguage") ||
      firstExistingInputValue(["loveLanguage"]);

    loveLanguage = normalizeLoveLanguageOne(loveLanguage);

    let loveLanguages = getCheckedValues("loveLanguages");
    if (!loveLanguages.length && loveLanguage) loveLanguages = [loveLanguage];
    loveLanguages = normalizeLoveLanguages(loveLanguages, loveLanguage);

    if (!loveLanguage && loveLanguages[0]) {
      loveLanguage = loveLanguages[0];
    }

    let connectWith = getCheckedValues("connectWith");
    const seekingGender = getCheckedValues("seekingGender");
    if (!connectWith.length && seekingGender.length) connectWith = seekingGender;

    connectWith = normalizeConnectWithList(connectWith);
    const normalizedSeekingGender = normalizeConnectWithList(seekingGender.length ? seekingGender : connectWith);

    const orientationValue =
      getSelectedRadioValue("orientation") ||
      firstExistingInputValue(["orientation", "orientationText", "orientationChoice"]);

    const genderValue =
      getSelectedRadioValue("gender") ||
      firstExistingInputValue(["gender"]);

    const aboutValue = firstExistingInputValue(["about", "aboutMe"]);

    const profile = normalizeProfile({
      ...currentProfile,
      name: getInputValue("name"),
      country: getInputValue("country"),
      birthday,
      height: getInputValue("height"),
      weight: getInputValue("weight"),
      kg: getInputValue("kg"),
      connectionType,
      loveLanguages,
      loveLanguage,
      gender: normalizeGender(genderValue),
      genderSelf: getInputValue("genderSelf"),
      connectWith,
      seekingGender: normalizedSeekingGender,
      connectWithCustom: getInputValue("connectWithCustom"),
      orientation: normalizeOrientation(orientationValue),
      orientationText: normalizeOrientation(orientationValue),
      orientationChoice: normalizeOrientation(orientationValue),
      hobbies: uniq(getCheckedValues("hobbies")),
      interests: uniq(getCheckedValues("hobbies")),
      values: uniq(getCheckedValues("values")),
      unacceptable: firstExistingInputValue(["unacceptable", "boundaries", "unacceptableBehavior", "notAllowed", "noGo"]),
      boundaries: firstExistingInputValue(["boundaries", "unacceptable", "unacceptableBehavior", "notAllowed", "noGo"]),
      about: aboutValue,
      aboutMe: aboutValue,
      mantra: getInputValue("mantra"),
      spiritualBeliefs: getInputValue("spiritualBeliefs"),
      soulSummary: getInputValue("soulSummary"),
      zodiac: getInputValue("zodiac") || computeZodiac(parts),
      chineseZodiac: getInputValue("chineseZodiac") || computeChineseZodiac(parts),
      lifePath: computeLifePath(birthday),
      lifePathNumber: getInputValue("lifePathNumber") || computeLifePath(birthday),
      age: String(calculateAge(parts) || ""),
      profilePhoto1: norm(currentProfile.profilePhoto1),
      profilePhoto2: norm(currentProfile.profilePhoto2),
      profilePhoto3: norm(currentProfile.profilePhoto3),
      mainPhotoSlot: currentProfile.mainPhotoSlot || currentProfile.primaryPhotoSlot || null,
      primaryPhotoSlot: currentProfile.mainPhotoSlot || currentProfile.primaryPhotoSlot || null,
      profileCompleted: true
    });

    return profile;
  }

  async function saveProfile(profile, options = {}) {
    const normalized = normalizeProfile(profile);

    currentProfile = normalized;
    writeLocalProfile(normalized);

    const user = await waitForAuthUser();

    if (!user) {
      console.log("[Soulink] Using local fallback");
      return normalized;
    }

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          ...normalized,
          uid: user.uid,
          email: user.email || normalized.email || "",
          updatedAt: serverTimestamp(),
          profileCompleted: true
        },
        { merge: true }
      );

      const finalProfile = {
        ...normalized,
        uid: user.uid,
        email: user.email || normalized.email || ""
      };

      currentProfile = finalProfile;
      writeLocalProfile(finalProfile);
      console.log("[Soulink] Saved profile to Firestore");

      if (options.showToast) {
        showSaveStatus("Saved to Soulink ✨", true);
      }

      return finalProfile;
    } catch (err) {
      console.error("[Soulink] Save failed", err);
      if (options.showToast) {
        showSaveStatus("Save failed — check Console", false);
      }
      throw err;
    }
  }

  function bindAutosave() {
    const watched = $$("input, select, textarea", form);

    watched.forEach((node) => {
      const eventName =
        node.type === "checkbox" || node.type === "radio" || node.tagName === "SELECT"
          ? "change"
          : "input";

      node.addEventListener(eventName, () => {
        const fragment = collectQuizData();
        currentProfile = fragment;
        patchLocalProfile(fragment);
      });
    });
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
    const profile = collectQuizData();

    if (!profile.name) {
      const el = byId("error-name");
      if (el) el.textContent = "Please add your name.";
      valid = false;
    }

    if (!profile.connectionType) {
      const el = byId("error-connectionType");
      if (el) el.textContent = "Choose at least one connection type.";
      valid = false;
    }

    if (!profile.loveLanguage) {
      const el = byId("error-loveLanguage");
      if (el) el.textContent = "Select your primary love language.";
      valid = false;
    }

    return valid;
  }

  function bindSubmit() {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!validate()) return;

      const nextUrl = form.getAttribute("data-next") || "edit-profile.html";
      const profile = collectQuizData();

      try {
        await saveProfile(profile, { showToast: true });
      } catch (err) {
      } finally {
        window.location.href = nextUrl;
      }
    });
  }

  async function init() {
    const profile = await loadProfileSource();
    prefillFromProfile(profile);
    bindAutosave();
    bindSubmit();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init().catch((err) => {
        console.error("[Soulink] Quiz init failed", err);
      });
    });
  } else {
    init().catch((err) => {
      console.error("[Soulink] Quiz init failed", err);
    });
  }
})();