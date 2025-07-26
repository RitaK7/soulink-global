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

  // Helper to set field text + empty style
  function setField(id, val) {
    const el = document.getElementById('edit-' + id);
    if (!el) return;
    el.textContent = val || '–';
    el.classList.toggle('empty', !val);
  }

  // Load all fields
  [
    'name','birthday','about',
    'relationshipType','loveLanguage','loveLanguageDesc',
    'hobbies','values','unacceptable',
    'country','height','weight'
  ].forEach(f => setField(f, data[f]));

  // Photo previews
  for (let i = 1; i <= 3; i++) {
    const prev = document.getElementById('photoPreview' + i);
    if (data['photo' + i]) prev.src = data['photo' + i];
  }

  // Trigger file dialog
  window.triggerPhoto = i => {
    document.getElementById('photoInput' + i).click();
  };

  // Handle photo selection & preview + save
  for (let i = 1; i <= 3; i++) {
    document.getElementById('photoInput' + i)
      .addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          data['photo' + i] = reader.result;
          localStorage.setItem(key, JSON.stringify(data));
          document.getElementById('photoPreview' + i).src = reader.result;
        };
        reader.readAsDataURL(file);
      });
  }

  // Inline edit prompt
  window.editField = (field, opts) => {
    const current = data[field] || '';
    let newVal = prompt(
      `Enter ${field.replace(/([A-Z])/g, ' $1')}:`,
      current
    );
    if (newVal === null) return;
    newVal = newVal.trim();
    // Validate options if provided
    if (opts) {
      const allowed = opts.split(',');
      if (!allowed.includes(newVal)) {
        alert('Please choose one of: ' + allowed.join(', '));
        return;
      }
    }
    data[field] = newVal;
    // Auto‑gen Love Description
    if (field === 'loveLanguage') {
      const map = {
        'Words of Affirmation':'Expressing love through kind and encouraging words.',
        'Acts of Service':'Showing love by doing helpful, caring actions.',
        'Receiving Gifts':'Feeling loved through thoughtful presents and symbols.',
        'Quality Time':'Giving undivided attention and shared moments.',
        'Physical Touch':'Feeling love through hugs, kisses, and closeness.'
      };
      data.loveLanguageDesc = map[newVal] || '';
      setField('loveLanguageDesc', data.loveLanguageDesc);
    }
    localStorage.setItem(key, JSON.stringify(data));
    setField(field, newVal);
  };

  // Save & navigate
  window.saveAndGo = () => {
    location.href = 'my-soul.html';
  };
});
