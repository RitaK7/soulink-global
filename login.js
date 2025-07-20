// src/login.js
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase-config.js";

const form = document.getElementById("loginForm");
const messageDiv = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Išsaugom į localStorage (jei reikia)
    localStorage.setItem("soulinkUser", JSON.stringify({
      email: user.email,
      name: user.displayName,
      uid: user.uid
    }));

    showMessage("✅ Logged in successfully!", "success");

    setTimeout(() => {
      window.location.href = "/my-soul.html";
    }, 1500);
  } catch (err) {
    showMessage("❌ " + err.message);
  }
});

function showMessage(msg, type = "error") {
  messageDiv.textContent = msg;
  messageDiv.style.color = type === "success" ? "#00ff88" : "#ff4444";
}
