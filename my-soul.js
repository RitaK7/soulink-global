document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("soulQuiz") || "{}");

  const userNameEl = document.getElementById("userName");
  if (data.name) userNameEl.textContent = data.name;

  const avatarContainer = document.getElementById("avatarContainer");
  if (data.photo1) {
    const img = document.createElement("img");
    img.src = data.photo1;
    img.alt = "My Soul Photo";
    img.className = "profile-avatar";
    avatarContainer.appendChild(img);
  }

  const cardContainer = document.getElementById("soulCard");
  const fields = [
    ["Birthday", data.birthday],
    ["Country", data.country],
    ["Height", data.height ? data.height + " cm" : ""],
    ["Weight", data.weight ? data.weight + " kg" : ""],
    ["Connection Type", data.connectionType],
    ["Love Language", data.loveLanguage],
    ["Hobbies", renderList(data.hobbies)],
    ["Values", renderList(data.values)],
    ["Unacceptable Behaviour", data.unacceptable],
    ["About Me", data.bio],
    ["Western Zodiac", data.westernZodiac],
    ["Chinese Zodiac", data.chineseZodiac],
    ["Life Path Number", data.lifePathNumber]
  ];

  fields.forEach(([label, value]) => {
    cardContainer.innerHTML += createCard(label, value);
  });
});

function renderList(arr) {
  return Array.isArray(arr) && arr.length
    ? "<ul>" + arr.map(i => `<li>${i}</li>`).join("") + "</ul>"
    : "–";
}

function createCard(label, value) {
  const icons = {
    "Name": "bi-person-circle",
    "Birthday": "bi-cake",
    "Country": "bi-geo-alt",
    "Height": "bi-rulers",
    "Weight": "bi-scales",
    "Connection Type": "bi-people",
    "Love Language": "bi-heart",
    "Hobbies": "bi-puzzle",
    "Values": "bi-gem",
    "Unacceptable Behaviour": "bi-x-octagon",
    "About Me": "bi-chat-left-text",
    "Western Zodiac": "bi-stars",
    "Chinese Zodiac": "bi-kanban",
    "Life Path Number": "bi-compass"
  };
  const icon = icons[label] || "bi-info-circle";
  return `
    <div class="card glowing-card">
      <i class="bi ${icon} icon-glow"></i>
      <strong>${label}</strong><br />
      <span>${value || "–"}</span>
    </div>`;
}
