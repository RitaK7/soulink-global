// src/soul-coach.js

function getUserData() {
  const quizData =
    JSON.parse(localStorage.getItem('soulQuiz')) || {};

  return {
    name: quizData.name || 'Soul Seeker',
    birthDate: quizData.birthdate || '',
    loveLanguage: quizData.loveLanguage || 'Unknown',
    zodiacSign: quizData.zodiacSign || 'Unknown',
    chineseSign: quizData.chineseSign || 'Unknown'
  };
}

function getLifePathNumber(dateStr) {
  let sum = dateStr.replace(/-/g, '').split('').map(Number).reduce((a, b) => a + b, 0);
  while (sum > 9 && ![11, 22].includes(sum)) {
    sum = sum.toString().split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

function generateInsight(data) {
  const insights = {
    loveLanguage: {
      'Words of Affirmation': 'You thrive on kind words and meaningful praise. Your heart blossoms through verbal connection.',
      'Acts of Service': 'You believe that love is action. You show you care through thoughtful help and kind deeds.',
      'Receiving Gifts': 'You see the soul behind the gesture. Every gift carries a deep meaning for you.',
      'Quality Time': 'Presence is your love language. You feel most loved when truly together.',
      'Physical Touch': 'A gentle touch or warm hug speaks volumes to your heart.',
      'Unknown': 'Your love language is waiting to be revealed through meaningful connection.'
    },
    zodiacSign: {
      'Sagittarius': 'You are a seeker of truth, always aiming your arrow toward higher meaning.',
      'Pisces': 'You swim in deep emotional waters, guided by empathy and intuition.',
      'Aries': 'Bold and driven, your soul forges paths where others hesitate.',
      'Leo': 'You shine like the sun – warm, confident, and creative.',
      'Unknown': 'Your zodiac voice is still forming in the stars.'
    },
    chineseSign: {
      'Rat': 'Clever and resourceful, you always find your way forward.',
      'Dragon': 'Majestic and powerful – you were born to inspire.',
      'Rabbit': 'Gentle and harmonious, your energy soothes those around you.',
      'Unknown': 'Your Chinese zodiac energy is awakening.'
    }
  };

  const lifePath = getLifePathNumber(data.birthDate);
  const numerologyDescription = `Your Life Path Number is ${lifePath}. This number reveals your soul’s mission – a sacred blueprint that shapes your spiritual journey.`;

  return {
    love: insights.loveLanguage[data.loveLanguage] || insights.loveLanguage['Unknown'],
    zodiac: insights.zodiacSign[data.zodiacSign] || insights.zodiacSign['Unknown'],
    chinese: insights.chineseSign[data.chineseSign] || insights.chineseSign['Unknown'],
    numerology: numerologyDescription
  };
}

function displayInsights() {
  const data = getUserData();
  if (!data.birthDate || !data.name) {
    document.getElementById('loveLanguageInsight').textContent = "Please complete the quiz to receive your soul insights.";
    return;
  }

  const insight = generateInsight(data);

  document.getElementById('loveLanguageInsight').textContent = `💖 ${insight.love}`;
  document.getElementById('horoscopeInsight').textContent = `🔮 ${insight.zodiac}`;
  document.getElementById('numerologyInsight').textContent = `🔢 ${insight.numerology}`;
  document.getElementById('chineseZodiacInsight').textContent = `🐉 ${insight.chinese}`;
}

window.addEventListener('DOMContentLoaded', displayInsights);
