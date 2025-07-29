document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("soulQuiz") || "{}");
  const soulCard = document.getElementById("soulCard");
  const userNameEl = document.getElementById("userName");
  if (data.name) userNameEl.textContent = data.name;

  const summaryBox = `
    <div class="summary-box">
      🌟 <em>${data.name} is a soulful person who seeks ${data.connectionType?.toLowerCase() || "connections"}.
      With a heart tuned to ${data.loveLanguage || "love"}, and guided by ${data.values?.join(", ") || "deep values"},
      they’re looking for meaningful relationships. ${data.bio || ""}</em>
    </div>
  `;

  const content = `
    <p><strong>Birthday:</strong> ${data.birthday || "–"}</p>
    <p><strong>Country:</strong> ${data.country || "–"}</p>
    <p><strong>Height:</strong> ${data.height || "–"} cm</p>
    <p><strong>Weight:</strong> ${data.weight || "–"} kg</p>
    <p><strong>Connection Type:</strong> ${data.connectionType || "–"}</p>
    <p><strong>Love Language:</strong> ${data.loveLanguage || "–"}</p>
    <p><strong>Hobbies:</strong> ${Array.isArray(data.hobbies) ? data.hobbies.join(", ") : "–"}</p>
    <p><strong>Values:</strong> ${Array.isArray(data.values) ? data.values.join(", ") : "–"}</p>
    <p><strong>Unacceptable Behaviour:</strong> ${data.unacceptable || "–"}</p>
    <p><strong>About Me:</strong> ${data.bio || "–"}</p>
    <hr />
    <p><strong>Western Zodiac:</strong> ${data.westernZodiac || "–"}</p>
    <p><strong>Chinese Zodiac:</strong> ${data.chineseZodiac || "–"}</p>
    <p><strong>Life Path Number:</strong> ${data.lifePathNumber || "–"}</p>
  `;

  soulCard.innerHTML = summaryBox + soulCard.innerHTML;
  document.getElementById("soulContent").innerHTML = content;
});
