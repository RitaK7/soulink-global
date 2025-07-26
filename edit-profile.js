// AI-enhanced Edit Profile JS

const soulData = JSON.parse(localStorage.getItem("soulQuiz")) || {};

function loadProfile() {
  const fields = [
    "name", "birthday", "relationshipType", "loveLanguage",
    "hobbies", "values", "unacceptable", "about"
  ];
  fields.forEach(field => {
    const el = document.getElementById(field + "Value");
    if (el) el.textContent = soulData[field] || "Not provided";
  });

  // Load profile photos
  for (let i = 1; i <= 3; i++) {
    const img = document.getElementById("photo" + i);
    const key = "profilePhoto" + i;
    if (img && soulData[key]) {
      img.src = soulData[key];
    } else if (img) {
      img.src = "https://via.placeholder.com/100x100?text=+";
    }
  }
}

function editField(field) {
  const newValue = prompt("Edit your " + field + ":", soulData[field] || "");
  if (newValue !== null) {
    soulData[field] = newValue;
    localStorage.setItem("soulQuiz", JSON.stringify(soulData));
    loadProfile();
  }
}

function saveProfile() {
  localStorage.setItem("soulQuiz", JSON.stringify(soulData));
  alert("✅ Profile saved!");
}

document.addEventListener("DOMContentLoaded", loadProfile);
