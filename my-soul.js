import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

(function () {
"use strict";

const PRIMARY_KEY = "soulink.soulQuiz";
const LEGACY_KEY = "soulQuiz";

let currentUser = null;

const $ = (selector) => document.querySelector(selector);

function activeUid() {
return (currentUser && currentUser.uid) || (auth.currentUser && auth.currentUser.uid) || "";
}

function ownsLocalCache(data, user) {
if (!user || !data || typeof data !== "object") return true;
const owner = data.__soulinkUid || data.uid || data.ownerUid || "";
return owner === user.uid;
}

const ui = {
content: $("#mySoulContent"),
empty: $("#mySoulEmpty"),
startQuiz: $("#mySoulStartQuiz"),

avatar: $("#msAvatar"),
photo1: $("#msPhoto1"),
photo2: $("#msPhoto2"),
photo3: $("#msPhoto3"),

heroTitle: $("#msHeroTitle"),
heroSubtitle: $("#msHeroSubtitle"),

zodiacTag: $("#msZodiacTag"),
chineseTag: $("#msChineseTag"),
lifePathTag: $("#msLifePathTag"),
connectionTag: $("#msConnectionTag"),

snapshotName: $("#msSnapshotName"),
snapshotAge: $("#msSnapshotAge"),
snapshotCountry: $("#msSnapshotCountry"),
snapshotConnection: $("#msSnapshotConnection"),
snapshotLoveLanguage: $("#msSnapshotLoveLanguage"),
snapshotValues: $("#msSnapshotValues"),
snapshotHobbies: $("#msSnapshotHobbies"),

soulSummary: $("#msSoulSummary"),
energyText: $("#msEnergyText"),
loveLanguages: $("#msLoveLanguages"),
connectWith: $("#msConnectWith"),
boundariesText: $("#msBoundariesText"),
aboutText: $("#msAboutText"),
mantraText: $("#msMantraText"),

backQuizTop: $("#msBackToQuizTop"),
backQuizBottom: $("#msBackToQuizBottom"),
goToChart: $("#msGoToChart")

};

const LOVE_DESCRIPTIONS = {
"Words of Affirmation": "Warm, sincere words help your heart feel seen, valued and emotionally safe.",
"Quality Time": "Undivided attention and shared presence create the deepest sense of connection for you.",
"Acts of Service": "Care becomes real when it is expressed through thoughtful help and dependable action.",
"Physical Touch": "Affection, closeness and gentle touch help you feel grounded, loved and reassured.",
"Receiving Gifts": "Meaningful gifts and symbols of care remind you that love is intentional and remembered."
};

function norm(value) {
return value == null ? "" : String(value).trim();
}

function toArray(value) {
if (!value) return [];
if (Array.isArray(value)) return value.slice();
return [value];
}

function uniq(list) {
const out = [];
const seen = new Set();
(list || []).forEach((item) => {
const clean = norm(item);
if (!clean || seen.has(clean)) return;
seen.add(clean);
out.push(clean);
});
return out;
}

function safeParse(raw) {
if (!raw) return null;
try {
return JSON.parse(raw);
} catch (err) {
return null;
}
}

function readLocalSoulData() {
try {
if (typeof window.getSoulData === "function") {
const data = window.getSoulData({ ensureShape: true });
if (data && typeof data === "object") return data;
}
} catch (err) {
console.warn("[Soulink] Local helper read failed", err);
}

const raw =
  safeParse(localStorage.getItem(PRIMARY_KEY)) ||
  safeParse(localStorage.getItem(LEGACY_KEY));

return raw && typeof raw === "object" ? raw : null;

}

function writeLocalSoulData(data) {
if (!data || typeof data !== "object") return;

const uid = activeUid();
const payload = uid ? Object.assign({}, data, { __soulinkUid: uid }) : Object.assign({}, data);

try {
  if (typeof window.saveSoulData === "function") {
    window.saveSoulData(payload);
    return;
  }
} catch (err) {
  console.warn("[Soulink] Local helper save failed", err);
}

try {
  const json = JSON.stringify(payload);
  localStorage.setItem(PRIMARY_KEY, json);
  localStorage.setItem(LEGACY_KEY, json);
} catch (err) {
  console.warn("[Soulink] Local fallback save failed", err);
}

}

function waitForAuthUser(timeoutMs = 5000) {
return new Promise((resolve) => {
if (auth.currentUser) {
currentUser = auth.currentUser;
console.log("[Soulink] Auth user ready", auth.currentUser.uid);
resolve(auth.currentUser);
return;
}

  let settled = false;

  const timer = window.setTimeout(() => {
    if (settled) return;
    settled = true;
    unsubscribe();
    currentUser = auth.currentUser || null;
    console.log("[Soulink] Auth user ready", currentUser ? currentUser.uid : "none");
    resolve(currentUser);
  }, timeoutMs);

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timer);
    unsubscribe();
    currentUser = user || null;
    console.log("[Soulink] Auth user ready", currentUser ? currentUser.uid : "none");
    resolve(currentUser);
  });
});

}

