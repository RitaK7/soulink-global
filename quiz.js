document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quizForm');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const getValue = id => document.getElementById(id)?.value || '';
    const getCheckedValue = name => {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : '';
    };
    const getCheckedValues = cls => {
      return [...document.querySelectorAll(`.${cls}:checked`)].map(el => el.value);
    };

    const birthdate = getValue('birthday');
    const zodiacSign = getZodiacSign(birthdate);

    const data = {
      name: getValue('name'),
      birthday: birthdate,
      country: getValue('country'),
      height: getValue('height'),
      weight: getValue('weight'),
      connectionType: getCheckedValue('connectionType'),
      loveLanguage: getCheckedValue('loveLanguage'),
      hobbies: getCheckedValues('hobby'),
      values: getCheckedValues('value'),
      unacceptable: getValue('unacceptable'),
      about: getValue('about'),
      spiritualBelief: getValue('spiritualBelief'),
      mantra: getValue('mantra'),
      gender: getValue('gender'),
      matchPreference: getValue('matchPreference'),
      zodiacSign: zodiacSign
    };

    localStorage.setItem('soulQuiz', JSON.stringify(data));
    window.location.href = 'edit-profile.html';
  });

  function getZodiacSign(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!month || !day) return '';
    const zodiacs = [
      ['Capricorn', 20], ['Aquarius', 19], ['Pisces', 20], ['Aries', 20],
      ['Taurus', 21], ['Gemini', 21], ['Cancer', 23], ['Leo', 23],
      ['Virgo', 23], ['Libra', 23], ['Scorpio', 23], ['Sagittarius', 22], ['Capricorn', 31]
    ];
    return day < zodiacs[month - 1][1] ? zodiacs[month - 1][0] : zodiacs[month][0];
  }
});
