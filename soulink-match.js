// soulink-match.js – Local matching demo

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('soulQuiz')) || {};
  const matchContainer = document.getElementById('matchResults');

  // Iš anksto įvesti testiniai partneriai (vėliau – Firebase duomenys)
  const testUsers = [
    {
      name: 'Alex',
      loveLanguage: 'Words of Affirmation',
      values: ['Trust', 'Adventure'],
      connectionType: 'Romantic'
    },
    {
      name: 'Mia',
      loveLanguage: 'Quality Time',
      values: ['Creativity', 'Freedom'],
      connectionType: 'Friendship'
    },
    {
      name: 'Leo',
      loveLanguage: 'Acts of Service',
      values: ['Growth', 'Compassion'],
      connectionType: 'Both'
    }
  ];

  function calculateCompatibility(user1, user2) {
    let score = 0;
    if (user1.loveLanguage === user2.loveLanguage) score += 40;

    const sharedValues = (user1.values || []).filter(v => (user2.values || []).includes(v));
    score += sharedValues.length * 15;

    if (user1.connectionType === user2.connectionType || user2.connectionType === 'Both') score += 30;

    return Math.min(score, 100);
  }

  function createCard(user, score) {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.innerHTML = `
      <h3>${user.name}</h3>
      <p>Love Language: ${user.loveLanguage}</p>
      <p>Values: ${user.values.join(', ')}</p>
      <p>Connection: ${user.connectionType}</p>
      <strong>Compatibility: ${score}%</strong>
    `;
    return card;
  }

  if (matchContainer) {
    testUsers.forEach(user => {
      const score = calculateCompatibility(currentUser, user);
      matchContainer.appendChild(createCard(user, score));
    });
  }
});
