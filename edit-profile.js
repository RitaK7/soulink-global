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

  function setField(id, val) {
    const el = document.getElementById('edit-'+id);
    if (!el) return;
    el.textContent = val || '–';
    el.classList.toggle('empty', !val);
  }

  // Load all simple fields
  [
    'name','birthday','about',
    'relationshipType','loveLanguage','loveLanguageDesc',
    'hobbies','values','unacceptable',
    'country','height','weight'
  ].forEach(f => setField(f, data[f]));

  // Photo previews
  ['1','2','3'].forEach(n => {
    const preview = document.getElementById('photoPreview'+n);
    if (data['photo'+n]) {
      preview.src = data['photo'+n];
    } else {
      preview.src = '';  // no more truncated URI
    }
  });

  // Handle photo inputs
  ['1','2','3'].forEach(n => {
    document.getElementById('photoInput'+n)
      .addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          data['photo'+n] = reader.result;
          localStorage.setItem(key, JSON.stringify(data));
          document.getElementById('photoPreview'+n).src = reader.result;
        };
        reader.readAsDataURL(file);
      });
  });

  window.editField = (field, options) => {
    let current = data[field] || '';
    let newVal;
    if (options) {
      const opts = options.split(',');
      newVal = prompt(
        `Enter ${field} (options: ${opts.join(', ')}):`,
        current
      );
      if (newVal && !opts.includes(newVal)) {
        alert('Please choose one of: ' + opts.join(', '));
        return;
      }
    } else {
      newVal = prompt(`Enter ${field}:`, current);
    }
    if (newVal !== null) {
      data[field] = newVal.trim();
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
      setField(field, data[field]);
    }
  };

  window.saveAndGo = () => {
    location.href = 'my-soul.html';
  };
});
