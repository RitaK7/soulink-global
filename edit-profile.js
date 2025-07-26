// edit-profile.js
document.addEventListener('DOMContentLoaded', () => {
  const key = 'soulQuiz';
  let data = {};
  try {
    data = JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    localStorage.removeItem(key);
    data = {};
  }

  // 1) Render inline fields
  const fieldsContainer = document.getElementById('fields');
  const fieldDefs = [
    { id:'name',        label:'Name' },
    { id:'birthday',    label:'Birthday (YYYY-MM-DD)' },
    { id:'about',       label:'About / Bio' },
    { id:'relationshipType', label:'Connection', opts:['Romantic','Friendship','Both'] },
    { id:'loveLanguage',    label:'Love Language', opts:['Words of Affirmation','Acts of Service','Receiving Gifts','Quality Time','Physical Touch'] },
    { id:'loveLanguageDesc', label:'Love Description', readonly:true },
    { id:'hobbies',     label:'Hobbies (comma‑sep)' },
    { id:'values',      label:'Values (comma‑sep)' },
    { id:'unacceptable',label:'Unacceptable' },
    { id:'country',     label:'Country' },
    { id:'height',      label:'Height (cm)' },
    { id:'weight',      label:'Weight (kg)' }
  ];

  const loveMap = {
    'Words of Affirmation':'Expressing love through kind and encouraging words.',
    'Acts of Service':'Showing love by doing helpful, caring actions.',
    'Receiving Gifts':'Feeling loved through thoughtful presents and symbols.',
    'Quality Time':'Giving undivided attention and shared moments.',
    'Physical Touch':'Feeling love through hugs, kisses, and closeness.'
  };

  function createField(def) {
    const row = document.createElement('div');
    row.className = 'field-row';
    const lbl = document.createElement('div');
    lbl.className = 'field-label';
    lbl.textContent = def.label;
    const val = document.createElement('div');
    val.id = 'edit-'+def.id;
    val.className = 'field-value';
    if (!data[def.id]) val.classList.add('empty');
    val.textContent = data[def.id] || '–';
    const icon = document.createElement('i');
    icon.className = def.readonly
      ? 'bi bi-info-circle'
      : 'bi bi-pencil-square';
    if (!def.readonly) {
      icon.addEventListener('click', () => editField(def));
    } else {
      icon.title = 'Auto-generated from Love Language';
    }
    row.append(lbl,val,icon);
    return row;
  }

  fieldDefs.forEach(def => {
    fieldsContainer.appendChild(createField(def));
  });

  // 2) Photo grid
  const photoGrid = document.getElementById('photoGrid');
  for (let i=1; i<=3; i++) {
    const slot = document.createElement('div');
    slot.className = 'photo-slot';
    const img = document.createElement('img');
    img.id = 'photoPreview'+i;
    img.src = data['photo'+i]||'';
    img.alt = `Photo ${i}`;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.id = 'photoInput'+i;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Choose Photo';
    btn.addEventListener('click', ()=> input.click());
    input.addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        data['photo'+i] = reader.result;
        img.src = reader.result;
        localStorage.setItem(key,JSON.stringify(data));
      };
      reader.readAsDataURL(f);
    });
    slot.append(img,input,btn);
    photoGrid.append(slot);
  }

  // 3) editField prompt
  window.editField = def => {
    const current = data[def.id] || '';
    let promptMsg = `Enter ${def.label}`;
    if (def.opts) promptMsg += `\nOptions: ${def.opts.join(', ')}`;
    let newVal = prompt(promptMsg, current);
    if (newVal===null) return;
    newVal = newVal.trim();
    if (def.opts && !def.opts.includes(newVal)) {
      alert('Please choose one of: ' + def.opts.join(', '));
      return;
    }
    data[def.id] = newVal;
    // auto‑gen loveDescription
    if (def.id==='loveLanguage') {
      data.loveLanguageDesc = loveMap[newVal]||'';
      document.getElementById('edit-loveLanguageDesc').textContent = data.loveLanguageDesc || '–';
      document.getElementById('edit-loveLanguageDesc').classList.toggle('empty', !data.loveLanguageDesc);
    }
    const el = document.getElementById('edit-'+def.id);
    el.textContent = newVal||'–';
    el.classList.toggle('empty', !newVal);
    localStorage.setItem(key,JSON.stringify(data));
  };

  // 4) Save button
  document.getElementById('saveBtn').addEventListener('click', e=> {
    e.preventDefault();
    location.href = 'my-soul.html';
  });
});
