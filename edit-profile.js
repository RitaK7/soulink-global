
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("edit-profile-form");

  // Load existing data from localStorage
  const storedData = JSON.parse(localStorage.getItem("soulQuiz")) || {};
  document.getElementById("name").value = storedData.name || "";
  document.getElementById("birthday").value = storedData.birthday || "";
  document.getElementById("about").value = storedData.about || "";
  document.getElementById("relationshipType").value = storedData.relationshipType || "";
  document.getElementById("connection").value = storedData.connection || "";

  // Handle Save
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const updatedData = {
      ...storedData,
      name: document.getElementById("name").value,
      birthday: document.getElementById("birthday").value,
      about: document.getElementById("about").value,
      relationshipType: document.getElementById("relationshipType").value,
      connection: document.getElementById("connection").value,
    };
    localStorage.setItem("soulQuiz", JSON.stringify(updatedData));
    window.location.href = "my-soul.html";
  });

  // Preview image uploads
  function previewImage(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    input.addEventListener("change", function () {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  previewImage("photo1", "preview1");
  previewImage("photo2", "preview2");
  previewImage("photo3", "preview3");
});
