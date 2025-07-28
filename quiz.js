
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("quizForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const getCheckedValues = (name) =>
      Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map(
        (el) => el.value
      );

    const formData = {
      name: form.name.value.trim(),
      birthday: form.birthday.value.trim(),
      country: form.country.value,
      height: form.height.value.trim(),
      weight: form.weight.value.trim(),
      relationshipType: form.querySelector('input[name="relationshipType"]:checked')?.value || "",
      loveLanguage: form.querySelector('input[name="loveLanguage"]:checked')?.value || "",
      hobbies: getCheckedValues("hobbies"),
      values: getCheckedValues("values"),
      boundaries: form.boundaries.value.trim(),
      about: form.about.value.trim(),
    };

    // Compute zodiac
    const bday = new Date(formData.birthday);
    const month = bday.getUTCMonth() + 1;
    const day = bday.getUTCDate();

    const zodiacSigns = [
      { sign: "Capricorn", end: [1, 19] },
      { sign: "Aquarius", end: [2, 18] },
      { sign: "Pisces", end: [3, 20] },
      { sign: "Aries", end: [4, 19] },
      { sign: "Taurus", end: [5, 20] },
      { sign: "Gemini", end: [6, 20] },
      { sign: "Cancer", end: [7, 22] },
      { sign: "Leo", end: [8, 22] },
      { sign: "Virgo", end: [9, 22] },
      { sign: "Libra", end: [10, 22] },
      { sign: "Scorpio", end: [11, 21] },
      { sign: "Sagittarius", end: [12, 21] },
      { sign: "Capricorn", end: [12, 31] }, // wrap around
    ];
    const zodiac = zodiacSigns.find(
      ({ end }) =>
        month < end[0] || (month === end[0] && day <= end[1])
    ).sign;

    const chineseZodiacAnimals = [
      "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake",
      "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"
    ];
    const birthYear = bday.getUTCFullYear();
    const chineseZodiac = chineseZodiacAnimals[birthYear % 12];

    formData.westernZodiac = zodiac;
    formData.chineseZodiac = chineseZodiac;

    // Save to localStorage
    localStorage.setItem("soulQuiz", JSON.stringify(formData));

    // Redirect or confirmation
    window.location.href = "edit-profile.html";
  });
});
