// edit-profile.js – Patikrinta ir atnaujinta

document.addEventListener('DOMContentLoaded', () => {
  const key = 'soulQuiz';
  let data = {};
  try {
    data = JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    localStorage.removeItem(key);
    data = {};
  }

  // Inline redagavimo funkcija
  function setupEditableField(fieldId) {
    const el = document.getElementById(fieldId);
    const editBtn = el?.nextElementSibling;
    if (el && editBtn) {
      editBtn.addEventListener('click', () => {
        el.removeAttribute('readonly');
        el.focus();
      });
    }
  }

  // Užpildo laukus
  const fieldIds = ['name', 'birthday', 'about', 'connectionType', 'loveLanguage', 'unacceptable', 'hobbies', 'values'];
  fieldIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (Array.isArray(data[id])) {
      data[id].forEach(val => {
        const checkbox = document.querySelector(`[name="${id}"][value="${val}"]`);
        if (checkbox) checkbox.checked = true;
      });
    } else {
      el.value = data[id] || '';
    }
    setupEditableField(id);
  });

  // Nuotraukos atkūrimas
  for (let i = 1; i <= 3; i++) {
    const preview = document.getElementById(`photoPreview${i}`);
    const input = document.getElementById(`photo${i}`);
    if (data[`profilePhoto${i}`] && preview) {
      preview.src = data[`profilePhoto${i}`];
    }
    if (input) {
      input.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            preview.src = reader.result;
            data[`profilePhoto${i}`] = reader.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  // Išsaugoti paspaudus mygtuką
  document.getElementById('saveBtn')?.addEventListener('click', () => {
    fieldIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox' || el.type === 'radio') {
        const selected = [...document.querySelectorAll(`[name="${id}"]:checked`)].map(x => x.value);
        data[id] = selected;
      } else {
        data[id] = el.value;
      }
    });

    localStorage.setItem(key, JSON.stringify(data));
    alert('✅ Your soul profile has been saved.');
  });
});
