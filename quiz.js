document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("quizForm");

  // Auto-fill from localStorage
  const saved = JSON.parse(localStorage.getItem("soulQuiz") || "{}");

  for (const [key, value] of Object.entries(saved)) {
    const field = form.elements[key];
    if (!field) continue;

    if (Array.isArray(value)) {
      value.forEach(val => {
        const checkbox = form.querySelector(`[name="${key}"][value="${val}"]`);
        if (checkbox) checkbox.checked = true;
      });
    } else if (field.type === "radio") {
      const radio = form.querySelector(`[name="${key}"][value="${value}"]`);
      if (radio) radio.checked = true;
    } else {
      field.value = value;
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = {};
    const formData = new FormData(form);

    // Text fields
    ["name", "birthdate", "country", "height", "weight", "unacceptable", "about"].forEach(key => {
      data[key] = formData.get(key) || "";
    });

    // Radio buttons
    data.connectionType = formData.get("connectionType") || "";
    data.loveLanguage = formData.get("loveLanguage") || "";

    // Checkboxes
    data.hobbies = formData.getAll("hobbies");
    data.values = formData.getAll("values");

    // Zodiac auto-calc
    if (data.birthdate) {
      const birth = new Date(data.birthdate);
      const month = birth.getMonth() + 1;
      const day = birth.getDate();
      const year = birth.getFullYear();

      const zodiacs = [
        ["Capricorn", 1, 19], ["Aquarius", 2, 18], ["Pisces", 3, 20],
        ["Aries", 4, 19], ["Taurus", 5, 20], ["Gemini", 6, 20],
        ["Cancer", 7, 22], ["Leo", 8, 22], ["Virgo", 9, 22],
        ["Libra", 10, 22], ["Scorpio", 11, 21], ["Sagittarius", 12, 21],
        ["Capricorn", 12, 31]
      ];
      data.westernZodiac = zodiacs.find(([sign, m, d]) => (month === m && day <= d))?.[0] || "Capricorn";

      const signs = [
        "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake",
        "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"
      ];
      data.chineseZodiac = signs[year % 12];
    }

    // Save and notify
    localStorage.setItem("soulQuiz", JSON.stringify(data));
    alert("✅ Duomenys išsaugoti!");
    window.location.href = "edit-profile.html";
  });
});
