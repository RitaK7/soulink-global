
document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("soulQuiz") || "{}");
  const container = document.getElementById("soulCard");
  const userNameEl = document.getElementById("userName");
  if (data.name) userNameEl.textContent = data.name;

  if (!data.name) {
    container.innerHTML = "<p>No data found. Please complete the quiz.</p>";
    return;
  }

  function renderList(arr) {
    return arr && arr.length ? arr.map(i => `<span class='pill'>${i}</span>`).join(" ") : "<em>–</em>";
  }

  container.innerHTML = `
    <section class="section-box">
      <h2><i class="bi bi-person-vcard"></i> Personal Info</h2>
      <p><strong>Birth Date:</strong> ${data.birthday || "–"}</p>
      <p><strong>Country:</strong> ${data.country || "–"}</p>
      <p><strong>Height:</strong> ${data.height || "–"} cm</p>
      <p><strong>Weight:</strong> ${data.weight || "–"} kg</p>
      <p><strong>Connection:</strong> ${data.connectionType || "–"}</p>
      <p><strong>Relationship Type:</strong> ${data.loveLanguage || "–"}</p>
    </section>
    <section class="section-box">
      <h2><i class="bi bi-hearts"></i> Hobbies & Values</h2>
      <p><strong>Hobbies:</strong> ${renderList(data.hobbies)}</p>
      <p><strong>Values:</strong> ${renderList(data.values)}</p>
    </section>
    <section class="section-box">
      <h2><i class="bi bi-flower2"></i> Essence</h2>
      <p><strong>Unacceptable:</strong> ${data.unacceptable || "–"}</p>
      <p><strong>Soul Message:</strong> ${data.bio || "–"}</p>
    </section>
    <section class="section-box">
      <h2><i class="bi bi-envelope-heart"></i> Love Language</h2>
      <p>${data.loveLanguage || "–"}</p>
    </section>
    <section class="section-box">
      <h2><i class="bi bi-stars"></i> Western Zodiac</h2>
      <p>${data.westernZodiac || "–"}</p>
    </section>
    <section class="section-box">
      <h2><i class="bi bi-gem"></i> Chinese Zodiac</h2>
      <p>${data.chineseZodiac || "–"}</p>
    </section>
    <section class="section-box">
      <h2><i class="bi bi-123"></i> Life Path Number</h2>
      <p>${data.lifePathNumber || "–"}</p>
    </section>
    <div class="center-btn">
      <a href="edit-profile.html" class="btn-glow">Edit Profile</a>
    </div>
  `;
});
