import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById("signupForm");
const msg = document.getElementById("msg");

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

  localStorage.removeItem("soulinkUser");
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;
    const agree = document.getElementById("agree").checked;

    if (!name) {
      msg.textContent = "Please enter your name";
      return;
    }

    if (!email) {
      msg.textContent = "Please enter your email";
      return;
    }

    if (password !== confirm) {
      msg.textContent = "Passwords do not match";
      return;
    }

    if (!agree) {
      msg.textContent = "Please read and accept the Terms of Use and Privacy Policy before creating your account.";
      return;
    }

    try {
      msg.textContent = "Creating your account...";

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      clearOldSoulData();

      await updateProfile(user, {
  displayName: name
});

let verificationSent = false;

try {
  await sendEmailVerification(user, {
    url: "https://soulink.global/login.html",
    handleCodeInApp: false
  });

  verificationSent = true;
  console.log("[Soulink] Verification email sent to:", user.email);
} catch (verifyErr) {
  console.warn("[Soulink] Verification email could not be sent:", verifyErr);
}

await setDoc(doc(db, "users", user.uid), {
  uid: user.uid,
  name,
  email,
  emailVerified: user.emailVerified === true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  profileCompleted: false
});

localStorage.setItem(
  "soulinkUser",
  JSON.stringify({
    uid: user.uid,
    name,
    email
  })
);

if (verificationSent) {
  msg.textContent = "Account created ✓ Please check your email to verify your account.";
} else {
  msg.textContent = "Account created ✓ Verification email was not sent. You can still continue and we will fix verification next.";
}

      setTimeout(() => {
        window.location.href = "quiz.html";
      }, 3500);
    } catch (err) {
      console.error("[Soulink] Signup failed:", err);
      msg.textContent = err.message || "Signup failed. Please try again.";
    }
  });
}