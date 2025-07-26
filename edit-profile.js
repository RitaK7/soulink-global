// edit-profile.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profile-form');
  const fields = ['name','birthday','about','relationshipType','connection'];
  const photoInputs = [
    { input: document.getElementById('photo1'), preview: document.getElementById('preview1'), key: 'profilePhoto1' },
    { input: document.getElementById('photo2'), preview: document.getElementById('preview2'), key: 'profilePhoto2' },
    { input: document.getElementById('photo3'), preview: document.getElementById('preview3'), key: 'profilePhoto3' }
  ];
  const saveMsg = document.getElementById('saveMessage');

  // load existing
  const data = JSON.parse(localStorage.getItem('soulQuiz')||'{}');
  // populate basic fields
  fields.forEach(k => {
    if (data[k]) {
      const el = form.elements[k];
      if (el) el.value = data[k];
    }
  });
  // populate previews
  photoInputs.forEach(({ input, preview, key }) => {
    if (data[key]) preview.src = data[key];
    // wire change->preview
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => preview.src = reader.result;
      reader.readAsDataURL(file);
    });
  });

  // helper: read a file to base64 or fallback
  function readFile(file) {
    return new Promise(resolve => {
      if (!file) return resolve(null);
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(file);
    });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    // gather
    const out = {};
    fields.forEach(k => out[k] = form.elements[k].value || '');
    // photos
    for (let { input, key } of photoInputs) {
      const file = input.files[0];
      out[key] = (await readFile(file)) || data[key] || '';
    }
    // save
    localStorage.setItem('soulQuiz', JSON.stringify(out));
    // show confirmation
    saveMsg.classList.add('visible');
    setTimeout(() => saveMsg.classList.remove('visible'), 2500);
  });
});
