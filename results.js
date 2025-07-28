// ─── DATA MAPPINGS ────────────────────────────────────────────────
const loveLangMap = {
  "Words of Affirmation": "You thrive on heartfelt compliments and spoken appreciation.",
  "Acts of Service": "Actions speak louder than words—you feel loved when help arrives.",
  "Receiving Gifts": "Tangible tokens show you how much you’re cherished.",
  "Quality Time": "Undivided attention and shared moments fill your soul.",
  "Physical Touch": "Touch is your language of connection and security."
};

const westernMap = {
  Aries: "bold and ambitious, driven by passion.",
  Taurus: "grounded and reliable, with a love for beauty.",
  Gemini: "curious and adaptable, thrives on communication.",
  Cancer: "deeply intuitive and emotionally in tune.",
  Leo: "radiates confidence, charisma, and creativity.",
  Virgo: "meticulous, thoughtful, and practical.",
  Libra: "seeks balance and harmony in all relationships.",
  Scorpio: "intense, magnetic, and deeply emotional.",
  Sagittarius: "adventurous, optimistic, always chasing truth.",
  Capricorn: "disciplined, ambitious, steadily climbing to success.",
  Aquarius: "innovative, humanitarian, values freedom.",
  Pisces: "empathetic dreamer, guided by emotion and art."
};

const chineseMap = {
  Rat: "quick-witted and resourceful, often finding success creatively.",
  Ox: "strong and dependable, building life on hard work and honesty.",
  Tiger: "brave and competitive, winning admiration with daring spirit.",
  Rabbit: "gentle and compassionate, seeking peace and comfort.",
  Dragon: "confident and enthusiastic, destined for leadership.",
  Snake: "wise and strategic, trusting intuition to guide you.",
  Horse: "energetic and free-spirited, thriving on independence.",
  Goat: "kind and artistic, nurturing beauty in all aspects of life.",
  Monkey: "clever and curious, solving problems with creativity.",
  Rooster: "precise and practical, known for honesty and dedication.",
  Dog: "loyal and protective, placing great value on integrity.",
  Pig: "generous and sincere, finding joy in comfort and kindness."
};

const lifePathMap = {
  1: "Leader, independent and pioneering spirit.",
  2: "Diplomat, harmonizer, sensitive and intuitive.",
  3: "Creative, expressive and optimistic soul.",
  4: "Builder, practical and loyal with strong foundations.",
  5: "Adventurer, freedom-seeker and adaptable.",
  6: "Caretaker, responsible, family-centered and loving.",
  7: "Seeker, analytical and spiritual.",
  8: "Achiever, ambitious and business-minded.",
  9: "Humanitarian, compassionate and wise.",
  11: "Spiritual teacher, visionary, deeply intuitive and idealistic.",
  22: "Master builder, ambitious with visionary leadership.",
  33: "Master healer, compassionate, devoted and nurturing."
};

// ─── HELPERS ──────────────────────────────────────────────────────
function computeLifePath(dateStr) {
  if (!dateStr) return "Unknown";
  let sum = dateStr.replace(/-/g, "").split("").reduce((a, b) => a + +b, 0);
  while (sum > 9 && ![11,22,33].includes(sum)) {
    sum = sum.toString().split("").reduce((a, b) => a + +b, 0);
  }
  return sum;
}

// ─── RENDER RESULTS ───────────────────────────────────────────────
function renderResults() {
  const data = JSON.parse(localStorage.getItem("soulQuiz") || "{}");
  const {
    name = "Soul Seeker",
    birthdate = "Unknown",
    connection = "Unknown",
    loveLanguage = "Unknown",
    westernZodiac = "Unknown",
    chineseZodiac = "Unknown"
  } = data;

  const lifePath = computeLifePath(birthdate);

  // Greeting
  document.getElementById("greeting-card").innerHTML = `
    <h3>🌟 Hello, ${name}!</h3>
    <p>You were born on <strong>${birthdate}</strong> and you’re looking for <strong>${connection}</strong>.</p>
    <p>Your primary love language is <strong>${loveLanguage}</strong>.</p>
  `;

  // Love Language
  document.getElementById("love-card").innerHTML = `
    <h3>💖 Love Language</h3>
    <p>${loveLangMap[loveLanguage] || "No data."}</p>
  `;

  // Western Zodiac
  document.getElementById("western-card").innerHTML = `
    <h3>✨ Western Zodiac</h3>
    <p><strong>${westernZodiac}</strong></p>
    <p>${westernMap[westernZodiac] || "No data."}</p>
  `;

  // Chinese Zodiac
  document.getElementById("chinese-card").innerHTML = `
    <h3>🐍 Chinese Zodiac</h3>
    <p><strong>${chineseZodiac}</strong></p>
    <p>${chineseMap[chineseZodiac] || "No data."}</p>
  `;

  // Numerology
  document.getElementById("numerology-card").innerHTML = `
    <h3>🔢 Numerology (Life Path)</h3>
    <p>Your Life Path number is <strong>${lifePath}</strong>.</p>
    <p>${lifePathMap[lifePath] || ""}</p>
  `;

  // AI Insight
  document.getElementById("ai-insight-card").innerHTML = `
    <h3>🧠 AI Soul Insight</h3>
    <p>Dear <strong>${name}</strong>, your soul resonates with the energy of a <strong>${westernZodiac}</strong>—${westernMap[westernZodiac] || ""}</p>
    <p>Your love language, <strong>${loveLanguage}</strong>, shows that ${loveLangMap[loveLanguage] || ""}</p>
    <p>As a <strong>${chineseZodiac}</strong> in Chinese astrology, you’re ${chineseMap[chineseZodiac] || ""}</p>
    <p>Your Life Path number <strong>${lifePath}</strong> indicates ${lifePathMap[lifePath] || ""}</p>
  `;
}

// ─── FEEDBACK VIA EmailJS v3 ──────────────────────────────────────
function initFeedback() {
  const PUBLIC_KEY  = "SV7ptjuNI88paiVbz";
  const SERVICE_ID  = "default_service";
  const TEMPLATE_ID = "template_99hg4ni";

  emailjs.init(PUBLIC_KEY);

  const form   = document.getElementById("feedback-form");
  const status = document.getElementById("feedback-message");
  const btn    = form.querySelector("button");

  form.addEventListener("submit", e => {
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = "Sending…";
    status.textContent = "";

    const vars = {
      user_email: form.user_email.value,
      page:       form.page.value,
      rating:     form.rating.value,
      feedback:   form.feedback.value
    };

    console.log("EmailJS ▶", SERVICE_ID, TEMPLATE_ID, vars);

    emailjs.send(SERVICE_ID, TEMPLATE_ID, vars, PUBLIC_KEY)
      .then(() => {
        status.textContent = "✅ Feedback sent!";
        btn.textContent   = "Sent ✓";
      })
      .catch(err => {
        console.error("EmailJS Error (send):", err);
        status.textContent = `❌ Send failed (${err.status}): ${err.text}`;
        btn.disabled = false;
        btn.textContent = "Send Feedback";
      });
  });
}

// ─── PDF DOWNLOAD ─────────────────────────────────────────────────
function initPDF() {
  document.getElementById("download-pdf")
    .addEventListener("click", () => {
      const el = document.getElementById("results-output");
      html2pdf().set({
        margin: .5,
        filename: "Soulink-Results.pdf",
        html2canvas: { scale: 2 }
      }).from(el).save();
    });
}

// ─── START ────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  renderResults();
  initFeedback();
  initPDF();
});
