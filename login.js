import { auth } from "./firebase-config.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const form = document.getElementById("loginForm");

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
}

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
    clearOldSoulData();

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