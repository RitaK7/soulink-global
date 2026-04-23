import { auth, db } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById("signupForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();

  const email = document.getElementById("email").value.trim();

  const password = document.getElementById("password").value;

  const confirm = document.getElementById("confirm").value;

  const agree = document.getElementById("agree").checked;

  if (password !== confirm) {
    msg.textContent = "Passwords do not match";
    return;
  }

  if (!agree) {
    msg.textContent = "Please agree to Terms";
    return;
  }

  try {

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = userCredential.user;

    await updateProfile(user, {
      displayName: name
    });

    await setDoc(doc(db, "users", user.uid), {

      uid: user.uid,

      name,

      email,

      createdAt: serverTimestamp(),

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

    msg.textContent =
      "Account created successfully ✓";

    setTimeout(() => {

      window.location.href =
        "quiz.html";

    }, 1200);

  } catch (err) {

    msg.textContent =
      err.message;

  }

});