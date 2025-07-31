document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("soulQuiz") || "{}");
  const soulCard = document.getElementById("soulCard");
  const soulSummary = document.getElementById("soul-summary");

  if (!data.name) {
    soulCard.innerHTML = `<p class="centered glow-text">Please complete the quiz first 🌀</p>`;
    return;
  }

  // ✨ Summary box (top)
  const summaryText = `You are a soul seeking a ${data.connectionType || "meaningful"} connection. 
  Your love language is ${data.loveLanguage || "unknown"} and you value ${data.values?.slice(0, 2).join(" & ") || "..."}. 
  Let's find someone who matches your energy.`;
  soulSummary.innerHTML = `<p>${summaryText}</p>`;

  // ✨ Full profile grid
  soulCard.innerHTML = `
    ${data.profilePhoto1 ? `<img src="${data.profilePhoto1}" class="profile-avatar" alt="Profile Photo">` : ""}
    <div class="glow-card"><strong>Name:</strong> ${data.name}</div>
    <div class="glow-card"><strong>Birthday:</strong> ${data.birthday || "–"}</div>
    <div class="glow-card"><strong>Country:</strong> ${data.country || "–"}</div>
    <div class="glow-card"><strong>Height:</strong> ${data.height || "–"} cm</div>
    <div class="glow-card"><strong>Weight:</strong> ${data.weight || "–"} kg</div>
    <div class="glow-card"><strong>Connection Type:</strong> ${data.connectionType || "–"}</div>
    <div class="glow-card"><strong>Love Language:</strong> ${data.loveLanguage || "–"}</div>
    <div class="glow-card"><strong>Hobbies:</strong> ${renderList(data.hobbies)}</div>
    <div class="glow-card"><strong>Core Values:</strong> ${renderList(data.values)}</div>
    <div class="glow-card"><strong>Unacceptable Behavior:</strong> ${data.unacceptable || "–"}</div>
    <div class="glow-card"><strong>About Me:</strong> ${data.bio || "–"}</div>
    <div class="glow-card"><strong>Western Zodiac:</strong> ${data.westernZodiac || "–"}</div>
    <div class="glow-card"><strong>Chinese Zodiac:</strong> ${data.chineseZodiac || "–"}</div>
    <div class="glow-card"><strong>Life Path Number:</strong> ${data.lifePathNumber || "–"}</div>
  `;

  function renderList(arr) {
    return Array.isArray(arr) && arr.length
      ? "<ul>" + arr.map(i => `<li>${i}</li>`).join("") + "</ul>"
      : "–";
  }
});
