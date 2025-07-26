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
    { id:'name', label:'Name' },
    { id:'birthday', label:'Birthday (YYYY-MM-DD)' },
    { id:'about', label:'About / Bio' },
    { id:'connection', label:'Connection', opts:['Romantic','Friendship','Both'] },
    { id:'loveLanguage', label:'Love Language', opts:['Words of Affirmation','Acts of Service','Receiving Gifts','Quality Time','Physical Touch'] },
    { id:'loveDescription', label:'Love Description', readonly:true },
    { id:'hobbies', label:'Hobbies (comma-sep)' },
    { id:'values', label:'Values (comma-sep)' },
    { id:'unacceptable', label:'Unacceptable' },
    { id:'country', label:'Country' },
    { id:'height', label:'Height (cm)' },
    { id:'weight', label:'Weight (kg)' }
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
    fieldsContainer.appendChild(row);
  });

  const photoGrid = document.getElementById('photoGrid');
  for (let i = 1; i <= 3; i++) {
    const slot = document.createElement('div');
    slot.className = 'photo-slot';

    const img = document.createElement('img');
    img.id = 'photoPreview' + i;
    img.alt = `Photo ${i}`;
    img.src = data['profilePhoto'+i] || '';
    slot.appendChild(img);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.id = 'photoInput' + i;
    input.addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        data['profilePhoto'+i] = reader.result;
        img.src = reader.result;
        localStorage.setItem(key, JSON.stringify(data));
      };
      reader.readAsDataURL(f);
    });
    slot.appendChild(input);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Choose Photo';
    btn.addEventListener('click', () => input.click());
    slot.appendChild(btn);

    photoGrid.appendChild(slot);
  }

  window.editField = def => {
    const cur = data[def.id] || '';
    let promptText = `Enter ${def.label}`;
    if (def.opts) promptText += `\nOptions: ${def.opts.join(', ')}`;

    let nv = prompt(promptText, cur);
    if (nv === null) return;
    nv = nv.trim();

    if (def.opts && !def.opts.includes(nv)) {
      alert('Please choose one of: ' + def.opts.join(', '));
      return;
    }

    data[def.id] = nv;
    const el = document.getElementById('edit-' + def.id);
    el.textContent = nv || '–';
    el.classList.toggle('empty', !nv);

    if (def.id === 'loveLanguage') {
      data.loveDescription = loveMap[nv] || '';
      const descEl = document.getElementById('edit-loveDescription');
      descEl.textContent = data.loveDescription || '–';
      descEl.classList.toggle('empty', !data.loveDescription);
    }

    localStorage.setItem(key, JSON.stringify(data));
  };

  document.getElementById('saveBtn').addEventListener('click', e => {
    e.preventDefault();
    localStorage.setItem(key, JSON.stringify(data));
    alert('✅ Profile saved!');
  });
});