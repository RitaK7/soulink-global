// results.js — Soulink Results / Feedback / Snapshot / Export
// Šita versija pritaikyta prie dabartinio results.html:
//
//  Feedback blokas:
//    #fbStars   – žvaigždutės (JS sudeda automatiškai)
//    #fbEmail   – email (optional)
//    #fbMsg     – tekstas (būtinas)
//    #fbSend    – mygtukas
//    #fbToast   – mažas toast pranešimas (success/error)
//
//  Snapshot:
//    #me-name, #me-ct, #me-ll, #me-hobbies, #me-values
//
//  Settings:
//    #llWeight, #llw-label, #btnExport, #btnPrint
//
//  Match list:
//    #romantic, #friendship, #empty (šiuo metu tik tuščia būsena)

(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ===== Helpers =====

  function normaliseText(v) {
    return (v == null ? "" : String(v)).trim();
  }

  function toArray(v) {
    if (!v && v !== 0) return [];
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

  // Toast helper (naudoja #fbToast)
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
    // parodyti
    void el.offsetWidth; // reflow hack
    el.classList.add("show");

    // paslėpti po kelių sekundžių
    setTimeout(() => {
      el.classList.remove("show");
      el.classList.add("hide");
    }, 3000);
  }

  // ===== DOM cache =====

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
  };

  let soulSnapshot = {};
  let fbRating = 0;

  // ===== Snapshot =====

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

    // Love language
    const loveList = toArray(soul.loveLanguages || soul.loveLanguage || []);
    const primaryLove =
      normaliseText(soul.loveLanguage) || normaliseText(loveList[0]) || "";
    if (ui.meLl) ui.meLl.textContent = primaryLove || "—";

    // Hobbies & values
    const hobbies = toArray(soul.hobbies || soul.interests || []).map(normaliseText).filter(Boolean);
    const values = toArray(soul.values || []).map(normaliseText).filter(Boolean);

    if (ui.meHobbies) ui.meHobbies.textContent = hobbies.length ? hobbies.join(", ") : "—";
    if (ui.meValues) ui.meValues.textContent = values.length ? values.join(", ") : "—";
  }

  // ===== Feedback (stars + EmailJS) =====

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
        // update vizualiai
        $$("#fbStars button").forEach((b) => {
          const val = Number(b.dataset.value || "0");
          b.classList.toggle("active", val <= fbRating);
        });
      });
      ui.fbStars.appendChild(btn);
    }
  }

  function initFeedback() {
    if (!ui.fbSend || !ui.fbMsg) return;

    ui.fbSend.addEventListener("click", (ev) => {
      ev.preventDefault();

      const email = ui.fbEmail ? normaliseText(ui.fbEmail.value) : "";
      const msg = normaliseText(ui.fbMsg.value);
      const name =
        normaliseText(soulSnapshot.name) ||
        "Soulink user";

      if (!msg) {
        showToast(ui.fbToast, "Please enter your comments before sending.", "error");
        return;
      }

      // Jei EmailJS nėra – necrashinam, tik parodom sėkmę (vietinis feedback)
      const ready = tryInitEmailJs();
      if (!ready || typeof emailjs === "undefined" || typeof emailjs.send !== "function") {
        console.info("[Soulink Results] EmailJS not present, simulating success.");
        ui.fbMsg.value = "";
        showToast(ui.fbToast, "Thank you for your feedback! 💚", "success");
        return;
      }

      const templateParams = {
        from_name: name,
        from_email: email || "no-email-given",
        message: msg,
        rating: fbRating ? String(fbRating) : "not given",
        soul_love_language: normaliseText(soulSnapshot.loveLanguage),
        soul_connection_type: normaliseText(soulSnapshot.connectionType),
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

  // ===== Settings: weight + export + print/pdf =====

  function initSettings() {
    if (ui.llWeight && ui.llwLabel) {
      const updateLabel = () => {
        const v = Number(ui.llWeight.value || "1");
        ui.llwLabel.textContent = v.toFixed(1) + "×";
      };
      ui.llWeight.addEventListener("input", updateLabel);
      updateLabel();
    }

    if (ui.btnExport) {
      ui.btnExport.addEventListener("click", (ev) => {
        ev.preventDefault();
        try {
          const payload = {
            generatedAt: new Date().toISOString(),
            soul: soulSnapshot,
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

        // Jei html2pdf yra – bandome PDF, jei ne – window.print
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

  // ===== Matches (šiuo metu tik tuščia žinutė) =====

  function initMatches() {
    // Kol kas neatkūrinėjam suderinamumo logikos – paliekam draugišką "No friends yet".
    if (ui.empty) {
      ui.empty.style.display = "block";
    }
    // Jei ateityje skaitysim localStorage["soulink.friends.list"], čia bus renderis.
  }

  // ===== Init =====

  function init() {
    try {
      soulSnapshot = safeGetSoulData();
      renderSnapshot();
      initStars();
      initFeedback();
      initSettings();
      initMatches();
      // bandome iš anksto paruošti EmailJS (jei scriptas yra)
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
