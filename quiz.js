// quiz.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quizForm');
  const storageKey = 'soulQuiz';

  // Zodiac helpers
  function getWesternZodiac(date) {
    const m = date.getMonth() + 1, d = date.getDate();
    const zodiacDates = [
      [1, 20, 'Capricorn'], [2, 19, 'Aquarius'],
      [3, 21, 'Pisces'], [4, 20, 'Aries'],
      [5, 21, 'Taurus'], [6, 21, 'Gemini'],
      [7, 23, 'Cancer'], [8, 23, 'Leo'],
      [9, 23, 'Virgo'], [10, 23, 'Libra'],
      [11, 22, 'Scorpio'], [12, 22, 'Sagittarius'],
      [12, 31, 'Capricorn']
    ];
    for (let [mm, dd, sign] of zodiacDates) {
      if (m < mm || (m === mm && d <= dd)) return sign;
    }
  }
  function getChineseZodiac(year) {
    const animals = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
    return animals[(year - 4) % 12];
  }

  // populate form if saved
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  for (let [k, v] of Object.entries(saved)) {
    const el = form.elements[k];
    if (!el) continue;
    if (el.type === 'radio' || el.type === 'checkbox') {
      if (Array.isArray(v)) {
        v.forEach(val => {
          [...form.elements[k]].filter(inp => inp.value === val).forEach(i=>i.checked = true);
        });
      } else {
        [...form.elements[k]].find(i => i.value === v)?.checked = true;
      }
    } else {
      el.value = v;
    }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = {};
    for (let el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'checkbox') {
        data[el.name] = data[el.name] || [];
        if (el.checked) data[el.name].push(el.value);
      } else if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value;
      } else {
        data[el.name] = el.value;
      }
    }
    // compute zodiacs
    const bd = new Date(data.birthdate);
    data.westernZodiac = getWesternZodiac(bd);
    data.chineseZodiac = getChineseZodiac(bd.getFullYear());

    localStorage.setItem(storageKey, JSON.stringify(data));
    window.location.href = 'edit-profile.html';
  });
});
