// soul-coach.js — Soulink "Soul Coach" page
// View-only: reads soul profile and generates gentle coaching tips.
// Never writes to localStorage or calls patchSoulData/saveSoulData.

(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ===================== Helpers =====================

  function normaliseText(v) {
    return (v == null ? "" : String(v)).trim();
  }

  function toArray(v) {
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
  }

  function safeGetSoulData() {
    let data = {};
    try {
      if (typeof getSoulData === "function") {
        try {
          data = getSoulData({ ensureShape: true }) || {};
        } catch (e) {
          data = getSoulData() || {};
        }
      } else if (typeof localStorage !== "undefined") {
        const primary = localStorage.getItem("soulink.soulQuiz");
        const legacy = localStorage.getItem("soulQuiz");
        const raw = primary || legacy;
        data = raw ? JSON.parse(raw) : {};
      }
    } catch (err) {
      console.warn("Soul Coach: failed to read soul data", err);
      data = {};
    }
    if (!data || typeof data !== "object") return {};
    return data;
  }

  function hasAnyCoreData(soul) {
    if (!soul || typeof soul !== "object") return false;
    if (normaliseText(soul.name)) return true;
    if (normaliseText(soul.connectionType)) return true;
    if (normaliseText(soul.loveLanguage)) return true;
    if (toArray(soul.loveLanguages || soul.loveLanguage || []).length) return true;
    if (toArray(soul.values || []).length) return true;
    if (toArray(soul.hobbies || soul.interests || []).length) return true;
    if (normaliseText(soul.about) || normaliseText(soul.aboutMe)) return true;
    if (normaliseText(soul.zodiac)) return true;
    if (normaliseText(soul.chineseZodiac)) return true;
    if (soul.lifePathNumber != null) return true;
    return false;
  }

  function pickPrimaryLoveLanguage(soul) {
    const primary = normaliseText(soul.loveLanguage);
    if (primary) return primary;
    const list = toArray(soul.loveLanguages || []);
    if (list.length) return normaliseText(list[0]);
    return "";
  }

  function canonicalLoveKey(labelRaw) {
    const label = normaliseText(labelRaw).toLowerCase();
    if (!label) return "";
    if (label.includes("affirmation") || label.includes("words")) return "words";
    if (label.includes("quality")) return "quality";
    if (label.includes("service")) return "service";
    if (label.includes("touch")) return "touch";
    if (label.includes("gift")) return "gifts";
    return "other";
  }

  // Some profiles may already have zodiac fields; if not, we can attempt a light fallback from birthday.
  function deriveZodiacFallback(soul) {
    const zodiacExisting = normaliseText(soul.zodiac);
    const chineseExisting = normaliseText(soul.chineseZodiac);
    let lifePathExisting = soul.lifePathNumber;

    function computeFromBirthday(birthdayRaw) {
      const raw = normaliseText(birthdayRaw);
      if (!raw) return {};

      let year, month, day;

      // New: explicit European formats DD.MM.YYYY or DD/MM/YYYY
      const euMatch = raw.match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
      if (euMatch) {
        day = Number(euMatch[1]);
        month = Number(euMatch[2]);
        year = Number(euMatch[3]);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        // Existing: ISO YYYY-MM-DD
        const parts = raw.split("-");
        year = Number(parts[0]);
        month = Number(parts[1]);
        day = Number(parts[2]);
      } else {
        // Fallback: digits only, assume YYYYMMDD (existing behavior)
        const digits = raw.replace(/[^\d]/g, "");
        if (/^\d{8}$/.test(digits)) {
          year = Number(digits.slice(0, 4));
          month = Number(digits.slice(4, 6));
          day = Number(digits.slice(6, 8));
        } else {
          return {};
        }
      }

      const dt = new Date(Date.UTC(year, month - 1, day));
      if (isNaN(dt.getTime())) return {};

      function zodiacSign(mo, da) {
        const md = mo * 100 + da;
        if (md >= 321 && md <= 419) return "Aries";
        if (md >= 420 && md <= 520) return "Taurus";
        if (md >= 521 && md <= 620) return "Gemini";
        if (md >= 621 && md <= 722) return "Cancer";
        if (md >= 723 && md <= 822) return "Leo";
        if (md >= 823 && md <= 922) return "Virgo";
        if (md >= 923 && md <= 1022) return "Libra";
        if (md >= 1023 && md <= 1121) return "Scorpio";
        if (md >= 1122 && md <= 1221) return "Sagittarius";
        if (md >= 1222 || md <= 119) return "Capricorn";
        if (md >= 120 && md <= 218) return "Aquarius";
        if (md >= 219 && md <= 320) return "Pisces";
        return "";
      }

      function chineseZodiac(y) {
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
        const idx = (y - 1900) % 12;
        return animals[(idx + 12) % 12];
      }

      function lifePath(yyyy, mm, dd) {
        const digitsAll =
          String(yyyy) +
          String(mm).padStart(2, "0") +
          String(dd).padStart(2, "0");
        const sumDigits = (s) =>
          s.split("").reduce((acc, ch) => acc + Number(ch || 0), 0);
        let n = sumDigits(digitsAll);
        const isMaster = (x) => x === 11 || x === 22 || x === 33;
        while (n > 9 && !isMaster(n)) {
          n = sumDigits(String(n));
        }
        return n;
      }

      return {
        zodiac: zodiacSign(month, day),
        chineseZodiac: chineseZodiac(year),
        lifePathNumber: lifePath(year, month, day),
      };
    }

    let zodiac = zodiacExisting;
    let chineseZodiac = chineseExisting;
    let lifePathNumber = lifePathExisting;

    if (!zodiac || !chineseZodiac || lifePathNumber == null) {
      const fromBirthday = computeFromBirthday(soul.birthday);
      if (!zodiac) zodiac = normaliseText(fromBirthday.zodiac) || zodiacExisting;
      if (!chineseZodiac)
        chineseZodiac =
          normaliseText(fromBirthday.chineseZodiac) || chineseExisting;
      if (lifePathNumber == null && fromBirthday.lifePathNumber != null) {
        lifePathNumber = fromBirthday.lifePathNumber;
      }
    }

    return { zodiac, chineseZodiac, lifePathNumber };
  }

  function joinSentences(sentences) {
    return sentences.filter(Boolean).join(" ");
  }

  // ===================== DOM cache =====================

  const ui = {
    coachEmpty: $("#coachEmpty"),

    coachName: $("#coachName"),
    coachConn: $("#coachConn"),
    coachLovePrimary: $("#coachLovePrimary"),

    coachLoveAdvice: $("#coachLoveAdvice"),
    coachZodiacAdvice: $("#coachZodiacAdvice"),
    coachChineseAdvice: $("#coachChineseAdvice"),
    coachLifePathAdvice: $("#coachLifePathAdvice"),
    coachValuesAdvice: $("#coachValuesAdvice"),
    coachNextSteps: $("#coachNextSteps"),

    btnRefresh: $("#coachRefresh"),
    btnModeLove: $("#coachModeLove"),
    btnModeFriend: $("#coachModeFriend"),
  };

  // ===================== State =====================

  let soulData = {};
  let coachMode = "love"; // "love" | "friend"

  function setMode(mode) {
    if (mode !== "love" && mode !== "friend") return;
    coachMode = mode;

    // Optional visual state
    if (ui.btnModeLove) {
      ui.btnModeLove.classList.toggle("active", mode === "love");
      ui.btnModeLove.setAttribute("aria-pressed", mode === "love" ? "true" : "false");
    }
    if (ui.btnModeFriend) {
      ui.btnModeFriend.classList.toggle("active", mode === "friend");
      ui.btnModeFriend.setAttribute("aria-pressed", mode === "friend" ? "true" : "false");
    }
  }

  function partnerWord() {
    return coachMode === "friend" ? "friend" : "partner";
  }

  function connectionWord() {
    return coachMode === "friend" ? "friendships" : "relationships";
  }

  // ===================== Advice generators =====================

  function renderLoveAdvice(soul) {
    if (!ui.coachLoveAdvice) return;

    const primaryLabel = pickPrimaryLoveLanguage(soul);
    const key = canonicalLoveKey(primaryLabel);

    if (!primaryLabel && !key) {
      ui.coachLoveAdvice.textContent =
        "Your heart has its own unique love language. Begin by noticing when you feel most seen and nourished — is it words, time, support, touch or thoughtful surprises?";
      return;
    }

    const pWord = partnerWord();
    const cWord = connectionWord();

    let text = "";

    switch (key) {
      case "words":
        text = joinSentences([
          `Your primary love language seems to be Words of Affirmation.`,
          `You open up when your ${pWord} or ${cWord} reflect back what they appreciate about you.`,
          `Intentionally invite honest, gentle conversations and share appreciation out loud — it creates a soft, safe field for your soul.`,
        ]);
        break;
      case "quality":
        text = joinSentences([
          `Your soul thrives on Quality Time.`,
          `You feel most connected when someone is fully present with you — no phone, no rush, just shared moments.`,
          `Protect time for one-on-one presence with your ${pWord} and say clearly: “Time together is how I feel loved.”`,
        ]);
        break;
      case "service":
        text = joinSentences([
          `Acts of Service are a key love language for you.`,
          `When someone quietly helps, supports your daily life or takes a task off your shoulders, your nervous system relaxes.`,
          `Choose ${connectionWord()} where support is mutual — where both of you naturally look for ways to make each other’s path lighter.`,
        ]);
        break;
      case "touch":
        text = joinSentences([
          `Physical Touch carries a deep meaning for your soul.`,
          `Hugs, holding hands or a gentle touch on the shoulder can say more than a paragraph of words.`,
          `Create agreements around consent and comfort so that touch becomes a safe, grounding ritual with the right ${pWord} or friends around you.`,
        ]);
        break;
      case "gifts":
        text = joinSentences([
          `Thoughtful Gifts and tangible symbols of care speak strongly to you.`,
          `For you it’s not about price — it’s about being seen and remembered.`,
          `Share with your ${pWord} or close friends how much small, meaningful surprises nourish you, and also practice gifting them in your own heartfelt way.`,
        ]);
        break;
      default:
        text = joinSentences([
          `Your way of giving and receiving love is multi-layered.`,
          `You may resonate with more than one love language, which makes you sensitive and adaptable in ${connectionWord()}.`,
          `Notice what consistently makes you feel safe, alive and respected — that is the compass your Soul Coach wants you to follow.`,
        ]);
        break;
    }

    ui.coachLoveAdvice.textContent = text;
  }

  function renderZodiacAdvice(soul, zodiac) {
    if (!ui.coachZodiacAdvice) return;

    const sign = normaliseText(zodiac || soul.zodiac);
    if (!sign) {
      ui.coachZodiacAdvice.textContent =
        "Your zodiac energy is a unique blend. Even without a specific sign here, trust the parts of you that feel fiery, earthy, airy or watery — they all have wisdom for your path.";
      return;
    }

    const pWord = partnerWord();
    const cWord = connectionWord();
    const lower = sign.toLowerCase();

    let text = "";

    if (lower === "aries") {
      text = joinSentences([
        `As an Aries soul, you carry bold, pioneering fire.`,
        `You thrive in ${connectionWord()} that allow honesty, directness and a sense of adventure.`,
        `Choose people who can handle your truth and movement — and remember to also listen deeply, so your fire warms instead of burns.`,
      ]);
    } else if (lower === "taurus") {
      text = joinSentences([
        `Taurus energy in your chart brings stability and sensuality.`,
        `You blossom in ${connectionWord()} where you feel safe, well-fed emotionally and physically, and not rushed.`,
        `Honor your need for comfort and loyalty — your ${pWord} should feel like a soft place to land, not another battlefield.`,
      ]);
    } else if (lower === "gemini") {
      text = joinSentences([
        `Gemini energy makes your mind curious and your heart responsive to conversation.`,
        `You connect through words, ideas and playful banter.`,
        `Seek ${connectionWord()} where you can talk about both the light and the deep topics — your soul needs mental stimulation and kindness together.`,
      ]);
    } else if (lower === "cancer") {
      text = joinSentences([
        `Cancer energy gives you a strong, sensitive heart.`,
        `You need emotional safety more than drama.`,
        `Choose ${connectionWord()} with people who respect your feelings, your family energy and your cycles — your sensitivity is a gift, not a weakness.`,
      ]);
    } else if (lower === "leo") {
      text = joinSentences([
        `Leo energy in you wants to shine and be seen.`,
        `You thrive when your ${pWord} or friends genuinely celebrate your light.`,
        `Just remember: your warmth is strongest when you also shine your spotlight on others, appreciating their brilliance too.`,
      ]);
    } else if (lower === "virgo") {
      text = joinSentences([
        `Virgo energy brings discernment and a desire to improve things.`,
        `You notice details in ${connectionWord()} others might overlook.`,
        `Use this wisely: communicate with kindness, offer support without trying to fix people, and allow yourself to be imperfect and loved as you are.`,
      ]);
    } else if (lower === "libra") {
      text = joinSentences([
        `Libra energy in your soul loves harmony and beauty in ${connectionWord()}.`,
        `You care about fairness, balance and mutual respect.`,
        `Practice expressing your own needs clearly, not only keeping peace for everyone else — true harmony includes your truth too.`,
      ]);
    } else if (lower === "scorpio") {
      text = joinSentences([
        `Scorpio energy makes you deep, intuitive and transformation-oriented.`,
        `Superficial ${connectionWord()} will never satisfy you for long.`,
        `Choose people who can handle raw honesty, emotional depth and evolution — and remember to balance intensity with moments of softness and play.`,
      ]);
    } else if (lower === "sagittarius") {
      text = joinSentences([
        `Sagittarius energy brings freedom, meaning and exploration.`,
        `You need ${connectionWord()} that allow growth, learning and a sense of expansion.`,
        `Stay loyal to your truth, and choose companions who are excited to walk new paths with you rather than limit your horizon.`,
      ]);
    } else if (lower === "capricorn") {
      text = joinSentences([
        `Capricorn energy gives you strength, responsibility and long-term vision.`,
        `You value reliability and shared goals.`,
        `Let your ${pWord} or close friends see both your strong side and your softer, more vulnerable self — this balance deepens trust and intimacy.`,
      ]);
    } else if (lower === "aquarius") {
      text = joinSentences([
        `Aquarius energy makes you unique, future-oriented and community-minded.`,
        `You thrive in ${connectionWord()} where authenticity and shared ideals matter more than strict traditions.`,
        `Allow yourself to be fully “different” and attract those who love you exactly that way.`,
      ]);
    } else if (lower === "pisces") {
      text = joinSentences([
        `Pisces energy gives you compassion, intuition and spiritual depth.`,
        `You often feel the emotions of others as if they were your own.`,
        `Create clear energetic boundaries in ${connectionWord()} so you can stay kind without losing yourself — your sensitivity is sacred.`,
      ]);
    } else {
      text = joinSentences([
        `Your zodiac sign, ${sign}, brings its own flavor of wisdom and challenge.`,
        `Notice where your natural tendencies support healthy ${connectionWord()} and where they pull you into old patterns.`,
        `Awareness itself becomes your Soul Coach here.`,
      ]);
    }

    ui.coachZodiacAdvice.textContent = text;
  }

  function renderChineseAdvice(soul, chineseZodiac) {
    if (!ui.coachChineseAdvice) return;

    const sign = normaliseText(chineseZodiac || soul.chineseZodiac);
    if (!sign) {
      ui.coachChineseAdvice.textContent =
        "Your Chinese zodiac energy adds an extra layer of flavor to your personality. Even if it’s not named here, trust that your instincts, loyalty and courage are guiding your choices.";
      return;
    }

    const cWord = connectionWord();
    const lower = sign.toLowerCase();
    let text = "";

    if (lower === "rat") {
      text = joinSentences([
        `As a Rat in Chinese astrology, you carry sharp instincts and resourcefulness.`,
        `Use your clever mind to build ${cWord} where both hearts feel practically supported and emotionally safe.`,
      ]);
    } else if (lower === "ox") {
      text = joinSentences([
        `Ox energy gives you endurance and reliability.`,
        `You are the steady presence others can lean on — just remember to let them support you too.`,
      ]);
    } else if (lower === "tiger") {
      text = joinSentences([
        `Tiger energy makes you brave and passionate.`,
        `Channel your intensity into protecting what matters rather than fighting what doesn’t deserve your energy.`,
      ]);
    } else if (lower === "rabbit") {
      text = joinSentences([
        `Rabbit energy brings gentleness, sensitivity and a love of comfort.`,
        `Build ${cWord} that feel calm, aesthetically pleasing and emotionally kind.`,
      ]);
    } else if (lower === "dragon") {
      text = joinSentences([
        `Dragon energy is powerful and visionary.`,
        `You’re here to create big things — choose ${cWord} that celebrate your dreams rather than shrink them.`,
      ]);
    } else if (lower === "snake") {
      text = joinSentences([
        `Snake energy gives you depth, intuition and the ability to shed old skins.`,
        `Allow yourself to transform out of old relational patterns and step into a wiser version of love and friendship.`,
      ]);
    } else if (lower === "horse") {
      text = joinSentences([
        `Horse energy makes you free-spirited and restless when confined.`,
        `You need movement, adventure and open skies in your ${cWord} — not cages.`,
      ]);
    } else if (lower === "goat" || lower === "sheep") {
      text = joinSentences([
        `Goat energy brings creativity and tenderness.`,
        `You flourish in environments that are emotionally supportive and aesthetically soft.`,
      ]);
    } else if (lower === "monkey") {
      text = joinSentences([
        `Monkey energy makes you playful, witty and adaptable.`,
        `Bring humor into your ${cWord}, but remember to also show your serious, committed side when it matters.`,
      ]);
    } else if (lower === "rooster") {
      text = joinSentences([
        `Rooster energy gives you confidence and a love for honesty.`,
        `Be proud of who you are, while staying open to feedback that helps your ${cWord} grow.`,
      ]);
    } else if (lower === "dog") {
      text = joinSentences([
        `Dog energy in you is all about loyalty and protection.`,
        `You are a devoted ${partnerWord()} and friend — just make sure your devotion is received with respect, not taken for granted.`,
      ]);
    } else if (lower === "pig" || lower === "boar") {
      text = joinSentences([
        `Pig energy brings generosity, kindness and enjoyment of life.`,
        `Create ${cWord} where good food, laughter and emotional honesty are part of your shared rituals.`,
      ]);
    } else {
      text = joinSentences([
        `Your Chinese zodiac sign, ${sign}, offers its own style of courage and growth.`,
        `Trust that you can use this energy to attract souls who respect your heart and your boundaries.`,
      ]);
    }

    ui.coachChineseAdvice.textContent = text;
  }

  function renderLifePathAdvice(soul, lifePathNumberRaw) {
    if (!ui.coachLifePathAdvice) return;

    let n = lifePathNumberRaw;
    if (n == null) n = soul.lifePathNumber;
    if (typeof n === "string") n = parseInt(n, 10);
    if (!Number.isFinite(n)) {
      ui.coachLifePathAdvice.textContent =
        "Your life path carries a unique lesson about love, connection and self-worth. Even without a specific number here, notice the repeating themes that life keeps inviting you to grow through.";
      return;
    }

    const cWord = connectionWord();
    let text = "";

    switch (n) {
      case 1:
        text = joinSentences([
          `Life Path 1: the path of the Pioneer.`,
          `You are here to learn healthy independence and leadership in ${cWord}.`,
          `Balance your strong will with openness to collaboration and emotional vulnerability.`,
        ]);
        break;
      case 2:
        text = joinSentences([
          `Life Path 2: the path of the Peacemaker.`,
          `You are deeply tuned into others and value harmony.`,
          `Your lesson is to honor your own needs while still being the gentle, intuitive soul you are.`,
        ]);
        break;
      case 3:
        text = joinSentences([
          `Life Path 3: the path of the Creative Communicator.`,
          `You bring light, humor and artistic energy into ${cWord}.`,
          `Use your voice to express truth, not just to entertain, and allow your emotions to be seen.`,
        ]);
        break;
      case 4:
        text = joinSentences([
          `Life Path 4: the path of the Builder.`,
          `You’re here to create stable foundations, both materially and emotionally.`,
          `Choose ${cWord} that respect structure, reliability and long-term vision.`,
        ]);
        break;
      case 5:
        text = joinSentences([
          `Life Path 5: the path of Freedom and Change.`,
          `You need space, variety and adventure.`,
          `Your soul lesson is to choose freedom with responsibility — not running from commitment, but designing ${cWord} that feel spacious, not restrictive.`,
        ]);
        break;
      case 6:
        text = joinSentences([
          `Life Path 6: the path of the Healer and Caregiver.`,
          `You are naturally nurturing and responsible.`,
          `Remember to care for yourself as much as you care for others, and avoid taking on roles that feel like “parenting” everyone around you.`,
        ]);
        break;
      case 7:
        text = joinSentences([
          `Life Path 7: the path of the Seeker.`,
          `You need depth, inner space and spiritual meaning.`,
          `Choose ${cWord} where quiet, reflection and soulful conversations are honored, not judged.`,
        ]);
        break;
      case 8:
        text = joinSentences([
          `Life Path 8: the path of Power and Manifestation.`,
          `You are learning to balance material success with heart-centered integrity.`,
          `In ${cWord}, stay aware of control dynamics — use your power to uplift, not to dominate.`,
        ]);
        break;
      case 9:
        text = joinSentences([
          `Life Path 9: the path of the Old Soul.`,
          `You carry compassion and a sense of global, collective love.`,
          `Your lesson is to practice healthy boundaries while still keeping your heart open to humanity.`,
        ]);
        break;
      case 11:
        text = joinSentences([
          `Life Path 11: the path of the Intuitive Light-Bringer.`,
          `Your sensitivity and intuition are amplified.`,
          `You’re here to bring spiritual awareness into human ${cWord}, grounding your visions into daily life.`,
        ]);
        break;
      case 22:
        text = joinSentences([
          `Life Path 22: the Master Builder.`,
          `You are capable of building big, tangible manifestations of love, community or service.`,
          `Stay anchored in your heart so your ambitions stay aligned with your soul.`,
        ]);
        break;
      case 33:
        text = joinSentences([
          `Life Path 33: the Master Teacher of Compassion.`,
          `Your energy can feel intense and highly loving.`,
          `Your work is to channel that love in healthy ways, not through sacrifice, but through conscious, balanced giving.`,
        ]);
        break;
      default:
        text = joinSentences([
          `Your life path number, ` + n + `, carries its own sacred curriculum.`,
          `Trust that your repeated life patterns are showing you where to heal, forgive and grow in ${cWord}.`,
        ]);
        break;
    }

    ui.coachLifePathAdvice.textContent = text;
  }

  function renderValuesHobbiesAdvice(soul) {
    if (!ui.coachValuesAdvice) return;

    const values = toArray(soul.values || []).map(normaliseText).filter(Boolean);
    const hobbies = toArray(soul.hobbies || soul.interests || [])
      .map(normaliseText)
      .filter(Boolean);

    const cWord = connectionWord();
    const pieces = [];

    if (!values.length && !hobbies.length) {
      ui.coachValuesAdvice.textContent =
        "Your values and passions are the map for your connections. Take a quiet moment to write down what matters most to you and what lights you up — then let people into that authentic world.";
      return;
    }

    // Values
    if (values.length) {
      const lowerValues = values.map((v) => v.toLowerCase());

      if (lowerValues.some((v) => v.includes("honesty") || v.includes("integrity"))) {
        pieces.push(
          `Honesty and integrity matter deeply to you. Protect yourself from dynamics where truth is blurred or hidden — your nervous system needs transparency to relax.`
        );
      }
      if (lowerValues.some((v) => v.includes("loyal"))) {
        pieces.push(
          `Loyalty is one of your core values. Choose ${cWord} where promises and actions match, and where both sides show up even when it’s not convenient.`
        );
      }
      if (
        lowerValues.some(
          (v) => v.includes("freedom") || v.includes("independence") || v.includes("autonomy")
        )
      ) {
        pieces.push(
          `Freedom and personal space are essential for you. Communicate your need for autonomy early, so you don’t feel trapped later.`
        );
      }
      if (lowerValues.some((v) => v.includes("family"))) {
        pieces.push(
          `Family and close bonds matter to your heart. You’re happiest when your ${cWord} can blend with your sense of home and belonging.`
        );
      }
      if (
        lowerValues.some(
          (v) => v.includes("spiritual") || v.includes("growth") || v.includes("evolution")
        )
      ) {
        pieces.push(
          `Spiritual growth and inner evolution are important to you. Seek souls who are open to reflection, healing and conscious communication.`
        );
      }

      if (!pieces.length) {
        pieces.push(
          `Your values — ` + values.join(", ") + ` — are your inner compass. Let them guide who you give your time, energy and heart to.`
        );
      }
    }

    // Hobbies / lifestyle
    if (hobbies.length) {
      const lowerH = hobbies.map((v) => v.toLowerCase());

      if (
        lowerH.some(
          (v) =>
            v.includes("hiking") ||
            v.includes("nature") ||
            v.includes("forest") ||
            v.includes("garden") ||
            v.includes("outdoor")
        )
      ) {
        pieces.push(
          `Nature is a medicine for your soul. Regular time outside — even simple walks — will keep you grounded and clear about which ${cWord} truly nourish you.`
        );
      }
      if (
        lowerH.some(
          (v) =>
            v.includes("yoga") ||
            v.includes("dance") ||
            v.includes("gym") ||
            v.includes("fitness") ||
            v.includes("movement")
        )
      ) {
        pieces.push(
          `Your body is a big part of your emotional balance. Movement, stretching or dancing help you process feelings instead of holding them inside.`
        );
      }
      if (
        lowerH.some(
          (v) =>
            v.includes("art") ||
            v.includes("design") ||
            v.includes("paint") ||
            v.includes("draw") ||
            v.includes("music") ||
            v.includes("sing") ||
            v.includes("write")
        )
      ) {
        pieces.push(
          `Your creativity is sacred. Protect time for your art, music or writing — the right ${cWord} will respect and even celebrate this part of you.`
        );
      }
      if (lowerH.some((v) => v.includes("travel") || v.includes("adventure"))) {
        pieces.push(
          `Exploration and travel feed your spirit. Design ${cWord} that allow shared adventures and new experiences, so you don’t feel stuck.`
        );
      }

      if (!pieces.length) {
        pieces.push(
          `Your interests — ` +
            hobbies.join(", ") +
            ` — are not random. They show the environments and rhythms where your heart feels most alive. Bring more of them into your daily life.`
        );
      }
    }

    // Safe DOM building: no innerHTML with user content
    ui.coachValuesAdvice.textContent = "";
    pieces.forEach((sentence) => {
      if (!sentence) return;
      const p = document.createElement("p");
      p.textContent = sentence;
      ui.coachValuesAdvice.appendChild(p);
    });
  }

  function renderNextSteps(soul) {
    if (!ui.coachNextSteps) return;

    const pWord = partnerWord();
    const cWord = connectionWord();
    const primaryLove = pickPrimaryLoveLanguage(soul) || "your natural way of receiving love";

    const steps = [];

    steps.push(
      `• This week, create one intentional moment with a ` +
        pWord +
        ` or close ` +
        (coachMode === "friend" ? "friend" : "person") +
        ` where you honor ` +
        primaryLove +
        `.`
    );

    steps.push(
      `• Write down your top 3 values and check: are they present in your current ` +
        cWord +
        `? If not, what small shift could you make?`
    );

    const aboutText = normaliseText(soul.about || soul.aboutMe);
    if (aboutText) {
      steps.push(
        `• Re-read your own “About me” text and update one sentence so it reflects who you are now, not who you were in the past.`
      );
    } else {
      steps.push(
        `• Take 10 minutes to write a gentle “About me” paragraph just for yourself, describing how you want to feel in ${cWord}.`
      );
    }

    // Safe DOM building: no innerHTML with user content
    ui.coachNextSteps.textContent = "";
    steps.forEach((step) => {
      if (!step) return;
      const p = document.createElement("p");
      p.textContent = step;
      ui.coachNextSteps.appendChild(p);
    });
  }

  function renderHeader(soul) {
    if (ui.coachName) {
      const name = normaliseText(soul.name);
      ui.coachName.textContent = name || "beautiful soul";
    }

    if (ui.coachConn) {
      const conn = normaliseText(soul.connectionType);
      ui.coachConn.textContent = conn || "connection type not set yet";
    }

    if (ui.coachLovePrimary) {
      const primaryLove = pickPrimaryLoveLanguage(soul);
      ui.coachLovePrimary.textContent = primaryLove || "not defined yet";
    }
  }

  // ===================== Render orchestration =====================

  function renderAll() {
    const soul = soulData || {};
    const derived = deriveZodiacFallback(soul);

    renderHeader(soul);
    renderLoveAdvice(soul);
    renderZodiacAdvice(soul, derived.zodiac);
    renderChineseAdvice(soul, derived.chineseZodiac);
    renderLifePathAdvice(soul, derived.lifePathNumber);
    renderValuesHobbiesAdvice(soul);
    renderNextSteps(soul);
  }

  // ===================== Init =====================

  function init() {
    try {
      soulData = safeGetSoulData();
      const hasData = hasAnyCoreData(soulData);

      if (!hasData) {
        if (ui.coachEmpty) {
          ui.coachEmpty.hidden = false;
          ui.coachEmpty.textContent =
            "No soul data yet — please complete your Soulink Quiz and Edit Profile first.";
        }
        // We still safely exit; advice blocks may stay empty.
      } else if (ui.coachEmpty) {
        ui.coachEmpty.hidden = true;
      }

      // Default mode
      setMode("love");

      // Initial render (only if there is some data; but safe either way)
      renderAll();

      // Optional controls
      if (ui.btnRefresh) {
        ui.btnRefresh.addEventListener("click", function (e) {
          e.preventDefault();
          // Refresh data snapshot in case something changed
          soulData = safeGetSoulData();
          renderAll();
        });
      }

      if (ui.btnModeLove && ui.btnModeFriend) {
        ui.btnModeLove.addEventListener("click", function (e) {
          e.preventDefault();
          setMode("love");
          renderAll();
        });
        ui.btnModeFriend.addEventListener("click", function (e) {
          e.preventDefault();
          setMode("friend");
          renderAll();
        });
      }
    } catch (err) {
      console.error("Soul Coach: init failed", err);
      if (ui.coachEmpty) {
        ui.coachEmpty.hidden = false;
        ui.coachEmpty.textContent =
          "We could not load your Soul Coach data. Please refresh the page or try again later.";
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