async function readFirestoreProfile(user) {
if (!user) return null;

const snap = await getDoc(doc(db, "users", user.uid));
if (!snap.exists()) return null;

const data = snap.data() || null;
if (data) {
  console.log("[Soulink] Loaded profile from Firestore");
}
return data;

}

function normalizeList(value) {
if (!value) return [];
if (Array.isArray(value)) {
return value.map((v) => String(v).trim()).filter(Boolean);
}
return String(value)
.split(/[\n,;]+/)
.map((v) => v.trim())
.filter(Boolean);
}

function parseBirthdayToDate(raw) {
const str = norm(raw);
if (!str) return null;

if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(str)) {
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

if (/^\d{4}\.\d{2}\.\d{2}$/.test(str)) {
  const [y, m, d] = str.split(".").map(Number);
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}

const match = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
if (match) {
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  let year = parseInt(match[3], 10);
  if (year < 100) year += year >= 50 ? 1900 : 2000;
  const dt = new Date(year, month, day);
  return isNaN(dt.getTime()) ? null : dt;
}

if (/^\d{8}$/.test(str)) {
  const y = Number(str.slice(0, 4));
  const m = Number(str.slice(4, 6));
  const d = Number(str.slice(6, 8));
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}

const d = new Date(str);
return isNaN(d.getTime()) ? null : d;

}

function calculateAge(date) {
if (!date) return null;
const now = new Date();
let age = now.getFullYear() - date.getFullYear();
const m = now.getMonth() - date.getMonth();
if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age -= 1;
return age >= 0 && age < 130 ? age : null;
}

function getYearFromDate(date) {
if (!date) return null;
const year = date.getFullYear();
return Number.isFinite(year) ? year : null;
}

function getWesternZodiac(date) {
if (!date) return null;
const month = date.getMonth() + 1;
const day = date.getDate();

const inRange = (m, d, m1, d1, m2, d2) => {
  return (
    (m === m1 && d >= d1) ||
    (m === m2 && d <= d2) ||
    (m > m1 && m < m2) ||
    (m1 > m2 && (m >= m1 || m <= m2))
  );
};

if (inRange(month, day, 3, 21, 4, 19)) return "Aries";
if (inRange(month, day, 4, 20, 5, 20)) return "Taurus";
if (inRange(month, day, 5, 21, 6, 20)) return "Gemini";
if (inRange(month, day, 6, 21, 7, 22)) return "Cancer";
if (inRange(month, day, 7, 23, 8, 22)) return "Leo";
if (inRange(month, day, 8, 23, 9, 22)) return "Virgo";
if (inRange(month, day, 9, 23, 10, 22)) return "Libra";
if (inRange(month, day, 10, 23, 11, 21)) return "Scorpio";
if (inRange(month, day, 11, 22, 12, 21)) return "Sagittarius";
if (inRange(month, day, 12, 22, 1, 19)) return "Capricorn";
if (inRange(month, day, 1, 20, 2, 18)) return "Aquarius";
if (inRange(month, day, 2, 19, 3, 20)) return "Pisces";
return null;

}

function getChineseZodiac(year) {
if (!year || !Number.isFinite(year)) return null;
const animals = [
"Rat",
"Ox",
"Tiger",
"Rabbit",
"Dragon",
"Snake",
"Horse",
"Goat",
"Monkey",
"Rooster",
"Dog",
"Pig"
];
const index = (year - 1900) % 12;
return animals[(index + 12) % 12];
}

