// quiz.js — Soulink (golden + gender)
// Loads/saves the quiz form to localStorage key "soulQuiz"

(function () {
  const KEY = "soulQuiz";
  const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

  const form =
    document.getElementById("quizForm") ||
    document.getElementById("quiz-form") ||
    document.querySelector("form");
  if (!form) return;

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const getEl = (id) => document.getElementById(id);

  const parse = (v)=>{ try { return JSON.parse(v)||{}; } catch { return {}; } };
  const load = () => parse(localStorage.getItem(KEY));
  const save = (obj) => localStorage.setItem(KEY, JSON.stringify(obj));

  function setInputValue(id, val){
    const el = getEl(id); if(!el) return;
    if (el.tagName==="SELECT" || el.tagName==="TEXTAREA" || el.type==="text" || el.type==="number") el.value = val ?? "";
  }
  function getInputValue(id){
    const el = getEl(id); if(!el) return "";
    if (el.type==="number") return el.value ? Number(el.value) : "";
    return (el.value||"").trim();
  }
  function setRadio(name, value){
    $$(`input[type="radio"][name="${name}"], input[type="radio"][name="${name}[]"]`)
      .forEach(n => n.checked = String(n.value) === String(value));
  }
  function getRadio(name){
    const n = $(`input[type="radio"][name="${name}"]:checked`) || $(`input[type="radio"][name="${name}[]"]:checked`);
    return n ? n.value : "";
  }
  function setChecks(name, values){
    const set = new Set(Array.isArray(values) ? values.map(String) : []);
    $$(`input[type="checkbox"][name="${name}"], input[type="checkbox"][name="${name}[]"]`)
      .forEach(n => n.checked = set.has(String(n.value)));
  }
  function getChecks(name){
    return $$(`input[type="checkbox"][name="${name}"]:checked, input[type="checkbox"][name="${name}[]"]:checked`).map(n => n.value);
  }
  function optionExists(select, value){
    return Array.from(select?.options||[]).some(o => String(o.value) === String(value));
  }

  // load existing
  const data = load();

  // core fields
  const textFields = ["name","birthday","country","height","weight","unacceptable","about","orientation"];
  textFields.forEach(id=>{
    if(id==="country"){
      const sel = getEl("country"); if(sel && optionExists(sel, data.country)) sel.value = data.country;
    } else setInputValue(id, data[id]);
  });

  // radios
  setRadio("connectionType", data.connectionType);
  setRadio("loveLanguage", data.loveLanguage);
  setRadio("gender", data.gender);

  // checks
  setChecks("hobbies", data.hobbies);
  setChecks("values", data.values);
  setChecks("seekingGender", data.seekingGender);

  // self-describe gender text (only if chosen)
  if (data.gender === "Self-describe") setInputValue("genderSelf", data.genderSelf||"");

  // birthday validity bubble
  const birthdayEl = getEl("birthday");
  birthdayEl?.addEventListener("input", ()=> birthdayEl.setCustomValidity(""));

  // submit
  form.addEventListener("submit", (e)=>{
    e.preventDefault();

    const payload = {
      name: getInputValue("name"),
      birthday: getInputValue("birthday"),
      country: getInputValue("country"),
      height: getInputValue("height"),
      weight: getInputValue("weight"),
      connectionType: getRadio("connectionType"),
      loveLanguage: getRadio("loveLanguage"),
      gender: getRadio("gender"),
      genderSelf: getInputValue("genderSelf"),
      seekingGender: getChecks("seekingGender"),
      orientation: getInputValue("orientation"),
      hobbies: getChecks("hobbies"),
      values: getChecks("values"),
      unacceptable: getInputValue("unacceptable"),
      about: getInputValue("about"),
    };

    if (!payload.name) { alert("Please enter your name."); getEl("name")?.focus(); return; }

    if (birthdayEl) {
      const b = (payload.birthday || "").trim();
      if (!DATE_RE.test(b)) {
        birthdayEl.setCustomValidity("Please use YYYY-MM-DD (e.g., 1972-11-22)");
        birthdayEl.reportValidity();
        return;
      }
    }

    // if self-describe chosen, replace gender value with the text if provided
    if (payload.gender === "Self-describe" && payload.genderSelf) {
      payload.gender = payload.genderSelf;
    }

    // merge + save
    const merged = { ...load(), ...payload };
    save(merged);

    // continue
    window.location.href = "edit-profile.html";
  });

  // autosave on change (optional, lightweight)
  const autosave = () => {
    const current = load();
    const fragment = {
      name: getInputValue("name"),
      birthday: getInputValue("birthday"),
      country: getInputValue("country"),
      height: getInputValue("height"),
      weight: getInputValue("weight"),
      connectionType: getRadio("connectionType"),
      loveLanguage: getRadio("loveLanguage"),
      gender: getRadio("gender"),
      genderSelf: getInputValue("genderSelf"),
      seekingGender: getChecks("seekingGender"),
      orientation: getInputValue("orientation"),
      hobbies: getChecks("hobbies"),
      values: getChecks("values"),
      unacceptable: getInputValue("unacceptable"),
      about: getInputValue("about"),
    };
    localStorage.setItem(KEY, JSON.stringify({ ...current, ...fragment }));
  };

  ["name","birthday","country","height","weight","orientation","unacceptable","about","genderSelf"]
    .forEach(id => getEl(id)?.addEventListener("change", autosave));
  $$('input[name="connectionType"], input[name="loveLanguage"], input[name="gender"]').forEach(n => n.addEventListener("change", autosave));
  $$('input[name="hobbies[]"], input[name="values[]"], input[name="seekingGender[]"]').forEach(n => n.addEventListener("change", autosave));
})();
