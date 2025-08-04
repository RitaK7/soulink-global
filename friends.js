// friends.js – Friend Match View

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('soulQuiz')) || {};
  const friendContainer = document.getElementById('friendResults');

  const testFriends = [
    {
      name: 'Ella',
      loveLanguage: 'Words of Affirmation',
      values: ['Kindness', 'Loyalty'],
      connectionType: 'Friendship'
    },
    {
      name: 'Noah',
      loveLanguage: 'Quality Time',
      values: ['Curiosity', 'Respect'],
      connectionType: 'Friendship'
    },
    {
      name: 'Luna',
      loveLanguage: 'Receiving Gifts',
      values: ['Humor', 'Trust'],
      connectionType: 'Both'
    }
  ];

  function calculateFriendMatch(user1, user2) {
    let score = 0;
    if (user1.loveLanguage === user2.loveLanguage) score += 30;

    const sharedValues = (user1.values || []).filter(v => (user2.values || []).includes(v));
    score += sharedValues.length * 20;

    if (user2.connectionType === 'Friendship' || user2.connectionType === 'Both') score += 30;

    return Math.min(score, 100);
  }

  function createFriendCard(user, score) {
    const card = document.createElement('div');
    card.className = 'friend-card';
    card.innerHTML = `
      <h3><i class="bi bi-people"></i> ${user.name}</h3>
      <p>Love Language: ${user.loveLanguage}</p>
      <p>Values: ${user.values.join(', ')}</p>
      <p>Connection: ${user.connectionType}</p>
      <strong>Friendship Match: ${score}%</strong>
    `;
    return card;
  }

  if (friendContainer) {
    testFriends.forEach(friend => {
      const score = calculateFriendMatch(currentUser, friend);
      friendContainer.appendChild(createFriendCard(friend, score));
    });
  }
});