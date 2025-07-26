
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("editProfileForm");
  const previews = [1, 2, 3].map(i => document.getElementById("preview" + i));
  const inputs = [1, 2, 3].map(i => document.getElementById("profilePhoto" + i));
  let data = {};
  try {
    data = JSON.parse(localStorage.getItem("soulQuiz")) || {};
  } catch (e) {
    console.error("Error reading soulQuiz from localStorage", e);
  }

  const fields = [
    "name", "birthday", "about", "relationshipType",
    "loveLanguage", "hobbies", "values", "unacceptable"
  ];

  fields.forEach(field => {
    const el = document.getElementById(field);
    if (el && data[field]) el.value = data[field];
  });

  previews.forEach((preview, i) => {
    const key = "profilePhoto" + (i + 1);
    if (data[key]) preview.src = data[key];
  });

  inputs.forEach((input, i) => {
    const key = "profilePhoto" + (i + 1);
    input.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        previews[i].src = reader.result;
        data[key] = reader.result;
      };
      reader.readAsDataURL(file);
    });
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    fields.forEach(field => {
      const el = document.getElementById(field);
      if (el) data[field] = el.value;
    });
    localStorage.setItem("soulQuiz", JSON.stringify(data));
    alert("✅ Your profile has been updated!");
    window.location.href = "my-soul.html";
  });
});
