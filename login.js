import { auth } from "./firebase-config.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const form = document.getElementById("loginForm");

const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {

  e.preventDefault();

  const email =
    document.getElementById("email")
    .value
    .trim();

  const password =
    document.getElementById("password")
    .value;

  try {

    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = userCredential.user;

    localStorage.setItem(
      "soulinkUser",
      JSON.stringify({

        uid: user.uid,

        name: user.displayName,

        email: user.email

      })
    );

    msg.textContent =
      "Logged in successfully ✓";

    setTimeout(() => {

      window.location.href =
        "my-soul.html";

    }, 1000);

  } catch (err) {

    msg.textContent =
      err.message;

  }

});