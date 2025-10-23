/* Soulink Beta Access Guard – auth.js (patched)
   Uses sessionStorage key "soulinkBeta" ("true") after successful login.
   If the key is missing – redirects to login.html.
*/

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
    return path.toLowerCase().split("?")[0].split("#")[0];
  } catch {
    return "index.html";
  }
}

function isPublicPage() {
  return PUBLIC_PAGES.has(currentPageName());
}

function hasBetaAccess() {
  return sessionStorage.getItem("soulinkBeta") === "true";
}

(function enforceBetaAccess() {
  if (isPublicPage()) return;
  if (!hasBetaAccess()) {
    try {
      sessionStorage.removeItem("soulinkBeta");
      const page = currentPageName();
      const url  = `${BETA_LOGIN_PAGE}?next=${encodeURIComponent(page)}`;
      window.location.replace(url);
    } catch {
      window.location.href = BETA_LOGIN_PAGE;
    }
  }
})();

window.soulinkLogout = function () {
  try {
    sessionStorage.removeItem("soulinkBeta");
    sessionStorage.removeItem("soulinkBetaStartedAt");
  } finally {
    window.location.replace(BETA_LOGIN_PAGE);
  }
};

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