/* Soulink Beta Access Guard – auth.js
 *
 * This file controls an optional "beta/password gate" for internal pages.
 * Right now BETA_MODE is set to false, which means:
 *   – NO pages are blocked,
 *   – The whole site is open for normal users.
 *
 * If in the future you want to re-enable the beta gate, just change:
 *   const BETA_MODE = false;
 * to:
 *   const BETA_MODE = true;
 */

const BETA_MODE = false; // <— beta/password gate is DISABLED globally

const BETA_LOGIN_PAGE = "login.html";

const PUBLIC_PAGES = new Set([
  "index.html",
  BETA_LOGIN_PAGE,
  "signup.html",
  "privacy.html",
  "terms.html",
  "404.html",
  "robots.txt",
  "sitemap.xml"
]);

function currentPageName() {
  try {
    const path = window.location.pathname.split("/").pop() || "index.html";
    // Strip query string and hash
    return path.toLowerCase().split("?")[0].split("#")[0] || "index.html";
  } catch {
    return "index.html";
  }
}

function isPublicPage() {
  // If beta mode is OFF – treat all pages as public
  if (!BETA_MODE) return true;
  return PUBLIC_PAGES.has(currentPageName());
}

function hasBetaAccess() {
  // If beta mode is OFF – always allow access
  if (!BETA_MODE) return true;
  return sessionStorage.getItem("soulinkBeta") === "true";
}

// Main guard – runs immediately when the script loads
(function enforceBetaAccess() {
  if (!BETA_MODE) return;      // beta disabled – do nothing
  if (isPublicPage()) return;  // public pages are always allowed

  if (!hasBetaAccess()) {
    try {
      sessionStorage.removeItem("soulinkBeta");
      sessionStorage.removeItem("soulinkBetaStartedAt");
      const page = currentPageName();
      const url = `${BETA_LOGIN_PAGE}?next=${encodeURIComponent(page)}`;
      window.location.replace(url);
    } catch {
      window.location.href = BETA_LOGIN_PAGE;
    }
  }
})();

// Shared logout helper – can be called from any page
window.soulinkLogout = function () {
  try {
    sessionStorage.removeItem("soulinkBeta");
    sessionStorage.removeItem("soulinkBetaStartedAt");
  } finally {
    window.location.replace(BETA_LOGIN_PAGE);
  }
};

// Simple beta session timeout (default 12h) – only used when BETA_MODE is true
(function sessionTimeout(hours = 12) {
  if (!BETA_MODE) return;             // when beta is disabled – do nothing
  if (!hasBetaAccess()) return;       // no active session – nothing to track

  const KEY = "soulinkBetaStartedAt";
  const now = Date.now();

  const started = Number(sessionStorage.getItem(KEY) || 0);
  if (!started) {
    sessionStorage.setItem(KEY, String(now));
  } else {
    const msLimit = hours * 60 * 60 * 1000;
    if (now - started > msLimit) {
      window.soulinkLogout();
    }
  }
})();
