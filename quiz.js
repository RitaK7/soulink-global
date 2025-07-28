
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("quizForm");

  // 1. Auto-fill from localStorage if available
  const storedData = localStorage.getItem("soulQuiz");
  if (storedData) {
    const data = JSON.parse(storedData);
    for (const [key, value] of Object.entries(data)) {
      const el = document.getElementById(key);
      if (el) {
        if (el.type === "radio" || el.type === "checkbox") {
          const inputs = document.querySelectorAll(`[name="${key}"]`);
          inputs.forEach(input => {
            if (Array.isArray(value)) {
              input.checked = value.includes(input.value);
            } else {
              input.checked = input.value === value;
            }
          });
        } else {
          el.value = value;
        }
      }
    }
  }

  // 2. Save on submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }

    // Add zodiac calculation
    const birthdate = data.birthdate;
    if (birthdate) {
      const month = parseInt(birthdate.split("-")[1]);
      const day = parseInt(birthdate.split("-")[2]);
      data.westernZodiac = getZodiac(month, day);
    }

    localStorage.setItem("soulQuiz", JSON.stringify(data));

    // Success message
    const success = document.createElement("div");
    success.textContent = "✅ Duomenys išsaugoti";
    success.style.color = "#00fdd8";
    success.style.marginTop = "1rem";
    form.appendChild(success);

    setTimeout(() => {
      window.location.href = "edit-profile.html";
    }, 1000);
  });

  // Zodiac helper
  function getZodiac(month, day) {
    const signs = [
      "Capricorn", "Aquarius", "Pisces", "Aries", "Taurus", "Gemini",
      "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius"
    ];
    const lastDay = [19, 18, 20, 19, 20, 20, 22, 22, 22, 22, 21, 21];
    return day > lastDay[month - 1] ? signs[month] : signs[month - 1];
  }
});
