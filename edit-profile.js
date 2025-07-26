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

  const fieldsContainer = document.getElementById('fields');
  fieldDefs.forEach(def => {
    const row = document.createElement('div');
    row.className = 'field-row';

    const lbl = document.createElement('div');
    lbl.className = 'field-label';
    lbl.textContent = def.label;

    const val = document.createElement('div');
    val.className = 'field-value';
    val.id = 'edit-' + def.id;
    val.textContent = data[def.id] || '–';
    if (!data[def.id]) val.classList.add('empty');

    const icon = document.createElement('i');
    icon.className = def.readonly ? 'bi bi-info-circle' : 'bi bi-pencil-square';
    if (!def.readonly) {
      icon.addEventListener('click', () => editField(def));
    } else {
      icon.title = 'Auto-generated from Love Language';
    }

    row.append(lbl, val, icon);
    fieldsContainer.append(row);
  });

  // Photo grid
  const photoGrid = document.getElementById('photoGrid');
  for (let i = 1; i <= 3; i++) {
    const slot = document.createElement('div');
    slot.className = 'photo-slot';

    const img = document.createElement('img');
    img.id = 'photoPreview' + i;
    img.src = data['photo' + i] || '';
    img.alt = `Photo ${i}`;
    img.addEventListener('click', () => fileInput.click());

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.id = 'photoInput' + i;
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        data['photo' + i] = reader.result;
        img.src = reader.result;
        localStorage.setItem(key, JSON.stringify(data));
      };
      reader.readAsDataURL(file);
    });

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Choose Photo';
    btn.addEventListener('click', () => fileInput.click());

    slot.append(img, fileInput, btn);
    photoGrid.append(slot);
  }

  // Inline edit function
  window.editField = def => {
    const current = data[def.id] || '';
    let promptText = `Enter ${def.label}`;
    if (def.opts) promptText += `\nOptions: ${def.opts.join(', ')}`;
    let newVal = prompt(promptText, current);
    if (newVal === null) return;
    newVal = newVal.trim();
    if (def.opts && !def.opts.includes(newVal)) {
      alert('Please choose one of: ' + def.opts.join(', '));
      return;
    }

    data[def.id] = newVal;
    const valEl = document.getElementById('edit-' + def.id);
    valEl.textContent = newVal || '–';
    valEl.classList.toggle('empty', !newVal);

    // Auto-generate loveLanguageDesc
    if (def.id === 'loveLanguage') {
      data.loveLanguageDesc = loveMap[newVal] || '';
      const descEl = document.getElementById('edit-loveLanguageDesc');
      descEl.textContent = data.loveLanguageDesc || '–';
      descEl.classList.toggle('empty', !data.loveLanguageDesc);
    }

    localStorage.setItem(key, JSON.stringify(data));
  };

  // Save button
  document.getElementById('saveBtn').addEventListener('click', e => {
    e.preventDefault();
    location.href = 'my-soul.html';
  });
});
