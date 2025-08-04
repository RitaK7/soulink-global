// footer.js
window.addEventListener('DOMContentLoaded', () => {
  fetch('footer.html')
    .then(res => res.text())
    .then(html => {
      const footer = document.createElement('div');
      footer.innerHTML = html;
      document.body.appendChild(footer);
    });
});
