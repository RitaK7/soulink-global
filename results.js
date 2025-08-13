// results.js — Soulink (polished)
(() => {
  const PUBLIC_KEY  = "UYuKR_3UnPjeqJFL7";
  const SERVICE_ID  = "service_3j9h9ei";
  const TEMPLATE_ID = "template_99hg4ni";

  const form = document.getElementById("feedback-form");
  const sendBtn = document.getElementById("sendBtn");
  const statusEl = document.getElementById("feedback-status");
  const fb = document.getElementById("feedback");
  const counter = document.getElementById("fbCount");

  // --- tiny profile snapshot from localStorage
  const data = (() => {
    try { return JSON.parse(localStorage.getItem("soulQuiz") || "{}"); }
    catch { return {}; }
  })();

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || "–"; };
  set("r-name", data.name);
  set("r-ll", data.loveLanguage);
  set("r-ct", data.connectionType);
  set("r-bd", data.birthday);

  // --- rating stars UI
  const stars = Array.from(document.querySelectorAll("#ratingStars label"));
  const radios = Array.from(document.querySelectorAll('#ratingStars input[type="radio"]'));
  function highlight(value) {
    stars.forEach((lab, i) => lab.classList.toggle("active", i < value));
  }
  stars.forEach((lab, i) => {
    lab.addEventListener("click", () => {
      radios[i].checked = true;
      highlight(i + 1);
    });
  });
  // preselect 5 by default (optional)
  if (!radios.some(r => r.checked)) { radios[4].checked = true; highlight(5); }

  // --- character counter
  const updateCount = () => { if (counter && fb) counter.textContent = String(fb.value.length); };
  fb?.addEventListener("input", updateCount);
  updateCount();

  // --- submit
  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const rating = (document.querySelector('input[name="rating"]:checked') || {}).value || "";
    const templateParams = {
      user_email: (document.getElementById("user_email")?.value || "").trim(),
      page: document.getElementById("page")?.value || "result.html",
      rating,
      feedback: (fb?.value || "").trim()
    };

    // Basic checks (rating always set; feedback optional but nice)
    if (!rating) {
      alert("Please select a rating.");
      return;
    }

    // UI lock
    sendBtn.disabled = true;
    const prevText = sendBtn.textContent;
    sendBtn.textContent = "Sending…";
    if (statusEl) statusEl.textContent = "";

    // Send via EmailJS
    try {
      emailjs.init(PUBLIC_KEY); // safe if already called
    } catch(_) {}

    emailjs
      .send(SERVICE_ID, TEMPLATE_ID, templateParams)
      .then(() => {
        alert("Thank you! Your feedback has been sent.");
        if (statusEl) statusEl.textContent = "✓ Sent";
        form.reset();
        // restore default star
        radios.forEach(r => (r.checked = false));
        radios[4].checked = true; highlight(5);
        updateCount();
      })
      .catch((err) => {
        console.error("EmailJS send error:", err);
        alert("Sending failed. Please check your connection and try again.");
        if (statusEl) {
          statusEl.textContent =
            `✘ Send failed` +
            (err?.status ? ` (${err.status})` : "") +
            (err?.text ? `: ${err.text}` : "");
        }
      })
      .finally(() => {
        sendBtn.disabled = false;
        sendBtn.textContent = prevText;
      });
  });
})();
