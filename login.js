import { auth } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");
const loginBtn = document.getElementById("loginBtn");
const forgotBtn = document.getElementById("forgotBtn");
const verificationActions = document.getElementById("verificationActions");
const resendVerificationBtn = document.getElementById("resendVerificationBtn");
const continuePrivateBtn = document.getElementById("continuePrivateBtn");

let currentLoggedInUser = null;

function clearOldSoulData() {
  localStorage.removeItem("soulQuiz");
  localStorage.removeItem("soulink.soulQuiz");

  localStorage.removeItem("soulCoach");
  localStorage.removeItem("soulink.soulCoach");

  localStorage.removeItem("soulMatches");
  localStorage.removeItem("soulink.matches");

  localStorage.removeItem("soulFriends");
  localStorage.removeItem("soulink.friends.list");

  localStorage.removeItem("profilePhoto1");
  localStorage.removeItem("profilePhoto2");
  localStorage.removeItem("profilePhoto3");
}

function showMessage(text, ok = true) {
  if (!msg) return;
  msg.textContent = text;
  msg.style.color = ok ? "#dff" : "#ffd4dc";
}

function showVerificationActions(show) {
  if (!verificationActions) return;
  verificationActions.classList.toggle("is-visible", !!show);
}

async function sendVerification(user) {
  if (!user) return false;

  try {
    await sendEmailVerification(user, {
      url: "https://soulink.global/login.html",
      handleCodeInApp: false
    });

    console.log("[Soulink] Verification email sent to:", user.email);
    return true;
  } catch (err) {
    console.warn("[Soulink] Verification email could not be sent:", err);
    return false;
  }
}

function saveLoggedInUser(user) {
  localStorage.setItem(
    "soulinkUser",
    JSON.stringify({
      uid: user.uid,
      name: user.displayName || "",
      email: user.email || "",
      emailVerified: !!user.emailVerified
    })
  );
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    showVerificationActions(false);

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showMessage("Please enter your email and password.", false);
      return;
    }

    try {
      if (loginBtn) loginBtn.disabled = true;
      showMessage("Logging in...");

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      currentLoggedInUser = user;
      clearOldSoulData();
      saveLoggedInUser(user);

      if (!user.emailVerified) {
        showMessage(
          "Logged in ✓ Your email is not verified yet. Please verify it before making your profile visible to other Soulink members.",
          true
        );
        showVerificationActions(true);
        return;
      }

      showMessage("Logged in successfully ✓");

      setTimeout(() => {
        window.location.href = "my-soul.html";
      }, 900);
    } catch (err) {
      console.error("[Soulink] Login failed:", err);
      showMessage(err.message || "Login failed. Please try again.", false);
    } finally {
      if (loginBtn) loginBtn.disabled = false;
    }
  });
}

if (resendVerificationBtn) {
  resendVerificationBtn.addEventListener("click", async () => {
    if (!currentLoggedInUser && auth.currentUser) {
      currentLoggedInUser = auth.currentUser;
    }

    if (!currentLoggedInUser) {
      showMessage("Please log in first, then resend the verification email.", false);
      return;
    }

    resendVerificationBtn.disabled = true;
    showMessage("Sending verification email...");

    const sent = await sendVerification(currentLoggedInUser);

    if (sent) {
      showMessage("Verification email sent ✓ Please check your inbox or spam folder.");
    } else {
      showMessage("Could not send verification email. Please wait a moment and try again.", false);
    }

    resendVerificationBtn.disabled = false;
  });
}

if (continuePrivateBtn) {
  continuePrivateBtn.addEventListener("click", () => {
    window.location.href = "my-soul.html";
  });
}

if (forgotBtn) {
  forgotBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();

    if (!email) {
      showMessage("Enter your email first, then click Forgot password.", false);
      return;
    }

    try {
      forgotBtn.disabled = true;
      showMessage("Sending password reset email...");

      await sendPasswordResetEmail(auth, email, {
        url: "https://soulink.global/login.html",
        handleCodeInApp: false
      });

      showMessage("Password reset email sent ✓ Please check your inbox or spam folder.");
    } catch (err) {
      console.error("[Soulink] Password reset failed:", err);
      showMessage(err.message || "Could not send password reset email.", false);
    } finally {
      forgotBtn.disabled = false;
    }
  });
}
