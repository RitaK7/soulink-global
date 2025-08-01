
function getWesternZodiac(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const signs = [
    ["Capricorn", 20], ["Aquarius", 19], ["Pisces", 20], ["Aries", 20],
    ["Taurus", 21], ["Gemini", 21], ["Cancer", 22], ["Leo", 23],
    ["Virgo", 23], ["Libra", 23], ["Scorpio", 23], ["Sagittarius", 22], ["Capricorn", 31]
  ];
  return day <= signs[month - 1][1] ? signs[month - 1][0] : signs[month][0];
}

function getChineseZodiac(dateStr) {
  const year = new Date(dateStr).getFullYear();
  const animals = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", 
                   "Goat", "Monkey", "Rooster", "Dog", "Pig"];
  return animals[year % 12];
}

function getLifePathNumber(dateStr) {
  const nums = dateStr.replace(/[^0-9]/g, "").split("").map(Number);
  let sum = nums.reduce((a, b) => a + b, 0);
  while (sum > 9 && ![11, 22, 33].includes(sum)) {
    sum = sum.toString().split("").map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profile-form");
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    const data = {
      name: form.name.value,
      birthday: form.birthday.value,
      country: form.country.value,
      height: form.height.value,
      weight: form.weight.value,
      bio: form.bio.value,
      unacceptable: form.unacceptable.value,
      connectionType: form.querySelector("input[name='connectionType']:checked")?.value || "",
      loveLanguage: form.querySelector("input[name='loveLanguage']:checked")?.value || "",
      hobbies: Array.from(form.querySelectorAll("input[name='hobbies']:checked")).map(cb => cb.value),
      values: Array.from(form.querySelectorAll("input[name='values']:checked")).map(cb => cb.value)
    };

    data.westernZodiac = getWesternZodiac(data.birthday);
    data.chineseZodiac = getChineseZodiac(data.birthday);
    data.lifePathNumber = getLifePathNumber(data.birthday);

    localStorage.setItem("soulQuiz", JSON.stringify(data));
    window.location.href = "my-soul.html";
  });
});
