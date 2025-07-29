// edit-profile.js (pataisyta versija)
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profile-form");
  const photoInputs = [
    document.getElementById("photo1"),
    document.getElementById("photo2"),
    document.getElementById("photo3")
  ];

  const saved = JSON.parse(localStorage.getItem("soulQuiz")) || {};

  // Text/textarea fields
  const textFields = [
    "name", "birthday", "country", "relationshipType", "loveLanguage",
    "unacceptable", "about", "bio"
  ];
  textFields.forEach(id => {
    if (saved[id]) {
      const field = form.querySelector(`[name="${id}"]`);
      if (field) field.value = saved[id];
    }
  });

  // Checkbox groups
  const checkboxGroups = ["hobbies", "values"];
  checkboxGroups.forEach(group => {
    if (Array.isArray(saved[group])) {
      saved[group].forEach(val => {
        const checkbox = form.querySelector(`[name="${group}"][value="${val}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
  });

  // Photo preview helper
  const showPreview = (input, previewId, src) => {
    const img = document.getElementById(previewId);
    if (src) img.src = src;
    input.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => img.src = reader.result;
      reader.readAsDataURL(file);
    });
  };

  // Initialize previews
  showPreview(photoInputs[0], "preview1", saved.photo1);
  showPreview(photoInputs[1], "preview2", saved.photo2);
  showPreview(photoInputs[2], "preview3", saved.photo3);

  // Submit handler
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const data = {};

    textFields.forEach(id => {
      const field = form.querySelector(`[name="${id}"]`);
      if (field) data[id] = field.value || "";
    });

    checkboxGroups.forEach(group => {
      const checkboxes = form.querySelectorAll(`input[name="${group}"]:checked`);
      data[group] = [...checkboxes].map(cb => cb.value);
    });

    // Read photos or keep existing
    const readImage = file => new Promise(resolve => {
      if (!file) return resolve(null);
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(file);
    });

    data.photo1 = await readImage(photoInputs[0].files[0]) || saved.photo1 || null;
    data.photo2 = await readImage(photoInputs[1].files[0]) || saved.photo2 || null;
    data.photo3 = await readImage(photoInputs[2].files[0]) || saved.photo3 || null;

    localStorage.setItem("soulQuiz", JSON.stringify(data));
    window.location.href = "my-soul.html";
  });
});
