
// quiz.js – with Life Path Number calculation

function calculateLifePath(dateStr) {
  const digits = dateStr.replace(/[^0-9]/g, "").split("").map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split("").map(Number).reduce((a, b) => a + b, 0);
  }
  return sum.toString();
}

function submitQuiz() {
  const data = {
    name: document.getElementById("name").value,
    birthdate: document.getElementById("birthdate").value,
    country: document.getElementById("country").value,
    height: document.getElementById("height").value,
    weight: document.getElementById("weight").value,
    connection: document.querySelector("input[name='connection']:checked")?.value || "",
    loveLanguage: document.querySelector("input[name='love-language']:checked")?.value || "",
    westernZodiac: document.getElementById("westernZodiac").textContent,
    chineseZodiac: document.getElementById("chineseZodiac").textContent,
    hobbies: Array.from(document.querySelectorAll("input[name='hobbies']:checked")).map(el => el.value),
    values: Array.from(document.querySelectorAll("input[name='values']:checked")).map(el => el.value),
    unacceptable: document.getElementById("unacceptable").value,
    about: document.getElementById("about").value
  };

  data.lifePath = calculateLifePath(data.birthdate);

  localStorage.setItem("soulQuiz", JSON.stringify(data));
  window.location.href = "my-soul.html";
}
