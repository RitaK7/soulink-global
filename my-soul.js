(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const ui = {
    content: $("#mySoulContent"),
    empty: $("#mySoulEmpty"),
    startQuiz: $("#mySoulStartQuiz"),

    avatar: $("#msAvatar"),
    photo1: $("#msPhoto1"),
    photo2: $("#msPhoto2"),
    photo3: $("#msPhoto3"),

    heroTitle: $("#msHeroTitle"),
    heroSubtitle: $("#msHeroSubtitle"),

    zodiacTag: $("#msZodiacTag"),
    chineseTag: $("#msChineseTag"),
    lifePathTag: $("#msLifePathTag"),
    connectionTag: $("#msConnectionTag"),

    snapshotName: $("#msSnapshotName"),
    snapshotAge: $("#msSnapshotAge"),
    snapshotCountry: $("#msSnapshotCountry"),
    snapshotConnection: $("#msSnapshotConnection"),
    snapshotLoveLanguage: $("#msSnapshotLoveLanguage"),
    snapshotValues: $("#msSnapshotValues"),
    snapshotHobbies: $("#msSnapshotHobbies"),

    soulSummary: $("#msSoulSummary"),
    energyText: $("#msEnergyText"),
    loveLanguages: $("#msLoveLanguages"),
    connectWith: $("#msConnectWith"),
    boundariesText: $("#msBoundariesText"),
    aboutText: $("#msAboutText"),
    mantraText: $("#msMantraText"),

    backQuizTop: $("#msBackToQuizTop"),
    backQuizBottom: $("#msBackToQuizBottom"),
    goToChart: $("#msGoToChart"),
  };

  function loadSoulData() {
    try {
      if (typeof window.getSoulData === "function") {
        const data = window.getSoulData({
          fallbackToLegacy: true,
          ensureShape: true,
        });
        return data || null;
      }
    } catch (e) {
      console.error("My Soul: failed to load soul data", e);
    }
    return null;
  }

  function hasMeaningfulData(data) {
    if (!data) return false;
    const keys = [
      "name",
      "birthday",
      "country",
      "connectionType",
      "loveLanguage",
      "loveLanguages",
      "values",
      "hobbies",
      "about",
      "aboutMe",
      "soulSummary",
    ];
    return keys.some((key) => {
      const value = data[key];
      if (Array.isArray(value)) return value.length > 0;
      if (value == null) return false;
      return String(value).trim().length > 0;
    });
  }

  function normalizeList(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((v) => String(v).trim())
        .filter(Boolean);
    }
    return String(value)
      .split(/[\n,;]+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  function parseBirthdayToDate(raw) {
    if (!raw) return null;
    const str = String(raw).trim();
    if (!str) return null;

    // YYYY-MM-DD or YYYY/MM/DD
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(str)) {
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    }

    // DD.MM.YYYY or DD/MM/YYYY
    const match = str.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      let year = parseInt(match[3], 10);
      if (year < 100) {
        year += year >= 50 ? 1900 : 2000;
      }
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  function calculateAge(date) {
    if (!date) return null;
    const now = new Date();
    let age = now.getFullYear() - date.getFullYear();
    const m = now.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < date.getDate())) {
      age -= 1;
    }
    return age >= 0 && age < 130 ? age : null;
  }

  function getYearFromDate(date) {
    if (!date) return null;
    const year = date.getFullYear();
    return Number.isFinite(year) ? year : null;
  }

  function getWesternZodiac(date) {
    if (!date) return null;
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const inRange = (m, d, m1, d1, m2, d2) => {
      return (
        (m === m1 && d >= d1) ||
        (m === m2 && d <= d2) ||
        (m > m1 && m < m2) ||
        (m1 > m2 && (m >= m1 || m <= m2))
      );
    };

    if (inRange(month, day, 3, 21, 4, 19)) return "Aries";
    if (inRange(month, day, 4, 20, 5, 20)) return "Taurus";
    if (inRange(month, day, 5, 21, 6, 20)) return "Gemini";
    if (inRange(month, day, 6, 21, 7, 22)) return "Cancer";
    if (inRange(month, day, 7, 23, 8, 22)) return "Leo";
    if (inRange(month, day, 8, 23, 9, 22)) return "Virgo";
    if (inRange(month, day, 9, 23, 10, 22)) return "Libra";
    if (inRange(month, day, 10, 23, 11, 21)) return "Scorpio";
    if (inRange(month, day, 11, 22, 12, 21)) return "Sagittarius";
    if (inRange(month, day, 12, 22, 1, 19)) return "Capricorn";
    if (inRange(month, day, 1, 20, 2, 18)) return "Aquarius";
    if (inRange(month, day, 2, 19, 3, 20)) return "Pisces";
    return null;
  }

  function getChineseZodiac(year) {
    if (!year || !Number.isFinite(year)) return null;
    const animals = [
      "Rat",
      "Ox",
      "Tiger",
      "Rabbit",
      "Dragon",
      "Snake",
      "Horse",
      "Goat",
      "Monkey",
      "Rooster",
      "Dog",
      "Pig",
    ];
    const index = (year - 1900) % 12;
    const safeIndex = (index + 12) % 12;
    return animals[safeIndex];
  }

  function getLifePathNumber(rawBirthday) {
    if (!rawBirthday) return null;
    const digits = String(rawBirthday).replace(/\D/g, "");
    if (!digits) return null;

    const isMaster = (n) => n === 11 || n === 22 || n === 33;
    const sumDigits = (n) =>
      String(n)
        .split("")
        .reduce((acc, ch) => acc + Number(ch || 0), 0);

    let n = digits
      .split("")
      .reduce((acc, ch) => acc + Number(ch || 0), 0);

    while (n > 9 && !isMaster(n)) {
      n = sumDigits(n);
    }
    return n;
  }

  const LOVE_DESCRIPTIONS = {
    "Words of Affirmation":
      "You feel loved through kind words, encouragement and sincere appreciation.",
    "Quality Time":
      "You value presence, deep conversations and shared moments without distraction.",
    "Acts of Service":
      "Support, thoughtful help and practical care speak love to you.",
    "Physical Touch":
      "Warm hugs, gentle touch and physical closeness nourish your heart.",
    "Receiving Gifts":
      "Meaningful, thoughtful gifts make you feel seen and remembered.",
  };

  function formatListForSentence(items, max) {
    if (!items || !items.length) return "";
    const arr = items.slice(0, max || 3);
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
    return `${arr.slice(0, -1).join(", ")}, and ${arr[arr.length - 1]}`;
  }

  function buildSoulSummary(data) {
    if (data.soulSummary) {
      return String(data.soulSummary).trim();
    }

    const name = data.name || "Your soul";
    const connectionType =
      data.connectionType || "meaningful connections with aligned souls";

    const loves = normalizeList(data.loveLanguages || data.loveLanguage);
    const primaryLove = loves[0] || null;

    const values = normalizeList(data.values);
    const hobbies = normalizeList(data.hobbies);

    const topValues = formatListForSentence(values, 3);
    const topHobbies = formatListForSentence(hobbies, 3);

    const parts = [];

    parts.push(
      primaryLove
        ? `${name} is seeking ${connectionType.toLowerCase()}, with a heart that speaks mainly in ${primaryLove}.`
        : `${name} is seeking ${connectionType.toLowerCase()}, guided by quiet inner truth.`
    );

    if (topValues) {
      parts.push(`Core values like ${topValues} keep this path aligned.`);
    }

    if (topHobbies) {
      parts.push(
        `Joy flows through ${topHobbies}, making everyday life feel more alive.`
      );
    }

    parts.push(
      "As you refine your profile, this summary will grow with you – a living reflection of your current chapter."
    );

    return parts.join(" ");
  }

  function buildEnergyText(data, birthdayDate, year) {
    const tokens = [];
    const explicitZodiac =
      data.zodiacSign || data.zodiac || data.sunSign || null;
    const explicitChinese = data.chineseSign || data.chineseZodiac || null;
    const explicitLifePath =
      data.lifePathNumber || data.lifePath || data.lifePathNum || null;

    const zodiac = explicitZodiac || getWesternZodiac(birthdayDate);
    const chinese = explicitChinese || getChineseZodiac(year);
    const lifePath = explicitLifePath || getLifePathNumber(data.birthday);

    if (zodiac) tokens.push(zodiac);
    if (chinese) tokens.push(chinese);
    if (lifePath) tokens.push(`Life Path ${lifePath}`);

    if (!tokens.length) {
      return {
        text: "Add your birthday in the Quiz to unlock your zodiac, Chinese sign and life path number here.",
        zodiac,
        chinese,
        lifePath,
      };
    }

    const baseLine = tokens.join(" • ");

    const flavor = [];
    if (zodiac) {
      flavor.push("a unique way of seeing the world");
    }
    if (lifePath) {
      flavor.push("a quiet inner compass");
    }
    if (chinese) {
      flavor.push("a particular flavor of courage and playfulness");
    }

    let secondLine = "";
    if (flavor.length) {
      secondLine = `— together they describe your energy pattern: ${formatListForSentence(
        flavor,
        flavor.length
      )}.`;
    } else {
      secondLine = "— together they sketch the outline of your current chapter.";
    }

    return {
      text: `${baseLine} ${secondLine}`,
      zodiac,
      chinese,
      lifePath,
    };
  }

  function renderChips(list, container, options) {
    const opts = options || {};
    const max = typeof opts.max === "number" ? opts.max : 6;
    const placeholderLabel = opts.placeholder || "Not set yet";
    container.innerHTML = "";

    const values = normalizeList(list);
    if (!values.length) {
      const chip = document.createElement("span");
      chip.className = "ms-chip ghost";
      chip.textContent = placeholderLabel;
      container.appendChild(chip);
      return;
    }

    const items = values.slice(0, max);
    items.forEach((item, index) => {
      const chip = document.createElement("span");
      chip.className = "ms-chip" + (opts.primary && index === 0 ? " primary" : "");
      chip.textContent = item;
      container.appendChild(chip);
    });

    if (values.length > max) {
      const moreChip = document.createElement("span");
      moreChip.className = "ms-chip ghost";
      moreChip.textContent = `+${values.length - max} more`;
      container.appendChild(moreChip);
    }
  }

  function renderLoveLanguageChips(loves, container) {
    container.innerHTML = "";
    const list = normalizeList(loves);
    if (!list.length) {
      const chip = document.createElement("span");
      chip.className = "ms-chip ghost";
      chip.textContent = "Add love languages in Quiz or Edit Profile.";
      container.appendChild(chip);
      return;
    }

    list.forEach((label, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "ms-chip";
      if (index === 0) {
        wrapper.className += " primary";
      }

      const title = document.createElement("div");
      title.style.fontSize = "0.9rem";
      title.style.fontWeight = "600";
      title.textContent = index === 0 ? `${label} · primary` : label;

      const desc = document.createElement("div");
      desc.style.fontSize = "0.8rem";
      desc.style.opacity = "0.9";
      desc.textContent =
        LOVE_DESCRIPTIONS[label] ||
        "A personal way your heart likes to both give and receive care.";

      wrapper.appendChild(title);
      wrapper.appendChild(desc);
      container.appendChild(wrapper);
    });
  }

  function renderPhoto(img, url) {
    if (!img) return;
    if (url) {
      img.src = url;
      img.alt = "Soul photo";
      img.classList.remove("is-empty");
    } else {
      img.removeAttribute("src");
      img.alt = "";
      img.classList.add("is-empty");
    }
  }

  function render(data) {
    const name = data.name || "My Soul";

    // HERO TITLE
    if (ui.heroTitle) {
      ui.heroTitle.textContent = name ? `My Soul • ${name}` : "My Soul";
    }

    if (ui.heroSubtitle) {
      ui.heroSubtitle.textContent =
        "Your core soul snapshot – built from your answers and updated each time you change your profile.";
    }

    // AVATAR & PHOTOS
    const photo1 = data.profilePhoto1;
    const photo2 = data.profilePhoto2;
    const photo3 = data.profilePhoto3;

    if (ui.avatar) {
      const avatarUrl = photo1 || photo2 || photo3 || "";
      if (avatarUrl) {
        ui.avatar.src = avatarUrl;
        ui.avatar.alt = "Soul avatar";
      } else {
        ui.avatar.removeAttribute("src");
        ui.avatar.alt = "";
      }
    }

    renderPhoto(ui.photo1, photo1);
    renderPhoto(ui.photo2, photo2);
    renderPhoto(ui.photo3, photo3);

    // BASIC DATE / AGE / ASTRO
    const birthdayDate = parseBirthdayToDate(data.birthday || data.birthdate);
    const age = calculateAge(birthdayDate);
    const year = getYearFromDate(birthdayDate);

    // ENERGY TEXT & TAGS
    const energy = buildEnergyText(data, birthdayDate, year);

    if (ui.energyText) {
      ui.energyText.textContent = energy.text;
      ui.energyText.classList.remove("ms-placeholder");
    }

    if (ui.zodiacTag) {
      if (energy.zodiac) {
        ui.zodiacTag.textContent = energy.zodiac;
        ui.zodiacTag.hidden = false;
      } else {
        ui.zodiacTag.hidden = true;
      }
    }

    if (ui.chineseTag) {
      if (energy.chinese) {
        ui.chineseTag.textContent = energy.chinese;
        ui.chineseTag.hidden = false;
      } else {
        ui.chineseTag.hidden = true;
      }
    }

    if (ui.lifePathTag) {
      if (energy.lifePath != null) {
        ui.lifePathTag.textContent = `Life Path ${energy.lifePath}`;
        ui.lifePathTag.hidden = false;
      } else {
        ui.lifePathTag.hidden = true;
      }
    }

    if (ui.connectionTag) {
      const ct = data.connectionType;
      if (ct) {
        ui.connectionTag.textContent = ct;
        ui.connectionTag.hidden = false;
      } else {
        ui.connectionTag.hidden = true;
      }
    }

    // CORE SNAPSHOT
    if (ui.snapshotName) {
      ui.snapshotName.textContent = name || "—";
    }

    if (ui.snapshotAge) {
      ui.snapshotAge.textContent = age != null ? `${age}` : "—";
    }

    if (ui.snapshotCountry) {
      ui.snapshotCountry.textContent =
        (data.country && String(data.country).trim()) || "—";
    }

    if (ui.snapshotConnection) {
      ui.snapshotConnection.textContent =
        data.connectionType || "Not chosen yet";
    }

    const loveArray = normalizeList(
      data.loveLanguages || data.loveLanguage || []
    );
    const primaryLove = loveArray[0];

    if (ui.snapshotLoveLanguage) {
      ui.snapshotLoveLanguage.textContent = primaryLove || "Not chosen yet";
    }

    if (ui.snapshotValues) {
      renderChips(data.values, ui.snapshotValues, {
        max: 6,
        primary: false,
        placeholder: "No values selected yet.",
      });
    }

    if (ui.snapshotHobbies) {
      renderChips(data.hobbies, ui.snapshotHobbies, {
        max: 6,
        primary: false,
        placeholder: "No hobbies added yet.",
      });
    }

    // SOUL SUMMARY
    if (ui.soulSummary) {
      const summary = buildSoulSummary(data);
      ui.soulSummary.textContent = summary;
      ui.soulSummary.classList.toggle(
        "ms-placeholder",
        !summary || !summary.trim()
      );
    }

    // LOVE & CONNECTION STYLE
    if (ui.loveLanguages) {
      renderLoveLanguageChips(
        data.loveLanguages || data.loveLanguage || [],
        ui.loveLanguages
      );
    }

    if (ui.connectWith) {
      const connectList = normalizeList(
        data.whoYouWantToConnectWith || data.connectionPreferences || []
      );
      renderChips(connectList, ui.connectWith, {
        max: 6,
        placeholder:
          "You can describe who you want to meet in Edit Profile.",
      });
    }

    // BOUNDARIES & VOICE
    const boundaries = (
      data.boundaries ||
      data.nonNegotiables ||
      data.unacceptable ||
      ""
    )
      .toString()
      .trim();

    if (ui.boundariesText) {
      if (boundaries) {
        ui.boundariesText.textContent = boundaries;
        ui.boundariesText.classList.remove("ms-placeholder");
      } else {
        ui.boundariesText.textContent =
          "You haven’t written your boundaries yet. When you add them, they will appear here.";
        ui.boundariesText.classList.add("ms-placeholder");
      }
    }

    const about = (
      data.aboutMe ||
      data.about ||
      data.story ||
      ""
    )
      .toString()
      .trim();

    if (ui.aboutText) {
      if (about) {
        ui.aboutText.textContent = about;
        ui.aboutText.classList.remove("ms-placeholder");
      } else {
        ui.aboutText.textContent =
          "Share a few lines about yourself in the Quiz or Edit Profile – your story will be reflected here.";
        ui.aboutText.classList.add("ms-placeholder");
      }
    }

    const mantra = (data.mantra || data.intention || "")
      .toString()
      .trim();

    if (ui.mantraText) {
      if (mantra) {
        ui.mantraText.textContent = mantra;
        ui.mantraText.classList.remove("ms-placeholder");
      } else {
        ui.mantraText.textContent =
          "Add a mantra to carry with you – something short you can return to on difficult days.";
        ui.mantraText.classList.add("ms-placeholder");
      }
    }
  }

  function renderEmpty() {
    if (ui.content) {
      ui.content.hidden = true;
    }
    if (ui.empty) {
      ui.empty.hidden = false;
    }
  }

  function renderFull(data) {
    if (ui.empty) {
      ui.empty.hidden = true;
    }
    if (ui.content) {
      ui.content.hidden = false;
    }
    render(data);
  }

  function bindStaticLinks() {
    const goToChart = ui.goToChart;
    if (goToChart) {
      goToChart.addEventListener("click", function (event) {
        event.preventDefault();
        window.location.href = "soul-chart.html";
      });
    }

    [ui.backQuizTop, ui.backQuizBottom].forEach((btn) => {
      if (!btn) return;
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        window.location.href = "quiz.html";
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const data = loadSoulData();
    if (!hasMeaningfulData(data)) {
      renderEmpty();
    } else {
      renderFull(data);
    }
    bindStaticLinks();
  });
})();
