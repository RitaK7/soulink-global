\// soul-coach.js — Soulink "Soul Coach" page
// Reads soul profile via data-helpers.js and generates gentle coaching ideas.

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

  function prefersReducedMotion() {
    try {
      return (
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    } catch (_err) {
      return false;
    }
  }

  function safeGetSoulData() {
    let data = {};
    try {
      if (typeof getSoulData === "function") {
        try {
          data = getSoulData({ ensureShape: true }) || {};
        } catch (_e) {
          data = getSoulData() || {};
        }
      }
    } catch (err) {
      console.warn("Soul Coach: failed to read soul data", err);
      data = {};
    }
    if (!data || typeof data !== "object") return {};
    return data;
  }

  function pickPrimaryLoveLanguage(soul) {
    const direct = normaliseText(soul.loveLanguage);
    if (direct) return direct;
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

  function isContactLike(strRaw) {
    const str = normaliseText(strRaw).toLowerCase();
    if (!str) return false;
    if (str.includes("@")) return true;
    if (str.includes("http://") || str.includes("https://") || str.includes("www.")) return true;
    if (str.includes("telegram") || str.includes("tg:") || str.includes("whatsapp")) return true;
    if (str.replace(/[^0-9+]/g, "").length >= 6) return true;
    return false;
  }

  function cleanList(listLike) {
    const out = [];
    const seen = new Set();
    toArray(listLike).forEach((item) => {
      const t = normaliseText(item);
      if (!t) return;
      if (isContactLike(t)) return;
      const key = t.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(t);
    });
    return out;
  }

  function hasMeaningfulData(soul) {
    if (!soul || typeof soul !== "object") return false;
    if (normaliseText(soul.name)) return true;
    if (pickPrimaryLoveLanguage(soul)) return true;
    if (cleanList(soul.values || soul.coreValues || []).length) return true;
    if (cleanList(soul.hobbies || soul.passions || soul.interests || []).length) return true;
    if (normaliseText(soul.about || soul.aboutMe)) return true;
    if (normaliseText(soul.connectionType)) return true;
    if (normaliseText(soul.zodiac || soul.westernZodiac)) return true;
    if (soul.lifePathNumber != null && String(soul.lifePathNumber).trim() !== "") return true;
    return false;
  }

  function determineMode(soul) {
    const conn = normaliseText(soul.connectionType).toLowerCase();
    if (conn.includes("friend")) return "friend";
    if (conn.includes("family")) return "friend";
    return "love";
  }

  function partnerWord(mode) {
    return mode === "friend" ? "friend" : "partner";
  }

  function connectionWord(mode) {
    return mode === "friend" ? "friendships" : "relationships";
  }

  function pickOne(arr, fallback) {
    const list = toArray(arr).filter(Boolean);
    if (!list.length) return fallback;
    if (list.length === 1) return list[0];
    const idx = Math.floor(Math.random() * list.length);
    return list[idx];
  }

  function numericLifePath(value) {
    if (value == null) return null;
    let n = value;
    if (typeof n === "string") {
      n = parseInt(n, 10);
    }
    if (!Number.isFinite(n)) return null;
    return n;
  }

  // ===================== DOM cache =====================

  const ui = {
    page: $(".soul-coach-page"),
    empty: $("#coachEmpty"),
    layout: $("#coachLayout"),

    heroName: $("#coachHeroName"),
    heroConnection: $("#coachHeroConnection"),
    pillName: $("#coachPillName"),
    pillLove: $("#coachPillLove"),
    pillLife: $("#coachPillLife"),
    orbMain: $("#coachOrbMain"),
    orbSub: $("#coachOrbSub"),

    loveText: $("#coachLoveText"),
    loveActions: $("#coachLoveActions"),

    valuesChips: $("#coachValuesChips"),
    valuesText: $("#coachValuesText"),
    valuesActions: $("#coachValuesActions"),

    energyChips: $("#coachEnergyChips"),
    energyText: $("#coachEnergyText"),
    energyActions: $("#coachEnergyActions"),

    stepText: $("#coachStepText"),
    stepHighlight: $("#coachStepHighlight"),

    refreshBtn: $("#coachRefreshBtn"),
  };

  let soulData = {};
  let mode = "love";

  // ===================== Render helpers =====================

  function renderHero(soul) {
    const name = normaliseText(soul.name) || "beautiful soul";
    const conn = normaliseText(soul.connectionType) || "";
    const lifePath = numericLifePath(soul.lifePathNumber);
    const primaryLove = pickPrimaryLoveLanguage(soul);

    if (ui.heroName) {
      ui.heroName.textContent = name;
    }
    if (ui.heroConnection) {
      ui.heroConnection.textContent = conn || "your connections";
    }

    if (ui.pillName) {
      ui.pillName.textContent = "Name: " + name;
    }
    if (ui.pillLove) {
      ui.pillLove.textContent = primaryLove
        ? "Love language: " + primaryLove
        : "Love language: not set yet";
    }
    if (ui.pillLife) {
      ui.pillLife.textContent =
        lifePath != null
          ? "Life path: " + lifePath
          : "Life path: not calculated yet";
    }

    if (ui.orbMain) {
      ui.orbMain.textContent = name === "beautiful soul" ? "Your soul" : name;
    }
    if (ui.orbSub) {
      let line = "";
      const cWord = connectionWord(mode);
      if (conn) {
        line = "Leaning gently into " + cWord + " that match your real energy.";
      } else if (primaryLove) {
        line =
          "Being kind to your own heart by honoring your love language today.";
      } else {
        line =
          "Taking one small, kind step toward the connections you truly want.";
      }
      ui.orbSub.textContent = line;
    }
  }

  function buildLoveCoaching(soul) {
    const primary = pickPrimaryLoveLanguage(soul);
    const key = canonicalLoveKey(primary);
    const pWord = partnerWord(mode);
    const cWord = connectionWord(mode);

    if (!key) {
      return {
        text:
          "Your heart has its own way of feeling safe and seen. Begin by noticing when you relax around people — is it when they listen, show up with actions, offer touch, or create time just for you?",
        actions: [
          "Notice three tiny moments this week when you feel genuinely cared for.",
          "Write one sentence that describes what feeling loved means for you.",
          "Share that sentence with a trusted " + pWord + " or friend.",
        ],
      };
    }

    switch (key) {
      case "words":
        return {
          text:
            "Words of Affirmation seem important for you. Your energy softens when someone speaks to you with honesty, respect and appreciation. Clear, gentle words can calm your nervous system.",
          actions: [
            "Pay attention to which words land softly in your body and which feel sharp.",
            "Practice saying one encouraging sentence to yourself out loud each morning.",
            "Tell your " +
              pWord +
              " or close friends that sincere words matter more than perfect speeches.",
          ],
        };
      case "quality":
        return {
          text:
            "Quality Time nourishes you. You feel most connected when someone is fully present — no scrolling, no rushing, just being together. Your soul loves slow, focused moments.",
          actions: [
            "Protect one small block of time this week for undistracted presence with a " +
              pWord +
              " or friend.",
            "When you are with someone you care about, put your phone aside for 15 minutes.",
            "Gently explain that time together is how you feel loved and safe.",
          ],
        };
      case "service":
        return {
          text:
            "Acts of Service carry a lot of meaning for you. When someone quietly helps, supports your day or takes a task off your shoulders, your whole system exhales.",
          actions: [
            "Write down two practical ways others could support you right now.",
            "Practice asking for one small, clear favor instead of waiting for people to guess.",
            "Notice where service is mutual in your " + cWord + " and where it feels one-sided.",
          ],
        };
      case "touch":
        return {
          text:
            "Physical Touch can speak louder than long explanations for you. A hug, a hand on your shoulder or simply sitting close can bring you back into your body.",
          actions: [
            "Check in with yourself about what kinds of touch feel comforting and what feels too much.",
            "Create simple agreements about touch with your " +
              pWord +
              " or close people so you feel safe.",
            "Offer yourself grounding touch too — a hand on your own heart or a gentle stretch.",
          ],
        };
      case "gifts":
        return {
          text:
            "Thoughtful Gifts and symbols of care are meaningful to you. It is less about price and more about feeling remembered and considered.",
          actions: [
            "Notice what kinds of small gifts or gestures make you feel seen.",
            "Create one tiny ritual of gifting — a note, a flower, a photo — to people you love.",
            "Share with your " +
              pWord +
              " that small, meaningful gifts speak loudly to your heart.",
          ],
        };
      default:
        return {
          text:
            "You may resonate with more than one love language. This makes you sensitive and rich in how you connect. Your Soul Coach invites you to notice what consistently makes you feel calm, respected and alive.",
          actions: [
            "List the top three situations where you feel most loved and safe.",
            "Circle what these moments have in common — time, words, actions or touch.",
            "Let this become your personal compass when choosing where to invest your heart.",
          ],
        };
    }
  }

  function renderLoveCard(soul) {
    if (!ui.loveText || !ui.loveActions) return;
    const data = buildLoveCoaching(soul);

    ui.loveText.textContent = data.text || "";

    ui.loveActions.innerHTML = "";
    toArray(data.actions).forEach((item) => {
      const t = normaliseText(item);
      if (!t) return;
      const li = document.createElement("li");
      li.textContent = t;
      ui.loveActions.appendChild(li);
    });
  }

  function renderValuesCard(soul) {
    if (!ui.valuesText || !ui.valuesChips || !ui.valuesActions) return;

    const values = cleanList(
      soul.values || soul.coreValues || soul.priorities || []
    );
    const about = normaliseText(soul.about || soul.aboutMe);
    const cWord = connectionWord(mode);

    ui.valuesChips.textContent = "";
    if (values.length) {
      values.slice(0, 8).forEach((val) => {
        const span = document.createElement("span");
        span.className = "sc-pill sc-pill-soft";
        span.textContent = val;
        ui.valuesChips.appendChild(span);
      });
    }

    let text = "";
    if (values.length) {
      const joined =
        values.length === 1
          ? values[0]
          : values.slice(0, 3).join(", ") +
            (values.length > 3 ? "…" : "");
      text =
        "These values — " +
        joined +
        " — act like your inner compass. When they are respected, your whole body relaxes.";
    } else if (about) {
      text =
        "Even if you have not listed explicit values yet, the way you describe yourself already hints at what matters most. Your Soul Coach invites you to read your own words with kindness.";
    } else {
      text =
        "Your values and boundaries are the quiet map behind your choices. Naming them clearly will help you recognize which " +
        cWord +
        " truly support you.";
    }

    ui.valuesText.textContent = text;

    const actions = [];
    actions.push(
      "Write down 3–5 words that describe what you will not compromise on in " +
        cWord +
        "."
    );
    actions.push(
      "Notice which current " +
        cWord +
        " already honor these values and which ones drain you."
    );
    actions.push(
      "Practice saying one gentle boundary sentence, such as “I need more time to think about this.”"
    );

    ui.valuesActions.innerHTML = "";
    actions.forEach((a) => {
      const t = normaliseText(a);
      if (!t) return;
      const li = document.createElement("li");
      li.textContent = t;
      ui.valuesActions.appendChild(li);
    });
  }

  function renderEnergyCard(soul) {
    if (!ui.energyText || !ui.energyChips || !ui.energyActions) return;

    const hobbies = cleanList(
      soul.hobbies || soul.passions || soul.interests || []
    );

    ui.energyChips.textContent = "";
    if (hobbies.length) {
      hobbies.slice(0, 8).forEach((h) => {
        const span = document.createElement("span");
        span.className = "sc-pill sc-pill-soft";
        span.textContent = h;
        ui.energyChips.appendChild(span);
      });
    }

    let text = "";
    if (hobbies.length) {
      const few =
        hobbies.length === 1
          ? hobbies[0]
          : hobbies.slice(0, 3).join(", ") +
            (hobbies.length > 3 ? "…" : "");
      text =
        "Your energy refuels when you are close to what you love — like " +
        few +
        ". Treat these not as hobbies only, but as important rituals for your nervous system.";
    } else {
      text =
        "Even if you have not named specific hobbies yet, your body already knows what feels nourishing. Pay attention to the activities after which you feel calmer, clearer or more alive.";
    }

    ui.energyText.textContent = text;

    const actions = [];
    if (hobbies.length) {
      actions.push(
        "Choose one activity you enjoy and protect 20–30 minutes for it this week."
      );
      actions.push(
        "After doing it, notice how your body and mood feel before and after."
      );
      actions.push(
        "Share this joy with someone who feels safe, inviting them into your real world."
      );
    } else {
      actions.push(
        "Experiment with one small, kind ritual: a walk, stretching, music, journaling or tea in silence."
      );
      actions.push(
        "Notice which experiences gently recharge you rather than exhaust you."
      );
      actions.push(
        "Add at least one of these small rituals to your weekly rhythm."
      );
    }

    ui.energyActions.innerHTML = "";
    actions.forEach((a) => {
      const t = normaliseText(a);
      if (!t) return;
      const li = document.createElement("li");
      li.textContent = t;
      ui.energyActions.appendChild(li);
    });
  }

  function renderStepCard(soul) {
    if (!ui.stepText || !ui.stepHighlight) return;

    const primaryLove = pickPrimaryLoveLanguage(soul);
    const values = cleanList(
      soul.values || soul.coreValues || soul.priorities || []
    );
    const hobbies = cleanList(
      soul.hobbies || soul.passions || soul.interests || []
    );
    const cWord = connectionWord(mode);

    const oneValue = pickOne(values, "");
    const oneHobby = pickOne(hobbies, "");

    let paragraph =
      "Today does not need a big transformation. One gentle, honest step is enough.";
    let suggestion = "";

    if (primaryLove || oneValue || oneHobby) {
      suggestion = "Today’s suggestion: ";

      if (primaryLove) {
        suggestion +=
          "create one tiny moment that speaks your love language (" +
          primaryLove +
          ")";
        if (oneHobby) {
          suggestion +=
            " — perhaps by making time for " + oneHobby.toLowerCase();
        }
        suggestion += ".";
      } else if (oneValue) {
        suggestion +=
          "choose one action that respects your value of " +
          oneValue.toLowerCase() +
          ".";
      } else if (oneHobby) {
        suggestion +=
          "protect a small pocket of time just for " +
          oneHobby.toLowerCase() +
          ".";
      }

      if (!primaryLove && !oneValue && oneHobby) {
        paragraph =
          "Your joy matters. Even a short moment with something you enjoy can shift how you feel in your " +
          cWord +
          ".";
      }
    } else {
      suggestion =
        "Today’s suggestion: pause, place a hand on your heart, and ask quietly “What do I need right now?” Then honor the first kind answer that comes.";
    }

    ui.stepText.textContent = paragraph;
    ui.stepHighlight.textContent = suggestion;
  }

  function animateSectionsOnce() {
    if (!ui.page) return;
    if (prefersReducedMotion()) {
      ui.page.classList.add("sc-no-motion");
      return;
    }
    // Trigger CSS transitions
    window.requestAnimationFrame(function () {
      ui.page.classList.add("sc-animate");
    });
  }

  function renderAll() {
    const soul = soulData || {};
    mode = determineMode(soul);

    renderHero(soul);
    renderLoveCard(soul);
    renderValuesCard(soul);
    renderEnergyCard(soul);
    renderStepCard(soul);
  }

  // ===================== Init =====================

  function init() {
    try {
      soulData = safeGetSoulData();
      const hasData = hasMeaningfulData(soulData);

      if (!hasData) {
        if (ui.empty) ui.empty.hidden = false;
        if (ui.layout) ui.layout.hidden = true;
      } else {
        if (ui.empty) ui.empty.hidden = true;
        if (ui.layout) ui.layout.hidden = false;
        renderAll();
      }

      if (ui.refreshBtn) {
        ui.refreshBtn.addEventListener("click", function (event) {
          event.preventDefault();
          soulData = safeGetSoulData();
          if (hasMeaningfulData(soulData)) {
            if (ui.empty) ui.empty.hidden = true;
            if (ui.layout) ui.layout.hidden = false;
            renderAll();
          } else if (ui.empty) {
            ui.empty.hidden = false;
          }
        });
      }

      animateSectionsOnce();
    } catch (err) {
      console.error("Soul Coach: init failed", err);
      if (ui.empty) {
        ui.empty.hidden = false;
        ui.empty.textContent =
          "We could not load your Soul Coach data right now. Please refresh the page or try again later.";
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
