// match.js — Soulink "Match Lab" page
// Read-only: uses current soul profile as base and compares to sample matches.

(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const $ = (sel, root = document) => root.querySelector(sel);

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
      console.warn("Match Lab: failed to read soul data", err);
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
    if (toArray(soul.loveLanguages || []).length) return true;
    if (toArray(soul.values || []).length) return true;
    if (toArray(soul.hobbies || soul.interests || []).length) return true;
    return false;
  }

  function pickPrimaryLoveLanguage(soul) {
    const primary = normaliseText(soul.loveLanguage);
    if (primary) return primary;
    const list = toArray(soul.loveLanguages || []);
    if (list.length) return normaliseText(list[0]);
    return "";
  }

  function normalisedSet(arr) {
    const set = new Set();
    toArray(arr).forEach((item) => {
      const norm = normaliseText(item).toLowerCase();
      if (norm) set.add(norm);
    });
    return set;
  }

  function overlapList(baseArr, otherArr) {
    const baseSet = normalisedSet(baseArr);
    const result = [];
    toArray(otherArr).forEach((item) => {
      const norm = normaliseText(item).toLowerCase();
      if (norm && baseSet.has(norm)) {
        result.push(normaliseText(item));
      }
    });
    return result;
  }

  // ===================== Sample Matches =====================

  const sampleMatches = [
    {
      id: "soul-aurora",
      name: "Aurora",
      connectionType: "Romantic",
      loveLanguage: "Quality Time",
      loveLanguages: ["Quality Time", "Words of Affirmation"],
      values: ["Honesty", "Loyalty", "Growth"],
      hobbies: ["Hiking", "Books", "Music"],
    },
    {
      id: "soul-leo",
      name: "Leo",
      connectionType: "Romantic",
      loveLanguage: "Physical Touch",
      loveLanguages: ["Physical Touch", "Acts of Service"],
      values: ["Passion", "Adventure", "Authenticity"],
      hobbies: ["Travel", "Dancing", "Cooking"],
    },
    {
      id: "soul-sage",
      name: "Sage",
      connectionType: "Friendship",
      loveLanguage: "Words of Affirmation",
      loveLanguages: ["Words of Affirmation", "Quality Time"],
      values: ["Honesty", "Curiosity", "Freedom"],
      hobbies: ["Podcasts", "Yoga", "Nature"],
    },
    {
      id: "soul-luna",
      name: "Luna",
      connectionType: "Romantic",
      loveLanguage: "Acts of Service",
      loveLanguages: ["Acts of Service", "Receiving Gifts"],
      values: ["Loyalty", "Kindness", "Family"],
      hobbies: ["Cooking", "Gardening", "Films"],
    },
    {
      id: "soul-river",
      name: "River",
      connectionType: "Friendship",
      loveLanguage: "Quality Time",
      loveLanguages: ["Quality Time", "Physical Touch"],
      values: ["Growth", "Spirituality", "Authenticity"],
      hobbies: ["Meditation", "Hiking", "Art"],
    },
    {
      id: "soul-nova",
      name: "Nova",
      connectionType: "Romantic",
      loveLanguage: "Receiving Gifts",
      loveLanguages: ["Receiving Gifts", "Acts of Service"],
      values: ["Creativity", "Freedom", "Joy"],
      hobbies: ["Art", "Design", "Music"],
    },
  ];

  // ===================== Compatibility =====================

  function computeCompatibility(baseSoul, candidate) {
    const baseConn = normaliseText(baseSoul.connectionType).toLowerCase();
    const candConn = normaliseText(candidate.connectionType).toLowerCase();

    const basePrimaryLove = pickPrimaryLoveLanguage(baseSoul);
    const candPrimaryLove = pickPrimaryLoveLanguage(candidate);

    const baseLoveSet = normalisedSet(
      toArray(baseSoul.loveLanguages || []).concat(basePrimaryLove)
    );
    const candLoveSet = normalisedSet(
      toArray(candidate.loveLanguages || []).concat(candPrimaryLove)
    );

    const baseValues = toArray(baseSoul.values || []);
    const candValues = toArray(candidate.values || []);
    const baseHobbies = toArray(baseSoul.hobbies || baseSoul.interests || []);
    const candHobbies = toArray(candidate.hobbies || candidate.interests || []);

    let points = 0;
    const maxPoints = 100;

    // Connection type (25 points)
    if (baseConn && candConn && baseConn === candConn) {
      points += 25;
    }

    // Love language (25 points)
    let loveMatch = false;
    if (baseLoveSet.size && candLoveSet.size) {
      for (const l of baseLoveSet) {
        if (candLoveSet.has(l)) {
          loveMatch = true;
          break;
        }
      }
    }
    if (loveMatch) {
      points += 25;
    }

    // Values overlap (up to 30 points, 5 per shared, max 6)
    const sharedValues = overlapList(baseValues, candValues);
    const valuePoints = Math.min(sharedValues.length, 6) * 5;
    points += valuePoints;

    // Hobbies overlap (up to 20 points, 5 per shared, max 4)
    const sharedHobbies = overlapList(baseHobbies, candHobbies);
    const hobbyPoints = Math.min(sharedHobbies.length, 4) * 5;
    points += hobbyPoints;

    if (points < 0) points = 0;
    if (points > maxPoints) points = maxPoints;

    return {
      score: Math.round(points),
      sharedValues,
      sharedHobbies,
      loveMatch,
    };
  }

  // ===================== DOM cache =====================

  const ui = {
    matchEmpty: $("#matchEmpty"),
    matchList: $("#matchList"),
    matchUserName: $("#matchUserName"),
    matchUserConn: $("#matchUserConn"),
    matchUserLove: $("#matchUserLove"),
  };

  // ===================== Rendering =====================

  function renderBaseSummary(soul) {
    if (ui.matchUserName) {
      const name = normaliseText(soul.name);
      ui.matchUserName.textContent = name || "beautiful soul";
    }

    if (ui.matchUserConn) {
      const conn = normaliseText(soul.connectionType);
      ui.matchUserConn.textContent = conn || "not set yet";
    }

    if (ui.matchUserLove) {
      const love = pickPrimaryLoveLanguage(soul);
      ui.matchUserLove.textContent = love || "not defined yet";
    }
  }

  function createMatchCard(candidate, details, baseSoul) {
    const card = document.createElement("article");
    card.className = "glass-card match-card";

    const header = document.createElement("header");
    header.className = "match-card-header";

    const title = document.createElement("h3");
    title.className = "match-card-title";
    title.textContent = candidate.name;

    const label = document.createElement("p");
    label.className = "match-card-subtitle";

    const connLabel = normaliseText(candidate.connectionType);
    const loveLabel = pickPrimaryLoveLanguage(candidate);
    const subtitleParts = [];
    if (connLabel) subtitleParts.push(connLabel);
    if (loveLabel) subtitleParts.push(loveLabel);
    label.textContent = subtitleParts.join(" • ") || "Soul connection";

    const scorePill = document.createElement("span");
    scorePill.className = "match-score-pill";
    scorePill.textContent = details.score + "% match";

    header.appendChild(title);
    header.appendChild(label);
    header.appendChild(scorePill);

    const body = document.createElement("div");
    body.className = "match-card-body";

    if (details.sharedValues && details.sharedValues.length) {
      const block = document.createElement("div");
      block.className = "match-chip-row";

      const labelSpan = document.createElement("span");
      labelSpan.className = "match-chip-label";
      labelSpan.textContent = "Shared values:";

      block.appendChild(labelSpan);

      details.sharedValues.forEach((val) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = val;
        block.appendChild(chip);
      });

      body.appendChild(block);
    }

    if (details.sharedHobbies && details.sharedHobbies.length) {
      const block = document.createElement("div");
      block.className = "match-chip-row";

      const labelSpan = document.createElement("span");
      labelSpan.className = "match-chip-label";
      labelSpan.textContent = "Shared passions:";

      block.appendChild(labelSpan);

      details.sharedHobbies.forEach((h) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = h;
        block.appendChild(chip);
      });

      body.appendChild(block);
    }

    const snippet = document.createElement("p");
    snippet.className = "match-snippet";

    const baseName = normaliseText(baseSoul.name) || "You";
    const firstValue = details.sharedValues[0];
    const firstHobby = details.sharedHobbies[0];

    let text = "";

    if (firstValue && firstHobby) {
      text =
        baseName +
        " and " +
        candidate.name +
        " both value " +
        firstValue +
        " and enjoy " +
        firstHobby +
        " — this could feel like a naturally aligned, heart-based connection.";
    } else if (firstValue) {
      text =
        baseName +
        " and " +
        candidate.name +
        " share the value of " +
        firstValue +
        ", which gives your connection a strong emotional foundation.";
    } else if (firstHobby) {
      text =
        baseName +
        " and " +
        candidate.name +
        " both enjoy " +
        firstHobby +
        ", making it easy to create warm, shared moments together.";
    } else if (details.loveMatch) {
      text =
        "Your love languages resonate, so small gestures could feel deeply understood between you.";
    } else {
      text =
        "Even without many obvious overlaps, curiosity and honest communication can reveal beautiful layers between you.";
    }

    snippet.textContent = text;
    body.appendChild(snippet);

    card.appendChild(header);
    card.appendChild(body);
    return card;
  }

  function renderMatches(baseSoul) {
    if (!ui.matchList) return;

    ui.matchList.innerHTML = "";

    const matchesWithScores = sampleMatches.map((candidate) => {
      const details = computeCompatibility(baseSoul, candidate);
      return { candidate, details };
    });

    matchesWithScores.sort((a, b) => b.details.score - a.details.score);

    matchesWithScores.forEach(({ candidate, details }) => {
      const card = createMatchCard(candidate, details, baseSoul);
      ui.matchList.appendChild(card);
    });
  }

  // ===================== Init =====================

  function init() {
    try {
      const soul = safeGetSoulData();
      const hasData = hasAnyCoreData(soul);

      if (!hasData) {
        if (ui.matchEmpty) {
          ui.matchEmpty.hidden = false;
          ui.matchEmpty.textContent =
            "Please complete your Soulink Quiz and Edit Profile to unlock Match Lab.";
        }
        return;
      }

      if (ui.matchEmpty) {
        ui.matchEmpty.hidden = true;
      }

      renderBaseSummary(soul);
      renderMatches(soul);
    } catch (err) {
      console.error("Match Lab: init failed", err);
      if (ui.matchEmpty) {
        ui.matchEmpty.hidden = false;
        ui.matchEmpty.textContent =
          "We could not load your Match Lab data. Please refresh the page or try again later.";
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
