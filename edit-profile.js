document.addEventListener("DOMContentLoaded", function () {
  const soulData = JSON.parse(localStorage.getItem("soulQuiz")) || {};

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "Not provided";
  }

  function setImagePreview(id, src) {
    const img = document.getElementById(id);
    if (img) {
      if (src && src.startsWith("data:image")) {
        img.src = src;
      } else {
        img.src = ""; // no default placeholder, just empty
        img.alt = "No image selected";
      }
    }
  }

  setText("name", soulData.name);
  setText("birthday", soulData.birthday);
  setText("type", soulData.relationshipType);
  setText("loveLanguage", soulData.loveLanguage);
  setText("hobbies", soulData.hobbies);
  setText("values", soulData.values);
  setText("unacceptable", soulData.unacceptable);
  setText("about", soulData.about);

  setImagePreview("preview1", soulData.profilePhoto1);
  setImagePreview("preview2", soulData.profilePhoto2);
  setImagePreview("preview3", soulData.profilePhoto3);

  // Edit + Save logic
  const editableFields = [
    "name",
    "birthday",
    "type",
    "loveLanguage",
    "hobbies",
    "values",
    "unacceptable",
    "about"
  ];

  editableFields.forEach(field => {
    const btn = document.getElementById(`edit-${field}`);
    if (btn) {
      btn.addEventListener("click", function () {
        const newValue = prompt(`Edit ${field}:`, soulData[field] || "");
        if (newValue !== null) {
          soulData[field] = newValue;
          setText(field, newValue);
          localStorage.setItem("soulQuiz", JSON.stringify(soulData));
        }
      });
    }
  });

  // Image upload handlers
  for (let i = 1; i <= 3; i++) {
    const input = document.getElementById(`photo${i}`);
    const preview = document.getElementById(`preview${i}`);

    if (input) {
      input.addEventListener("change", function () {
        const file = this.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            preview.src = e.target.result;
            soulData[`profilePhoto${i}`] = e.target.result;
            localStorage.setItem("soulQuiz", JSON.stringify(soulData));
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  // Save Button
  document.getElementById("saveBtn").addEventListener("click", function () {
    localStorage.setItem("soulQuiz", JSON.stringify(soulData));
    alert("✅ Profile saved!");
  });
});
