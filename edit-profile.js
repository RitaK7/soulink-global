// edit-profile.js — Soulink (golden, fixed)
// Full load/save to localStorage 'soulQuiz' + 3 photo previews + Remove buttons.

document.addEventListener("DOMContentLoaded", () => {
  const KEY = "soulQuiz";
  const form = document.getElementById("profile-form") || document.querySelector("form");

  // --- helpers
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const getEl = (id) => document.getElementById(id);

  function safeParse(v) { try { return JSON.parse(v) || {}; } catch { return {}; } }
  function loadData()    { return safeParse(localStorage.getItem(KEY)); }
  function saveData(obj) { localStorage.setItem(KEY, JSON.stringify(obj)); }

  function setValue(id, value) {
    const el = getEl(id);
    if (!el) return;
    if (el.tagName === "SELECT" || el.tagName === "TEXTAREA" || el.type === "text" || el.type === "number") {
      el.value = value ?? "";
    }
  }
  function getValue(id) {
    const el = getEl(id);
    if (!el) return "";
    if (el.type === "number") return el.value ? Number(el.value) : "";
    return (el.value || "").trim();
  }
  function setRadios(name, value) {
    $$(`input[type="radio"][name="${name}"]`).forEach(n => n.checked = String(n.value) === String(value));
  }
  function getRadios(name) {
    const n = $(`input[type="radio"][name="${name}"]:checked`);
    return n ? n.value : "";
  }
  function setChecks(name, values) {
    const set = new Set(Array.isArray(values) ? values.map(String) : []);
    $$(`input[type="checkbox"][name="${name}"], input[type="checkbox"][name="${name}[]"]`)
      .forEach(n => n.checked = set.has(String(n.value)));
  }
  function getChecks(name) {
    return $$(`input[type="checkbox"][name="${name}"]:checked, input[type="checkbox"][name="${name}[]"]:checked`)
      .map(n => n.value);

  function toggleGenderSelf(){
  const g = document.querySelector('input[name="gender"]:checked')?.value;
  const t = document.getElementById('genderSelf');
  if (!t) return;
  const on = g === "Self-describe";
  t.disabled = !on;
  if (!on) t.value = "";  // išvalo, kad nesaugotų per klaidą
}
document.querySelectorAll('input[name="gender"]').forEach(r => r.addEventListener('change', toggleGenderSelf));
toggleGenderSelf(); // inicialiai

  }

  // --- load existing data into the form
  const data = loadData();

  [
    "name","birthday","unacceptable","about","orientation","genderSelf",
    "country","height","weight"
  ].forEach(id => (data[id] !== undefined) && setValue(id, data[id]));

  setRadios("connectionType", data.connectionType);
  setRadios("loveLanguage",   data.loveLanguage);
  setRadios("gender",         data.gender);

  setChecks("hobbies",        data.hobbies);
  setChecks("values",         data.values);
  setChecks("seekingGender",  data.seekingGender);

  // --- photos (optional IDs in HTML: photo1/2/3, preview1/2/3, remove1/2/3)
  function bindPhoto(slot) {
    const input  = getEl(`photo${slot}`);
    const img    = getEl(`preview${slot}`);
    const remove = getEl(`remove${slot}`);
    const key    = `profilePhoto${slot}`;

    // show existing
    if (img && data[key]) { img.src = data[key]; img.style.display = "block"; }

    if (input) {
      input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const cur = loadData();
          cur[key] = reader.result;
          saveData(cur);
          if (img) { img.src = reader.result; img.style.display = "block"; }
        };
        reader.readAsDataURL(file);
      });
    }
    if (remove) {
      remove.addEventListener("click", (e) => {
        e.preventDefault();
        const cur = loadData();
        cur[key] = "";
        saveData(cur);
        if (img) { img.removeAttribute("src"); img.style.display = "none"; }
        if (input) input.value = "";
      });
    }
  }
  [1, 2, 3].forEach(bindPhoto);

  // --- save handler
  const saveBtn = getEl("saveBtn") || $('button[type="submit"]');
  const msg     = getEl("status")  || getEl("msg");

  if (saveBtn) {
    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const payload = {
        name: getValue("name"),
        birthday: getValue("birthday"),
        unacceptable: getValue("unacceptable"),
        about: getValue("about"),
        connectionType: getRadios("connectionType"),
        loveLanguage: getRadios("loveLanguage"),
        hobbies: getChecks("hobbies"),
        values: getChecks("values"),
        gender: getRadios("gender"),
        genderSelf: getValue("genderSelf"),
        seekingGender: getChecks("seekingGender"),
        orientation: getValue("orientation"),
        country: getValue("country"),
        height: getValue("height"),
        weight: getValue("weight"),
      };

      // If self-describe chosen — use the typed value
      if (payload.gender === "Self-describe" && payload.genderSelf) {
        payload.gender = payload.genderSelf.trim();
      }

      // merge + keep existing photos if not changed
      const current = loadData();
      const merged = {
        ...current,
        ...payload,
        profilePhoto1: current.profilePhoto1 || "",
        profilePhoto2: current.profilePhoto2 || "",
        profilePhoto3: current.profilePhoto3 || "",
      };

      saveData(merged);

      if (msg) {
        msg.textContent = "Saved ✓";
        msg.style.opacity = "1";
        setTimeout(() => (msg.style.opacity = "0"), 1600);
      }

      // redirect if you want:
      // window.location.href = "my-soul.html";
    });
  }
});