function getLifePathNumber(rawBirthday) {
const digits = String(rawBirthday || "").replace(/\D/g, "");
if (!digits) return null;

const sumDigits = (value) =>
  String(value).split("").reduce((acc, ch) => acc + Number(ch || 0), 0);

const isMaster = (n) => n === 11 || n === 22 || n === 33;

let n = sumDigits(digits);
while (n > 9 && !isMaster(n)) {
  n = sumDigits(n);
}
return n;

}

function hasMeaningfulData(data) {
if (!data || typeof data !== "object") return false;

const keys = [
  "name",
  "birthday",
  "country",
  "connectionType",
  "loveLanguage",
  "loveLanguages",
  "values",
  "hobbies",
  "about",
  "aboutMe",
  "soulSummary",
  "profilePhoto1",
  "profilePhoto2",
  "profilePhoto3"
];

return keys.some((key) => {
  const value = data[key];
  if (Array.isArray(value)) return value.length > 0;
  return norm(value).length > 0;
});

}

function normalizeProfile(raw) {
const data = raw && typeof raw === "object" ? { ...raw } : {};

const birthday = norm(data.birthday || data.birthdate);
const birthdayDate = parseBirthdayToDate(birthday);
const age =
  data.age != null && data.age !== ""
    ? Number(data.age)
    : calculateAge(birthdayDate);
const year = getYearFromDate(birthdayDate);

const zodiac = norm(data.zodiac || data.zodiacSign || getWesternZodiac(birthdayDate));
const chineseZodiac = norm(
  data.chineseZodiac || data.chinese || getChineseZodiac(year)
);
const lifePath =
  data.lifePath != null && data.lifePath !== ""
    ? data.lifePath
    : data.lifePathNumber != null && data.lifePathNumber !== ""
      ? data.lifePathNumber
      : getLifePathNumber(birthday);

const loveLanguages = uniq(
  normalizeList(
    data.loveLanguages && data.loveLanguages.length
      ? data.loveLanguages
      : data.loveLanguage
  )
);

const primaryLoveLanguage = norm(data.loveLanguage || loveLanguages[0]);
if (primaryLoveLanguage && !loveLanguages.includes(primaryLoveLanguage)) {
  loveLanguages.unshift(primaryLoveLanguage);
}

const values = uniq(normalizeList(data.values));
const hobbies = uniq(
  normalizeList(
    data.hobbies && data.hobbies.length ? data.hobbies : data.interests
  )
);
const connectWith = uniq(
  normalizeList(
    data.connectWith && data.connectWith.length
      ? data.connectWith
      : data.seekingGender
  )
);

const profilePhoto1 = norm(data.profilePhoto1);
const profilePhoto2 = norm(data.profilePhoto2);
const profilePhoto3 = norm(data.profilePhoto3);

return {
  ...data,
  name: norm(data.name),
  country: norm(data.country),
  birthday,
  age: Number.isFinite(age) ? age : null,
  zodiac,
  chineseZodiac,
  lifePath,
  connectionType: norm(data.connectionType),
  loveLanguage: primaryLoveLanguage,
  loveLanguages,
  values,
  hobbies,
  connectWith,
  boundaries: norm(
    data.boundaries ||
      data.nonNegotiables ||
      data.unacceptable ||
      data.unacceptableBehavior ||
      data.notAllowed ||
      data.noGo
  ),
  about: norm(data.aboutMe || data.about || data.story),
  mantra: norm(data.mantra || data.intention),
  soulSummary: norm(data.soulSummary),
  profilePhoto1,
  profilePhoto2,
  profilePhoto3,
  mainPhotoSlot: data.mainPhotoSlot || data.primaryPhotoSlot || null
};

}

function textOrDash(value) {
const clean = norm(value);
return clean || "—";
}

function buildEnergyText(data) {
const parts = [];
if (data.connectionType) parts.push(`Seeking ${data.connectionType.toLowerCase()}`);
if (data.loveLanguage) parts.push(`led by ${data.loveLanguage.toLowerCase()}`);
if (data.zodiac) parts.push(`with ${data.zodiac} energy`);
if (data.country) parts.push(`from ${data.country}`);

if (!parts.length) {
  return {
    text: "Complete your profile to reveal the energy of your soul snapshot.",
    zodiac: data.zodiac || "",
    chinese: data.chineseZodiac || "",
    lifePath: data.lifePath || null
  };
}

return {
  text: parts.join(" • "),
  zodiac: data.zodiac || "",
  chinese: data.chineseZodiac || "",
  lifePath: data.lifePath || null
};

}

