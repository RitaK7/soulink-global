document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("soulQuiz")) || {};

  const setText = (id, value) => {
    document.getElementById(id).textContent = value || "—";
  };

  const getLifePathNumber = (birthdate) => {
    if (!birthdate) return "—";
    const digits = birthdate.replace(/-/g, "").split("").map(Number);
    let sum = digits.reduce((a, b) => a + b, 0);
    while (sum > 9 && ![11, 22, 33].includes(sum)) {
      sum = sum.toString().split("").map(Number).reduce((a, b) => a + b, 0);
    }
    return sum;
  };

  const getChineseZodiac = (year) => {
    if (!year) return "—";
    const signs = [
      { name: "Rat", symbol: "🐀", traits: "clever, adaptable" },
      { name: "Ox", symbol: "🐂", traits: "strong, reliable" },
      { name: "Tiger", symbol: "🐅", traits: "brave, confident" },
      { name: "Rabbit", symbol: "🐇", traits: "gentle, elegant" },
      { name: "Dragon", symbol: "🐉", traits: "ambitious, charismatic" },
      { name: "Snake", symbol: "🐍", traits: "wise, mysterious" },
      { name: "Horse", symbol: "🐎", traits: "energetic, independent" },
      { name: "Goat", symbol: "🐐", traits: "kind, artistic" },
      { name: "Monkey", symbol: "🐒", traits: "curious, witty" },
      { name: "Rooster", symbol: "🐓", traits: "honest, hard-working" },
      { name: "Dog", symbol: "🐕", traits: "loyal, fair" },
      { name: "Pig", symbol: "🐖", traits: "generous, calm" }
    ];
    const sign = signs[year % 12];
    return `${sign.symbol} ${sign.name} – ${sign.traits}`;
  };

  setText("name", data.name);
  setText("birthday", data.birthday);
  setText("connectionType", data.connectionType);
  setText("loveLanguage", data.loveLanguage);
  setText("about", data.about);
  setText("unacceptable", data.unacceptable);
  setText("hobbies", (data.hobbies || []).join(", "));
  setText("values", (data.values || []).join(", "));

  const birthYear = data.birthday?.split("-")[0];
  setText("lifePath", getLifePathNumber(data.birthday));
  setText("chineseZodiac", getChineseZodiac(Number(birthYear)));

  const photoIds = ["photo1", "photo2", "photo3"];
  photoIds.forEach((id, index) => {
    const imgData = data[`profilePhoto${index + 1}`];
    if (imgData) {
      const img = document.getElementById(id);
      img.src = imgData;
      img.style.display = "block";
    }
  });
});
