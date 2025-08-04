// quiz.js – Patikrinta ir patobulinta

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quizForm');
  const savedData = JSON.parse(localStorage.getItem('soulQuiz')) || {};

  // Užpildo laukus iš išsaugotų duomenų
  for (const key in savedData) {
    const el = form.elements[key];
    if (!el) continue;

    if (el.type === 'radio' || el.type === 'checkbox') {
      if (Array.isArray(savedData[key])) {
        savedData[key].forEach(val => {
          const checkbox = form.querySelector(`[name="${key}"][value="${val}"]`);
          if (checkbox) checkbox.checked = true;
        });
      } else {
        const radio = form.querySelector(`[name="${key}"][value="${savedData[key]}"]`);
        if (radio) radio.checked = true;
      }
    } else {
      el.value = savedData[key];
    }
  }

  // Išsaugo duomenis pateikus formą
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {};

    formData.forEach((value, key) => {
      if (data[key]) {
        if (!Array.isArray(data[key])) data[key] = [data[key]];
        data[key].push(value);
      } else {
        data[key] = value;
      }
    });

    // Checkbox grupių apdorojimas (jei nepasirinkta – reikia išvalyti)
    const checkboxFields = ['hobbies', 'values'];
    checkboxFields.forEach(field => {
      if (!formData.has(field)) data[field] = [];
    });

    localStorage.setItem('soulQuiz', JSON.stringify(data));
    window.location.href = 'my-soul.html';
  });
});
