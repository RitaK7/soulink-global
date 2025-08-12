// edit-profile.js — Soulink (golden)
// Full load/save to localStorage 'soulQuiz' + 3 photo previews + Remove buttons.

document.addEventListener("DOMContentLoaded", () => {
  const KEY = "soulQuiz";
  const form = document.getElementById("profile-form");

  // --- helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const getEl = (id) => document.getElementById(id);

  function safeParse(v) {
    try { return JSON.parse(v) || {}; } catch { return {}; }
  }
  function loadData() { return safeParse(localStorage.getItem(KEY)); }
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
    return el.type === "number" ? (el.value ? Number(el.value) : "") : (el.value || "");
  }

  function setRadios(name, value) {
    const nodes = $$(`input[type="radio"][name="${name}"], input[type="radio"][name="${name}[]"]`);
    nodes.forEach(n => n.checked = (String(n.value) === String(value)));
  }
  function getRadios(name) {
    return ($(`input[type="radio"][name="${name}"]:checked`) || $(`input[type="radio"][name="${name}[]"]:checked`))?.value || "";
  }

  function setChecks(name, values) {
    const set = new Set(Array.isArray(values) ? values.map(String) : []);
    const nodes = $$(`input[type="checkbox"][name="${name}"], input[type="checkbox"][name="${name}[]"]`);
    nodes.forEach(n => n.checked = set.has(String(n.value)));
  }
  function getChecks(name) {
    return $$(`input[type="checkbox"][name="${name}"]:checked, input[type="checkbox"][name="${name}[]"]:checked`)
      .map(n => n.value);
  }

  function setPhotoPreview(id, dataUrl) {
    const img = getEl(id + "-preview");
    if (!img) return;
    if (dataUrl) {
      img.src = dataUrl;
      img.style.display = "block";
    } else {
      img.removeAttribute("src");
      img.style.display = "none";
    }
  }

  // --- load existing data
  const data = loadData();

  // text inputs
  ["name", "birthday", "unacceptable", "about"].forEach(id => setValue(id, data[id]));

  // radios / checkboxes
  setRadios("connectionType", data.connectionType);
  setRadios("loveLanguage", data.loveLanguage);
  setChecks("hobbies", data.hobbies);
  setChecks("values", data.values);

  // photos
  ["profilePhoto1", "profilePhoto2", "profilePhoto3"].forEach(pid => {
    if (data[pid]) setPhotoPreview(pid, data[pid]);
  });

  // bind photo inputs
  ["profilePhoto1", "profilePhoto2", "profilePhoto3"].forEach(pid => {
    const input = getEl(pid);
    if (!input) return;
    input.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        data[pid] = ev.target.result; // base64
        setPhotoPreview(pid, data[pid]);
        saveData(data);
      };
      reader.readAsDataURL(file);
    });
  });

  // remove buttons
  $$('[data-remove]').forEach(btn => {
    btn.addEventListener("click", () => {
      const pid = btn.getAttribute("data-remove");
      if (!pid) return;
      data[pid] = "";
      const input = getEl(pid);
      if (input) input.value = "";
      setPhotoPreview(pid, "");
      saveData(data);
    });
  });

  // save button
  const saveBtn = getEl("saveProfile");
  const msg = getEl("saveMessage");
  if (saveBtn) {
    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // collect all fields
      const payload = {
        name: getValue("name"),
        birthday: getValue("birthday"),
        unacceptable: getValue("unacceptable"),
        about: getValue("about"),
        connectionType: getRadios("connectionType"),
        loveLanguage: getRadios("loveLanguage"),
        hobbies: getChecks("hobbies"),
        values: getChecks("values")
      };
      // merge + save
      const merged = { ...loadData(), ...payload,
        profilePhoto1: data.profilePhoto1 || "",
        profilePhoto2: data.profilePhoto2 || "",
        profilePhoto3: data.profilePhoto3 || ""
      };
      saveData(merged);
     if (msg) { msg.textContent = "Saved ✓"; msg.style.opacity = "1"; setTimeout(()=> msg.style.opacity="0", 1600); }
     // redirect after save:
    window.location.href = "my-soul.html";
    });
  }

  // reset button
  const resetBtn = getEl("resetProfile");
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      form.reset();
      ["profilePhoto1","profilePhoto2","profilePhoto3"].forEach(pid=>{
        const input = getEl(pid); if (input) input.value="";
        setPhotoPreview(pid, "");
        data[pid] = "";
      });
      saveData({}); // clear all
      if (msg) { msg.textContent = "Reset ✓"; msg.style.opacity = "1"; setTimeout(()=> msg.style.opacity="0", 1600); }
    });
  }
});
