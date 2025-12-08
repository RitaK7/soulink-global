// results.js — Soulink Results / Feedback / Snapshot / Matches / Export / Print
//
// This version is aligned with results.html and the shared Soulink architecture:
//
//  Feedback block:
//    #fbStars   – star buttons (1–5), rendered by JS
//    #fbEmail   – email (optional)
//    #fbMsg     – textarea (optional, but required if no rating)
//    #fbSend    – "Send Feedback" button
//    #fbToast   – toast message (success / error / info)
//
//  Snapshot:
//    #me-name, #me-ct, #me-ll, #me-hobbies, #me-values
//
//  Settings:
//    #llWeight    – range slider [0.0–2.0]
//    #llw-label   – label showing current multiplier (“1.3×”)
//    #btnExport   – export results JSON
//    #btnPrint    – print / save PDF
//
//  Matches:
//    #romantic, #friendship – containers for rendered cards
//    #empty                 – empty-state text
//    #topOverview, #insights – overview / insight sentences
//
// Data source:
//   Uses data-helpers.js (getSoulData) when available; otherwise falls back to
//   localStorage["soulink.soulQuiz"] / "soulQuiz" for backward compatibility.

(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // ----- Tiny DOM helpers -----
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ----- Generic helpers -----

  function normaliseText(v) {
    return (v == null ? "" : String(v)).trim();
  }

  function toArray(v) {
    if (!v && v !== 0) return [];
    return Array.isArray(v) ? v : [v];
  }

  function lower(v) {
    return normaliseText(v).toLowerCase();
  }

  function safeGetSoulData() {
    let data = {};
    try {
      if (typeof getSoulData === "function") {
        try {
          // preferred path if helper supports ensureShape
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
      console.warn("[Soulink Results] failed to read soul data", err);
      data = {};
    }
    if (!data || typeof data !== "object") return {};
    return data;
  }

  function hasAnyCoreData(data) {
    if (!data || typeof data !== "object") return false;
    if (normaliseText(data.name)) return true;
    if (normaliseText(data.connectionType)) return true;
    if (normaliseText(data.loveLanguage)) return true;
    if (toArray(data.loveLanguages || data.loveLanguage || []).length) return true;
    if (toArray(data.hobbies || data.interests || []).length) return true;
    if (toArray(data.values || []).length) return true;
    if (normaliseText(data.about || data.aboutMe)) return true;
    return false;
  }

  function listFromSoul(data, keyCandidates) {
    for (const key of keyCandidates) {
      if (Array.isArray(data[key])) return data[key];
      if (typeof data[key] === "string" && data[key].includes(",")) {
        return data[key]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    return [];
  }

  function getPrimaryLoveLanguage(soul) {
    const list = toArray(soul.loveLanguages || soul.loveLanguage || []);
    const fromField = normaliseText(soul.loveLanguage);
    if (fromField) return fromField;
    if (list.length) return normaliseText(list[0]);
    return "";
  }

  function intersectStrings(aList, bList) {
    const aNorm = aList.map((v) => ({ norm: lower(v), raw: v }));
    const bNorm = bList.map((v) => ({ norm: lower(v), raw: v }));
    const result = [];
    for (const av of aNorm) {
      const found = bNorm.find((bv) => bv.norm === av.norm);
      if (found) {
        result.push(found.raw);
      }
    }
    return result;
  }

  function getInitials(name) {
    const parts = normaliseText(name).split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function sentenceFromList(items) {
    if (!items || !items.length) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    const last = items[items.length - 1];
    const rest = items.slice(0, -1).join(", ");
    return `${rest}, and ${last}`;
  }

  // Toast helper (uses #fbToast)
  function showToast(el, message, tone) {
    if (!el) {
      console.log("[Soulink Results toast]", message);
      return;
    }
    el.textContent = message || "";
    el.hidden = false;
    el.classList.remove("is-error", "is-success", "is-info", "show", "hide");

    if (tone === "error") el.classList.add("is-error");
    else if (tone === "success") el.classList.add("is-success");
    else if (tone === "info") el.classList.add("is-info");

    // Trigger reflow + show
    void el.offsetWidth;
    el.classList.add("show");

    // Hide after a few seconds
    setTimeout(() => {
      el.classList.remove("show");
      el.classList.add("hide");
    }, 3000);
  }

  // ----- DOM cache -----

  const ui = {
    // feedback
    fbStars: $("#fbStars"),
    fbEmail: $("#fbEmail"),
    fbMsg: $("#fbMsg"),
    fbSend: $("#fbSend"),
    fbToast: $("#fbToast"),

    // snapshot
    meName: $("#me-name"),
    meCt: $("#me-ct"),
    meLl: $("#me-ll"),
    meHobbies: $("#me-hobbies"),
    meValues: $("#me-values"),

    // settings
    llWeight: $("#llWeight"),
    llwLabel: $("#llw-label"),
    btnExport: $("#btnExport"),
    btnPrint: $("#btnPrint"),

    // matches
    romantic: $("#romantic"),
    friendship: $("#friendship"),
    empty: $("#empty"),
    topOverview: $("#topOverview"),
    insights: $("#insights"),
  };

  // ----- State -----

  let soulSnapshot = {};
  let fbRating = 0;

  /** Base match profiles (without scores). Will be derived from soul data. */
  let baseMatches = [];

  /** Last rendered matches with scores, for export. */
  let lastRenderedMatches = {
    romantic: [],
    friendship: [],
  };

  // ----- Snapshot rendering -----

  function renderSnapshot() {
    const soul = soulSnapshot;
    const hasData = hasAnyCoreData(soul);

    if (!hasData) {
      if (ui.meName) ui.meName.textContent = "—";
      if (ui.meCt) ui.meCt.textContent = "—";
      if (ui.meLl) ui.meLl.textContent = "—";
      if (ui.meHobbies) ui.meHobbies.textContent = "—";
      if (ui.meValues) ui.meValues.textContent = "—";
      return;
    }

    if (ui.meName) ui.meName.textContent = normaliseText(soul.name) || "—";
    if (ui.meCt) ui.meCt.textContent = normaliseText(soul.connectionType) || "—";

    const primaryLove = getPrimaryLoveLanguage(soul);
    if (ui.meLl) ui.meLl.textContent = primaryLove || "—";

    const hobbies = listFromSoul(soul, ["hobbies", "interests"]);
    const values = listFromSoul(soul, ["values"]);

    if (ui.meHobbies) ui.meHobbies.textContent = hobbies.length ? hobbies.join(", ") : "—";
    if (ui.meValues) ui.meValues.textContent = values.length ? values.join(", ") : "—";
  }

  // ----- Feedback (stars + EmailJS) -----

  let emailJsReady = false;
  let emailJsInitTried = false;

  function tryInitEmailJs() {
    if (emailJsInitTried) return emailJsReady;
    emailJsInitTried = true;

    if (typeof emailjs === "undefined" || !emailjs || typeof emailjs.init !== "function") {
      console.warn("[Soulink Results] EmailJS not available on this page.");
      emailJsReady = false;
      return false;
    }
    try {
      emailjs.init("UYuKR_3UnPjeqJFL7");
      emailJsReady = true;
    } catch (err) {
      console.warn("[Soulink Results] EmailJS init failed", err);
      emailJsReady = false;
    }
    return emailJsReady;
  }

  function initStars() {
    if (!ui.fbStars) return;
    ui.fbStars.innerHTML = "";

    const maxStars = 5;
    for (let i = 1; i <= maxStars; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.setAttribute("aria-label", `Rate ${i} out of 5`);
      btn.dataset.value = String(i);
      btn.textContent = "★";
      btn.addEventListener("click", () => {
        fbRating = i;
        // visual state
        $$("#fbStars button").forEach((b) => {
          const val = Number(b.dataset.value || "0");
          b.classList.toggle("active", val <= fbRating);
        });
      });
      ui.fbStars.appendChild(btn);
    }
  }

  function initFeedback() {
    if (!ui.fbSend) return;

    ui.fbSend.addEventListener("click", (ev) => {
      ev.preventDefault();

      const email = ui.fbEmail ? normaliseText(ui.fbEmail.value) : "";
      const msg = ui.fbMsg ? normaliseText(ui.fbMsg.value) : "";
      const name = normaliseText(soulSnapshot.name) || "Soulink user";

      // Validation: at least a star OR a comment
      if (!fbRating && !msg) {
        showToast(
          ui.fbToast,
          "Please add a star rating or a quick comment before sending.",
          "error"
        );
        return;
      }

      const ready = tryInitEmailJs();
      if (!ready || typeof emailjs === "undefined" || typeof emailjs.send !== "function") {
        console.info("[Soulink Results] EmailJS not present, simulating success.");
        if (ui.fbMsg) ui.fbMsg.value = "";
        if (ui.fbEmail) ui.fbEmail.value = "";
        fbRating = 0;
        $$("#fbStars button").forEach((b) => b.classList.remove("active"));
        showToast(ui.fbToast, "Thank you for your feedback! 💚", "success");
        return;
      }

      const templateParams = {
        from_name: name,
        from_email: email || "no-email-given",
        message: msg || "(no comment provided, rating only)",
        rating: fbRating ? String(fbRating) : "not given",
        soul_love_language: normaliseText(soulSnapshot.loveLanguage),
        soul_connection_type: normaliseText(soulSnapshot.connectionType),
        submitted_at: new Date().toISOString(),
      };

      showToast(ui.fbToast, "Sending your feedback…", "info");

      emailjs
        .send("service_3j9h9ei", "template_99hg4ni", templateParams)
        .then(() => {
          if (ui.fbMsg) ui.fbMsg.value = "";
          if (ui.fbEmail) ui.fbEmail.value = "";
          fbRating = 0;
          $$("#fbStars button").forEach((b) => b.classList.remove("active"));
          showToast(ui.fbToast, "Thank you for your feedback! 💚", "success");
        })
        .catch((err) => {
          console.error("[Soulink Results] feedback send failed", err);
          showToast(
            ui.fbToast,
            "We could not send your feedback right now. Please try again later.",
            "error"
          );
        });
    });
  }

  // ----- Matches: generation, scoring, rendering -----

  function buildBaseMatches(soul) {
    const primaryLove = getPrimaryLoveLanguage(soul) || "Quality Time";
    const connectionType = normaliseText(soul.connectionType) || "Romantic love";

    // Simple demo set – tuned slightly by user's primary love language
    return [
      {
        id: "rom-1",
        kind: "romantic",
        name: "Luna V.",
        connectionLabel: "Deep romantic match",
        loveLanguage: primaryLove,
        hobbies: ["travel", "music", "deep talks"],
        values: ["honesty", "loyalty"],
        about: "Loves late-night conversations and cozy weekends.",
        contact: "mailto:luna@example.com",
      },
      {
        id: "rom-2",
        kind: "romantic",
        name: "Kai R.",
        connectionLabel: connectionType || "Romantic partner",
        loveLanguage: "Physical Touch",
        hobbies: ["fitness", "nature", "dance"],
        values: ["authenticity", "stability"],
        about: "Grounded soul who enjoys nature and gentle affection.",
        contact: "",
      },
      {
        id: "rom-3",
        kind: "romantic",
        name: "Mia S.",
        connectionLabel: "Soulful connection",
        loveLanguage: "Words of Affirmation",
        hobbies: ["writing", "art", "reading"],
        values: ["kindness", "growth"],
        about: "Creative spirit who thrives on honest communication.",
        contact: "",
      },
      {
        id: "fri-1",
        kind: "friendship",
        name: "Noah T.",
        connectionLabel: "Soul friend",
        loveLanguage: "Quality Time",
        hobbies: ["coffee chats", "movies", "board games"],
        values: ["loyalty", "humor"],
        about: "The kind of friend who shows up and stays.",
        contact: "https://instagram.com/noah",
      },
      {
        id: "fri-2",
        kind: "friendship",
        name: "Aria L.",
        connectionLabel: "Creative buddy",
        loveLanguage: "Acts of Service",
        hobbies: ["projects", "learning", "volunteering"],
        values: ["growth", "empathy"],
        about: "Loves building meaningful things with people.",
        contact: "",
      },
    ];
  }

  function computeMatchView(match, soul, weight) {
    const w = Number(weight);
    const loveWeight = Number.isFinite(w) ? Math.max(0, Math.min(w, 2)) : 1;

    const soulValues = listFromSoul(soul, ["values"]);
    const soulHobbies = listFromSoul(soul, ["hobbies", "interests"]);

    const mValues = toArray(match.values || []);
    const mHobbies = toArray(match.hobbies || []);

    const sharedValues = intersectStrings(soulValues, mValues);
    const sharedHobbies = intersectStrings(soulHobbies, mHobbies);

    const soulLove = lower(getPrimaryLoveLanguage(soul));
    const matchLove = lower(match.loveLanguage || "");
    const loveMatch = !!soulLove && !!matchLove && soulLove === matchLove;

    let score = 30;

    const valuesCount = Math.min(sharedValues.length, 4);
    const hobbiesCount = Math.min(sharedHobbies.length, 4);

    score += valuesCount * 7;
    score += hobbiesCount * 4;

    if (loveMatch) {
      score += 20 * loveWeight;
    }

    // Soft clamp
    if (score > 99) score = 99;
    if (score < 5) score = 5;

    const roundedScore = Math.round(score);

    // Explanation
    const parts = [];
    if (loveMatch) {
      parts.push("You share the same primary love language.");
    }
    if (sharedValues.length) {
      parts.push(`You both value ${sentenceFromList(sharedValues)}.`);
    }
    if (sharedHobbies.length) {
      parts.push(`You can connect over ${sentenceFromList(sharedHobbies)}.`);
    }
    if (!parts.length) {
      parts.push("Good energetic fit based on your Soulprint.");
    }

    return {
      id: match.id,
      kind: match.kind, // "romantic" | "friendship"
      name: match.name,
      connectionLabel: match.connectionLabel || "",
      loveLanguage: match.loveLanguage || "",
      score: roundedScore,
      sharedValues,
      sharedHobbies,
      explanation: parts.join(" "),
      contact: match.contact || "",
      avatarUrl: match.avatarUrl || "",
      loveLanguageMatch: loveMatch,
    };
  }

  function createMatchCard(view) {
    const card = document.createElement("article");
    card.className = "card sl-card";

    // Score badge
    const scoreBadge = document.createElement("div");
    scoreBadge.className = "score-badge";
    const scoreSpan = document.createElement("span");
    scoreSpan.className = "score-pill";
    scoreSpan.textContent = `${view.score}%`;
    scoreBadge.appendChild(scoreSpan);
    card.appendChild(scoreBadge);

    // Head: avatar + name + subline
    const head = document.createElement("div");
    head.className = "sl-head";

    const avatar = document.createElement("div");
    avatar.className = "sl-avatar";
    if (view.avatarUrl) {
      const img = document.createElement("img");
      img.src = view.avatarUrl;
      img.alt = view.name || "Match avatar";
      avatar.appendChild(img);
    } else {
      avatar.textContent = getInitials(view.name);
    }

    const headText = document.createElement("div");
    const nameEl = document.createElement("div");
    nameEl.className = "sl-name";
    nameEl.textContent = view.name;

    const subEl = document.createElement("div");
    subEl.className = "sl-sub";
    const connectionLabel = view.connectionLabel || (view.kind === "friendship" ? "Friendship" : "Romantic");
    const loveLabel = view.loveLanguage || "Love Language";
    subEl.textContent = `${connectionLabel} • ${loveLabel}`;

    headText.appendChild(nameEl);
    headText.appendChild(subEl);

    head.appendChild(avatar);
    head.appendChild(headText);
    card.appendChild(head);

    // Badges
    const badges = document.createElement("div");
    badges.className = "sl-badges";

    if (view.sharedValues && view.sharedValues.length) {
      view.sharedValues.forEach((val) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = val;
        badges.appendChild(chip);
      });
    }

    if (view.sharedHobbies && view.sharedHobbies.length) {
      view.sharedHobbies.forEach((hob) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = hob;
        badges.appendChild(chip);
      });
    }

    if (badges.children.length) {
      card.appendChild(badges);
    }

    // Explanation
    const p = document.createElement("p");
    p.textContent = view.explanation;
    card.appendChild(p);

    // Actions
    const actions = document.createElement("div");
    actions.className = "sl-actions";

    if (view.contact) {
      const a = document.createElement("a");
      a.className = "btn";
      a.textContent = "Message";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.href = view.contact;
      actions.appendChild(a);
    }

    if (actions.children.length) {
      card.appendChild(actions);
    }

    return card;
  }

  function updateMatches() {
    if (!ui.romantic || !ui.friendship) return;

    const weight = ui.llWeight ? Number(ui.llWeight.value || "1") : 1;

    const romanticViews = [];
    const friendshipViews = [];

    baseMatches.forEach((m) => {
      const view = computeMatchView(m, soulSnapshot, weight);
      if (m.kind === "friendship") friendshipViews.push(view);
      else romanticViews.push(view);
    });

    romanticViews.sort((a, b) => b.score - a.score);
    friendshipViews.sort((a, b) => b.score - a.score);

    lastRenderedMatches = {
      romantic: romanticViews,
      friendship: friendshipViews,
    };

    ui.romantic.innerHTML = "";
    ui.friendship.innerHTML = "";

    romanticViews.forEach((view) => ui.romantic.appendChild(createMatchCard(view)));
    friendshipViews.forEach((view) => ui.friendship.appendChild(createMatchCard(view)));

    const totalMatches = romanticViews.length + friendshipViews.length;
    if (ui.empty) {
      ui.empty.style.display = totalMatches ? "none" : "block";
    }

    // Overview and insights
    if (ui.topOverview) {
      if (totalMatches) {
        ui.topOverview.textContent = `We tuned ${totalMatches} matches based on your love language, values, and hobbies.`;
      } else {
        ui.topOverview.textContent = "Once you start adding friends and connections, their matches will appear here.";
      }
    }

    if (ui.insights) {
      const loveMatches = romanticViews.filter((v) => v.loveLanguageMatch).length +
        friendshipViews.filter((v) => v.loveLanguageMatch).length;

      if (totalMatches && loveMatches) {
        ui.insights.textContent =
          `You share the same primary love language with ${loveMatches} of your matches. ` +
          `Use the Love Language Weight slider to see how strongly this shapes your scores.`;
      } else if (totalMatches) {
        ui.insights.textContent =
          "Your matches are currently driven more by shared values and hobbies than by love language.";
      } else {
        ui.insights.textContent = "";
      }
    }
  }

  function initMatches() {
    baseMatches = buildBaseMatches(soulSnapshot);
    updateMatches();
  }

  // ----- Settings: weight + export + print/pdf -----

  function initSettings() {
    if (ui.llWeight && ui.llwLabel) {
      const updateLabelAndMatches = () => {
        const v = Number(ui.llWeight.value || "1");
        const clamped = Number.isFinite(v) ? Math.max(0, Math.min(2, v)) : 1;
        ui.llwLabel.textContent = clamped.toFixed(1) + "×";
        updateMatches();
      };
      ui.llWeight.addEventListener("input", updateLabelAndMatches);
      updateLabelAndMatches();
    }

    if (ui.btnExport) {
      ui.btnExport.addEventListener("click", (ev) => {
        ev.preventDefault();
        try {
          const payload = {
            generatedAt: new Date().toISOString(),
            settings: {
              loveLanguageWeight: ui.llWeight ? Number(ui.llWeight.value || "1") : 1,
            },
            soul: soulSnapshot,
            matches: lastRenderedMatches,
          };
          const json = JSON.stringify(payload, null, 2);
          const blob = new Blob([json], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "soulink-results.json";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error("[Soulink Results] export JSON failed", err);
          showToast(ui.fbToast, "Could not export JSON. Please try again.", "error");
        }
      });
    }

    if (ui.btnPrint) {
      ui.btnPrint.addEventListener("click", (ev) => {
        ev.preventDefault();

        const main = document.querySelector("main") || document.body;

        if (typeof html2pdf === "function") {
          try {
            const opt = {
              margin: 10,
              filename: "soulink-results.pdf",
              image: { type: "jpeg", quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            };
            html2pdf().set(opt).from(main).save();
          } catch (err) {
            console.error("[Soulink Results] html2pdf failed, fallback to print()", err);
            window.print();
          }
        } else {
          window.print();
        }
      });
    }
  }

  // ----- Init -----

  function init() {
    try {
      soulSnapshot = safeGetSoulData();
      renderSnapshot();
      initStars();
      initFeedback();
      initSettings();
      initMatches();
      // prepare EmailJS if script is present
      tryInitEmailJs();
    } catch (err) {
      console.error("[Soulink Results] init failed", err);
      showToast(ui.fbToast, "Something went wrong. Please refresh the page.", "error");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
