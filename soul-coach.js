// soul-coach.js – AI patarimai pagal soulQuiz

document.addEventListener('DOMContentLoaded', () => {
  const data = JSON.parse(localStorage.getItem('soulQuiz')) || {};

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // Meilės kalbos patarimas
  const loveAdvice = {
    'Words of Affirmation': 'Use kind words daily to uplift both yourself and others.',
    'Acts of Service': 'Find joy in helping others – it strengthens your connections.',
    'Receiving Gifts': 'Share little symbolic gifts to express care and presence.',
    'Quality Time': 'Prioritize uninterrupted time with those you love.',
    'Physical Touch': 'A hug or a warm touch speaks volumes for your soul.'
  };

  setText('coachLove', loveAdvice[data.loveLanguage] || 'Embrace your unique way of expressing love.');

  // Gyvenimo kelio patarimas (numerologija)
  const lifePathTips = {
    '1': 'You are a leader – take initiative and trust your vision.',
    '2': 'You’re a peacemaker – focus on harmony and collaboration.',
    '3': 'Your creativity uplifts others – express it boldly.',
    '4': 'You thrive with structure – build something lasting.',
    '5': 'Embrace change – your soul craves freedom.',
    '6': 'You are a nurturer – your care brings healing.',
    '7': 'Seek depth – your intuition is a powerful guide.',
    '8': 'Step into your power – success awaits through discipline.',
    '9': 'You are a giver – your compassion transforms lives.'
  };

  setText('coachLifePath', lifePathTips[data.lifePathNumber] || 'Trust your inner path – you are evolving.');

  // Zodiako patarimas (jei norima integruoti vėliau)
  setText('coachZodiac', `As a ${data.zodiacSign || 'soulful being'}, trust your cosmic rhythm.`);

  // Kinų horoskopo patarimas (jei yra)
  setText('coachChinese', `Your Chinese sign ${data.chineseZodiac || '...'} reminds you to embrace your true nature.`);
});
