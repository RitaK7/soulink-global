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

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const EMAILJS_PUBLIC_KEY = "SV7ptjuNI88paiVbz";
  const EMAILJS_SERVICE_ID = "service_ifo7026";
  const EMAILJS_TEMPLATE_ID = "template_99hg4ni";

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

  function listFromSoul(data, keys) {
    for (const key of keys) {
      if (!data) continue;
      if (Array.isArray(data[key])) return data[key].map((s) => normaliseText(s)).filter(Boolean);
      if (typeof data[key] === "string" && data[key].includes(",")) {
        return data[key]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (typeof data[key] === "string") {
        const v = normaliseText(data[key]);
        if (v) return [v];
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

    void el.offsetWidth;
    el.classList.add("show");

    setTimeout(() => {
      el.classList.remove("show");
      el.classList.add("hide");
    }, 3000);
  }

  const ui = {
    fbStars: $("#fbStars"),
    fbEmail: $("#fbEmail"),
    fbMsg: $("#fbMsg"),
    fbSend: $("#fbSend"),
    fbToast: $("#fbToast"),

    meName: $("#me-name"),
    meCt: $("#me-ct"),
    meLl: $("#me-ll"),
    meHobbies: $("#me-hobbies"),
    meValues: $("#me-values"),

    llWeight: $("#llWeight"),
    llwLabel: $("#llw-label"),
    btnExport: $("#btnExport"),
    btnPrint: $("#btnPrint"),

    romantic: $("#romantic"),
    friendship: $("#friendship"),
    empty: $("#empty"),
    topOverview: $("#topOverview"),
    insights: $("#insights"),
  };

  let soulSnapshot = {};
  let fbRating = 0;

  let baseMatches = [];

  let lastRenderedMatches = {
    romantic: [],
    friendship: [],
  };

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
      emailjs.init(EMAILJS_PUBLIC_KEY);
      emailJsReady = true;
    } catch (err) {
      console.warn("[Soulink Results] EmailJS init failed", err);
      emailJsReady = false;
    }
    return emailJsReady;
  }

  function applyStarUI() {
    $$("#fbStars button").forEach((b) => {
      const val = Number(b.dataset.value || "0");
      b.classList.toggle("active", val <= fbRating);
    });
  }

  function setRating(value) {
    fbRating = value;
    applyStarUI();
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

      const activate = (ev) => {
        if (ev && ev.type === "touchstart") {
          try { ev.preventDefault(); } catch (e) { /* ignore */ }
        }
        setRating(i);
      };

      btn.addEventListener("click", activate);
      btn.addEventListener("touchstart", activate, { passive: false });

      ui.fbStars.appendChild(btn);
    }
  }

  function initFeedback() {
    if (!ui.fbSend) return;

    const sendNow = (ev) => {
      if (ev) {
        if (ev.type === "touchstart") {
          try { ev.preventDefault(); } catch (e) { /* ignore */ }
        }
        try { ev.preventDefault(); } catch (e) { /* ignore */ }
      }

      const email = ui.fbEmail ? normaliseText(ui.fbEmail.value) : "";
      const msg = ui.fbMsg ? normaliseText(ui.fbMsg.value) : "";
      const name = normaliseText(soulSnapshot.name) || "Soulink user";

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
        applyStarUI();
        showToast(ui.fbToast, "Thank you for your feedback! 💚", "success");
        return;
      }

      // ✅ Build a single compact feedback string (EmailJS template uses {{feedback}})
      const stars = fbRating
        ? ("★".repeat(fbRating) + "☆".repeat(5 - fbRating))
        : "No rating";

      const userFeedback =
        `Rating: ${stars}\n` +
        `Email: ${email || "—"}\n` +
        `Message: ${msg || "—"}\n` +
        `Name: ${name || "—"}\n` +
        `Love language: ${normaliseText(soulSnapshot.loveLanguage) || "—"}\n` +
        `Type: ${normaliseText(soulSnapshot.connectionType) || "—"}\n` +
        `Submitted: ${new Date().toISOString()}`;

      const templateParams = {
        from_name: name,
        from_email: email || "no-email-given",
        message: msg || "(no comment provided, rating only)",
        rating: fbRating ? String(fbRating) : "not given",

        // ✅ IMPORTANT: your template uses {{feedback}} (subject + body)
        feedback: userFeedback,

        soul_love_language: normaliseText(soulSnapshot.loveLanguage),
        soul_connection_type: normaliseText(soulSnapshot.connectionType),
        submitted_at: new Date().toISOString(),
      };

      showToast(ui.fbToast, "Sending your feedback…", "info");

      emailjs
        .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(() => {
          if (ui.fbMsg) ui.fbMsg.value = "";
          if (ui.fbEmail) ui.fbEmail.value = "";
          fbRating = 0;
          applyStarUI();
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
    };

    ui.fbSend.addEventListener("click", sendNow);
    ui.fbSend.addEventListener("touchstart", sendNow, { passive: false });
  }

  function buildBaseMatches(soul) {
    const primaryLove = getPrimaryLoveLanguage(soul) || "Quality Time";
    const connectionType = normaliseText(soul.connectionType) || "Romantic love";

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
    const loveWeight = Number.isFinite(w) ? Math.max(0, Math.min(2, w)) : 1;

    const myLove = lower(getPrimaryLoveLanguage(soul));
    const theirLove = lower(match.loveLanguage);
    const loveLanguageMatch = myLove && theirLove && myLove === theirLove;

    const myHobbies = listFromSoul(soul, ["hobbies", "interests"]);
    const myValues = listFromSoul(soul, ["values"]);

    const theirHobbies = toArray(match.hobbies || []).map((s) => normaliseText(s)).filter(Boolean);
    const theirValues = toArray(match.values || []).map((s) => normaliseText(s)).filter(Boolean);

    const sharedHobbies = intersectStrings(myHobbies, theirHobbies);
    const sharedValues = intersectStrings(myValues, theirValues);

    const hobbyScore = Math.min(24, sharedHobbies.length * 8);
    const valueScore = Math.min(40, sharedValues.length * 10);
    const loveScore = loveLanguageMatch ? 36 * loveWeight : 8 * Math.max(0.25, loveWeight * 0.35);

    const raw = loveScore + valueScore + hobbyScore;
    const score = Math.max(0, Math.min(100, Math.round(raw)));

    const tags = [];
    if (loveLanguageMatch) tags.push("Same Love Language");
    if (sharedValues.length) tags.push(`${sharedValues.length} shared values`);
    if (sharedHobbies.length) tags.push(`${sharedHobbies.length} shared hobbies`);

    return {
      ...match,
      score,
      loveLanguageMatch: !!loveLanguageMatch,
      sharedValues,
      sharedHobbies,
      tags,
      initials: getInitials(match.name),
    };
  }

  function renderMatchCard(view) {
    const card = document.createElement("article");
    card.className = "r-card";
    card.setAttribute("data-id", view.id);
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Match ${view.name}, score ${view.score} percent`);

    const top = document.createElement("div");
    top.className = "r-card-top";

    const name = document.createElement("h4");
    name.className = "r-card-name";
    name.textContent = view.name;

    const score = document.createElement("div");
    score.className = "r-card-score";
    score.textContent = `${view.score}%`;

    top.appendChild(name);
    top.appendChild(score);

    const meta = document.createElement("p");
    meta.className = "r-card-meta";
    meta.textContent = view.connectionLabel || (view.kind === "friendship" ? "Friendship match" : "Romantic match");

    const tags = document.createElement("div");
    tags.className = "r-card-tags";
    (view.tags || []).slice(0, 3).forEach((t) => {
      const pill = document.createElement("span");
      pill.className = "r-tag";
      pill.textContent = t;
      tags.appendChild(pill);
    });

    card.appendChild(top);
    card.appendChild(meta);
    if (tags.childElementCount) card.appendChild(tags);

    const activate = () => {
      const lines = [];
      lines.push(`Match: ${view.name}`);
      if (view.kind === "friendship") lines.push("Mode: Friendship");
      else lines.push("Mode: Romantic");
      if (view.loveLanguage) lines.push(`Love Language: ${view.loveLanguage}`);
      if (view.sharedValues && view.sharedValues.length) lines.push(`Shared values: ${sentenceFromList(view.sharedValues)}`);
      if (view.sharedHobbies && view.sharedHobbies.length) lines.push(`Shared hobbies: ${sentenceFromList(view.sharedHobbies)}`);
      showToast(ui.fbToast, lines.join(" • "), "info");
    };

    card.addEventListener("click", activate);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });

    return card;
  }

  function updateMatches() {
    if (!ui.romantic || !ui.friendship) return;

    ui.romantic.innerHTML = "";
    ui.friendship.innerHTML = "";

    const weight = ui.llWeight ? Number(ui.llWeight.value || "1") : 1;

    const views = baseMatches.map((m) => computeMatchView(m, soulSnapshot, weight));
    const romanticViews = views.filter((v) => v.kind === "romantic").sort((a, b) => b.score - a.score);
    const friendshipViews = views.filter((v) => v.kind === "friendship").sort((a, b) => b.score - a.score);

    lastRenderedMatches.romantic = romanticViews;
    lastRenderedMatches.friendship = friendshipViews;

    romanticViews.forEach((v) => ui.romantic.appendChild(renderMatchCard(v)));
    friendshipViews.forEach((v) => ui.friendship.appendChild(renderMatchCard(v)));

    const totalMatches = romanticViews.length + friendshipViews.length;

    if (ui.empty) {
      ui.empty.style.display = totalMatches ? "none" : "";
    }

    if (ui.topOverview) {
      if (totalMatches) {
        ui.topOverview.textContent = `We tuned ${totalMatches} matches based on your love language, values, and hobbies.`;
      } else {
        ui.topOverview.textContent = "Once you start adding friends and connections, their matches will appear here.";
      }
    }

    if (ui.insights) {
      const loveMatches =
        romanticViews.filter((v) => v.loveLanguageMatch).length +
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
      ui.btnPrint.addEventListener("click", async (ev) => {
        ev.preventDefault();

        const target =
          document.querySelector(".results-page .page-inner") ||
          document.querySelector(".page-inner") ||
          document.querySelector("main") ||
          document.body;

        showToast(ui.fbToast, "Preparing PDF…", "info");

        const fallbackPrint = () => {
          showToast(ui.fbToast, "Opening print dialog… (Choose “Save as PDF”)", "info");
          try { window.print(); } catch (e) { /* ignore */ }
        };

        if (typeof html2pdf === "function") {
          try {
            const opt = {
              margin: 10,
              filename: "soulink-results.pdf",
              image: { type: "jpeg", quality: 0.98 },
              pagebreak: { mode: ["avoid-all", "css", "legacy"] },
              html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: "#003c43",
              },
              jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            };

            await new Promise((r) => setTimeout(r, 60));

            const job = html2pdf().set(opt).from(target).save();

            let finished = false;
            const guard = new Promise((_, rej) =>
              setTimeout(() => {
                if (!finished) rej(new Error("PDF download timed out"));
              }, 9000)
            );

            await Promise.race([
              Promise.resolve(job).then(() => { finished = true; }),
              guard,
            ]);

            showToast(ui.fbToast, "PDF saved ✅", "success");
          } catch (err) {
            console.error("[Soulink Results] html2pdf failed, fallback to print()", err);
            fallbackPrint();
          }
        } else {
          fallbackPrint();
        }
      });
    }
  }

  function init() {
    try {
      soulSnapshot = safeGetSoulData();
      renderSnapshot();
      initStars();
      initFeedback();
      initSettings();
      initMatches();
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
