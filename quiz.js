// Apskaičiuoja Vakarų zodiako ženklą pagal gimimo datą
function getWesternZodiac(d) {
  const date = new Date(d);
  const m = date.getMonth() + 1;
  const day = date.getDate();

  if ((m == 3 && day >= 21) || (m == 4 && day <= 19)) return 'Aries';
  if ((m == 4 && day >= 20) || (m == 5 && day <= 20)) return 'Taurus';
  if ((m == 5 && day >= 21) || (m == 6 && day <= 20)) return 'Gemini';
  if ((m == 6 && day >= 21) || (m == 7 && day <= 22)) return 'Cancer';
  if ((m == 7 && day >= 23) || (m == 8 && day <= 22)) return 'Leo';
  if ((m == 8 && day >= 23) || (m == 9 && day <= 22)) return 'Virgo';
  if ((m == 9 && day >= 23) || (m == 10 && day <= 22)) return 'Libra';
  if ((m == 10 && day >= 23) || (m == 11 && day <= 21)) return 'Scorpio';
  if ((m == 11 && day >= 22) || (m == 12 && day <= 21)) return 'Sagittarius';
  if ((m == 12 && day >= 22) || (m == 1 && day <= 19)) return 'Capricorn';
  if ((m == 1 && day >= 20) || (m == 2 && day <= 18)) return 'Aquarius';
  if ((m == 2 && day >= 19) || (m == 3 && day <= 20)) return 'Pisces';
  return '';
}

// Apskaičiuoja Kinijos zodiako ženklą pagal gimimo metus
function getChineseZodiac(d) {
  const year = new Date(d).getFullYear();
  const animals = [
    "Rat","Ox","Tiger","Rabbit","Dragon","Snake",
    "Horse","Goat","Monkey","Rooster","Dog","Pig"
  ];
  return animals[(year - 1900) % 12];
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quizForm');

  // Perskaitome išsaugotus atsakymus (jei yra)
  const saved = JSON.parse(localStorage.getItem('soulQuiz') || '{}');

  // Atstatome kiekvieną lauką
  for (const [key, value] of Object.entries(saved)) {
    if (Array.isArray(value)) {
      // Checkbox grupėms (hobbies, values)
      value.forEach(v => {
        const box = form.querySelector(`[name="${key}"][value="${v}"]`);
        if (box) box.checked = true;
      });
    } else {
      const el = form.querySelector(`[name="${key}"]`);
      if (!el) continue;

      if (el.type === 'radio') {
        // Vienas iš radio mygtukų
        const radio = form.querySelector(`[name="${key}"][value="${value}"]`);
        if (radio) radio.checked = true;
      } else {
        // Text, date, number, select, textarea
        el.value = value;
      }
    }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();

    const data = {};
    const formElements = form.querySelectorAll('input, select, textarea');
    const checkboxGroups = ['hobbies', 'values'];

    // Surenkame visų laukų reikšmes
    formElements.forEach(el => {
      if (!el.name) return;

      if (el.type === 'checkbox') {
        if (!data[el.name]) data[el.name] = [];
        if (el.checked) data[el.name].push(el.value);
      } else if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value;
      } else {
        data[el.name] = el.value;
      }
    });

    // Užtikriname, kad checkbox grupės visada būtų bent tušti masyvai
    checkboxGroups.forEach(name => {
      if (!data[name]) data[name] = [];
    });

    // Pridedame zodiako ženklus
    data.zodiacSign = getWesternZodiac(data.birthdate);
    data.chineseSign = getChineseZodiac(data.birthdate);

    // Išsaugome ir nukreipiame
    localStorage.setItem('soulQuiz', JSON.stringify(data));
    window.location.href = 'my-soul.html';
  });
});
