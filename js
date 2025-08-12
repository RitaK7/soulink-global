import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase-config.js";

// Stebi ar vartotojas prisijungęs
export function observeUser(callback) {
  const auth = getAuth();
  onAuthStateChanged(auth, callback);
}

// Atsijungimas
export function logout() {
  const auth = getAuth();
  return signOut(auth);
}

// Gauti vartotojo papildomus duomenis iš Firestore
export async function getUserData(uid) {
  const userDoc = await getDoc(doc(db, "users", uid));
  return userDoc.exists() ? userDoc.data() : null;
}

// Tikrina ar vartotojas yra Premium
export async function isPremium(user) {
  if (!user) return false;
  const userData = await getUserData(user.uid);
  return userData?.plan === "premium";
}
