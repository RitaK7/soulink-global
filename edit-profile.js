// edit-profile.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profile-form");
  const photoInputs = [
    document.getElementById("photo1"),
    document.getElementById("photo2"),
    document.getElementById("photo3")
  ];

  // 1. Tvirtiamos vietos, kad JSON.parse visada gautų validų tekstą
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem("profile") || "{}");
  } catch (e) {
    console.error("Negalima perskaityti profile iš localStorage:", e);
    saved = {};
  }

  // 2. Užpildome laukus (net jei tušti – rodys placeholder’į)
  form.name.value     = saved.name     || "";
  form.birthday.value = saved.birthday || "";
  form.bio.value      = saved.bio      || "";

  // 3. Preview helper – jei nėra src, paslepia <img>
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
        // jei failas išimtas – rodome seną arba slepiam
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

  // 4. Inicializuojame visus tris preview
  showPreview(photoInputs[0], "preview1", saved.photo1);
  showPreview(photoInputs[1], "preview2", saved.photo2);
  showPreview(photoInputs[2], "preview3", saved.photo3);

  // 5. Pagrindinis įvykis formos submit – skaitom tekstus, nuotraukas, ir rašom į localStorage
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const data = {
      name:     form.name.value,
      birthday: form.birthday.value,
      bio:      form.bio.value
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

    localStorage.setItem("profile", JSON.stringify(data));
    // po išsaugojimo – į My Soul
    window.location.href = "my-soul.html";
  });
});
