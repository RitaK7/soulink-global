// src/signup.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { firebaseConfig } from "./firebase-config.js";

// Inicializuojame Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Gaunam formą
const form = document.getElementById("signupForm");
const messageDiv = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Paimam įrašytus duomenis
  const name = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const agreed = document.getElementById("terms").checked;

  // Tikrinimai
  if (!agreed) {
    return showMessage("❗ You must agree to the Terms & Conditions.");
  }

  if (password !== confirmPassword) {
    return showMessage("❗ Passwords do not match.");
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });

    showMessage("✅ Account created successfully!", "success");

    // Optionally išsaugom naudotoją localStorage (pvz.)
    localStorage.setItem("soulinkUser", JSON.stringify({
      email: email,
      name: name,
      uid: userCredential.user.uid
    }));

    // Po 2 sek. perkeliam į my-soul.html
    setTimeout(() => {
      window.location.href = "/my-soul.html";
    }, 2000);

    form.reset();
  } catch (err) {
    showMessage("❌ " + err.message);
  }
});

// Pranešimų rodymo funkcija
function showMessage(msg, type = "error") {
  messageDiv.textContent = msg;
  messageDiv.style.color = type === "success" ? "#00ff88" : "#ff4444";
}
