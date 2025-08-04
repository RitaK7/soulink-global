// results.js – Atkurta Soul Summary, PDF, EmailJS

document.addEventListener('DOMContentLoaded', () => {
  const data = JSON.parse(localStorage.getItem('soulQuiz')) || {};

  // Užpildo tekstinius laukus
  const fields = ['name', 'birthday', 'about', 'connectionType', 'loveLanguage', 'unacceptable'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el && data[id]) el.textContent = data[id];
  });

  // Meilės kalba paaiškinimas
  const loveDesc = {
    'Words of Affirmation': 'You feel loved when you hear kind and supportive words.',
    'Acts of Service': 'Actions speak louder than words for you.',
    'Receiving Gifts': 'Gifts are symbols of love and care.',
    'Quality Time': 'Time spent together means everything.',
    'Physical Touch': 'You connect through physical closeness.'
  };
  const loveExplain = document.getElementById('loveExplain');
  if (loveExplain && data.loveLanguage && loveDesc[data.loveLanguage]) {
    loveExplain.textContent = loveDesc[data.loveLanguage];
  }

  // Soul Summary
  const summary = document.getElementById('soulSummary');
  if (summary) {
    const summaryText = `You are a soul seeking ${data.connectionType?.toLowerCase()} connection through ${data.loveLanguage?.toLowerCase()}, guided by values like ${(data.values || []).join(', ')}.`;
    summary.textContent = summaryText;
  }

  // PDF generavimas
  document.getElementById('downloadBtn')?.addEventListener('click', () => {
    const element = document.getElementById('resultCard');
    if (!element) return;
    import('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js')
      .then(() => html2pdf().from(element).save('soulink-result.pdf'));
  });

  // EmailJS siuntimas
  document.getElementById('feedbackForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    emailjs.sendForm('service_3j9h9ei', 'template_99hg4ni', this, 'UYuKR_3UnPjeqJFL7')
      .then(() => alert('✅ Thank you for your feedback!'))
      .catch(() => alert('❌ Failed to send feedback.'));
  });
});
