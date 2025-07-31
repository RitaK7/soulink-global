document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("soulQuiz") || "{}");

  // Soul Summary
  const summaryBox = `
    <p><strong>${data.name || "User"}</strong> seeks a <strong>${data.connectionType || "–"}</strong> connection, 
    loves through <strong>${data.loveLanguage || "–"}</strong>, 
    and describes themselves as: <em>${data.about || "–"}</em>.</p>`;
  document.getElementById("soulSummaryBox").innerHTML = summaryBox;

  // Avatar
  const avatarImg = document.getElementById("profileAvatar");
  if (data.profilePhoto1) {
    avatarImg.src = data.profilePhoto1;
  } else {
    avatarImg.style.display = "none";
  }

  // Data Fields
  const createCard = (label, value) => `
    <div class="card"><strong>${label}</strong>: ${value || "–"}</div>`;

  const createListCard = (label, items) => `
    <div class="card">
      <strong>${label}</strong>:
      <ul>${(items || []).map(item => `<li>${item}</li>`).join("")}</ul>
    </div>`;

  const soulCard = document.getElementById("soulCard");
  soulCard.innerHTML = `
    <div class="grid-2">
      ${createCard("Name", data.name)}
      ${createCard("Birthday", data.birthday)}
      ${createCard("Country", data.country)}
      ${createCard("Height", data.height ? data.height + " cm" : "–")}
      ${createCard("Weight", data.weight ? data.weight + " kg" : "–")}
      ${createCard("Connection Type", data.connectionType)}
      ${createCard("Love Language", data.loveLanguage)}
      ${createCard("Hobbies", (data.hobbies || []).join(", "))}
      ${createCard("Values", (data.values || []).join(", "))}
      ${createCard("Unacceptable Behaviour", data.behaviour)}
      ${createCard("About Me", data.about)}
      ${createCard("Western Zodiac", data.westernZodiac)}
      ${createCard("Chinese Zodiac", data.chineseZodiac)}
      ${createCard("Life Path Number", data.lifePathNumber)}
    </div>`;
});
