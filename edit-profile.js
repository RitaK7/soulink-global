document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profile-form");
  const photoInputs = [
    document.getElementById("photo1"),
    document.getElementById("photo2"),
    document.getElementById("photo3")
  ];

  let saved;
  try {
    saved = JSON.parse(localStorage.getItem("soulQuiz") || "{}");
  } catch (e) {
    console.error("Failed to parse soulQuiz:", e);
    saved = {};
  }

  form.name.value = saved.name || "";
  form.birthday.value = saved.birthday || "";
  form.bio.value = saved.bio || "";

  const showPreview = (input, previewId, src) => {
    const img = document.getElementById(previewId);
    if (src) {
      img.src = src;
      img.style.display = "block";
    } else {
      img.style.display = "none";
    }
    input.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) {
        img.style.display = saved[previewId] ? "block" : "none";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result;
        img.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  };

  showPreview(photoInputs[0], "preview1", saved.photo1);
  showPreview(photoInputs[1], "preview2", saved.photo2);
  showPreview(photoInputs[2], "preview3", saved.photo3);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const data = {
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

    data.photo1 = await readImage(photoInputs[0].files[0]) || saved.photo1 || null;
    data.photo2 = await readImage(photoInputs[1].files[0]) || saved.photo2 || null;
    data.photo3 = await readImage(photoInputs[2].files[0]) || saved.photo3 || null;

    localStorage.setItem("soulQuiz", JSON.stringify(data));
    window.location.href = "my-soul.html";
  });
});