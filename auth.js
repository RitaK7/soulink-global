/* Soulink Auth Helper – auth.js
 *
 * Static vanilla JS file.
 * Loaded as:
 *   <script src="auth.js" defer></script>
 *
 * Responsibilities:
 * 1. Provide one safe global logout function: window.soulinkLogout().
 * 2. On logout:
 *    - Firebase signOut()
 *    - clear Soulink local/session profile cache
 *    - clear old photo/profile keys
 *    - clear Soulink service worker caches
 *    - redirect to login.html
 */

(function () {
  "use strict";

  const LOGIN_PAGE = "login.html";

  const EXACT_STORAGE_KEYS = [
    "soulinkUser",

    "soulink.soulQuiz",
    "soulQuiz",

    "soulink.soulCoach",
    "soulCoach",

    "soulink.matches",
    "soulMatches",

    "soulink.friends.list",
    "soulFriends",

    "soulink.profile",
    "soulink.userProfile",
    "userProfile",
    "profile",

    "profilePhoto1",
    "profilePhoto2",
    "profilePhoto3",

    "soulink.profilePhoto1",
    "soulink.profilePhoto2",
    "soulink.profilePhoto3",

    "photo1",
    "photo2",
    "photo3",

    "soulink.photo1",
    "soulink.photo2",
    "soulink.photo3"
  ];

  function shouldRemoveSoulinkStorageKey(key) {
    if (!key) return false;

    const lower = String(key).toLowerCase();

    if (EXACT_STORAGE_KEYS.includes(key)) return true;

    return (
      lower === "soulquiz" ||
      lower.startsWith("soulink.") ||
      lower.startsWith("soulink:") ||
      lower.startsWith("soulink_") ||
      lower.includes("profilephoto") ||
      lower.includes("soulquiz") ||
      lower.includes("soulcoach") ||
      lower.includes("soulmatches") ||
      lower.includes("soulfriends")
    );
  }

  function clearStorageArea(storage) {
    if (!storage) return;

    try {
      EXACT_STORAGE_KEYS.forEach((key) => {
        try {
          storage.removeItem(key);
        } catch (err) {}
      });

      const keysToRemove = [];

      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (shouldRemoveSoulinkStorageKey(key)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        try {
          storage.removeItem(key);
        } catch (err) {}
      });
    } catch (err) {
      console.warn("[Soulink] Storage clear failed", err);
    }
  }

  function clearSoulinkStorage() {
    clearStorageArea(localStorage);
    clearStorageArea(sessionStorage);
  }

  async function clearSoulinkCaches() {
    if (!("caches" in window)) return;

    try {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter((key) => String(key).toLowerCase().startsWith("soulink"))
          .map((key) => caches.delete(key))
      );

      console.log("[Soulink] Local Soulink caches cleared");
    } catch (err) {
      console.warn("[Soulink] Cache clear failed", err);
    }
  }

  async function firebaseSignOutIfPossible() {
    try {
      const firebaseConfigModule = await import("./firebase-config.js");
      const firebaseAuthModule = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
      );

      if (!firebaseConfigModule || !firebaseConfigModule.auth) return;
      if (!firebaseAuthModule || typeof firebaseAuthModule.signOut !== "function") return;

      await firebaseAuthModule.signOut(firebaseConfigModule.auth);
      console.log("[Soulink] Firebase signed out");
    } catch (err) {
      console.warn("[Soulink] Firebase signOut skipped or failed", err);
    }
  }

  function redirectAfterLogout() {
    window.location.replace(`${LOGIN_PAGE}?loggedout=1&v=${Date.now()}`);
  }

  window.soulinkLogout = async function () {
    try {
      await firebaseSignOutIfPossible();
    } finally {
      clearSoulinkStorage();
      await clearSoulinkCaches();
      redirectAfterLogout();
    }
  };

  window.soulinkClearLocalProfileCache = function () {
    clearSoulinkStorage();
  };
})();