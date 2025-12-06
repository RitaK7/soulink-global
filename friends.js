// friends.js — Soulink "Friends" page
// View-only: reads soul profile + saved friends and renders them.
// Never writes to localStorage (only reads soulink.friends.list).

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
      console.warn("Friends: failed to read soul data", err);
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
    if (normaliseText(soul.about) || normaliseText(soul.aboutMe)) return true;
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

  const FRIENDS_KEY = "soulink.friends.list";

  function safeGetFriendsList() {
    if (typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(FRIENDS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      console.warn("Friends: failed to read friends list", e);
      return [];
    }
  }

  function buildContactLink(contactRaw) {
    const c = normaliseText(contactRaw);
    if (!c) return null;

    const lower = c.toLowerCase();

    // Already a full link
    if (
      lower.startsWith("mailto:") ||
      lower.startsWith("http://") ||
      lower.startsWith("https://") ||
      lower.startsWith("tel:")
    ) {
      return { href: c, label: "Message" };
    }

    // Plain email
    if (c.includes("@") && !lower.includes("http://") && !lower.includes("https://")) {
      return { href: "mailto:" + c, label: "Email" };
    }

    // Instagram full URL
    if (lower.includes("instagram.com")) {
      let href = c;
      if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
        href = "https://" + c.replace(/^\/*/, "");
      }
      return { href, label: "Instagram" };
    }

    // Instagram handle: "ig:handle" or "@handle"
    if (lower.startsWith("ig:") || c[0] === "@") {
      let handle = c;
      if (lower.startsWith("ig:")) {
        handle = c.slice(3);
      }
      if (handle[0] === "@") {
        handle = handle.slice(1);
      }
      if (!handle) return null;
      return {
        href: "https://instagram.com/" + encodeURIComponent(handle),
        label: "Instagram",
      };
    }

    // Phone number
    const digitsOnly = c.replace(/[\s\-]/g, "");
    if (/^\+?\d{7,}$/.test(digitsOnly)) {
      return { href: "tel:" + digitsOnly, label: "Call" };
    }

    return null;
  }

  // ===================== DOM cache =====================

  const ui = {
    friendsEmpty: $("#friendsEmpty"),
    friendsList: $("#friendsList"),
    friendsUserName: $("#friendsUserName"),
    friendsUserConn: $("#friendsUserConn"),
    friendsUserLove: $("#friendsUserLove"),
  };

  // ===================== Rendering =====================

  function renderBaseSummary(soul) {
    if (ui.friendsUserName) {
      const name = normaliseText(soul.name);
      ui.friendsUserName.textContent = name || "beautiful soul";
    }

    if (ui.friendsUserConn) {
      const conn = normaliseText(soul.connectionType);
      ui.friendsUserConn.textContent = conn || "not set yet";
    }

    if (ui.friendsUserLove) {
      const love = pickPrimaryLoveLanguage(soul);
      ui.friendsUserLove.textContent = love || "not defined yet";
    }
  }

  function createFriendCard(friend, baseSoul) {
    const card = document.createElement("article");
    card.className = "glass-card friends-card";

    const header = document.createElement("header");
    header.className = "friends-card-header";

    const title = document.createElement("h3");
    title.className = "friends-card-title";
    title.textContent = normaliseText(friend.name) || "Soul friend";

    const subtitle = document.createElement("p");
    subtitle.className = "friends-card-subtitle";

    const conn = normaliseText(friend.connectionType);
    const love = pickPrimaryLoveLanguage(friend);
    const subtitleParts = [];
    if (conn) subtitleParts.push(conn);
    if (love) subtitleParts.push(love);
    subtitle.textContent = subtitleParts.join(" • ") || "Friendship connection";

    header.appendChild(title);
    header.appendChild(subtitle);

    const body = document.createElement("div");
    body.className = "friends-card-body";

    const baseValues = (baseSoul && baseSoul.values) || [];
    const baseHobbies =
      (baseSoul && (baseSoul.hobbies || baseSoul.interests)) || [];

    const friendValues = toArray(friend.values || []);
    const friendHobbies = toArray(friend.hobbies || friend.interests || []);

    const sharedValues = overlapList(baseValues, friendValues);
    const sharedHobbies = overlapList(baseHobbies, friendHobbies);

    if (sharedValues.length) {
      const row = document.createElement("div");
      row.className = "friends-chip-row";

      const labelSpan = document.createElement("span");
      labelSpan.className = "friends-chip-label";
      labelSpan.textContent = "Shared values:";
      row.appendChild(labelSpan);

      sharedValues.forEach((val) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = val;
        row.appendChild(chip);
      });

      body.appendChild(row);
    }

    if (sharedHobbies.length) {
      const row = document.createElement("div");
      row.className = "friends-chip-row";

      const labelSpan = document.createElement("span");
      labelSpan.className = "friends-chip-label";
      labelSpan.textContent = "Shared passions:";
      row.appendChild(labelSpan);

      sharedHobbies.forEach((h) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = h;
        row.appendChild(chip);
      });

      body.appendChild(row);
    }

    const snippet = document.createElement("p");
    snippet.className = "friends-snippet";

    const baseName = normaliseText(baseSoul && baseSoul.name) || "You";
    const friendName = normaliseText(friend.name) || "this soul";
    const firstValue = sharedValues[0];
    const firstHobby = sharedHobbies[0];

    let text = "";

    if (firstValue && firstHobby) {
      text =
        baseName +
        " and " +
        friendName +
        " both value " +
        firstValue +
        " and enjoy " +
        firstHobby +
        " — this friendship can feel naturally supportive and alive.";
    } else if (firstValue) {
      text =
        baseName +
        " and " +
        friendName +
        " share the value of " +
        firstValue +
        ", which gives your connection a deep sense of trust.";
    } else if (firstHobby) {
      text =
        baseName +
        " and " +
        friendName +
        " both enjoy " +
        firstHobby +
        ", making it easy to create gentle, shared moments together.";
    } else {
      text =
        "This soul sits in your circle for a reason — stay curious, honest and kind, and let the friendship reveal its own rhythm.";
    }

    snippet.textContent = text;
    body.appendChild(snippet);

    const contactLink = buildContactLink(friend.contact);
    if (contactLink) {
      const actions = document.createElement("div");
      actions.className = "friends-card-actions";

      const btn = document.createElement("a");
      btn.className = "friends-message-btn";
      btn.href = contactLink.href;
      btn.target = "_blank";
      btn.rel = "noopener noreferrer";
      btn.textContent = contactLink.label || "Message";

      actions.appendChild(btn);
      body.appendChild(actions);
    }

    card.appendChild(header);
    card.appendChild(body);
    return card;
  }

  function renderFriends(friendsArray, baseSoul) {
    if (!ui.friendsList) return;

    ui.friendsList.innerHTML = "";

    const friends = Array.isArray(friendsArray) ? friendsArray : [];
    if (!friends.length) {
      if (ui.friendsEmpty) {
        ui.friendsEmpty.hidden = false;
        ui.friendsEmpty.textContent =
          "No saved soul friends yet — you can use this space to remember the people who truly feel like your circle.";
      }
      return;
    }

    friends.forEach((friend) => {
      const card = createFriendCard(friend || {}, baseSoul || {});
      ui.friendsList.appendChild(card);
    });
  }

  // ===================== Init =====================

  function init() {
    try {
      const soul = safeGetSoulData();
      const hasSoul = hasAnyCoreData(soul);
      const friends = safeGetFriendsList();
      const hasFriends = Array.isArray(friends) && friends.length > 0;

      if (!hasSoul && !hasFriends) {
        if (ui.friendsEmpty) {
          ui.friendsEmpty.hidden = false;
          ui.friendsEmpty.textContent =
            "Please complete your Soulink Quiz and add at least one soul friend to see this space come alive.";
        }
        return;
      }

      if (ui.friendsEmpty) {
        ui.friendsEmpty.hidden = true;
      }

      if (hasSoul) {
        renderBaseSummary(soul);
      }

      renderFriends(friends, soul);
    } catch (err) {
      console.error("Friends: init failed", err);
      if (ui.friendsEmpty) {
        ui.friendsEmpty.hidden = false;
        ui.friendsEmpty.textContent =
          "We could not load your Friends data. Please refresh the page or try again later.";
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
