// edit-profile.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profile-form");
  const photoInputs = [
    document.getElementById("photo1"),
    document.getElementById("photo2"),
    document.getElementById("photo3")
  ];

  // Load saved profile from soulQuiz
  const saved = JSON.parse(localStorage.getItem("soulQuiz") || "{}");
  if (saved.name)        form.name.value        = saved.name;
  if (saved.birthday)    form.birthday.value    = saved.birthday;
  if (saved.bio)         form.bio.value         = saved.bio;

  // Preview helper
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
    const data = {
      ...saved,
      name: form.name.value,
      birthday: form.birthday.value,
      bio: form.bio.value
    };

    const readImage = file => new Promise(resolve => {
      if (!file) return resolve(null);
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(file);
    });

    // Read photos or keep existing
    data.photo1 = await readImage(photoInputs[0].files[0]) || saved.photo1 || null;
    data.photo2 = await readImage(photoInputs[1].files[0]) || saved.photo2 || null;
    data.photo3 = await readImage(photoInputs[2].files[0]) || saved.photo3 || null;

    localStorage.setItem("soulQuiz", JSON.stringify(data));
    alert("✅ Profili sėkmingai išsaugotas!");
    window.location.href = "my-soul.html";
  });
});
