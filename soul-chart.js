// soul-chart.js – Vizualus sielos žemėlapis

document.addEventListener('DOMContentLoaded', () => {
  const data = JSON.parse(localStorage.getItem('soulQuiz')) || {};

  function setField(id, value, fallback = '—') {
    const el = document.getElementById(id);
    if (el) el.textContent = value || fallback;
  }

  setField('chartName', data.name);
  setField('chartBirthday', data.birthday);
  setField('chartZodiac', data.zodiacSign);
  setField('chartChinese', data.chineseZodiac);
  setField('chartLifePath', data.lifePathNumber);
  setField('chartLoveLanguage', data.loveLanguage);
  setField('chartValues', (data.values || []).join(', '));
  setField('chartHobbies', (data.hobbies || []).join(', '));

  // Jei yra nuotrauka, parodyti
  if (data.profilePhoto1) {
    const photo = document.getElementById('chartPhoto');
    if (photo) {
      photo.src = data.profilePhoto1;
      photo.alt = data.name || 'Soul Avatar';
    }
  }

  // Soul Map frazė
  const insight = document.getElementById('chartInsight');
  if (insight) {
    insight.textContent = `You are a ${data.zodiacSign || 'cosmic'} soul walking the life path ${data.lifePathNumber || '?'}, guided by the love of ${data.loveLanguage?.toLowerCase() || 'many forms'}.`;
  }
});
