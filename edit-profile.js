document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profile-form");
  const photoInputs = [document.getElementById("photo1"), document.getElementById("photo2"), document.getElementById("photo3")];

  // Užkrauti išsaugotus duomenis
  const saved = JSON.parse(localStorage.getItem("profile")) || {};
  if (saved.name) form.name.value = saved.name;
  if (saved.birthday) form.birthday.value = saved.birthday;
  if (saved.bio) form.bio.value = saved.bio;

  const showPreview = (input, previewId, src) => {
    const preview = document.getElementById(previewId);
    if (src) preview.src = src;
    input.addEventListener("change", () => {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          preview.src = reader.result;
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // Rodyti nuotraukas, jei yra
  showPreview(photoInputs[0], "preview1", saved.photo1);
  showPreview(photoInputs[1], "preview2", saved.photo2);
  showPreview(photoInputs[2], "preview3", saved.photo3);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const name = form.name.value;
    const birthday = form.birthday.value;
    const bio = form.bio.value;

    const data = { name, birthday, bio };

    const readImage = file =>
      new Promise(resolve => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

    // Nuskaityti visas nuotraukas
    data.photo1 = await readImage(photoInputs[0].files[0]) || saved.photo1 || null;
    data.photo2 = await readImage(photoInputs[1].files[0]) || saved.photo2 || null;
    data.photo3 = await readImage(photoInputs[2].files[0]) || saved.photo3 || null;

    localStorage.setItem("profile", JSON.stringify(data));
    location.href = "my-soul.html";
  });
});
