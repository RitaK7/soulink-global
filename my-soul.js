document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("soulQuiz") || "{}");
  const card = document.getElementById("soulCard");
  const summary = document.getElementById("soulSummary");

  if (!data.name) {
    card.innerHTML = "<p>No data found. Please complete the quiz.</p>";
    return;
  }

  // Avatar
  const avatarHTML = data.photo1 ? `<img class="profile-avatar" src="${data.photo1}" alt="Avatar"/>` : "";

  // Summary Insight
  const summaryHTML = `
    <div class="glow-card">
      <h2>Hello, ${data.name} 👋</h2>
      <p>You’re seeking <strong>${data.connectionType || "–"}</strong> and your love language is <strong>${data.loveLanguage || "–"}</strong>.</p>
      <p>You value <strong>${(data.values || []).slice(0, 3).join(", ") || "–"}</strong> most in life.</p>
      <p>Your essence: <em>"${data.bio || "–"}"</em></p>
    </div>
  `;
  summary.innerHTML = summaryHTML;

  const renderList = arr => arr?.length ? `<ul>${arr.map(i => `<li>${i}</li>`).join("")}</ul>` : "–";

  card.innerHTML = `
    ${avatarHTML}
    <div class="glow-card"><strong>Birthday:</strong> ${data.birthday || "–"}</div>
    <div class="glow-card"><strong>Country:</strong> ${data.country || "–"}</div>
    <div class="glow-card"><strong>Height:</strong> ${data.height || "–"} cm</div>
    <div class="glow-card"><strong>Weight:</strong> ${data.weight || "–"} kg</div>
    <div class="glow-card"><strong>Connection Type:</strong> ${data.connectionType || "–"}</div>
    <div class="glow-card"><strong>Love Language:</strong> ${data.loveLanguage || "–"}</div>
    <div class="glow-card"><strong>Hobbies:</strong> ${renderList(data.hobbies)}</div>
    <div class="glow-card"><strong>Values:</strong> ${renderList(data.values)}</div>
    <div class="glow-card"><strong>Unacceptable Behaviour:</strong> ${data.unacceptable || "–"}</div>
    <div class="glow-card"><strong>About Me:</strong> ${data.bio || "–"}</div>
    <div class="glow-card"><strong>Western Zodiac:</strong> ${data.westernZodiac || "–"}</div>
    <div class="glow-card"><strong>Chinese Zodiac:</strong> ${data.chineseZodiac || "–"}</div>
    <div class="glow-card"><strong>Life Path Number:</strong> ${data.lifePathNumber || "–"}</div>
  `;
});
