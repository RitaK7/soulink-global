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
}

function clearSessionOnly() {
  localStorage.removeItem("soulinkUser");
}

function clearAllUserStorage() {
  localStorage.removeItem("soulinkUser");
  localStorage.removeItem("soulQuiz");
  localStorage.removeItem("soulink.soulQuiz");
  localStorage.removeItem("soulCoach");
  localStorage.removeItem("soulink.soulCoach");
  localStorage.removeItem("soulMatches");
  localStorage.removeItem("soulink.matches");
  localStorage.removeItem("soulFriends");
  localStorage.removeItem("soulink.friends.list");
}

onAuthStateChanged(auth, (user) => {
  const page = getCurrentPage();

  if (!user && !isPublicPage()) {
    clearSessionOnly();
    window.location.href = `login.html?next=${encodeURIComponent(page)}`;
    return;
  }

  if (user) {
    saveUserToLocalStorage(user);
  }
});

window.soulinkLogout = async function () {
  try {
    await signOut(auth);
    clearAllUserStorage();
    window.location.href = "login.html";
  } catch (err) {
    console.error("Logout failed:", err);
    alert("Logout failed. Please try again.");
  }
};