
// Unified Edit Profile Controller – uses localStorage key 'soulQuiz'
document.addEventListener('DOMContentLoaded', () => {
  const KEY = 'soulQuiz';
  const form = document.getElementById('profile-form') || document.querySelector('form');

  // Fields we care about (ids should exist in edit-profile.html)
  const textFields = ['name','birthday','country','about','unacceptable','height','weight','mantra'];
  const radios = ['connectionType','loveLanguage','gender','matchPreference'];
  const checkboxGroups = ['hobbies','values','spiritualBeliefs'];
  const photoIds = ['profilePhoto1','profilePhoto2','profilePhoto3'];

  function safeParse(v){ try { return JSON.parse(v) || {}; } catch { return {}; } }
  function loadData(){ return safeParse(localStorage.getItem(KEY)); }
  function saveData(obj){ localStorage.setItem(KEY, JSON.stringify(obj)); }

  function setValue(id, value){
    const el = document.getElementById(id);
    if(!el) return;
    if(el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.type === 'text' || el.type === 'number'){
      el.value = value ?? '';
    }
  }

  function setRadios(name, value){
    const nodes = document.querySelectorAll(`input[name="${name}"]`);
    nodes.forEach(n => { n.checked = (n.value === String(value)); });
  }

  function setChecks(name, values){
    const nodes = document.querySelectorAll(`input[name="${name}"]`);
    const set = new Set(Array.isArray(values) ? values.map(String) : []);
    nodes.forEach(n => { n.checked = set.has(n.value); });
  }

  function getValue(id){
    const el = document.getElementById(id);
    if(!el) return undefined;
    return (el.type === 'number') ? (el.value ? Number(el.value) : '') : el.value;
  }

  function getRadios(name){
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
  }

  function getChecks(name){
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(n=>n.value);
  }

  // Image handling – store base64 in localStorage
  function setPhotoPreview(id, dataUrl){
    const img = document.getElementById(id + '-preview');
    if(img && dataUrl){ img.src = dataUrl; img.style.display = 'block'; }
  }

  // Load existing data
  const data = loadData();

  // Text/selects
  textFields.forEach(id => setValue(id, data[id]));
  // Radios
  radios.forEach(name => setRadios(name, data[name]));
  // Checkboxes
  checkboxGroups.forEach(name => setChecks(name, data[name]));

  // Photos
  photoIds.forEach(pid => { if(data[pid]) setPhotoPreview(pid, data[pid]); });

  // Bind photo inputs
  photoIds.forEach(pid => {
    const input = document.getElementById(pid);
    if(!input) return;
    input.addEventListener('change', (e)=>{
      const file = e.target.files && e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (ev)=>{
        data[pid] = ev.target.result;
        setPhotoPreview(pid, data[pid]);
        saveData(data);
      };
      reader.readAsDataURL(file);
    });
  });

  // Save button
  const saveBtn = document.getElementById('saveProfile') || document.querySelector('[data-action="save-profile"]');
  if(saveBtn){
    saveBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      // collect
      textFields.forEach(id => data[id] = getValue(id));
      radios.forEach(name => data[name] = getRadios(name));
      checkboxGroups.forEach(name => data[name] = getChecks(name));
      saveData(data);
      const msg = document.getElementById('saveMessage');
      if(msg){ msg.textContent = 'Saved ✓'; msg.style.opacity = '1'; setTimeout(()=> msg.style.opacity='0', 1600); }
    });
  }
});