function renderChips(container, values, options = {}) {
if (!container) return;
container.innerHTML = "";

const list = normalizeList(values);
if (!list.length) {
  const chip = document.createElement("span");
  chip.className = "ms-chip ghost";
  chip.textContent = options.emptyText || "Not added yet.";
  container.appendChild(chip);
  return;
}

const max = options.max || list.length;

list.slice(0, max).forEach((item, index) => {
  const chip = document.createElement("span");
  chip.className = "ms-chip" + (options.primary && index === 0 ? " primary" : "");
  chip.textContent = item;
  container.appendChild(chip);
});

if (list.length > max) {
  const moreChip = document.createElement("span");
  moreChip.className = "ms-chip ghost";
  moreChip.textContent = `+${list.length - max} more`;
  container.appendChild(moreChip);
}

}

function renderLoveLanguageChips(values, container) {
if (!container) return;
container.innerHTML = "";

const list = normalizeList(values);
if (!list.length) {
  const chip = document.createElement("span");
  chip.className = "ms-chip ghost";
  chip.textContent = "Add love languages in Quiz or Edit Profile.";
  container.appendChild(chip);
  return;
}

list.forEach((label, index) => {
  const wrapper = document.createElement("div");
  wrapper.className = "ms-chip" + (index === 0 ? " primary" : "");

  const title = document.createElement("div");
  title.style.fontSize = "0.9rem";
  title.style.fontWeight = "600";
  title.textContent = index === 0 ? `${label} · primary` : label;

  const desc = document.createElement("div");
  desc.style.fontSize = "0.8rem";
  desc.style.opacity = "0.9";
  desc.textContent =
    LOVE_DESCRIPTIONS[label] ||
    "A personal way your heart likes to both give and receive care.";

  wrapper.appendChild(title);
  wrapper.appendChild(desc);
  container.appendChild(wrapper);
});

}

function renderPhoto(img, url) {
if (!img) return;
if (url) {
img.src = url;
img.alt = "Soul photo";
img.classList.remove("is-empty");
} else {
img.removeAttribute("src");
img.alt = "";
img.classList.add("is-empty");
}
}

