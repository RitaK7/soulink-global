
// ✅ results.js – Full version with AI insights, PDF download & feedback

// 1. Description Maps
const loveLangMap = {
  "Words of Affirmation": "You thrive on heartfelt compliments and spoken appreciation.",
  "Acts of Service": "Actions speak louder than words—you feel loved when help arrives.",
  "Receiving Gifts": "Tangible tokens show you how much you’re cherished.",
  "Quality Time": "Undivided attention and shared moments fill your soul.",
  "Physical Touch": "Touch is your language of connection and security."
};

const westernMap = {
  "Aries": "bold and ambitious, driven by passion.",
  "Taurus": "grounded and reliable, with a love for beauty.",
  "Gemini": "curious and adaptable, thrives on communication.",
  "Cancer": "deeply intuitive and emotionally in tune.",
  "Leo": "radiates confidence, charisma, and creativity.",
  "Virgo": "meticulous, thoughtful, and practical.",
  "Libra": "balanced, charming, and values harmony.",
  "Scorpio": "intense, loyal, and emotionally deep.",
  "Sagittarius": "adventurous and optimistic, always chasing truth and wisdom.",
  "Capricorn": "disciplined, ambitious, and deeply grounded.",
  "Aquarius": "innovative and independent, values freedom of thought.",
  "Pisces": "sensitive dreamer, with a deep well of compassion."
};

const chineseMap = {
  "Rat": "Quick-witted and resourceful, often finding success in creative ways.",
  "Ox": "Dependable and strong, you achieve through persistence and hard work.",
  "Tiger": "Brave and competitive, you embrace challenges head-on.",
  "Rabbit": "Gentle and compassionate, with a deep appreciation for beauty and peace.",
  "Dragon": "Charismatic and confident, you're a natural-born leader.",
  "Snake": "Wise and mysterious, with strong intuition and elegance.",
  "Horse": "Energetic and free-spirited, always chasing new horizons.",
  "Goat": "Artistic and kind, you seek harmony in all aspects of life.",
  "Monkey": "Playful and clever, you solve problems with creativity.",
  "Rooster": "Observant and hardworking, with a flair for detail.",
  "Dog": "Loyal and honest, always there for those you care about.",
  "Pig": "Warm-hearted and generous, you cherish life's comforts and joys."
};

// 2. Load and Display SoulQuiz Data
document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("soulQuiz") || "{}");

  document.getElementById("userName").textContent = data.name || "Soul Seeker";
  document.getElementById("birthDate").textContent = data.birthdate || "Unknown";
  document.getElementById("loveLang").textContent = data.loveLang || "Unknown";
  document.getElementById("westernZodiac").textContent = data.westernZodiac || "Unknown";
  document.getElementById("chineseZodiac").textContent = data.chineseZodiac || "Unknown";
  document.getElementById("lifePathNumber").textContent = data.lifePath || "Unknown";

  // Add descriptions
  document.getElementById("loveLangDesc").textContent = loveLangMap[data.loveLang] || "";
  document.getElementById("westernDesc").textContent = westernMap[data.westernZodiac] || "";
  document.getElementById("chineseDesc").textContent = chineseMap[data.chineseZodiac] || "";

  // AI Insight
  document.getElementById("aiInsight").innerHTML = `
    Dear <strong>${data.name || "soul"}</strong>, your soul resonates with the energy of a <strong>${data.westernZodiac || "Unknown"}</strong> —<br>
    Your love language, <strong>${data.loveLang}</strong>, shows that ${loveLangMap[data.loveLang] || ""}<br>
    As a <strong>${data.chineseZodiac || "Unknown"}</strong> in Chinese astrology, you’re<br>
    Your Life Path number <strong>${data.lifePath}</strong> indicates you are introspective and wise.
  `;
});

// 3. PDF Download
document.getElementById("downloadBtn").addEventListener("click", () => {
  const element = document.body;
  html2pdf().from(element).save("soul-report.pdf");
});

// 4. EmailJS Feedback Form
document.getElementById("feedbackForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const form = this;
  emailjs.sendForm("service_3j9h9ei", "template_99hg4ni", form, "UYuKR_3UnPjeqJFL7")
    .then(() => {
      alert("Message sent!");
      form.reset();
    })
    .catch(() => {
      alert("Send failed");
    });
});
