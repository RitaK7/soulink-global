// Soulink – shared data helpers for soulQuiz storage
// Primary key: "soulink.soulQuiz", fallback: "soulQuiz"

(function (w) {
  const PRIMARY_KEY = "soulink.soulQuiz";
  const LEGACY_KEY = "soulQuiz";

  function safeParse(raw, source) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn("[Soulink] Failed to parse soul data from", source, e);
      return null;
    }
  }

  // Ensure we always have a safe object with expected fields
  function ensureSoulDataShape(data) {
    const base = {
      name: "",
      birthday: "",
      country: "",
      height: "",
      weight: "",
      gender: "",
      genderSelf: "",
      seekingGender: [],
      orientation: "",
      connectionType: "",
      loveLanguage: "",   // primary
      loveLanguages: [],  // multi
      hobbies: [],
      values: [],
      unacceptable: "",
      about: "",
      mantra: "",
      soulSummary: "",
      zodiac: "",
      chineseZodiac: "",
      lifePathNumber: "",
      profilePhoto1: "",
      profilePhoto2: "",
      profilePhoto3: ""
    };

    if (!data || typeof data !== "object") {
      return { ...base };
    }

    return { ...base, ...data };
  }

  function getSoulData(options = { ensureShape: true }) {
    if (typeof w === "undefined" || !w.localStorage) {
      return null;
    }

    let data = null;

    try {
      // 1. Try new key
      data = safeParse(w.localStorage.getItem(PRIMARY_KEY), PRIMARY_KEY);

      // 2. Fallback – old key
      if (!data) {
        data = safeParse(w.localStorage.getItem(LEGACY_KEY), LEGACY_KEY);
      }
    } catch (e) {
      console.warn("[Soulink] Error reading soul data from localStorage", e);
      data = null;
    }

    if (!data) return null;
    return options && options.ensureShape ? ensureSoulDataShape(data) : data;
  }

  function saveSoulData(obj) {
    if (typeof w === "undefined" || !w.localStorage) {
      return;
    }

    if (!obj || typeof obj !== "object") {
      console.warn("[Soulink] saveSoulData called with non-object:", obj);
      return;
    }

    try {
      const json = JSON.stringify(obj);
      w.localStorage.setItem(PRIMARY_KEY, json);
      w.localStorage.setItem(LEGACY_KEY, json);
    } catch (e) {
      console.warn("[Soulink] Failed to save soul data", e);
    }
  }

  // Small helper – update only part of the data
  function patchSoulData(fragment) {
    if (!fragment || typeof fragment !== "object") return;

    const current = getSoulData({ ensureShape: false }) || {};
    const merged = { ...current, ...fragment };
    saveSoulData(merged);
    return merged;
  }

  // Export to global scope so other scripts can use it
  w.getSoulData = getSoulData;
  w.saveSoulData = saveSoulData;
  w.patchSoulData = patchSoulData;
  w.ensureSoulDataShape = ensureSoulDataShape;
})(window);
