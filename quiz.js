// quiz.js
// Refactored for Soulink compatibility quiz
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

  // Love language descriptions
  const loveLangDesc = {
    'Words of Affirmation': 'Expressing love through kind and encouraging words.',
    'Acts of Service': 'Showing love by doing helpful, caring actions.',
    'Receiving Gifts': 'Feeling loved through thoughtful presents and symbols.',
    'Quality Time': 'Giving undivided attention and shared moments.',
    'Physical Touch': 'Feeling love through hugs, kisses, and closeness.'
  };

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('quizForm');
    const lsKey = 'soulQuiz';
    const saved = JSON.parse(localStorage.getItem(lsKey) || '{}');

    // Utility: set element value or checked state
    function restoreField(name, value) {
      const els = form.elements[name];
      if (!els) return;
      if (els.length && els[0].type === 'radio') {
        Array.from(els).forEach(r => r.checked = (r.value === value));
      } else if (els.length && els[0].type === 'checkbox') {
        Array.from(els).forEach(c => c.checked = (value || []).includes(c.value));
      } else {
        els.value = value || '';
      }
    }

    // Restore saved inputs
    Object.entries(saved).forEach(([k, v]) => restoreField(k, v));

    // Update derived fields
    function updateZodiacs() {
      const bd = form.birthdate.valueAsDate;
      if (bd) {
        form.westernZodiac.value = getWesternZodiac(bd);
        form.chineseZodiac.value = getChineseZodiac(bd);
      }
    }
    function updateLoveDesc() {
      const sel = form.loveLanguage.value;
      form.loveDescription.value = loveLangDesc[sel] || '';
    }

    // Listen for live changes
    form.birthdate.addEventListener('change', updateZodiacs);
    form.loveLanguage.forEach(radio =>
      radio.addEventListener('change', updateLoveDesc)
    );

    // Initialize derived values on load
    updateZodiacs();
    updateLoveDesc();

    // Hamburger nav toggle
    document.getElementById('navToggle')
      .addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('open');
        document.querySelector('.auth-buttons').classList.toggle('open');
      });

    // Submit & save
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = {};
      Array.from(form.elements).forEach(el => {
        if (!el.name) return;
        if (el.type === 'radio' && el.checked) data[el.name] = el.value;
        else if (el.type === 'checkbox') {
          data[el.name] = data[el.name] || [];
          if (el.checked) data[el.name].push(el.value);
        }
        else data[el.name] = el.value;
      });
      localStorage.setItem(lsKey, JSON.stringify(data));
      // proceed to next step
      location.href = 'edit-profile.html';
    });
  });
})();
