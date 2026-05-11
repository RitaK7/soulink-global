import { auth, db, storage } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut,
  deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

(function () {
  if (typeof window === "undefined") return;

  const PRIMARY_KEY = "soulink.soulQuiz";
  const LEGACY_KEY = "soulQuiz";
  const PHOTO_KEYS = ["profilePhoto1", "profilePhoto2", "profilePhoto3"];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const LOVE_LANGUAGE_LIST = [
    "Words of Affirmation",
    "Quality Time",
    "Acts of Service",
    "Physical Touch",
    "Receiving Gifts"
  ];

  const CONNECTION_TYPE_LABELS = [
    "Romantic relationship",
    "Friendship",
    "Both (romantic & friendship)",
    "Open to any connection"
  ];

  const CONNECTION_TYPE_CODE_TO_LABEL = {
    romantic: "Romantic relationship",
    friendship: "Friendship",
    both: "Both (romantic & friendship)",
    networking: "Open to any connection",
    "not sure yet": "Open to any connection"
  };

  const GENDER_LABELS = [
    "Woman",
    "Man",
    "Non-binary",
    "Prefer not to say",
    "Self-describe"
  ];

  const CONNECT_WITH_LABELS = [
    "Women",
    "Men",
    "Non-binary",
    "Open to all",
    "Custom preference"
  ];

  const CONNECT_WITH_CODE_TO_LABEL = {
    women: "Women",
    men: "Men",
    nonbinary: "Non-binary",
    all: "Open to all",
    custom: "Custom preference"
  };

  const ORIENTATION_LABELS = [
    "Heterosexual",
    "Gay",
    "Lesbian",
    "Bisexual",
    "Pansexual",
    "Asexual",
    "Queer",
    "Questioning",
    "Prefer not to say"
  ];

  const DEFAULT_HOBBIES = [
    "Travel",
    "Yoga",
    "Music",
    "Reading",
    "Gym / Fitness",
    "Dancing",
    "Cooking",
    "Baking",
    "Hiking",
    "Gardening",
    "Meditation",
    "Movies",
    "Gaming",
    "Art & Design",
    "Photography",
    "Writing",
    "Spirituality",
    "Yoga & Meditation",
    "Travel & Adventure",
    "Nature & Hiking",
    "Music & Dancing",
    "Books & Learning",
    "Cooking & Food"
  ];

  const DEFAULT_VALUES = [
    "Honesty",
    "Kindness",
    "Loyalty",
    "Freedom",
    "Empathy",
    "Authenticity",
    "Growth",
    "Family",
    "Adventure",
    "Trust",
    "Integrity",
    "Humor",
    "Respect",
    "Balance",
    "Spirituality",
    "Curiosity"
  ];

  const ui = {
    name: $("#name"),
    country: $("#country"),
    birthday: $("#birthday"),
    birthdayHint: $("#birthdayHint"),

    connectionChips: $("#connectionChips"),
    loveChips: $("#loveChips"),
    genderIdChips: $("#genderIdChips"),
    genderSelfMount: $("#genderSelfMount"),
    connectWithChips: $("#connectWithChips"),
    connectWithCustomMount: $("#connectWithCustomMount"),
    orientationChips: $("#orientationChips"),
    hobbyChips: $("#hobbyChips"),
    hobbyInput: $("#hobbyInput"),
    valueChips: $("#valueChips"),
    valueInput: $("#valueInput"),

    boundaries: $("#boundaries"),
    aboutMe: $("#aboutMe"),

    file1: $("#file1"),
    file2: $("#file2"),
    file3: $("#file3"),
    thumb1: $("#thumb1"),
    thumb2: $("#thumb2"),
    thumb3: $("#thumb3"),
    remove1: $("#remove1"),
    remove2: $("#remove2"),
    remove3: $("#remove3"),
    ph1: $("#ph1"),
    ph2: $("#ph2"),
    ph3: $("#ph3"),
    main1: $("#main1"),
    main2: $("#main2"),
    main3: $("#main3"),

    discoverableProfile: $("#discoverableProfile"),

    backQuiz: $("#backQuiz"),
    saveBtn: $("#saveBtn"),
    nextSoul: $("#nextSoul"),
    resetForm: $("#resetForm"),
    deleteAccount: $("#deleteAccount"),

    prevAvatar: $("#prevAvatar"),
    prevName: $("#prevName"),
    prevAge: $("#prevAge"),
    tagZodiac: $("#tagZodiac"),
    tagChinese: $("#tagChinese"),
    tagLife: $("#tagLife"),
    tagConn: $("#tagConn"),
    prevLove: $("#prevLove"),
    prevValues: $("#prevValues"),
    prevHobbies: $("#prevHobbies"),
    prevAbout: $("#prevAbout")
  };

  let state = {};

  function norm(s) {
    return s == null ? "" : String(s).trim();
  }

  function lower(s) {
    return norm(s).toLowerCase();
  }

  function toArray(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v.slice();
    return [v];
  }

  function uniq(list) {
    const out = [];
    const seen = new Set();
    (list || []).forEach((x) => {
      const s = norm(x);
      if (!s || seen.has(s)) return;
      seen.add(s);
      out.push(s);
    });
    return out;
  }

  function safeParse(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function readSoulRaw() {
    try {
      if (typeof window.getSoulData === "function") {
        const data = window.getSoulData({ ensureShape: true });
        if (data && typeof data === "object") return data;
      }
    } catch (e) {}

    return safeParse(localStorage.getItem(PRIMARY_KEY)) || safeParse(localStorage.getItem(LEGACY_KEY)) || {};
  }

  function writeSoulRaw(obj) {
    if (!obj || typeof obj !== "object") return;

    try {
      if (typeof window.saveSoulData === "function") {
        window.saveSoulData(obj);
        return;
      }
    } catch (e) {}

    try {
      const json = JSON.stringify(obj);
      localStorage.setItem(PRIMARY_KEY, json);
      localStorage.setItem(LEGACY_KEY, json);
    } catch (e) {}
  }

  function persistPatch(patch) {
    if (!patch || typeof patch !== "object") return state;
    const merged = Object.assign({}, readSoulRaw() || {}, patch);
    writeSoulRaw(merged);
    return merged;
  }

  function showSaveStatus(message, ok = true) {
    let toast = document.getElementById("soulinkSaveToast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "soulinkSaveToast";
      toast.setAttribute("role", "status");
      toast.style.position = "fixed";
      toast.style.right = "18px";
      toast.style.bottom = "18px";
      toast.style.zIndex = "9999";
      toast.style.padding = "12px 16px";
      toast.style.borderRadius = "999px";
      toast.style.fontWeight = "800";
      toast.style.fontSize = "0.9rem";
      toast.style.boxShadow = "0 0 22px rgba(0,253,216,0.75)";
      toast.style.transition = "opacity 0.2s ease, transform 0.2s ease";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.color = ok ? "#003c43" : "#ffd4dc";
    toast.style.background = ok ? "#00fdd8" : "rgba(80,0,20,0.95)";
    toast.style.border = ok
      ? "1px solid rgba(0,253,216,1)"
      : "1px solid rgba(255,154,162,0.8)";
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    window.clearTimeout(toast._timer);
    toast._timer = window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
    }, 2200);
  }

  function waitForAuthUser(timeoutMs = 5000) {
    return new Promise((resolve) => {
      if (auth.currentUser) {
        console.log("[Soulink] Auth user ready", auth.currentUser.uid);
        resolve(auth.currentUser);
        return;
      }

      let done = false;

      const timer = window.setTimeout(() => {
        if (done) return;
        done = true;
        unsubscribe();
        console.log("[Soulink] Auth user ready", auth.currentUser ? auth.currentUser.uid : "none");
        resolve(auth.currentUser || null);
      }, timeoutMs);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        unsubscribe();
        console.log("[Soulink] Auth user ready", user ? user.uid : "none");
        resolve(user || null);
      });
    });
  }

  async function readFirestoreProfile() {
    const user = await waitForAuthUser();
    if (!user) return null;

    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return null;

    console.log("[Soulink] Loaded profile from Firestore");
    return snap.data() || null;
  }

  function normaliseConnectionType(v) {
    const s = lower(v);
    if (!s) return "";
    if (CONNECTION_TYPE_CODE_TO_LABEL[s]) return CONNECTION_TYPE_CODE_TO_LABEL[s];
    if (s === "both") return "Both (romantic & friendship)";
    if (s === "romantic") return "Romantic relationship";
    if (s === "friendship") return "Friendship";
    const exact = CONNECTION_TYPE_LABELS.find((lbl) => lower(lbl) === s);
    return exact || norm(v);
  }

  function normaliseFromLabelsOrKeep(raw, labels, codeToLabel) {
    const s = lower(raw);
    if (!s) return "";
    if (codeToLabel && codeToLabel[s]) return codeToLabel[s];
    const found = labels.find((x) => lower(x) === s);
    return found ? found : norm(raw);
  }

  function normaliseLoveLanguageOne(raw) {
    const s = lower(raw);
    if (!s) return "";
    if (s === "words" || s === "wordsofaffirmation" || s === "words of affirmation") return "Words of Affirmation";
    if (s === "quality" || s === "qualitytime" || s === "quality time") return "Quality Time";
    if (s === "service" || s === "actsofservice" || s === "acts of service") return "Acts of Service";
    if (s === "touch" || s === "physicaltouch" || s === "physical touch") return "Physical Touch";
    if (s === "gifts" || s === "gift" || s === "receivinggifts" || s === "receiving gifts") return "Receiving Gifts";
    const match = LOVE_LANGUAGE_LIST.find((x) => lower(x) === s);
    return match ? match : norm(raw);
  }

  function normaliseLoveLanguages(rawList, rawPrimary) {
    const fromList = uniq(toArray(rawList).map(normaliseLoveLanguageOne)).filter(Boolean);
    const primary = normaliseLoveLanguageOne(rawPrimary);
    let out = fromList.slice();
    if (primary) {
      out = out.filter((x) => x !== primary);
      out.unshift(primary);
    }
    out = out.filter((x) => LOVE_LANGUAGE_LIST.includes(x));
    return uniq(out);
  }

  function computeBirthdayInfo(birthdayRaw) {
    const raw = norm(birthdayRaw);
    if (!raw) return {};

    const now = new Date();
    let year;
    let month;
    let day;

    function makeDate(y, m, d) {
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
      const dt = new Date(y, m - 1, d);
      if (isNaN(dt.getTime())) return null;
      if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
      return dt;
    }

    let dt = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw) || /^\d{4}\/\d{2}\/\d{2}$/.test(raw)) {
      const parts = raw.split(/[-\/]/).map(Number);
      year = parts[0];
      month = parts[1];
      day = parts[2];
      dt = makeDate(year, month, day);
    } else if (/^\d{4}\.\d{2}\.\d{2}$/.test(raw)) {
      const parts = raw.split(".").map(Number);
      year = parts[0];
      month = parts[1];
      day = parts[2];
      dt = makeDate(year, month, day);
    } else if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw) || /^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const parts = raw.split(/[\.\/]/).map(Number);
      day = parts[0];
      month = parts[1];
      year = parts[2];
      dt = makeDate(year, month, day);
    } else if (/^\d{8}$/.test(raw)) {
      year = Number(raw.slice(0, 4));
      month = Number(raw.slice(4, 6));
      day = Number(raw.slice(6, 8));
      dt = makeDate(year, month, day);
    }

    if (!dt) return {};

    let age = now.getFullYear() - year;
    const mDiff = now.getMonth() - (month - 1);
    const dDiff = now.getDate() - day;
    if (mDiff < 0 || (mDiff === 0 && dDiff < 0)) age -= 1;

    function zodiacSign(mo, da) {
      const md = mo * 100 + da;
      if (md >= 321 && md <= 419) return "Aries";
      if (md >= 420 && md <= 520) return "Taurus";
      if (md >= 521 && md <= 620) return "Gemini";
      if (md >= 621 && md <= 722) return "Cancer";
      if (md >= 723 && md <= 822) return "Leo";
      if (md >= 823 && md <= 922) return "Virgo";
      if (md >= 923 && md <= 1022) return "Libra";
      if (md >= 1023 && md <= 1121) return "Scorpio";
      if (md >= 1122 && md <= 1221) return "Sagittarius";
      if (md >= 1222 || md <= 119) return "Capricorn";
      if (md >= 120 && md <= 218) return "Aquarius";
      if (md >= 219 && md <= 320) return "Pisces";
      return "";
    }

    function chineseZodiac(y) {
      const animals = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
      const idx = (y - 1900) % 12;
      return animals[(idx + 12) % 12];
    }

    function lifePath(yyyy, mm, dd) {
      const digits = `${yyyy}${String(mm).padStart(2, "0")}${String(dd).padStart(2, "0")}`;
      const sumDigits = (s) => String(s).split("").reduce((acc, ch) => acc + Number(ch || 0), 0);
      const isMaster = (x) => x === 11 || x === 22 || x === 33;
      let n = sumDigits(digits);
      while (n > 9 && !isMaster(n)) n = sumDigits(n);
      return n;
    }

    const zodiac = zodiacSign(month, day);
    const chinese = chineseZodiac(year);
    const lifePathNumber = lifePath(year, month, day);

    return {
      date: dt,
      year,
      month,
      day,
      age: Number.isFinite(age) ? age : "",
      zodiac,
      chinese,
      lifePath: String(lifePathNumber),
      lifePathNumber: String(lifePathNumber)
    };
  }

  function updateBirthdayHint() {
    if (!ui.birthdayHint) return;
    const info = computeBirthdayInfo(state.birthday);
    if (!info.date) {
      ui.birthdayHint.textContent = "Example: 1993-02-24 (or type 19930224)";
      return;
    }
    ui.birthdayHint.textContent = `Age: ${info.age} • Zodiac: ${info.zodiac} • Chinese sign: ${info.chinese} • Life path: ${info.lifePathNumber}`;
  }

  function renderListChips(container, items) {
    if (!container) return;
    container.innerHTML = "";
    (items || []).filter(Boolean).forEach((label) => {
      const span = document.createElement("span");
      span.className = "chip gem";
      span.textContent = label;
      container.appendChild(span);
    });
  }

  function updatePreview() {
    if (ui.prevName) ui.prevName.textContent = state.name || "Your Name";
    const info = computeBirthdayInfo(state.birthday);
    if (ui.prevAge) ui.prevAge.textContent = info.date ? `Age: ${info.age}` : "Age: –";

    if (ui.tagZodiac) {
      ui.tagZodiac.hidden = !info.zodiac;
      if (info.zodiac) ui.tagZodiac.textContent = info.zodiac;
    }
    if (ui.tagChinese) {
      ui.tagChinese.hidden = !info.chinese;
      if (info.chinese) ui.tagChinese.textContent = info.chinese;
    }
    if (ui.tagLife) {
      ui.tagLife.hidden = !info.lifePathNumber;
      if (info.lifePathNumber) ui.tagLife.textContent = `Life path ${info.lifePathNumber}`;
    }
    if (ui.tagConn) {
      ui.tagConn.hidden = !state.connectionType;
      if (state.connectionType) ui.tagConn.textContent = state.connectionType;
    }

    renderListChips(ui.prevLove, state.loveLanguages);
    renderListChips(ui.prevValues, state.values);
    renderListChips(ui.prevHobbies, state.hobbies);

    if (ui.prevAbout) {
      ui.prevAbout.textContent = norm(state.about) || "—";
      ui.prevAbout.classList.toggle("empty", !norm(state.about));
    }

    if (ui.prevAvatar) {
      const mainSlot = state.mainPhotoSlot;
      const src = mainSlot && state[`profilePhoto${mainSlot}`]
        ? state[`profilePhoto${mainSlot}`]
        : state.profilePhoto1 || state.profilePhoto2 || state.profilePhoto3 || "";
      if (src) {
        ui.prevAvatar.src = src;
        ui.prevAvatar.alt = "Profile photo";
      } else {
        ui.prevAvatar.removeAttribute("src");
        ui.prevAvatar.alt = "No photo yet";
      }
    }
  }

  function makeChip(label, value, pressed) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.dataset.value = value;
    btn.setAttribute("aria-pressed", pressed ? "true" : "false");

    const ico = document.createElement("span");
    ico.className = "ico";
    ico.textContent = "✦";

    const lab = document.createElement("span");
    lab.className = "label";
    lab.textContent = label;

    const check = document.createElement("span");
    check.className = "check";
    check.setAttribute("aria-hidden", "true");
    check.textContent = pressed ? "✓" : "";

    btn.appendChild(ico);
    btn.appendChild(lab);
    btn.appendChild(check);
    btn._check = check;
    return btn;
  }

  function setPressed(btn, on) {
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    if (btn._check) btn._check.textContent = on ? "✓" : "";
  }

  function buildSingleChips(container, labels, currentValue, onChange) {
    if (!container) return;
    container.innerHTML = "";
    const cur = lower(currentValue);

    labels.forEach((lbl) => {
      const chip = makeChip(lbl, lbl, cur && lower(lbl) === cur);
      chip.addEventListener("click", () => {
        const already = chip.getAttribute("aria-pressed") === "true";
        if (already) return;
        $$("button.chip", container).forEach((b) => setPressed(b, b === chip));
        onChange(lbl);
      });
      container.appendChild(chip);
    });
  }

  function buildMultiChips(container, labels, currentList, onChange, options) {
    if (!container) return;
    container.innerHTML = "";
    const opts = options || {};
    const reorderOnActiveClick = !!opts.reorderOnActiveClick;
    const set = new Set((currentList || []).map((x) => norm(x)));

    labels.forEach((lbl) => {
      const chip = makeChip(lbl, lbl, set.has(lbl));
      chip.addEventListener("click", () => {
        const isOn = chip.getAttribute("aria-pressed") === "true";
        let next = (currentList || []).map((x) => norm(x)).filter(Boolean);

        if (!isOn) {
          setPressed(chip, true);
          if (!next.includes(lbl)) next.push(lbl);
        } else if (reorderOnActiveClick) {
          next = next.filter((x) => x !== lbl);
          next.unshift(lbl);
        } else {
          setPressed(chip, false);
          next = next.filter((x) => x !== lbl);
        }

        currentList = uniq(next);
        onChange(currentList);
      });
      container.appendChild(chip);
    });
  }

  function ensureTextInput(mount, id, placeholder) {
    if (!mount) return null;
    let input = $("#" + id);
    if (input) return input;
    input = document.createElement("input");
    input.id = id;
    input.type = "text";
    input.placeholder = placeholder || "";
    input.style.marginTop = "8px";
    mount.appendChild(input);
    return input;
  }

  function showGenderSelfInput(show) {
    if (!ui.genderSelfMount) return null;
    if (!show) {
      ui.genderSelfMount.innerHTML = "";
      return null;
    }
    return ensureTextInput(ui.genderSelfMount, "genderSelf", "Describe your gender…");
  }

  function showConnectWithCustomInput(show) {
    if (!ui.connectWithCustomMount) return null;
    if (!show) {
      ui.connectWithCustomMount.innerHTML = "";
      return null;
    }
    return ensureTextInput(ui.connectWithCustomMount, "connectWithCustom", "Custom preference…");
  }


  function boolFromAny(value) {
    return value === true || value === "true" || value === 1 || value === "1";
  }

  function bestPublicPhoto(data) {
    if (!data || typeof data !== "object") return "";
    const slot = Number(data.mainPhotoSlot || data.primaryPhotoSlot || 1);
    const slotKey = Number.isFinite(slot) && slot >= 1 && slot <= 3 ? `profilePhoto${slot}` : "profilePhoto1";
    return norm(data[slotKey] || data.profilePhoto1 || data.profilePhoto2 || data.profilePhoto3);
  }

  function buildPublicProfilePayload(privateProfile, user) {
    const data = privateProfile && typeof privateProfile === "object" ? privateProfile : {};
    const displayName = norm(data.name || (user && user.displayName) || "Soulink tester");
    const publicPhoto = bestPublicPhoto(data);

    return {
      uid: user.uid,
      ownerUid: user.uid,
      discoverable: true,
      displayName,
      name: displayName,
      age: norm(data.age),
      country: norm(data.country),
      connectionType: norm(data.connectionType),
      connectWith: uniq(toArray(data.connectWith || data.seekingGender).map(norm)).filter(Boolean),
      seekingGender: uniq(toArray(data.connectWith || data.seekingGender).map(norm)).filter(Boolean),
      loveLanguage: norm(data.loveLanguage),
      loveLanguages: uniq(toArray(data.loveLanguages || data.loveLanguage).map(normaliseLoveLanguageOne)).filter(Boolean),
      values: uniq(toArray(data.values).map(norm)).filter(Boolean).slice(0, 8),
      hobbies: uniq(toArray(data.hobbies || data.interests).map(norm)).filter(Boolean).slice(0, 8),
      interests: uniq(toArray(data.hobbies || data.interests).map(norm)).filter(Boolean).slice(0, 8),
      zodiac: norm(data.zodiac),
      westernZodiac: norm(data.zodiac || data.westernZodiac),
      chineseZodiac: norm(data.chineseZodiac),
      lifePathNumber: norm(data.lifePathNumber || data.lifePath),
      lifePath: norm(data.lifePath || data.lifePathNumber),
      publicPhoto,
      profilePhoto1: publicPhoto,
      shortAbout: norm(data.about || data.aboutMe || data.soulSummary).slice(0, 280),
      updatedAt: serverTimestamp()
    };
  }

  async function syncPublicProfile(user, profilePayload) {
    if (!user) return;

    const wantsPublic = !!(profilePayload && profilePayload.discoverableProfile);
    const publicRef = doc(db, "publicProfiles", user.uid);

    if (!wantsPublic) {
      try {
        await deleteDoc(publicRef);
        console.log("[Soulink] Public tester profile disabled");
      } catch (err) {
        console.warn("[Soulink] Public tester profile delete skipped", err);
      }
      return;
    }

    await setDoc(publicRef, buildPublicProfilePayload(profilePayload, user), { merge: true });
    console.log("[Soulink] Public tester profile synced");
  }

  function initPhotos() {
    function initSlot(slot) {
      const file = ui[`file${slot}`];
      const thumb = ui[`thumb${slot}`];
      const remove = ui[`remove${slot}`];
      const ph = ui[`ph${slot}`];
      const main = ui[`main${slot}`];
      const key = `profilePhoto${slot}`;

      function sync() {
        const url = state[key] || "";
        if (thumb) {
          if (url) {
            thumb.src = url;
            thumb.style.opacity = "1";
          } else {
            thumb.removeAttribute("src");
            thumb.style.opacity = "0";
          }
        }
        if (ph) ph.classList.toggle("has-photo", !!url);
      }

      sync();

      if (file && !file.dataset.boundChange) {
        file.dataset.boundChange = "1";
        file.addEventListener("change", async (ev) => {
          const f = ev.target.files && ev.target.files[0];
          console.log("[Soulink] Photo selected:", f);
          if (!f) return;

          const reader = new FileReader();
          reader.onload = async (e) => {
            const dataUrl = String(e.target && e.target.result ? e.target.result : "");
            state[key] = dataUrl;
            state = persistPatch({ [key]: dataUrl });
            sync();
            updatePreview();

            try {
              const user = await waitForAuthUser();
              if (!user) {
                console.warn("[Soulink] No authenticated user for upload.");
                file.value = "";
                return;
              }

              const storageRef = ref(storage, `users/${user.uid}/${key}`);
              const response = await fetch(dataUrl);
              const blob = await response.blob();
              await uploadBytes(storageRef, blob);
              const downloadURL = await getDownloadURL(storageRef);

              state[key] = downloadURL;
              state = persistPatch({ [key]: downloadURL });

              await setDoc(doc(db, "users", user.uid), {
                [key]: downloadURL,
                updatedAt: serverTimestamp()
              }, { merge: true });

              if (state.discoverableProfile) {
                const publicPayload = collectPayloadFromState();
                await syncPublicProfile(user, publicPayload);
              }

              sync();
              updatePreview();
              console.log(`[Soulink] ${key} uploaded successfully`);
            } catch (err) {
              console.error(`[Soulink] Upload failed for ${key}:`, err);
            } finally {
              file.value = "";
            }
          };
          reader.readAsDataURL(f);
        });
      }

      if (file && !file.dataset.boundTrigger) {
        const triggers = document.querySelectorAll(`[data-file-trigger="file${slot}"]`);
        triggers.forEach((el) => {
          el.addEventListener("click", (ev) => {
            if (ev.target && ev.target.closest && ev.target.closest(".star")) return;
            ev.preventDefault();
            file.click();
          });
        });
        file.dataset.boundTrigger = "1";
      }

      if (remove && !remove.dataset.boundClick) {
        remove.dataset.boundClick = "1";
        remove.addEventListener("click", (ev) => {
          ev.preventDefault();
          state[key] = "";
          state = persistPatch({ [key]: "" });
          if (file) file.value = "";
          sync();
          updatePreview();
        });
      }

      if (main && !main.dataset.boundClick) {
        main.dataset.boundClick = "1";
        main.addEventListener("click", (ev) => {
          ev.preventDefault();
          state.mainPhotoSlot = slot;
          state.primaryPhotoSlot = slot;
          state = persistPatch({ mainPhotoSlot: slot, primaryPhotoSlot: slot });
          updatePreview();
        });
      }
    }

    initSlot(1);
    initSlot(2);
    initSlot(3);
  }

  function initTags(container, defaults, initialList, onChange) {
    if (!container) return { addCustom() {} };

    const base = defaults.slice();
    let current = uniq(toArray(initialList).map(norm)).filter(Boolean);
    current.forEach((x) => {
      if (!base.includes(x)) base.push(x);
    });

    function rerender() {
      buildMultiChips(container, base, current, (next) => {
        current = uniq(next);
        onChange(current);
      }, { reorderOnActiveClick: true });
    }

    function addCustom(label) {
      const clean = norm(label);
      if (!clean) return;
      if (!base.includes(clean)) base.push(clean);
      if (!current.includes(clean)) current.push(clean);
      current = uniq(current);
      onChange(current);
      rerender();
    }

    rerender();
    return { addCustom, rerender };
  }

  function normaliseStateFromRaw(raw) {
    const out = Object.assign({}, raw || {});
    out.name = norm(raw.name);
    out.country = norm(raw.country);
    out.birthday = norm(raw.birthday);
    out.height = norm(raw.height);
    out.weight = norm(raw.weight);
    out.kg = norm(raw.kg || raw.weight);
    out.connectionType = normaliseConnectionType(raw.connectionType);

    const rawLoveList = raw.loveLanguages || raw.loveLanguage || [];
    const rawLovePrimary = raw.loveLanguage || (Array.isArray(rawLoveList) ? rawLoveList[0] : rawLoveList);
    out.loveLanguages = normaliseLoveLanguages(rawLoveList, rawLovePrimary);
    out.loveLanguage = out.loveLanguages[0] || "";

    const rawGender = norm(raw.genderSelf || raw.gender);
    const genderStandard = GENDER_LABELS.slice(0, 4).find((x) => lower(x) === lower(rawGender));
    if (genderStandard) {
      out.gender = genderStandard;
      out.genderSelf = "";
      out._genderMode = "standard";
    } else if (rawGender) {
      out.gender = rawGender;
      out.genderSelf = rawGender;
      out._genderMode = "self";
    } else {
      out.gender = "";
      out.genderSelf = "";
      out._genderMode = "none";
    }

    const connectRaw = toArray(raw.connectWith || raw.seekingGender || []);
    const mapped = [];
    let customValue = norm(raw.connectWithCustom);
    connectRaw.forEach((item) => {
      const s = lower(item);
      const mappedLabel = CONNECT_WITH_CODE_TO_LABEL[s] || CONNECT_WITH_LABELS.find((x) => lower(x) === s) || norm(item);
      if (!mappedLabel) return;
      if (CONNECT_WITH_LABELS.includes(mappedLabel)) {
        mapped.push(mappedLabel);
      } else {
        if (!customValue) customValue = mappedLabel;
        mapped.push("Custom preference");
      }
    });

    out.connectWith = uniq(mapped);
    out.seekingGender = uniq(mapped);
    out.connectWithCustom = customValue;
    out.orientation = normaliseFromLabelsOrKeep(raw.orientation || raw.orientationChoice || raw.orientationText, ORIENTATION_LABELS);
    out.hobbies = uniq(toArray(raw.hobbies || raw.interests).map(norm)).filter(Boolean);
    out.interests = out.hobbies.slice();
    out.values = uniq(toArray(raw.values).map(norm)).filter(Boolean);
    out.unacceptable = norm(raw.unacceptable || raw.boundaries || raw.unacceptableBehavior || raw.notAllowed || raw.noGo);
    out.boundaries = out.unacceptable;
    out.about = norm(raw.about || raw.aboutMe);
    out.aboutMe = out.about;
    out.mantra = norm(raw.mantra);
    out.spiritualBeliefs = norm(raw.spiritualBeliefs);
    out.soulSummary = norm(raw.soulSummary);
    out.discoverableProfile = boolFromAny(raw.discoverableProfile || raw.discoverable || raw.showInDiscovery || raw.publicProfileVisible);
    out.profilePhoto1 = norm(raw.profilePhoto1);
    out.profilePhoto2 = norm(raw.profilePhoto2);
    out.profilePhoto3 = norm(raw.profilePhoto3);
    out.mainPhotoSlot = raw.mainPhotoSlot || raw.primaryPhotoSlot || null;
    out.primaryPhotoSlot = out.mainPhotoSlot;

    const birthdayInfo = computeBirthdayInfo(out.birthday);
    out.age = birthdayInfo.age != null && birthdayInfo.age !== "" ? String(birthdayInfo.age) : "";
    out.zodiac = birthdayInfo.zodiac || "";
    out.chineseZodiac = birthdayInfo.chinese || "";
    out.lifePathNumber = birthdayInfo.lifePathNumber || "";
    out.lifePath = birthdayInfo.lifePath || "";
    return out;
  }

  function collectPayloadFromState() {
    const love = normaliseLoveLanguages(state.loveLanguages, state.loveLanguages[0]);
    const birthdayInfo = computeBirthdayInfo(state.birthday);

    return {
      name: norm(state.name),
      country: norm(state.country),
      birthday: norm(state.birthday),
      height: norm(state.height),
      weight: norm(state.weight),
      kg: norm(state.weight),
      age: birthdayInfo.age != null && birthdayInfo.age !== "" ? String(birthdayInfo.age) : "",
      zodiac: birthdayInfo.zodiac || "",
      chineseZodiac: birthdayInfo.chinese || "",
      lifePathNumber: birthdayInfo.lifePathNumber || "",
      lifePath: birthdayInfo.lifePath || "",
      connectionType: norm(state.connectionType),
      loveLanguages: love,
      loveLanguage: love[0] || "",
      gender: norm(state.gender),
      genderSelf: norm(state.genderSelf),
      connectWith: uniq(toArray(state.connectWith).map(norm)).filter(Boolean),
      seekingGender: uniq(toArray(state.connectWith).map(norm)).filter(Boolean),
      connectWithCustom: norm(state.connectWithCustom),
      orientation: norm(state.orientation),
      orientationChoice: norm(state.orientation),
      orientationText: "",
      hobbies: uniq(toArray(state.hobbies).map(norm)).filter(Boolean),
      interests: uniq(toArray(state.hobbies).map(norm)).filter(Boolean),
      values: uniq(toArray(state.values).map(norm)).filter(Boolean),
      unacceptable: norm(state.unacceptable),
      boundaries: norm(state.unacceptable),
      unacceptableBehavior: norm(state.unacceptable),
      about: norm(state.about),
      aboutMe: norm(state.about),
      mantra: norm(state.mantra),
      spiritualBeliefs: norm(state.spiritualBeliefs),
      soulSummary: norm(state.soulSummary),
      discoverableProfile: !!state.discoverableProfile,
      publicProfileVisible: !!state.discoverableProfile,
      profilePhoto1: norm(state.profilePhoto1),
      profilePhoto2: norm(state.profilePhoto2),
      profilePhoto3: norm(state.profilePhoto3),
      mainPhotoSlot: state.mainPhotoSlot || null,
      primaryPhotoSlot: state.mainPhotoSlot || null
    };
  }

  function prefillInputsFromState() {
    if (ui.name) ui.name.value = state.name || "";
    if (ui.country) ui.country.value = state.country || "";
    if (ui.birthday) ui.birthday.value = state.birthday || "";
    if (ui.boundaries) ui.boundaries.value = state.unacceptable || "";
    if (ui.aboutMe) ui.aboutMe.value = state.about || "";
    if (ui.discoverableProfile) ui.discoverableProfile.checked = !!state.discoverableProfile;
  }

  function bindText(el, key) {
    if (!el) return;
    const handler = () => {
      state[key] = el.value || "";
      state = persistPatch({ [key]: state[key] });
      if (key === "birthday") {
        const derived = collectPayloadFromState();
        state = persistPatch({
          age: derived.age,
          zodiac: derived.zodiac,
          chineseZodiac: derived.chineseZodiac,
          lifePathNumber: derived.lifePathNumber,
          lifePath: derived.lifePath
        });
        updateBirthdayHint();
      }
      updatePreview();
    };
    el.addEventListener("change", handler);
    el.addEventListener("blur", handler);
  }



  function bindDiscoverableProfile() {
    if (!ui.discoverableProfile) return;
    ui.discoverableProfile.checked = !!state.discoverableProfile;
    ui.discoverableProfile.addEventListener("change", () => {
      state.discoverableProfile = !!ui.discoverableProfile.checked;
      state.publicProfileVisible = !!state.discoverableProfile;
      state = persistPatch({
        discoverableProfile: state.discoverableProfile,
        publicProfileVisible: state.publicProfileVisible
      });
    });
  }

  function initChips() {
    buildSingleChips(ui.connectionChips, CONNECTION_TYPE_LABELS, state.connectionType, (lbl) => {
      state.connectionType = lbl;
      state = persistPatch({ connectionType: lbl });
      updatePreview();
    });

    buildMultiChips(ui.loveChips, LOVE_LANGUAGE_LIST, state.loveLanguages, (next) => {
      const normalised = normaliseLoveLanguages(next, next[0] || "");
      state.loveLanguages = normalised;
      state.loveLanguage = normalised[0] || "";
      state = persistPatch({ loveLanguages: normalised, loveLanguage: state.loveLanguage });
      updatePreview();
    });

    const genderSelected = state._genderMode === "self"
      ? "Self-describe"
      : normaliseFromLabelsOrKeep(state.gender, GENDER_LABELS.slice(0, 4)) || "";

    buildSingleChips(ui.genderIdChips, GENDER_LABELS, genderSelected, (lbl) => {
      if (lbl === "Self-describe") {
        const input = showGenderSelfInput(true);
        if (input) {
          input.value = state.genderSelf || state.gender || "";
          const handler = () => {
            const v = norm(input.value);
            state.gender = v;
            state.genderSelf = v;
            state._genderMode = "self";
            state = persistPatch({ gender: v, genderSelf: v });
            updatePreview();
          };
          input.addEventListener("change", handler);
          input.addEventListener("blur", handler);
          setTimeout(() => input.focus(), 0);
        }
      } else {
        showGenderSelfInput(false);
        state.gender = lbl;
        state.genderSelf = "";
        state._genderMode = lbl ? "standard" : "none";
        state = persistPatch({ gender: lbl, genderSelf: "" });
        updatePreview();
      }
    });

    const hasCustom = norm(state.connectWithCustom) !== "" || (state.connectWith || []).includes("Custom preference");
    const initialConnectList = uniq([].concat(state.connectWith || []));
    if (hasCustom && !initialConnectList.includes("Custom preference")) initialConnectList.push("Custom preference");

    buildMultiChips(ui.connectWithChips, CONNECT_WITH_LABELS, initialConnectList, (next) => {
      const nextList = uniq(next);
      const customOn = nextList.includes("Custom preference");
      let customValue = norm(state.connectWithCustom);
      if (!customOn) customValue = "";

      state.connectWith = nextList;
      state.seekingGender = nextList;
      state.connectWithCustom = customValue;

      if (customOn) {
        const input = showConnectWithCustomInput(true);
        if (input) {
          input.value = customValue || "";
          const handler = () => {
            state.connectWithCustom = norm(input.value);
            state = persistPatch({
              connectWith: state.connectWith,
              seekingGender: state.connectWith,
              connectWithCustom: state.connectWithCustom
            });
            updatePreview();
          };
          input.addEventListener("change", handler);
          input.addEventListener("blur", handler);
        }
      } else {
        showConnectWithCustomInput(false);
      }

      state = persistPatch({
        connectWith: nextList,
        seekingGender: nextList,
        connectWithCustom: state.connectWithCustom
      });
      updatePreview();
    });

    const orientationSelected = normaliseFromLabelsOrKeep(state.orientation, ORIENTATION_LABELS);
    buildSingleChips(ui.orientationChips, ORIENTATION_LABELS, orientationSelected, (lbl) => {
      state.orientation = lbl;
      state = persistPatch({ orientation: lbl, orientationChoice: lbl, orientationText: "" });
      updatePreview();
    });
  }

  function initTagGroups() {
    const hobbyGroup = initTags(ui.hobbyChips, DEFAULT_HOBBIES, state.hobbies, (next) => {
      state.hobbies = next;
      state = persistPatch({ hobbies: next, interests: next });
      updatePreview();
    });

    const valueGroup = initTags(ui.valueChips, DEFAULT_VALUES, state.values, (next) => {
      state.values = next;
      state = persistPatch({ values: next });
      updatePreview();
    });

    if (ui.hobbyInput) {
      ui.hobbyInput.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const v = norm(ui.hobbyInput.value);
        if (!v) return;
        hobbyGroup.addCustom(v);
        ui.hobbyInput.value = "";
      });
    }

    if (ui.valueInput) {
      ui.valueInput.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const v = norm(ui.valueInput.value);
        if (!v) return;
        valueGroup.addCustom(v);
        ui.valueInput.value = "";
      });
    }
  }

  function saveAll() {
    const payload = collectPayloadFromState();
    state = persistPatch(payload);
    state = normaliseStateFromRaw(state);
    writeSoulRaw(state);
    updateBirthdayHint();
    updatePreview();
  }

  async function saveToFirestore() {
  try {
    const user = await waitForAuthUser();

    // Hard sync checkbox from DOM before collecting payload.
    // This prevents old state/localStorage from overriding the visible checkbox.
    const discoverableEl = document.getElementById("discoverableProfile");
    if (discoverableEl) {
      state.discoverableProfile = !!discoverableEl.checked;
      state.publicProfileVisible = !!discoverableEl.checked;
      writeSoulRaw(Object.assign({}, state, {
        discoverableProfile: state.discoverableProfile,
        publicProfileVisible: state.publicProfileVisible
      }));
    }

    const payload = collectPayloadFromState();

    // Force payload to match the visible checkbox too.
    if (discoverableEl) {
      payload.discoverableProfile = !!discoverableEl.checked;
      payload.publicProfileVisible = !!discoverableEl.checked;
    }

    console.log("[Soulink] Save payload discoverable:", {
      checked: discoverableEl ? discoverableEl.checked : null,
      payloadDiscoverable: payload.discoverableProfile
    });

    state = normaliseStateFromRaw(Object.assign({}, state, payload));
    writeSoulRaw(state);

    if (!user) {
      console.log("[Soulink] Using local fallback");
      showSaveStatus("Saved locally ✨", true);
      return true;
    }

    await setDoc(doc(db, "users", user.uid), {
      ...payload,
      uid: user.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });

    await syncPublicProfile(user, Object.assign({}, payload, { uid: user.uid }));

    console.log("[Soulink] Saved profile to Firestore");
    showSaveStatus("Saved to Soulink ✨", true);
    return true;
  } catch (err) {
    console.error("[Soulink] Save failed", err);
    showSaveStatus("Save failed — check Console", false);
    return false;
  }
}


  function clearLocalSoulinkData(user) {
    try {
      localStorage.removeItem(PRIMARY_KEY);
      localStorage.removeItem(LEGACY_KEY);
      localStorage.removeItem("soulink.friends.list");
      localStorage.removeItem("soulink.friends");
      localStorage.removeItem("soulFriends");
      localStorage.removeItem("friends");
      if (user && user.uid) {
        localStorage.removeItem("soulink.friends.list." + user.uid);
      }
    } catch (err) {
      console.warn("[Soulink] Local cleanup skipped", err);
    }
  }

  async function deleteKnownStoragePhotos(user) {
    if (!user || !user.uid) return;
    const paths = PHOTO_KEYS.map((key) => `users/${user.uid}/${key}`);

    await Promise.all(paths.map(async (path) => {
      try {
        await deleteObject(ref(storage, path));
      } catch (err) {
        // It is OK if a photo was never uploaded or was already removed.
        console.warn("[Soulink] Photo delete skipped:", path, err && err.code ? err.code : err);
      }
    }));
  }

  async function deleteSoulinkAccount() {
    const firstConfirm = window.confirm(
      "Delete your Soulink profile? This will remove your private profile, public tester profile, saved local data, and uploaded profile photos. This cannot be undone."
    );
    if (!firstConfirm) return;

    const typed = window.prompt('Type DELETE to confirm permanent deletion.');
    if (typed !== "DELETE") {
      showSaveStatus("Deletion cancelled", true);
      return;
    }

    const user = await waitForAuthUser();
    if (!user) {
      clearLocalSoulinkData(null);
      state = normaliseStateFromRaw({});
      showSaveStatus("Local Soulink data deleted", true);
      window.location.href = "index.html";
      return;
    }

    const btn = ui.deleteAccount;
    const oldText = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Deleting...";
    }

    try {
      await deleteKnownStoragePhotos(user);

      try {
        await deleteDoc(doc(db, "publicProfiles", user.uid));
      } catch (err) {
        console.warn("[Soulink] Public profile delete skipped", err);
      }

      try {
        await deleteDoc(doc(db, "users", user.uid));
      } catch (err) {
        console.warn("[Soulink] Private profile delete skipped", err);
      }

      clearLocalSoulinkData(user);
      state = normaliseStateFromRaw({});

      try {
        await deleteUser(user);
        showSaveStatus("Soulink account deleted", true);
           } catch (err) {
        console.warn("[Soulink] Auth account delete skipped; recent login may be required", err);

        window.alert(
          "Your Soulink profile data has been deleted.\n\n" +
          "To also remove your login email from our system, please log in one more time and confirm deletion again — Firebase requires this as a security step.\n\n" +
          "If you skip this, your email may stay registered but holds no Soulink profile data, and you may not be able to re-sign up with the same email.\n\n" +
          "We recommend logging in again if you want to finish full account deletion."
        );

        await signOut(auth);
        showSaveStatus("Profile data deleted. Login again to finish deleting the login email.", true);
      }

      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 900);
    } catch (err) {
      console.error("[Soulink] Account deletion failed", err);
      showSaveStatus("Delete failed — check Console", false);
      if (btn) {
        btn.disabled = false;
        btn.textContent = oldText || "Delete My Account";
      }
    }
  }

  function initActions() {
    if (ui.backQuiz) {
      ui.backQuiz.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "quiz.html";
      });
    }

    if (ui.saveBtn) {
      ui.saveBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        saveAll();
        await saveToFirestore();
      });
    }

    if (ui.nextSoul) {
      ui.nextSoul.addEventListener("click", async (e) => {
        e.preventDefault();
        saveAll();
        const ok = await saveToFirestore();
        if (ok) window.location.href = "my-soul.html";
      });
    }

    const topNextSoul = document.getElementById("topNextSoul");

