// my-soul.js

// ─── INSIGHT MAPPINGS ─────────────────────────────────────────────
const westernMap = { /* …same as before… */ };
const loveLangMap = { /* …same as before… */ };
const chineseMap  = { /* …same as before… */ };
const lifePathMap = { /* …same as before… */ };

// ─── UTILS ────────────────────────────────────────────────────────
function getWesternZodiac(dob) { /* …same as before… */ }
function getChineseZodiac(dob) { /* …same as before… */ }
function getLifePathNumber(dob) { /* …same as before… */ }

// ─── RENDER & NAV TOGGLE ─────────────────────────────────────────
window.addEventListener("DOMContentLoaded", ()=> {
  const quiz    = JSON.parse(localStorage.getItem("soulQuiz")  || "{}");
  const profile = JSON.parse(localStorage.getItem("profile")   || "{}");
  const mount   = document.getElementById("soul-profile");

  if (!quiz.name) {
    mount.innerHTML = `<div class="card"><p>No profile data found. <a href="quiz.html">Take the Quiz</a> first.</p></div>`;
  } else {
    const west   = getWesternZodiac(quiz.birthdate);
    const chi    = getChineseZodiac(quiz.birthdate);
    const life   = getLifePathNumber(quiz.birthdate);

    // Photos
    const photos = [profile.photo1, profile.photo2, profile.photo3]
      .filter(url => url && url.trim());
    const gallery = photos.length
      ? `<section class="card">
           <h3>🖼️ Your Photos</h3>
           <div class="photo-gallery">
             ${photos.map(u=>`<img src="${u}" alt="Photo">`).join("")}
           </div>
         </section>`
      : "";

    mount.innerHTML = `
      ${gallery}

      <section class="card highlight">
        <h2>Welcome, ${quiz.name}!</h2>
        <p><em>Your soul profile at a glance</em></p>
      </section>

      <section class="card">
        <h3>📚 Personal Info</h3>
        <p><strong>Birth Date:</strong> ${quiz.birthdate||"Unknown"}</p>
        <p><strong>About Me:</strong> ${profile.bio||"Unknown"}</p>
      </section>

      <section class="card">
        <h3>💖 Love Language Insight</h3>
        <p><strong>${quiz.loveLanguage||"Unknown"}</strong></p>
        <p>${loveLangMap[quiz.loveLanguage]||""}</p>
      </section>

      <section class="card">
        <h3>✨ Western Zodiac: ${west}</h3>
        <p>${westernMap[west]||""}</p>
      </section>

      <section class="card">
        <h3>🐉 Chinese Zodiac: ${chi}</h3>
        <p>${chineseMap[chi]||""}</p>
      </section>

      <section class="card">
        <h3>🔢 Life Path Number: ${life}</h3>
        <p>${lifePathMap[life]||""}</p>
      </section>

      <div class="buttons">
        <a href="quiz.html" class="btn"><i class="bi bi-arrow-left"></i> Quiz</a>
        <a href="edit-profile.html" class="btn">Edit Profile</a>
        <a href="soul-coach.html" class="btn">Soul Coach <i class="bi bi-arrow-right"></i></a>
      </div>

      <p class="premium-note">
        🔒 Some features are exclusive to <strong>Soulink Premium</strong>. 
        <a href="signup.html">Upgrade now.</a>
      </p>

      <footer class="navigation">
        <a href="quiz.html">← Previous</a>
        <a href="friends.html">Next →</a>
      </footer>
    `;
  }

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const header    = document.querySelector('.main-nav');
  navToggle.addEventListener('click', () => {
    header.classList.toggle('active');
  });
});
