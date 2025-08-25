// /assets/js/core/soul-utils.js
(function (w) {
  function parseSoulQuiz() {
    try {
      const raw = localStorage.getItem("soulQuiz");
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function normalizeList(v) {
    if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
    if (typeof v === "string") {
      if (v.includes(",")) return v.split(",").map(x => x.trim()).filter(Boolean);
      if (v.includes("\n")) return v.split("\n").map(x => x.trim()).filter(Boolean);
      if (v.trim()) return [v.trim()];
    }
    return [];
  }

  // Western Zodiac from month/day
  function zodiacFromDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const m = d.getMonth() + 1, day = d.getDate();

    const inRange = (m, d, m1, d1, m2, d2) =>
      (m === m1 && d >= d1) || (m === m2 && d <= d2) ||
      (m > m1 && m < m2) || (m1 > m2 && (m >= m1 || m <= m2));

    if (inRange(m, day, 3, 21, 4, 19)) return "Aries";
    if (inRange(m, day, 4, 20, 5, 20)) return "Taurus";
    if (inRange(m, day, 5, 21, 6, 20)) return "Gemini";
    if (inRange(m, day, 6, 21, 7, 22)) return "Cancer";
    if (inRange(m, day, 7, 23, 8, 22)) return "Leo";
    if (inRange(m, day, 8, 23, 9, 22)) return "Virgo";
    if (inRange(m, day, 9, 23, 10, 22)) return "Libra";
    if (inRange(m, day, 10, 23, 11, 21)) return "Scorpio";
    if (inRange(m, day, 11, 22, 12, 21)) return "Sagittarius";
    if (inRange(m, day, 12, 22, 1, 19)) return "Capricorn";
    if (inRange(m, day, 1, 20, 2, 18)) return "Aquarius";
    if (inRange(m, day, 2, 19, 3, 20)) return "Pisces";
    return null;
  }

  function chineseZodiac(year) {
    if (!year || isNaN(year)) return null;
    const animals = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];
    const idx = (year - 1900) % 12;
    return animals[(idx + 12) % 12];
  }

  function lifePath(iso) {
    if (!iso) return null;
    const digits = String(iso).replace(/\D/g, "");
    if (!digits) return null;
    const isMaster = (n) => n === 11 || n === 22 || n === 33;
    const sumDigits = (n) => String(n).split("").reduce((a, b) => a + Number(b), 0);
    let n = digits.split("").reduce((a, b) => a + Number(b), 0);
    while (n > 9 && !isMaster(n)) n = sumDigits(n);
    return n;
  }

  // Simple typewriter helper
  function typeText(el, text, speed = 14) {
    if (!el) return;
    el.classList.add("caret");
    el.textContent = "";
    let i = 0;
    const id = setInterval(() => {
      el.textContent = text.slice(0, i++);
      if (i > text.length) {
        clearInterval(id);
        el.classList.remove("caret");
      }
    }, speed);
  }

  w.SoulUtils = {
    parseSoulQuiz,
    normalizeList,
    zodiacFromDate,
    chineseZodiac,
    lifePath,
    typeText,
  };
})(window);
