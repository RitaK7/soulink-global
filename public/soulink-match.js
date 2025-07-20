// src/match.js

window.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('soulQuiz') || '{}');
  const container = document.getElementById('matches-list');

  if (!user.name || !user.birthdate) {
    container.innerHTML = '<p>Please complete the quiz to see your matches.</p>';
    return;
  }

  // Sample fake matches
  const matches = [
    {
      name: 'Ayla',
      percent: 94,
      comment: 'You both speak the love language of presence and share deep emotional insight.'
    },
    {
      name: 'Kai',
      percent: 87,
      comment: 'Your values align harmoniously, creating a strong and balanced connection.'
    },
    {
      name: 'Luna',
      percent: 82,
      comment: 'There’s a playful and soulful spark between you – a promising bond awaits.'
    }
  ];

  container.innerHTML = matches.map(match => `
    <div class="card" style="margin-bottom: 1.5rem; padding: 1rem; background-color: #014247; border-radius: 1rem; box-shadow: 0 0 10px #00fdd8;">
      <h3>💞 ${match.name}</h3>
      <p><strong>Compatibility:</strong> ${match.percent}%</p>
      <p>${match.comment}</p>
      <a href="#" class="btn" style="display:inline-block; margin-top:0.5rem; background:#00fdd8; color:black; padding:0.5rem 1rem; border-radius:0.5rem; text-decoration:none;">View Profile</a>
    </div>
  `).join('');
});
