// quiz.js — Soulink Core Quiz Flow
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
      if (typeof getSoulData === "function" && typeof saveSoulData === "function") {
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

  // ---------- Prefill from existing data ----------

  function prefillFromData() {
    const data = safeGetSoulData();
    if (!data) return;

    // Basic identity
    setInputValue("name", data.name || "");
    setInputValue("birthday", data.birthday || "");
    setInputValue("country", data.country || "");
    setInputValue("height", data.height || "");
    setInputValue("weight", data.weight || "");
    setInputValue("genderSelf", data.genderSelf || "");

    // Relationship / orientation
    setRadio("gender", data.gender || data.genderSelf || "");
    setRadio("connectionType", data.connectionType || "");
    setRadio("orientation", data.orientation || "");

    // Love languages
    setRadio("loveLanguage", data.loveLanguage || "");
    setChecks("loveLanguages", data.loveLanguages || []);

    // Hobbies & values
    setChecks("hobbies", data.hobbies || []);
    setChecks("values", data.values || []);

    // Text areas
    setInputValue("unacceptable", data.unacceptable || "");
    setInputValue("about", data.about || "");
    setInputValue("mantra", data.mantra || "");
    setInputValue("soulSummary", data.soulSummary || "");

    // Hidden / computed fields if present
    setInputValue("zodiac", data.zodiac || "");
    setInputValue("chineseZodiac", data.chineseZodiac || "");
    setInputValue("lifePathNumber", data.lifePathNumber || "");
  }

  // ---------- Collect data from form ----------

  function collectQuizData() {
    // Basic identity
    const name = getInputValue("name");
    const birthday = getInputValue("birthday"); // text field (not date picker)
    const country = getInputValue("country");
    const height = getInputValue("height");
    const weight = getInputValue("weight");
    const genderSelf = getInputValue("genderSelf");

    // Relationship / orientation
    const gender = getRadio("gender");
    const connectionType = getRadio("connectionType");
    const orientation = getRadio("orientation") || getInputValue("orientation");

    // Love languages
    const loveLanguage = getRadio("loveLanguage");
    const loveLanguages = getChecks("loveLanguages");

    // Hobbies & values
    const hobbies =
      getChecks("hobbies").length > 0 ? getChecks("hobbies") : getChecks("hobbies[]");
    const values =
      getChecks("values").length > 0 ? getChecks("values") : getChecks("values[]");

    // Text areas
    const unacceptable = getInputValue("unacceptable");
    const about = getInputValue("about");
    const mantra = getInputValue("mantra");
    const soulSummary = getInputValue("soulSummary");

    // Hidden / computed fields if they exist in the DOM
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
      loveLanguage,
      loveLanguages,
      hobbies,
      values,
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
      "orientation",
      "unacceptable",
      "about",
      "genderSelf",
      "mantra",
      "soulSummary",
      "zodiac",
      "chineseZodiac",
      "lifePathNumber",
    ];

    textIds.forEach((id) => {
      const el = byId(id);
      if (!el) return;
      el.addEventListener("change", () => {
        const fragment = collectQuizData();
        safePatchSoulData(fragment);
      });
      el.addEventListener("blur", () => {
        const fragment = collectQuizData();
        safePatchSoulData(fragment);
      });
    });

    // Radio groups
    [
      "gender",
      "connectionType",
      "orientation",
      "loveLanguage",
    ].forEach((name) => {
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
    });

    // Checkbox groups
    [
      "loveLanguages",
      "hobbies",
      "values",
      "hobbies[]",
      "values[]",
    ].forEach((name) => {
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

  // ---------- Submit handling ----------

  function bindSubmit() {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const fragment = collectQuizData();
      safePatchSoulData(fragment);

      // Determine next page: use ?next=... or data-next attribute, else my-soul.html
      let nextUrl = "my-soul.html";
      try {
        const url = new URL(window.location.href);
        const nextParam = url.searchParams.get("next");
        if (nextParam) {
          nextUrl = nextParam;
        }
      } catch {
        // ignore
      }

      const attrNext = form.getAttribute("data-next");
      if (attrNext) {
        nextUrl = attrNext;
      }

      // Optionally show a micro feedback (non-intrusive)
      // Then redirect
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
