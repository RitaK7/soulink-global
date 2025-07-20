// src/friends.js

document.addEventListener('DOMContentLoaded', () => {
  const friendsContainer = document.getElementById('friendsContainer');

  const defaultFriends = [
    { name: "Elena", sharedValues: "Kindness, Nature, Humor", compatibility: 91 },
    { name: "Mira", sharedValues: "Spirituality, Honesty, Creativity", compatibility: 88 },
    { name: "Jonas", sharedValues: "Adventure, Learning, Loyalty", compatibility: 85 }
  ];

  const friendData = JSON.parse(localStorage.getItem('friendResults')) || defaultFriends;

  friendsContainer.innerHTML = '';
  friendData.forEach(friend => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <h3>🤝 ${friend.name}</h3>
      <p>🌟 Shared Values: ${friend.sharedValues}</p>
      <p>🎯 Compatibility: ${friend.compatibility}%</p>
    `;
    friendsContainer.appendChild(div);
  });
});
