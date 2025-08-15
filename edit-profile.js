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

 // === Photos (robust bind)
function bindPhoto(slot){
  const input  = document.getElementById(`photo${slot}`);
  let   img    = document.getElementById(`preview${slot}`);
  const remove = document.getElementById(`remove${slot}`);
  const key    = `profilePhoto${slot}`;

  if (!img && input) { img = document.createElement('img'); img.id=`preview${slot}`; img.className='photo-preview'; img.style.display='none'; input.insertAdjacentElement('afterend', img); }

  const existing = (loadData()||{})[key];
  if (img && existing){ img.src = existing; img.style.display='block'; }

  function downscale(dataUrl, max=1280, q=0.8){
    return new Promise(res=>{ const im=new Image(); im.onload=()=>{ let {width:w,height:h}=im; const s=Math.min(1, max/Math.max(w,h)); if(s<1){w=Math.round(w*s);h=Math.round(h*s);} const c=document.createElement('canvas'); c.width=w;c.height=h; c.getContext('2d').drawImage(im,0,0,w,h); res(c.toDataURL('image/jpeg',q)); }; im.src=dataUrl; });
  }

  input?.addEventListener('change', ()=>{
    const file = input.files?.[0]; if(!file) return;
    const r = new FileReader();
    r.onload = async () => { const small = await downscale(r.result,1280,0.8); const cur=loadData(); cur[key]=small; saveData(cur); if(img){img.src=small; img.style.display='block';} };
    r.readAsDataURL(file);
  });

  remove?.addEventListener('click', (e)=>{
    e.preventDefault();
    const cur = loadData(); cur[key] = ""; saveData(cur);
    if (img){ img.removeAttribute('src'); img.style.display='none'; }
    if (input) input.value = "";
  });
}
[1,2,3].forEach(bindPhoto);

  // --- save handler
  const saveBtn = getEl("saveBtn") || getEl("saveProfile") || $('button[type="submit"]');
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