if (topNextSoul) {
  topNextSoul.addEventListener("click", async (e) => {
    e.preventDefault();
    saveAll();
    const ok = await saveToFirestore();
    if (ok) window.location.href = "my-soul.html";
  });
}

    if (ui.resetForm) {
      ui.resetForm.addEventListener("click", (e) => {
        e.preventDefault();
        if (!window.confirm("Reset profile fields on this page?")) return;
        state = normaliseStateFromRaw({
          profilePhoto1: state.profilePhoto1,
          profilePhoto2: state.profilePhoto2,
          profilePhoto3: state.profilePhoto3,
          mainPhotoSlot: state.mainPhotoSlot
        });
        writeSoulRaw(state);
        prefillInputsFromState();
        initChips();
        initTagGroups();
        initPhotos();
        updateBirthdayHint();
        updatePreview();
        showSaveStatus("Profile reset locally", true);
      });
    }

    if (ui.deleteAccount) {
      ui.deleteAccount.addEventListener("click", async (e) => {
        e.preventDefault();
        await deleteSoulinkAccount();
      });
    }
  }

  async function init() {
    try {
      const local = readSoulRaw();
      const fire = await readFirestoreProfile();
      if (fire && typeof fire === "object") {
        state = normaliseStateFromRaw(Object.assign({}, local || {}, fire));
        writeSoulRaw(state);
      } else {
        console.log("[Soulink] Using local fallback");
        state = normaliseStateFromRaw(local || {});
      }
    } catch (err) {
      console.error("[Soulink] Firestore profile hydrate failed:", err);
      state = normaliseStateFromRaw(readSoulRaw() || {});
    }

    prefillInputsFromState();
    bindText(ui.name, "name");
    bindText(ui.country, "country");
    bindText(ui.birthday, "birthday");
    bindText(ui.boundaries, "unacceptable");
    bindText(ui.aboutMe, "about");
    bindDiscoverableProfile();

    initChips();
    initTagGroups();
    initPhotos();
    initActions();
    updateBirthdayHint();
    updatePreview();
  }

  init();
})();