// quiz.js
(function() {
  // Zodiac calculators
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

  const loveLangDesc = {
    'Words of Affirmation': 'Expressing love through kind and encouraging words.',
    'Acts of Service':       'Showing love by doing helpful, caring actions.',
    'Receiving Gifts':       'Feeling loved through thoughtful presents and symbols.',
    'Quality Time':          'Giving undivided attention and shared moments.',
    'Physical Touch':        'Feeling love through hugs, kisses, and closeness.'
  };

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('quizForm');
    const stored = JSON.parse(localStorage.getItem('soulQuiz') || '{}');

    // Restore text/select/radio/checkbox
    Array.from(form.elements).forEach(el => {
      if (!el.name) return;
      if (stored[el.name] != null) {
        if (el.type === 'radio') el.checked = (el.value === stored[el.name]);
        else if (el.type === 'checkbox') el.checked = (stored[el.name].includes(el.value));
        else el.value = stored[el.name];
      }
    });

    // Live updates
    function updateZodiacFields() {
      const bd = form.birthdate.valueAsDate;
      if (bd) {
        form.westernZodiac.value  = getWesternZodiac(bd);
        form.chineseZodiac.value  = getChineseZodiac(bd);
      }
    }
    function updateLoveDesc() {
      const sel = form.loveLanguage.value;
      form.loveDescription.value = loveLangDesc[sel] || '';
    }
    form.birthdate.addEventListener('change', updateZodiacFields);
    form.querySelectorAll('input[name="loveLanguage"]')
        .forEach(r => r.addEventListener('change', updateLoveDesc));

    // Initial fill
    updateZodiacFields();
    updateLoveDesc();

    // Nav toggle
    document.getElementById('navToggle')
      .addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('open');
        document.querySelector('.auth-buttons').classList.toggle('open');
      });

    // Submit handler
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = {};
      Array.from(form.elements).forEach(el => {
        if (!el.name) return;
        if (el.type === 'radio') {
          if (el.checked) data[el.name] = el.value;
        } else if (el.type === 'checkbox') {
          data[el.name] = data[el.name] || [];
          if (el.checked) data[el.name].push(el.value);
        } else {
          data[el.name] = el.value;
        }
      });
      localStorage.setItem('soulQuiz', JSON.stringify(data));
      window.location.href = 'edit-profile.html';
    });
  });
})();
