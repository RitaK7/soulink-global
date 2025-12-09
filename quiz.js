// quiz.js — Soulink Core Quiz Flow (refined)
// Uses shared helpers: getSoulData, saveSoulData, patchSoulData (from data-helpers.js)

(function () {
  const form =
    document.getElementById("quizForm") ||
    document.getElementById("quiz-form") ||
    document.querySelector("form");

  if (!form) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));
  const byId = (id) => document.getElementById(id);

  // ---------- Generic helpers ----------

  function getInputValue(id) {
    const el = byId(id);
    if (!el) return "";
    return (el.value || "").trim();
  }

  function setInputValue(id, value) {
    const el = byId(id);
    if (!el) return;
    el.value = value != null ? String(value) : "";
  }

  function getSelectValue(id) {
    const el = byId(id);
    if (!el) return "";
    return (el.value || "").trim();
  }

  function setSelectValue(id, value) {
    const el = byId(id);
    if (!el) return;
    const v = value != null ? String(value) : "";
    el.value = v;
  }

  function getRadio(name) {
    const node =
      $(`input[type="radio"][name="${name}"]:checked`) ||
      $(`input[type="radio"][name="${name}[]"]:checked`);
    return node ? node.value : "";
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
    return nodes.map((n) => n.value);
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

  // Safely call shared helpers in case they are not defined for some reason
  function safeGetSoulData() {
    try {
      if (typeof getSoulData === "function") {
        return getSoulData({ ensureShape: true });
      }
    } catch (e) {
      console.warn("[Soulink][quiz] getSoulData failed", e);
    }
    return null;
  }

  function safePatchSoulData(fragment) {
    try {
      if (typeof patchSoulData === "function") {
        return patchSoulData(fragment);
      }
      // Fallback: if patchSoulData is missing but saveSoulData exists
      if (
        typeof getSoulData === "function" &&
        typeof saveSoulData === "function"
      ) {
        const current = getSoulData({ ensureShape: false }) || {};
        const merged = Object.assign({}, current, fragment);
        saveSoulData(merged);
        return merged;
      }
    } catch (e) {
      console.warn("[Soulink][quiz] patchSoulData failed", e);
    }
    return null;
  }

  // ---------- Derived data: Birthday → Zodiac, Chinese Zodiac, Life Path ----------

  function parseBirthday(text) {
    if (!text) return null;
    const raw = text.trim();

    // YYYY-MM-DD
    let m = raw.match(/^(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})$/);
    if (m) {
      const year = parseInt(m[1], 10);
      const month = parseInt(m[2], 10);
      const day = parseInt(m[3], 10);
      if (year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return { year, month, day };
      }
    }

    // DD.MM.YYYY or DD/MM/YYYY
    m = raw.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10);
      const year = parseInt(m[3], 10);
      if (year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return { year, month, day };
      }
    }

    return null;
  }

  function computeZodiacSign(parts) {
    if (!parts) return "";
    const { day, month } = parts;
    // Western zodiac (approximate, standard cutoffs)
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20))
      return "Taurus";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20))
      return "Gemini";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22))
      return "Cancer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22))
      return "Leo";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22))
      return "Virgo";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22))
      return "Libra";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21))
      return "Scorpio";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21))
      return "Sagittarius";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19))
      return "Capricorn";
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18))
      return "Aquarius";
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20))
      return "Pisces";
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
      "Pig",
    ];
    const index = (year - 1900) % 12;
    const normalizedIndex = ((index % 12) + 12) % 12;
    return animals[normalizedIndex];
  }

  function computeLifePathNumber(parts) {
    if (!parts) return "";
    const digits = `${parts.year}${String(parts.month).padStart(
      2,
      "0"
    )}${String(parts.day).padStart(2, "0")}`.replace(/[^0-9]/g, "");
    if (!digits) return "";

    function sumDigits(str) {
      return str.split("").reduce((acc, ch) => acc + parseInt(ch, 10), 0);
    }

    let n = sumDigits(digits);
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
      n = sumDigits(String(n));
    }
    return String(n);
  }

  function updateDerivedFromBirthday() {
    const birthdayText = getInputValue("birthday");
    const parsed = parseBirthday(birthdayText);
    if (!parsed) {
      setInputValue("zodiac", "");
      setInputValue("chineseZodiac", "");
      setInputValue("lifePathNumber", "");
      return;
    }
    const zodiac = computeZodiacSign(parsed);
    const chinese = computeChineseZodiac(parsed.year);
    const lifePath = computeLifePathNumber(parsed);

    setInputValue("zodiac", zodiac);
    setInputValue("chineseZodiac", chinese);
    setInputValue("lifePathNumber", lifePath);
  }

  // ---------- Prefill from existing data ----------

  function prefillFromData() {
    const data = safeGetSoulData();
    if (!data) return;

    // Basic identity
    setInputValue("name", data.name || "");
    setInputValue("birthday", data.birthday || "");
    setSelectValue("country", data.country || "");
    setInputValue("height", data.height || "");
    setInputValue("weight", data.weight || "");
    setInputValue("genderSelf", data.genderSelf || "");

    // Relationship / orientation
    setRadio("gender", data.gender || data.genderSelf || "");
    setRadio("connectionType", data.connectionType || "");
    setRadio("orientation", data.orientation || "");
    setInputValue("orientationText", data.orientationText || "");

    // Love languages
    setRadio("loveLanguage", data.loveLanguage || "");
    setChecks("loveLanguages", data.loveLanguages || []);

    // Hobbies & values
    setChecks("hobbies", data.hobbies || []);
    setChecks("values", data.values || []);
    setInputValue("hobbiesExtra", data.hobbiesExtra || "");
    setInputValue("valuesExtra", data.valuesExtra || "");

    // Text areas
    setInputValue("unacceptable", data.unacceptable || "");
    setInputValue("about", data.about || "");
    setInputValue("mantra", data.mantra || "");
    setInputValue("soulSummary", data.soulSummary || "");

    // Hidden / computed fields if present
    setInputValue("zodiac", data.zodiac || "");
    setInputValue("chineseZodiac", data.chineseZodiac || "");
    setInputValue("lifePathNumber", data.lifePathNumber || "");

    // If derived fields missing but birthday exists, compute them now
    if (getInputValue("birthday") && !getInputValue("zodiac")) {
      updateDerivedFromBirthday();
    }
  }

  // ---------- Collect data from form ----------

  function collectQuizData() {
    // Basic identity
    const name = getInputValue("name");
    const birthday = getInputValue("birthday"); // text field (not date picker)
    const country = getSelectValue("country");
    const height = getInputValue("height");
    const weight = getInputValue("weight");
    const genderSelf = getInputValue("genderSelf");

    // Relationship / orientation
    const gender = getRadio("gender");
    const connectionType = getRadio("connectionType");
    const orientationChoice = getRadio("orientation");
    const orientationText = getInputValue("orientationText");
    const orientation = orientationChoice || orientationText;

    // Love languages
    const loveLanguage = getRadio("loveLanguage");
    const loveLanguages = getChecks("loveLanguages");

    // Hobbies & values
    const hobbies = getChecks("hobbies");
    const values = getChecks("values");
    const hobbiesExtra = getInputValue("hobbiesExtra");
    const valuesExtra = getInputValue("valuesExtra");

    // Text areas
    const unacceptable = getInputValue("unacceptable");
    const about = getInputValue("about");
    const mantra = getInputValue("mantra");
    const soulSummary = getInputValue("soulSummary");

    // Hidden / computed fields
    const zodiac = getInputValue("zodiac");
    const chineseZodiac = getInputValue("chineseZodiac");
    const lifePathNumber = getInputValue("lifePathNumber");

    const fragment = {
      name,
      birthday,
      country,
      height,
      weight,
      genderSelf,
      gender,
      connectionType,
      orientation,
      orientationChoice,
      orientationText,
      loveLanguage,
      loveLanguages,
      hobbies,
      values,
      hobbiesExtra,
      valuesExtra,
      unacceptable,
      about,
      mantra,
      soulSummary,
      zodiac,
      chineseZodiac,
      lifePathNumber,
    };

    return fragment;
  }

  // ---------- Autosave on change ----------

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
      "valuesExtra",
      "zodiac",
      "chineseZodiac",
      "lifePathNumber",
    ];

    textIds.forEach((id) => {
      const el = byId(id);
      if (!el) return;
      el.addEventListener("change", () => {
        if (id === "birthday") {
          updateDerivedFromBirthday();
        }
        const fragment = collectQuizData();
        safePatchSoulData(fragment);
      });
      el.addEventListener("blur", () => {
        if (id === "birthday") {
          updateDerivedFromBirthday();
        }
        const fragment = collectQuizData();
        safePatchSoulData(fragment);
      });
    });

    // Radio groups
    ["gender", "connectionType", "orientation", "loveLanguage"].forEach(
      (name) => {
        const radios = $$(
          `input[type="radio"][name="${name}"], input[type="radio"][name="${name}[]"]`
        );
        if (!radios.length) return;
        radios.forEach((n) => {
          n.addEventListener("change", () => {
            const fragment = collectQuizData();
            safePatchSoulData(fragment);
          });
        });
      }
    );

    // Checkbox groups
    ["loveLanguages", "hobbies", "values"].forEach((name) => {
      const boxes = $$(
        `input[type="checkbox"][name="${name}"], input[type="checkbox"][name="${name}[]"]`
      );
      if (!boxes.length) return;
      boxes.forEach((n) => {
        n.addEventListener("change", () => {
          const fragment = collectQuizData();
          safePatchSoulData(fragment);
        });
      });
    });
  }

  // ---------- Validation ----------

  function clearErrors() {
    const errorEls = [
      byId("error-name"),
      byId("error-connectionType"),
      byId("error-loveLanguage"),
    ];
    errorEls.forEach((el) => {
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

  // ---------- Submit handling ----------

  function bindSubmit() {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!validate()) {
        // Do not submit if required fields missing
        return;
      }

      const fragment = collectQuizData();
      safePatchSoulData(fragment);

      // Determine next page: use data-next if present, else edit-profile.html
      let nextUrl = "edit-profile.html";
      const attrNext = form.getAttribute("data-next");
      if (attrNext) {
        nextUrl = attrNext;
      }

      window.location.href = nextUrl;
    });
  }

  // ---------- Init ----------

  function init() {
    prefillFromData();
    bindAutosave();
    bindSubmit();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
