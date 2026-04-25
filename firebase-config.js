import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC5NOF2wAQM7-9SoEtm_9Mc3QuX0h2m1lg",
  authDomain: "soulink-342bb.firebaseapp.com",
  projectId: "soulink-342bb",
  storageBucket: "soulink-342bb.appspot.com",
  messagingSenderId: "541312933178",
  appId: "1:541312933178:web:239cbbb60e68b183f48403"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export { auth, db, storage };