document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profile-form");
  const photoInputs = [
    document.getElementById("photo1"),
    document.getElementById("photo2"),
    document.getElementById("photo3")
  ];

  const saved = JSON.parse(localStorage.getItem("soulQuiz")) || {};
  if (saved.name) form.name.value = saved.name;
  if (saved.birthday) form.birthday.value = saved.birthday;
  if (saved.about) form.about.value = saved.about;
  if (saved.connectionType) form.connectionType.value = saved.connectionType;
  if (saved.loveLanguage) form.loveLanguage.value = saved.loveLanguage;
  if (saved.unacceptableBehavior) form.unacceptableBehavior.value = saved.unacceptableBehavior;

  if (saved.hobbies) {
    document.querySelectorAll("input[name='hobbies']").forEach(el => {
      if (saved.hobbies.includes(el.value)) el.checked = true;
    });
  }

  if (saved.values) {
    document.querySelectorAll("input[name='values']").forEach(el => {
      if (saved.values.includes(el.value)) el.checked = true;
    });
  }

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

  showPreview(photoInputs[0], "preview1", saved.photo1);
  showPreview(photoInputs[1], "preview2", saved.photo2);
  showPreview(photoInputs[2], "preview3", saved.photo3);

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const getCheckedValues = (name) =>
      Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);

    const data = {
      name: form.name.value,
      birthday: form.birthday.value,
      about: form.about.value,
      connectionType: form.connectionType.value,
      loveLanguage: form.loveLanguage.value,
      unacceptableBehavior: form.unacceptableBehavior.value,
      hobbies: getCheckedValues("hobbies"),
      values: getCheckedValues("values"),
    };

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
    alert("✅ Duomenys išsaugoti!");
    window.location.href = "my-soul.html";
  });
});
