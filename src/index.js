
// index.js

document.addEventListener('DOMContentLoaded', () => {
  const journeyBtn = document.querySelector('#startJourney');
  if (journeyBtn) {
    journeyBtn.addEventListener('click', () => {
      window.location.href = '/quiz.html';
    });
  }
});
