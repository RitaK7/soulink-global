// quiz.js
// (Only the restoration logic is updated; the submit/save logic is unchanged)

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

function getChineseZodiac(d) {
  const signs = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
  return signs[(d.getFullYear() - 4) % 12];
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quizForm');
  const saved = JSON.parse(localStorage.getItem('soulQuiz') || '{}');

  // Restore simple fields + single radios
  for (let key in saved) {
    const val = saved[key];

    if (Array.isArray(val)) {
      // Multi‑value fields (checkbox groups like hobbies, values, etc.)
      document.querySelectorAll(`input[name="${key}"]`).forEach(inp => {
        inp.checked = val.includes(inp.value);
      });
    } else {
      const el = form.elements[key];
      if (!el) continue;

      if (el.type === 'radio') {
        // single radio-group
        const opts = form.querySelectorAll(`input[name="${key}"]`);
        opts.forEach(r => { r.checked = (r.value === val); });
      } else {
        // text, date, select, textarea, number...
        el.value = val;
      }
    }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = {};

    Array.from(form.elements).forEach(inp => {
      if (!inp.name) return;
      if (inp.type === 'radio') {
        if (inp.checked) data[inp.name] = inp.value;
      } else if (inp.type === 'checkbox') {
        data[inp.name] = data[inp.name] || [];
        if (inp.checked) data[inp.name].push(inp.value);
      } else if (inp.type !== 'button') {
        data[inp.name] = inp.value;
      }
    });

    const bd = new Date(data.birthdate);
    data.westernZodiac = getWesternZodiac(bd);
    data.chineseZodiac = getChineseZodiac(bd);

    localStorage.setItem('soulQuiz', JSON.stringify(data));
    location.href = 'edit-profile.html';
  });

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const header = document.querySelector('.main-nav');
  navToggle.addEventListener('click', () => {
    header.classList.toggle('active');
  });
});
