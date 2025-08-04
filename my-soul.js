// my-soul.js – Dinaminis Soul profilio įkėlimas

document.addEventListener('DOMContentLoaded', () => {
  const data = JSON.parse(localStorage.getItem('soulQuiz')) || {};

  const fields = [
    'name', 'birthday', 'about', 'connectionType', 'loveLanguage',
    'lifePathNumber', 'zodiacSign', 'chineseZodiac',
    'hobbies', 'values', 'unacceptable'
  ];

  fields.forEach(field => {
    const el = document.getElementById(field);
    if (el) {
      const value = data[field];
      el.textContent = Array.isArray(value) ? value.join(', ') : value || '—';
    }
  });

  // Avataro įkėlimas (nuotrauka 1)
  if (data.profilePhoto1) {
    const avatar = document.getElementById('avatar');
    if (avatar) {
      avatar.src = data.profilePhoto1;
      avatar.alt = data.name || 'Soul Photo';
    }
  }

  // Soul Summary viršuje
  const summary = document.getElementById('soulSummary');
  if (summary) {
    const summaryText = `You are a soul on a journey of ${data.connectionType?.toLowerCase()} connection, guided by ${data.loveLanguage?.toLowerCase()} and values like ${(data.values || []).join(', ')}.`;
    summary.textContent = summaryText;
  }
});
