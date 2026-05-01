import { auth } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const PUBLIC_PAGES = new Set([
  "index.html",
  "",
  "login.html",
  "signup.html",
  "privacy.html",
  "terms.html",
  "404.html"
]);

const EXACT_LOCAL_KEYS_TO_CLEAR = [
  "soulinkUser",
  "soulinkLastUid",
  "soulink.soulQuiz",
  "soulQuiz",
  "soulCoach",
  "soulink.soulCoach",
  "soulMatches",
  "soulink.matches",
  "soulFriends",
  "soulink.friends.list",
  "profilePhoto1",
  "profilePhoto2",
  "profilePhoto3",
  "mainPhotoSlot",
  "primaryPhotoSlot"
];

function getCurrentPage() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function isPublicPage() {
  return PUBLIC_PAGES.has(getCurrentPage());
}

function saveUserToLocalStorage(user) {
  localStorage.setItem(
    "soulinkUser",
    JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: user.displayName || ""
    })
  );
  localStorage.setItem("soulinkLastUid", user.uid);
}

function removeMatchingLocalStorageKeys() {
  const keys = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    const lower = key.toLowerCase();

    if (
      lower.startsWith("soulink.") ||
      lower.startsWith("soulink:") ||
      lower.startsWith("soulink_") ||
      lower.startsWith("soul") ||
      lower.includes("profilephoto") ||
      lower.includes("soulquiz") ||
      lower.includes("soulcoach") ||
      lower.includes("soulmatch") ||
      lower.includes("soulfriend")
    ) {
      keys.push(key);
    }
  }

  keys.forEach((key) => localStorage.removeItem(key));
}

function clearSessionOnly() {
  localStorage.removeItem("soulinkUser");
}

function clearAllUserStorage() {
  EXACT_LOCAL_KEYS_TO_CLEAR.forEach((key) => localStorage.removeItem(key));
  removeMatchingLocalStorageKeys();
}

function clearProfileCacheIfUserChanged(user) {
  if (!user) return;

  const lastUid = localStorage.getItem("soulinkLastUid");

  if (lastUid && lastUid !== user.uid) {
    clearAllUserStorage();
  }

  saveUserToLocalStorage(user);
}

onAuthStateChanged(auth, (user) => {
  const page = getCurrentPage();

  if (!user && !isPublicPage()) {
    clearSessionOnly();
    window.location.href = `login.html?next=${encodeURIComponent(page)}`;
    return;
  }

  if (user) {
    clearProfileCacheIfUserChanged(user);
  }
});

window.soulinkClearUserStorage = clearAllUserStorage;

window.soulinkLogout = async function () {
  try {
    clearAllUserStorage();

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SOULINK_CLEAR_RUNTIME_CACHE"
      });
    }

    await signOut(auth);

    clearAllUserStorage();
    window.location.href = "login.html";
  } catch (err) {
    console.error("Logout failed:", err);
    alert("Logout failed. Please try again.");
  }
};
