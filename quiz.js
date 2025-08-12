// quiz.js — Soulink (golden)
// Loads/saves the quiz form to localStorage key "soulQuiz"
// Birthdate is a free-text YYYY-MM-DD field with regex validation.

(function () {
  const KEY = "soulQuiz";
  const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

  // Form + fields
  const form =
    document.getElementById("quizForm") ||
    document.getElementById("quiz-form") ||
    document.querySelector("form");

  if (!form) {
    console.warn("quiz.js: form not found.");
    return;
  }

  // Helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const getEl = (id) => document.getElementById(id);

  function safeParse(v) {
    try {
      return JSON.parse(v) || {};
    } catch {
      return {};
    }
  }

  function loadData() {
    return safeParse(localStorage.getItem(KEY));
  }

  function saveData(obj) {
    localStorage.setItem(KEY, JSON.stringify(obj));
  }

  function setInputValue(id, val) {
    const el = getEl(id);
    if (!el) return;
    if (
      el.tagName === "SELECT" ||
      el.tagName === "TEXTAREA" ||
      el.type === "text" ||
      el.type === "number"
    ) {
      el.value = val ?? "";
    }
  }

  function setRadio(name, value) {
    // Support both name="hobbies" and name="hobbies[]"
    const nodes = $$(`input[type="radio"][name="${name}"], input[type="radio"][name="${name}[]"]`);
    nodes.forEach((n) => (n.checked = String(n.value) === String(value)));
  }

  function setChecks(name, values) {
    const set = new Set(Array.isArray(values) ? values.map(String) : []);
    const nodes = $$(
      `input[type="checkbox"][name="${name}"], input[type="checkbox"][name="${name}[]"]`
    );
    nodes.forEach((n) => (n.checked = set.has(String(n.value))));
  }

  function getInputValue(id) {
    const el = getEl(id);
    if (!el) return "";
    if (el.type === "number") return el.value ? Number(el.value) : "";
    return (el.value || "").trim();
  }

  function getRadio(name) {
    const node =
      $(`input[type="radio"][name="${name}"]:checked`) ||
      $(`input[type="radio"][name="${name}[]"]:checked`);
    return node ? node.value : "";
  }

  function getChecks(name) {
    return $$(
      `input[type="checkbox"][name="${name}"]:checked, input[type="checkbox"][name="${name}[]"]:checked`
    ).map((n) => n.value);
  }

  function optionExists(select, value) {
    return Array.from(select.options).some((o) => String(o.value) === String(value));
  }

  // ----- Load existing data into the form
  const data = loadData();

  // Basic text/number fields present on the quiz
  const textFields = ["name", "birthday", "country", "height", "weight", "unacceptable", "about"];
  textFields.forEach((id) => {
    // Special handling for <select id="country">
    if (id === "country") {
      const sel = getEl("country");
      if (sel && optionExists(sel, data.country)) sel.value = data.country;
      return;
    }
    setInputValue(id, data[id]);
  });

  // Radios
  setRadio("connectionType", data.connectionType);
  setRadio("loveLanguage", data.loveLanguage);

  // Checkbox groups (names may be "hobbies" / "hobbies[]", "values" / "values[]")
  setChecks("hobbies", data.hobbies);
  setChecks("values", data.values);

  // Optional: clear native validation bubble on typing
  const birthdayEl = getEl("birthday");
  if (birthdayEl) {
    birthdayEl.addEventListener("input", () => birthdayEl.setCustomValidity(""));
  }

  // ----- Submit/save handler
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Collect values
    const payload = {
      name: getInputValue("name"),
      birthday: getInputValue("birthday"),
      country: getInputValue("country"),
      height: getInputValue("height"),
      weight: getInputValue("weight"),
      connectionType: getRadio("connectionType"),
      loveLanguage: getRadio("loveLanguage"),
      hobbies: getChecks("hobbies"),
      values: getChecks("values"),
      unacceptable: getInputValue("unacceptable"),
      about: getInputValue("about"),
    };

    // Basic validations
    if (!payload.name) {
      alert("Please enter your name.");
      getEl("name")?.focus();
      return;
    }

    if (birthdayEl) {
      const b = (payload.birthday || "").trim();
      if (!DATE_RE.test(b)) {
        birthdayEl.setCustomValidity("Please use YYYY-MM-DD (e.g., 1972-11-22)");
        birthdayEl.reportValidity();
        return;
      }
    }

    if (!payload.connectionType) {
      alert("Please select your connection type.");
      return;
    }

    if (!payload.loveLanguage) {
      alert("Please select your primary love language.");
      return;
    }

    // Merge with existing (so we don't lose things saved elsewhere, e.g., photos)
    const current = loadData();
    const merged = { ...current, ...payload };

    saveData(merged);

    // Optional: visual confirmation
    // alert("Saved ✓");

    // Navigate to next page (matches your button label)
    window.location.href = "edit-profile.html";
  });

  // Optional autosave on change (comment out if you don't want it)
  const autosave = (evt) => {
    try {
      // Reuse submit logic lightly without navigation
      const temp = new Event("submit");
      temp.preventDefault = () => {};
      // Collect & merge
      const current = loadData();
      const p = {
        name: getInputValue("name"),
        birthday: getInputValue("birthday"),
        country: getInputValue("country"),
        height: getInputValue("height"),
        weight: getInputValue("weight"),
        connectionType: getRadio("connectionType"),
        loveLanguage: getRadio("loveLanguage"),
        hobbies: getChecks("hobbies"),
        values: getChecks("values"),
        unacceptable: getInputValue("unacceptable"),
        about: getInputValue("about"),
      };
      localStorage.setItem(KEY, JSON.stringify({ ...current, ...p }));
    } catch (e) {
      console.warn("Autosave failed:", e);
    }
  };

  // Attach autosave to key fields
  [
    "name",
    "birthday",
    "country",
    "height",
    "weight",
    "unacceptable",
    "about",
  ].forEach((id) => getEl(id)?.addEventListener("change", autosave));
  $$('input[name="connectionType"], input[name="connectionType[]"]').forEach((n) =>
    n.addEventListener("change", autosave)
  );
  $$('input[name="loveLanguage"], input[name="loveLanguage[]"]').forEach((n) =>
    n.addEventListener("change", autosave)
  );
  $$('input[name="hobbies"], input[name="hobbies[]"], input[name="values"], input[name="values[]"]').forEach(
    (n) => n.addEventListener("change", autosave)
  );
})();
