/* Soulink Beta Access Guard – auth.js
   Naudoja sessionStorage raktą "soulinkBeta" (true) po sėkmingo login.
   Jei rakto nėra – meta į login/index.
*/

// ✅ Nustatyk savo login puslapio kelią (pakeisk jei reikia)
// LOGIN puslapis:
const BETA_LOGIN_PAGE = "beta-login.html";

// PUSLAPIAI, kurie neprivalo beta rakto:
const PUBLIC_PAGES = new Set([
  "index.html",        // 👈 paliekam viešą Home
  BETA_LOGIN_PAGE,     // 👈 login visada viešas
  "privacy.html",
  "terms.html",
  "404.html",
  "robots.txt",
  "sitemap.xml"
]);

// Helper: gauti dabartinį failo pavadinimą (be query/hash)
function currentPageName() {
  try {
    const path = window.location.pathname.split("/").pop() || "index.html";
    return path.toLowerCase();
  } catch {
    return "index.html";
  }
}

// Ar puslapis viešas?
function isPublicPage() {
  return PUBLIC_PAGES.has(currentPageName());
}

// Ar prisijungęs prie beta?
function hasBetaAccess() {
  return sessionStorage.getItem("soulinkBeta") === "true";
}

// Priverstinis patikrinimas ir nukreipimas
(function enforceBetaAccess() {
  if (isPublicPage()) return;
  if (!hasBetaAccess()) {
    try {
      // Apsauga: išvalyk bet kokias apėjimo būsenas
      sessionStorage.removeItem("soulinkBeta");
      // Peradresuok į login
      window.location.replace(BETA_LOGIN_PAGE);
    } catch {
      window.location.href = BETA_LOGIN_PAGE;
    }
  }
})();

// 🔓 Logout util (naudok iš bet kurio puslapio)
window.soulinkLogout = function () {
  try {
    sessionStorage.removeItem("soulinkBeta");
  } finally {
    window.location.replace(BETA_LOGIN_PAGE);
  }
};

// ⏳ (Pasirinktinai) laiko limitas sesijai – pvz., 12 val.
(function sessionTimeout(hours = 12) {
  const KEY = "soulinkBetaStartedAt";
  const now = Date.now();
  if (!hasBetaAccess()) return;
  const started = Number(sessionStorage.getItem(KEY) || 0);
  if (!started) sessionStorage.setItem(KEY, String(now));
  else {
    const msLimit = hours * 60 * 60 * 1000;
    if (now - started > msLimit) {
      window.soulinkLogout();
    }
  }
})();
