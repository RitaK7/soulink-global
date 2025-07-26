
window.addEventListener('DOMContentLoaded', () => {
  const data = JSON.parse(localStorage.getItem("soulQuiz") || "{}");

  const fill = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value && value !== "" ? value : "–";
  };

  const arrayToString = (arr) => Array.isArray(arr) ? arr.join(", ") : "–";

  function calculateLifePath(dateStr) {
    if (!dateStr) return null;
    const digits = dateStr.replace(/[^0-9]/g, "").split("").map(Number);
    let sum = digits.reduce((a, b) => a + b, 0);
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = sum.toString().split("").map(Number).reduce((a, b) => a + b, 0);
    }
    return sum.toString();
  }

  const lifePath = data.lifePath || data.lifePathNumber || calculateLifePath(data.birthdate || data.birthday);

  fill("name", data.name);
  fill("birthdate", data.birthdate || data.birthday);
  fill("country", data.country);
  fill("height", data.height ? data.height + " cm" : "–");
  fill("weight", data.weight ? data.weight + " kg" : "–");
  fill("connection", data.connection);
  fill("relationshipType", data.relationshipType);
  fill("hobbies", arrayToString(data.hobbies));
  fill("values", arrayToString(data.values));
  fill("unacceptable", data.unacceptable);
  fill("about", data.about);
  fill("loveLanguage", data.loveLanguage);
  fill("westernZodiac", data.westernZodiac);
  fill("chineseZodiac", data.chineseZodiac);
  fill("lifePath", lifePath);

  const avatar = document.getElementById("avatar");
  if (avatar && data.name) {
    avatar.textContent = data.name.charAt(0).toUpperCase();
  }

  const planTag = document.getElementById("planTag");
  const plan = localStorage.getItem("plan") || "free";
  if (planTag) {
    planTag.textContent = plan === "premium" ? "💎 Premium" : "🔓 Free";
  }

  const loveLangMap = {
    "Words of Affirmation": "You flourish on heartfelt compliments and spoken appreciation.",
    "Acts of Service": "Actions speak louder than words – you feel loved when help arrives.",
    "Receiving Gifts": "Tangible tokens show how much you’re cherished.",
    "Quality Time": "Undivided attention and shared moments fill your soul.",
    "Physical Touch": "Touch is your language of connection and security."
  };

  const westernMap = {
    "Aries": "You’re courageous and energetic – a pioneer who leads with passion.",
    "Taurus": "Grounded and reliable, you cherish comfort and beauty in every form.",
    "Gemini": "Curious and adaptable, you thrive on communication and new ideas.",
    "Cancer": "Nurturing and intuitive, you place family and emotion above all.",
    "Leo": "Radiant and generous, you lead with confidence and warmth.",
    "Virgo": "Detail-oriented and analytical, striving for perfection.",
    "Libra": "Balanced and fair, you seek harmony in all relationships.",
    "Scorpio": "Intense and magnetic, you delve into life’s deeps with passion.",
    "Sagittarius": "Adventurous and optimistic, always chasing truth and wisdom.",
    "Capricorn": "Disciplined and ambitious, steadily climbing to success.",
    "Aquarius": "Innovative and humanitarian, valuing freedom and progress.",
    "Pisces": "Empathetic dreamer, guided by emotion and artistic vision."
  };

  const chineseMap = {
    "Rat": "Quick-witted and resourceful, often finding success in creative ways.",
    "Ox": "Strong and dependable, building life on hard work and honesty.",
    "Tiger": "Brave and competitive, winning admiration with daring spirit.",
    "Rabbit": "Gentle and compassionate, seeking peace and comfort.",
    "Dragon": "Confident and enthusiastic, destined for leadership.",
    "Snake": "Wise and strategic, trusting intuition to guide you.",
    "Horse": "Energetic and free-spirited, thriving on movement and independence.",
    "Goat": "Kind and artistic, nurturing beauty in all aspects of life.",
    "Monkey": "Clever and curious, solving problems with creativity.",
    "Rooster": "Precise and practical, known for honesty and dedication.",
    "Dog": "Loyal and protective, placing great value on integrity.",
    "Pig": "Generous and sincere, finding joy in comfort and kindness."
  };

  const lifePathMap = {
    "1": "Leader, independent and pioneering spirit.",
    "2": "Diplomat, harmonizer, sensitive and intuitive.",
    "3": "Creative, expressive and optimistic soul.",
    "4": "Builder, practical and loyal with strong foundations.",
    "5": "Adventurer, freedom-seeker and adaptable.",
    "6": "Caretaker, responsible, family-centered and loving.",
    "7": "Seeker, analytical and spiritual.",
    "8": "Achiever, ambitious and business-minded.",
    "9": "Humanitarian, compassionate and wise.",
    "11": "Spiritual teacher, visionary, deeply intuitive and idealistic.",
    "22": "Master builder, ambitious and practical with visionary leadership.",
    "33": "Master healer, compassionate, devoted and nurturing at a global level."
  };

  fill("loveLangDesc", loveLangMap[data.loveLanguage]);
  fill("westernDesc", westernMap[data.westernZodiac]);
  fill("chineseDesc", chineseMap[data.chineseZodiac]);
  fill("lifePathDesc", lifePathMap[lifePath]);
});
