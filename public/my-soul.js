// public/my-soul.js

// ─── INSIGHT MAPPINGS ─────────────────────────────────────────────
const westernMap = {
  Aries:        "You’re courageous and energetic – a pioneer who leads with passion.",
  Taurus:       "Grounded and reliable, you cherish comfort and beauty in every form.",
  Gemini:       "Curious and adaptable, you thrive on communication and new ideas.",
  Cancer:       "Nurturing and intuitive, you place family and emotion above all.",
  Leo:          "Radiant and generous, you lead with confidence and warmth.",
  Virgo:        "Detail-oriented and analytical, striving for perfection.",
  Libra:        "Balanced and fair, you seek harmony in all relationships.",
  Scorpio:      "Intense and magnetic, you delve into life’s deeps with passion.",
  Sagittarius:  "Adventurous and optimistic, always chasing truth and wisdom.",
  Capricorn:    "Disciplined and ambitious, steadily climbing to success.",
  Aquarius:     "Innovative and humanitarian, valuing freedom and progress.",
  Pisces:       "Empathetic dreamer, guided by emotion and artistic vision."
};

const loveLangMap = {
  "Words of Affirmation": "You flourish on heartfelt compliments and spoken appreciation.",
  "Acts of Service":      "Actions speak louder than words – you feel loved when help arrives.",
  "Receiving Gifts":      "Tangible tokens show how much you’re cherished.",
  "Quality Time":         "Undivided attention and shared moments fill your soul.",
  "Physical Touch":       "Touch is your language of connection and security."
};

const chineseMap = {
  Rat:    "Quick-witted and resourceful, often finding success in creative ways.",
  Ox:     "Strong and dependable, building life on hard work and honesty.",
  Tiger:  "Brave and competitive, winning admiration with daring spirit.",
  Rabbit: "Gentle and compassionate, seeking peace and comfort.",
  Dragon: "Confident and enthusiastic, destined for leadership.",
  Snake:  "Wise and strategic, trusting intuition to guide you.",
  Horse:  "Energetic and independent, loving adventure.",
  Goat:   "Calm and artistic, appreciating beauty and deep bonds.",
  Monkey: "Clever and playful, the life of the party.",
  Rooster:"Observant and hardworking, proud and courageous.",
  Dog:    "Loyal and honest, devoted protector and friend.",
  Pig:    "Generous and compassionate, valuing comfort and company."
};

const lifePathMap = {
  1:  "Natural-born leader, independent and ambitious.",
  2:  "Peacemaker, intuitive and diplomatic.",
  3:  "Creative communicator, optimistic and expressive.",
  4:  "Builder, practical and disciplined.",
  5:  "Adventurer, freedom-loving and adaptable.",
  6:  "Nurturer, responsible and caring.",
  7:  "Seeker, analytical and spiritual.",
  8:  "Executive, driven and successful.",
  9:  "Humanitarian, generous and compassionate.",
  11: "Master Teacher: high ideals and deep intuition.",
  22: "Master Builder: turning dreams into reality."
};

// ─── UTILS ────────────────────────────────────────────────────────
function getWesternZodiac(dob) {
  const d = new Date(dob), m = d.getMonth()+1, day = d.getDate();
  if ((m===3&&day>=21)||(m===4&&day<=19)) return "Aries";
  if ((m===4&&day>=20)||(m===5&&day<=20)) return "Taurus";
  if ((m===5&&day>=21)||(m===6&&day<=20)) return "Gemini";
  if ((m===6&&day>=21)||(m===7&&day<=22)) return "Cancer";
  if ((m===7&&day>=23)||(m===8&&day<=22)) return "Leo";
  if ((m===8&&day>=23)||(m===9&&day<=22)) return "Virgo";
  if ((m===9&&day>=23)||(m===10&&day<=22)) return "Libra";
  if ((m===10&&day>=23)||(m===11&&day<=21)) return "Scorpio";
  if ((m===11&&day>=22)||(m===12&&day<=21)) return "Sagittarius";
  if ((m===12&&day>=22)||(m===1&&day<=19)) return "Capricorn";
  if ((m===1&&day>=20)||(m===2&&day<=18)) return "Aquarius";
  if ((m===2&&day>=19)||(m===3&&day<=20)) return "Pisces";
  return "Unknown";
}

function getChineseZodiac(dob) {
  const year = new Date(dob).getFullYear();
  return ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"][(year-1900)%12] || "Unknown";
}

function getLifePathNumber(dob) {
  let sum = dob.replace(/[^0-9]/g,'').split('').map(Number).reduce((a,b)=>a+b,0);
  while (sum>9 && ![11,22].includes(sum)) {
    sum = sum.toString().split('').map(Number).reduce((a,b)=>a+b,0);
  }
  return sum;
}

// ─── RENDER ───────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", ()=> {
  const quiz    = JSON.parse(localStorage.getItem("soulQuiz")  || "{}");
  const profile = JSON.parse(localStorage.getItem("profile")   || "{}");
  const mount   = document.getElementById("soul-profile");

  if (!quiz.name) {
    mount.innerHTML = `<p>No profile data found. <a href="quiz.html">Take the Quiz</a> first.</p>`;
    return;
  }

  const west = getWesternZodiac(quiz.birthdate);
  const chi  = getChineseZodiac(quiz.birthdate);
  const life = getLifePathNumber(quiz.birthdate);

  // build photo gallery only if at least one valid URL
  const photos = [profile.photo1, profile.photo2, profile.photo3]
    .filter(url => typeof url === 'string' && url.trim().length);

  let gallerySection = '';
  if (photos.length) {
    gallerySection = `
      <section class="card">
        <h3>🖼️ Your Photos</h3>
        <div class="photo-gallery">
          ${photos.map(url => `<img src="${url}" alt="Photo">`).join('')}
        </div>
      </section>
    `;
  }

  mount.innerHTML = `
    ${gallerySection}

    <section class="card highlight">
      <h2>Welcome, ${quiz.name}!</h2>
      <p><em>Your soul profile at a glance</em></p>
    </section>

    <section class="card">
      <h3>📚 Personal Info</h3>
      <p><strong>Birth Date:</strong> ${quiz.birthdate||"Unknown"}</p>
      <p><strong>About Me:</strong> ${profile.bio   ||"Unknown"}</p>
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
      <a href="quiz.html"         class="btn"><i class="bi bi-arrow-left"></i> Quiz</a>
      <a href="edit-profile.html" class="btn">Edit Profile</a>
      <a href="soul-coach.html"   class="btn">Soul Coach <i class="bi bi-arrow-right"></i></a>
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
});