function render(data) {
const name = data.name || "My Soul";

if (ui.heroTitle) {
  ui.heroTitle.textContent = name ? `My Soul • ${name}` : "My Soul";
}

if (ui.heroSubtitle) {
  ui.heroSubtitle.textContent =
    "Your core soul snapshot – built from your answers and updated each time you change your profile.";
}

const avatarUrl =
  data.mainPhotoSlot && data[`profilePhoto${data.mainPhotoSlot}`]
    ? data[`profilePhoto${data.mainPhotoSlot}`]
    : data.profilePhoto1 || data.profilePhoto2 || data.profilePhoto3 || "";

if (ui.avatar) {
  if (avatarUrl) {
    ui.avatar.src = avatarUrl;
    ui.avatar.alt = "Soul avatar";
  } else {
    ui.avatar.removeAttribute("src");
    ui.avatar.alt = "";
  }
}

renderPhoto(ui.photo1, data.profilePhoto1);
renderPhoto(ui.photo2, data.profilePhoto2);
renderPhoto(ui.photo3, data.profilePhoto3);

const energy = buildEnergyText(data);

if (ui.energyText) {
  ui.energyText.textContent = energy.text;
  ui.energyText.classList.remove("ms-placeholder");
}

if (ui.zodiacTag) {
  ui.zodiacTag.hidden = !energy.zodiac;
  if (energy.zodiac) ui.zodiacTag.textContent = energy.zodiac;
}

if (ui.chineseTag) {
  ui.chineseTag.hidden = !energy.chinese;
  if (energy.chinese) ui.chineseTag.textContent = energy.chinese;
}

if (ui.lifePathTag) {
  ui.lifePathTag.hidden = !(energy.lifePath != null && energy.lifePath !== "");
  if (!ui.lifePathTag.hidden) {
    ui.lifePathTag.textContent = `Life Path ${energy.lifePath}`;
  }
}

if (ui.connectionTag) {
  ui.connectionTag.hidden = !data.connectionType;
  if (data.connectionType) ui.connectionTag.textContent = data.connectionType;
}

if (ui.snapshotName) ui.snapshotName.textContent = textOrDash(data.name);
if (ui.snapshotAge) ui.snapshotAge.textContent = data.age != null ? String(data.age) : "—";
if (ui.snapshotCountry) ui.snapshotCountry.textContent = textOrDash(data.country);
if (ui.snapshotConnection) ui.snapshotConnection.textContent = textOrDash(data.connectionType);
if (ui.snapshotLoveLanguage) {
  ui.snapshotLoveLanguage.textContent = textOrDash(
    data.loveLanguage || data.loveLanguages[0]
  );
}

renderChips(ui.snapshotValues, data.values, {
  max: 4,
  emptyText: "Add values in Quiz or Edit Profile."
});

renderChips(ui.snapshotHobbies, data.hobbies, {
  max: 4,
  emptyText: "Add hobbies in Quiz or Edit Profile."
});

if (ui.soulSummary) {
  if (data.soulSummary) {
    ui.soulSummary.textContent = data.soulSummary;
    ui.soulSummary.classList.remove("ms-placeholder");
  } else {
    ui.soulSummary.textContent = "Complete your profile to see your Soul Summary ✨";
    ui.soulSummary.classList.add("ms-placeholder");
  }
}

renderLoveLanguageChips(data.loveLanguages, ui.loveLanguages);

renderChips(ui.connectWith, data.connectWith, {
  emptyText: "Add who you want to connect with in Quiz or Edit Profile."
});

if (ui.boundariesText) {
  if (data.boundaries) {
    ui.boundariesText.textContent = data.boundaries;
    ui.boundariesText.classList.remove("ms-placeholder");
  } else {
    ui.boundariesText.textContent =
      "You haven’t written your boundaries yet. When you add them, they will appear here.";
    ui.boundariesText.classList.add("ms-placeholder");
  }
}

if (ui.aboutText) {
  if (data.about) {
    ui.aboutText.textContent = data.about;
    ui.aboutText.classList.remove("ms-placeholder");
  } else {
    ui.aboutText.textContent =
      "Share a few lines about yourself in the Quiz or Edit Profile – your story will be reflected here.";
    ui.aboutText.classList.add("ms-placeholder");
  }
}

if (ui.mantraText) {
  if (data.mantra) {
    ui.mantraText.textContent = data.mantra;
    ui.mantraText.classList.remove("ms-placeholder");
  } else {
    ui.mantraText.textContent =
      "Add a mantra to carry with you – something short you can return to on difficult days.";
    ui.mantraText.classList.add("ms-placeholder");
  }
}

}

function renderEmpty() {
if (ui.content) ui.content.hidden = true;
if (ui.empty) ui.empty.hidden = false;
}

function renderFull(data) {
if (ui.empty) ui.empty.hidden = true;
if (ui.content) ui.content.hidden = false;
render(data);
}

function bindStaticLinks() {
if (ui.goToChart) {
ui.goToChart.addEventListener("click", function (event) {
event.preventDefault();
window.location.href = "soul-chart.html";
});
}

[ui.backQuizTop, ui.backQuizBottom].forEach((btn) => {
  if (!btn) return;
  btn.addEventListener("click", function (event) {
    event.preventDefault();
    window.location.href = "quiz.html";
  });
});

}

async function loadProfileSourceOfTruth() {
const user = await waitForAuthUser();
const local = readLocalSoulData();

if (!user) {
  console.log("[Soulink] Using local fallback");
  return local;
}

try {
  const firestoreData = await readFirestoreProfile(user);
  if (firestoreData && typeof firestoreData === "object") {
    // Firestore is the source of truth for logged-in users.
    // Refresh localStorage FROM Firestore; never let localStorage override it.
    const source = Object.assign({}, firestoreData, { __soulinkUid: user.uid });
    writeLocalSoulData(source);
    return source;
  }
} catch (err) {
  console.error("[Soulink] My Soul Firestore load failed", err);
}

if (ownsLocalCache(local, user)) {
  console.log("[Soulink] No Firestore profile yet; using only this user's local draft");
  return local;
}

console.log("[Soulink] No Firestore profile and local cache belongs to another user");
return null;

}

async function start() {
bindStaticLinks();

try {
  const raw = await loadProfileSourceOfTruth();
  const data = normalizeProfile(raw || {});

  if (!hasMeaningfulData(data)) {
    renderEmpty();
    return;
  }

  renderFull(data);
} catch (err) {
  console.error("[Soulink] My Soul init failed", err);
  renderEmpty();
}

}

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();