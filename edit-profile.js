// DOM ready
window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profile-form');
  const photoInputs = [
    document.getElementById('photo1'),
    document.getElementById('photo2'),
    document.getElementById('photo3')
  ];

  // Responsive nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  navToggle.addEventListener('click', () => navLinks.classList.toggle('active'));

  // Load saved data
  const saved = JSON.parse(localStorage.getItem('soulQuiz')) || {};

  if (saved.name) form.name.value = saved.name;
  if (saved.birthdate) form.birthdate.value = saved.birthdate;
  if (saved.bio) form.bio.value = saved.bio;

  const relType = saved.relationshipType || saved.connection || '';
  form.relationshipType.value = relType;

  if (saved.loveLanguage) form.loveLanguage.value = saved.loveLanguage;
  if (saved.unacceptableBehavior) form.unacceptableBehavior.value = saved.unacceptableBehavior;

  if (Array.isArray(saved.hobbies)) {
    document.querySelectorAll("input[name='hobbies']").forEach(el => {
      if (saved.hobbies.includes(el.value)) el.checked = true;
    });
  }
  if (Array.isArray(saved.values)) {
    document.querySelectorAll("input[name='values']").forEach(el => {
      if (saved.values.includes(el.value)) el.checked = true;
    });
  }

  // Image preview
  const showPreview = (input, previewId, initialSrc) => {
    const img = document.getElementById(previewId);
    if (initialSrc) img.src = initialSrc;
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => img.src = reader.result;
      reader.readAsDataURL(file);
    });
  };
  showPreview(photoInputs[0], 'preview1', saved.photo1);
  showPreview(photoInputs[1], 'preview2', saved.photo2);
  showPreview(photoInputs[2], 'preview3', saved.photo3);

  // On save
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const getChecked = name =>
      Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
           .map(el => el.value);

    const data = {
      name: form.name.value,
      birthdate: form.birthdate.value,
      bio: form.bio.value,
      relationshipType: form.relationshipType.value,
      loveLanguage: form.loveLanguage.value,
      unacceptableBehavior: form.unacceptableBehavior.value,
      hobbies: getChecked('hobbies'),
      values: getChecked('values')
    };

    const readImage = file => new Promise(resolve => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    data.photo1 = await readImage(photoInputs[0].files[0]) || saved.photo1 || null;
    data.photo2 = await readImage(photoInputs[1].files[0]) || saved.photo2 || null;
    data.photo3 = await readImage(photoInputs[2].files[0]) || saved.photo3 || null;

    // Save and redirect
    localStorage.setItem('soulQuiz', JSON.stringify(data));
    window.location.href = 'my-soul.html';
  });
});