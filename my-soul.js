document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("soulQuiz") || "{}");

  const summaryBox = `
    <div class="soul-summary-box card glow-box">
      <p><i class="bi bi-stars"></i> <strong>${data.name || "This soul"}</strong> is a radiant being seeking ${data.connectionType?.toLowerCase() || "genuine"} connections. 
      Their heart resonates with <strong>${data.loveLanguage || "deep love"}</strong>, guided by values like 
      <strong>${(data.values || []).join(", ") || "authenticity"}</strong>. 
      <br/><em>${data.about || ""}</em></p>
    </div>
  `;
  document.getElementById("soul-summary").innerHTML = summaryBox;

  const createCard = (icon, title, content) => {
    if (!content || (Array.isArray(content) && content.length === 0)) return "";
    const formatted = Array.isArray(content) ? content.join(", ") : content;
    return `
      <div class="card glow-box">
        <h3><i class="bi ${icon}"></i> ${title}</h3>
        <p>${formatted}</p>
      </div>
    `;
  };

  const soulCard = document.getElementById("soulCard");
  soulCard.innerHTML = `
    ${createCard("bi-calendar-heart", "Birthdate", data.birthday)}
    ${createCard("bi-geo-alt", "Country", data.country)}
    ${createCard("bi-rulers", "Height", data.height ? `${data.height} cm` : "")}
    ${createCard("bi-weight", "Weight", data.weight ? `${data.weight} kg` : "")}
    ${createCard("bi-people", "Connection Type", data.connectionType)}
    ${createCard("bi-heart-pulse", "Love Language", data.loveLanguage)}
    ${createCard("bi-stars", "Hobbies", data.hobbies)}
    ${createCard("bi-gem", "Values", data.values)}
    ${createCard("bi-exclamation-triangle", "Unacceptable Behaviour", data.unacceptable)}
    ${createCard("bi-chat-quote", "About Me", data.about)}
    ${createCard("bi-moon-stars", "Western Zodiac", data.westernZodiac)}
    ${createCard("bi-kanban", "Chinese Zodiac", data.chineseZodiac)}
    ${createCard("bi-123", "Life Path Number", data.lifePath)}
  `;
});
