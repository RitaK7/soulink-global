
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("quizForm");
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem("soulQuiz")) || {};
  } catch (e) {
    console.error("❌ Error loading saved data:", e);
  }

  // Meilės kalbų tooltip'ai
  const loveLangRadios = document.querySelectorAll('input[name="loveLanguage"]');
  const loveLangTooltips = {
    "Words of Affirmation": "Expressing love through kind and encouraging words.",
    "Acts of Service": "Doing helpful, caring actions to show love.",
    "Receiving Gifts": "Feeling loved through thoughtful presents and symbols.",
    "Quality Time": "Giving undivided attention and shared moments.",
    "Physical Touch": "Love felt through hugs, kisses, and closeness."
  };

  loveLangRadios.forEach(radio => {
    radio.title = loveLangTooltips[radio.value] || "Choose your love language";
  });

  // Užpildymas iš localStorage
  Array.from(form.elements).forEach(el => {
    if (!el.name) return;
    if (saved[el.name] != null) {
      if (el.type === "radio") {
        el.checked = (el.value === saved[el.name]);
      } else {
        el.value = saved[el.name];
      }
    }
  });

  // Zodiako skaičiavimas
  function getWesternZodiac(d) {
    const m = d.getMonth() + 1, day = d.getDate();
    if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return 'Aquarius';
    if ((m === 2 && day >= 19) || (m === 3 && day <= 20)) return 'Pisces';
    if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return 'Aries';
    if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return 'Taurus';
    if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return 'Gemini';
    if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return 'Cancer';
    if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return 'Leo';
    if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return 'Virgo';
    if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return 'Libra';
    if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return 'Scorpio';
    if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return 'Sagittarius';
    return 'Capricorn';
  }

  function getChineseZodiac(year) {
    const animals = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];
    return animals[(year - 4) % 12];
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const data = {};
    Array.from(form.elements).forEach(el => {
      if (!el.name) return;
      if (el.type === "radio") {
        if (el.checked) data[el.name] = el.value;
      } else {
        data[el.name] = el.value;
      }
    });

    // Patikrinti gimimo datą
    const date = new Date(data.birthdate);
    if (isNaN(date)) {
      alert("❌ Please enter a valid birth date (YYYY-MM-DD).");
      return;
    }

    data.westernZodiac = getWesternZodiac(date);
    data.chineseZodiac = getChineseZodiac(date.getFullYear());

    localStorage.setItem("soulQuiz", JSON.stringify(data));
    window.location.href = "edit-profile.html";
  });
});
