document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profile-form");
  if (!form) return;

  const photoInputs = [
    document.getElementById("photo1"),
    document.getElementById("photo2"),
    document.getElementById("photo3")
  ];

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem("soulQuiz") || "{}");
  } catch (e) {
    console.error("Failed to parse soulQuiz:", e);
  }

  form.name.value = saved.name || "";
  form.birthday.value = saved.birthday || "";
  form.bio.value = saved.bio || "";
  form.unacceptable.value = saved.unacceptable || "";

  // Set radio buttons
  if (saved.connectionType) {
    const ct = form.querySelector(`input[name="connectionType"][value="${saved.connectionType}"]`);
    if (ct) ct.checked = true;
  }
  if (saved.loveLanguage) {
    const ll = form.querySelector(`input[name="loveLanguage"][value="${saved.loveLanguage}"]`);
    if (ll) ll.checked = true;
  }

  // Set checkboxes
  (saved.hobbies || []).forEach(h => {
    const cb = form.querySelector(`input[name="hobbies"][value="${h}"]`);
    if (cb) cb.checked = true;
  });
  (saved.values || []).forEach(v => {
    const cb = form.querySelector(`input[name="values"][value="${v}"]`);
    if (cb) cb.checked = true;
  });

  // Image preview helper
  const showPreview = (input, previewId, src) => {
    const img = document.getElementById(previewId);
    if (!img || !input) return;
    if (src) {
      img.src = src;
      img.style.display = "block";
    } else {
      img.style.display = "none";
    }
    input.addEventListener("change", () => {
      const file = input.files?.[0];
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
      bio: form.bio.value,
      unacceptable: form.unacceptable.value,
      connectionType: form.querySelector("input[name='connectionType']:checked")?.value || "",
      loveLanguage: form.querySelector("input[name='loveLanguage']:checked")?.value || "",
      hobbies: Array.from(form.querySelectorAll("input[name='hobbies']:checked")).map(cb => cb.value),
      values: Array.from(form.querySelectorAll("input[name='values']:checked")).map(cb => cb.value)
    };

    const readImage = file => new Promise(resolve => {
      if (!file) return resolve(null);
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(file);
    });

    data.photo1 = await readImage(photoInputs[0]?.files?.[0]) || saved.photo1 || null;
    data.photo2 = await readImage(photoInputs[1]?.files?.[0]) || saved.photo2 || null;
    data.photo3 = await readImage(photoInputs[2]?.files?.[0]) || saved.photo3 || null;

    localStorage.setItem("soulQuiz", JSON.stringify(data));
    window.location.href = "my-soul.html";
  });

  // Reset form button
  const resetBtn = document.getElementById("resetForm");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem("soulQuiz");
      form.reset();
      document.querySelectorAll("img.preview").forEach(img => img.style.display = "none");
    });
  }

  // Remove image buttons
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      const img = document.getElementById(target);
      if (img) {
        img.src = "";
        img.style.display = "none";
      }
      const idx = parseInt(target.replace("preview", ""));
      if (photoInputs[idx - 1]) {
        photoInputs[idx - 1].value = "";
      }
    });
  });
});