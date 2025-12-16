/* :contentReference[oaicite:1]{index=1} */
(function () {
  if (typeof window === "undefined") return;

  const PRIMARY_KEY = "soulink.soulQuiz";
  const LEGACY_KEY = "soulQuiz";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const LOVE_LANGUAGE_LIST = [
    "Words of Affirmation",
    "Quality Time",
    "Acts of Service",
    "Physical Touch",
    "Receiving Gifts",
  ];

  const CONNECTION_TYPE_LABELS = [
    "Romantic relationship",
    "Friendship",
    "Both (romantic & friendship)",
    "Open to any connection",
  ];

  const CONNECTION_TYPE_CODE_TO_LABEL = {
    romantic: "Romantic relationship",
    friendship: "Friendship",
    both: "Both (romantic & friendship)",
    networking: "Open to any connection",
  };

  const GENDER_LABELS = [
    "Woman",
    "Man",
    "Non-binary",
    "Prefer not to say",
    "Self-describe",
  ];

  const CONNECT_WITH_LABELS = [
    "Women",
    "Men",
    "Non-binary",
    "Open to all",
    "Custom preference",
  ];

  const CONNECT_WITH_CODE_TO_LABEL = {
    women: "Women",
    men: "Men",
    nonbinary: "Non-binary",
    all: "Open to all",
    custom: "Custom preference",
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
    "Prefer not to say",
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
    "Curiosity",
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

    backQuiz: $("#backQuiz"),
    saveBtn: $("#saveBtn"),
    nextSoul: $("#nextSoul"),
    resetForm: $("#resetForm"),

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
    prevAbout: $("#prevAbout"),
  };

  function norm(s) {
    return (s == null ? "" : String(s)).trim();
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
      if (!s) return;
      if (seen.has(s)) return;
      seen.add(s);
      out.push(s);
    });
    return out;
  }

  function readSoulRaw() {
    try {
      if (typeof getSoulData === "function") {
        try {
          const d = getSoulData({ ensureShape: true });
          if (d && typeof d === "object") return d;
        } catch (e) {
          const d = getSoulData();
          if (d && typeof d === "object") return d;
        }
      }
    } catch (e) {}
    try {
      const raw = localStorage.getItem(PRIMARY_KEY) || localStorage.getItem(LEGACY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function persistPatch(patch) {
    if (!patch || typeof patch !== "object") return state;
    const current = readSoulRaw() || {};
    const merged = Object.assign({}, current, patch);

    try {
      if (typeof patchSoulData === "function") {
        try {
          patchSoulData(patch);
        } catch (e) {}
      }
    } catch (e) {}

    try {
      const json = JSON.stringify(merged);
      localStorage.setItem(PRIMARY_KEY, json);
      localStorage.setItem(LEGACY_KEY, json);
    } catch (e) {}

    return merged;
  }

  function normaliseConnectionType(v) {
    const s = lower(v);
    if (!s) return "";
    if (CONNECTION_TYPE_CODE_TO_LABEL[s]) return CONNECTION_TYPE_CODE_TO_LABEL[s];

    const exact = CONNECTION_TYPE_LABELS.find((lbl) => lower(lbl) === s);
    if (exact) return exact;

    return norm(v);
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

    if (s === "words" || s === "wordsofaffirmation" || s === "words of affirmation") {
      return "Words of Affirmation";
    }
    if (s === "quality" || s === "qualitytime" || s === "quality time") {
      return "Quality Time";
    }
    if (s === "service" || s === "actsofservice" || s === "acts of service") {
      return "Acts of Service";
    }
    if (s === "touch" || s === "physicaltouch" || s === "physical touch") {
      return "Physical Touch";
    }
    if (
      s === "gifts" ||
      s === "gift" ||
      s === "receivinggifts" ||
      s === "receiving gifts" ||
      s === "gifts (receiving)" ||
      s === "gifts/receiving"
    ) {
      return "Receiving Gifts";
    }

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
    out = uniq(out);

    return out;
  }

  function computeBirthdayInfo(birthdayRaw) {
    const raw = norm(birthdayRaw);
    if (!raw) return {};

    const now = new Date();
    const currentYear = now.getFullYear();

    let year, month, day;

    function makeDateUTC(y, m, d) {
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
      if (y < 1000 || y > currentYear + 1) return null;
      if (m < 1 || m > 12) return null;
      if (d < 1 || d > 31) return null;

      const dt = new Date(Date.UTC(y, m - 1, d));
      if (isNaN(dt.getTime())) return null;

      if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;

      const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const birthLocal = new Date(y, m - 1, d);
      if (birthLocal.getTime() > todayLocal.getTime()) return null;

      return dt;
    }

    function trySet(y, m, d) {
      const dt = makeDateUTC(y, m, d);
      if (!dt) return null;
      year = y;
      month = m;
      day = d;
      return dt;
    }

    const digits = raw.replace(/[^\d]/g, "");

    if (/^\d{8}$/.test(digits)) {
      const y1 = Number(digits.slice(0, 4));
      const m1 = Number(digits.slice(4, 6));
      const d1 = Number(digits.slice(6, 8));

      const d2 = Number(digits.slice(0, 2));
      const m2 = Number(digits.slice(2, 4));
      const y2 = Number(digits.slice(4, 8));

      let dt = null;

      if (y1 > currentYear + 1) {
        dt = trySet(y2, m2, d2);
      } else {
        dt = trySet(y1, m1, d1);
        if (!dt) dt = trySet(y2, m2, d2);
      }

      if (!dt) return {};
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw) || /^\d{4}\/\d{2}\/\d{2}$/.test(raw)) {
      const parts = raw.split(/[-\/]/);
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      const dt = trySet(y, m, d);
      if (!dt) return {};
    } else if (/^\d{4}\.\d{2}\.\d{2}$/.test(raw)) {
      const parts = raw.split(".");
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      const dt = trySet(y, m, d);
      if (!dt) return {};
    } else if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw) || /^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const parts = raw.split(/[\.\/]/);
      const d = Number(parts[0]);
      const m = Number(parts[1]);
      const y = Number(parts[2]);
      const dt = trySet(y, m, d);
      if (!dt) return {};
    } else {
      return {};
    }

    const dt = new Date(Date.UTC(year, month - 1, day));

    let age = now.getFullYear() - year;
    const mDiff = now.getMonth() - (month - 1);
    const dDiff = now.getDate() - day;
    if (mDiff < 0 || (mDiff === 0 && dDiff < 0)) age -= 1;
    if (!Number.isFinite(age) || age < 0) return {};

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
        "Pig",
      ];
      const idx = (y - 1900) % 12;
      return animals[(idx + 12) % 12];
    }

    function lifePath(yyyy, mm, dd) {
      const digitsAll =
        String(yyyy) + String(mm).padStart(2, "0") + String(dd).padStart(2, "0");
      const sumDigits = (s) => s.split("").reduce((acc, ch) => acc + Number(ch || 0), 0);
      let n = sumDigits(digitsAll);
      const isMaster = (x) => x === 11 || x === 22 || x === 33;
      while (n > 9 && !isMaster(n)) n = sumDigits(String(n));
      return n;
    }

    return {
      date: dt,
      year,
      month,
      day,
      age,
      zodiac: zodiacSign(month, day),
      chinese: chineseZodiac(year),
      lifePath: lifePath(year, month, day),
    };
  }

  function updateBirthdayHint() {
    if (!ui.birthdayHint) return;
    const info = computeBirthdayInfo(state.birthday);
    if (!info.date) {
      ui.birthdayHint.textContent = "Example: 1993-02-24 (or type 19930224)";
      return;
    }
    const parts = [];
    if (Number.isFinite(info.age)) parts.push("Age: " + info.age);
    if (info.zodiac) parts.push("Zodiac: " + info.zodiac);
    if (info.chinese) parts.push("Chinese sign: " + info.chinese);
    if (info.lifePath) parts.push("Life path: " + info.lifePath);
    ui.birthdayHint.textContent = parts.join(" • ");
  }

  function renderListChips(container, items) {
    if (!container) return;
    const list = (items || []).filter(Boolean);
    container.innerHTML = "";
    list.forEach((label) => {
      const span = document.createElement("span");
      span.className = "chip gem";
      span.textContent = label;
      container.appendChild(span);
    });
  }

  function updatePreview() {
    if (ui.prevName) ui.prevName.textContent = state.name || "Your Name";

    const info = computeBirthdayInfo(state.birthday);
    if (ui.prevAge) ui.prevAge.textContent = info.date && Number.isFinite(info.age) ? "Age: " + info.age : "Age: –";

    if (ui.tagZodiac) {
      if (info.zodiac) {
        ui.tagZodiac.hidden = false;
        ui.tagZodiac.textContent = info.zodiac;
      } else {
        ui.tagZodiac.hidden = true;
      }
    }

    if (ui.tagChinese) {
      if (info.chinese) {
        ui.tagChinese.hidden = false;
        ui.tagChinese.textContent = info.chinese;
      } else {
        ui.tagChinese.hidden = true;
      }
    }

    if (ui.tagLife) {
      if (info.lifePath) {
        ui.tagLife.hidden = false;
        ui.tagLife.textContent = "Life path " + info.lifePath;
      } else {
        ui.tagLife.hidden = true;
      }
    }

    if (ui.tagConn) {
      if (state.connectionType) {
        ui.tagConn.hidden = false;
        ui.tagConn.textContent = state.connectionType;
      } else {
        ui.tagConn.hidden = true;
      }
    }

    renderListChips(ui.prevLove, state.loveLanguages);
    renderListChips(ui.prevValues, state.values);
    renderListChips(ui.prevHobbies, state.hobbies);

    if (ui.prevAbout) {
      const about = norm(state.about);
      ui.prevAbout.textContent = about || "—";
      ui.prevAbout.classList.toggle("empty", !about);
    }

    if (ui.prevAvatar) {
      const mainSlot = state.mainPhotoSlot;
      let src = "";
      if (mainSlot && state["profilePhoto" + mainSlot]) {
        src = state["profilePhoto" + mainSlot];
      } else {
        src = state.profilePhoto1 || state.profilePhoto2 || state.profilePhoto3 || "";
      }
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
      const pressed = cur && lower(lbl) === cur;
      const chip = makeChip(lbl, lbl, pressed);
      chip.addEventListener("click", () => {
        const already = chip.getAttribute("aria-pressed") === "true";
        if (already) return;
        $$("button.chip", container).forEach((b) => setPressed(b, b === chip));
        onChange(lbl);
      });
      container.appendChild(chip);
    });
  }

  function buildMultiChips(container, labels, currentList, onChange) {
    if (!container) return;
    container.innerHTML = "";
    const set = new Set((currentList || []).map((x) => norm(x)));

    labels.forEach((lbl) => {
      const pressed = set.has(lbl);
      const chip = makeChip(lbl, lbl, pressed);
      chip.addEventListener("click", () => {
        const isOn = chip.getAttribute("aria-pressed") === "true";
        const nextOn = !isOn;
        setPressed(chip, nextOn);

        let next = (currentList || []).map((x) => norm(x)).filter(Boolean);
        if (nextOn) {
          if (!next.includes(lbl)) next.push(lbl);
        } else {
          next = next.filter((x) => x !== lbl);
        }

        currentList = next;
        onChange(next);
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
    const input = ensureTextInput(ui.genderSelfMount, "genderSelf", "Describe your gender…");
    return input;
  }

  function showConnectWithCustomInput(show) {
    if (!ui.connectWithCustomMount) return null;
    if (!show) {
      ui.connectWithCustomMount.innerHTML = "";
      return null;
    }
    const input = ensureTextInput(ui.connectWithCustomMount, "connectWithCustom", "Custom preference…");
    return input;
  }

  function initPhotos() {
    function initSlot(slot) {
      const file = ui["file" + slot];
      const thumb = ui["thumb" + slot];
      const remove = ui["remove" + slot];
      const ph = ui["ph" + slot];
      const main = ui["main" + slot];
      const key = "profilePhoto" + slot;

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
        if (ph) {
          if (url) ph.classList.add("has-photo");
          else ph.classList.remove("has-photo");
        }
      }

      sync();

      if (file) {
        file.addEventListener("change", (ev) => {
          const f = ev.target.files && ev.target.files[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = String(e.target && e.target.result ? e.target.result : "");
            state[key] = dataUrl;
            state = persistPatch({ [key]: dataUrl });
            sync();
            updatePreview();
          };
          reader.readAsDataURL(f);
        });
      }

      if (remove) {
        remove.addEventListener("click", (ev) => {
          ev.preventDefault();
          state[key] = "";
          state = persistPatch({ [key]: "" });
          sync();
          updatePreview();
        });
      }

      if (main) {
        main.addEventListener("click", (ev) => {
          ev.preventDefault();
          state.mainPhotoSlot = slot;
          state = persistPatch({ mainPhotoSlot: slot });
          updatePreview();
        });
      }
    }

    initSlot(1);
    initSlot(2);
    initSlot(3);
  }

  function initTags(container, defaults, initialList, onChange) {
    if (!container) return { rerender() {}, addCustom() {} };

    const base = defaults.slice();
    let current = uniq(toArray(initialList).map(norm)).filter(Boolean);

    current.forEach((x) => {
      if (!base.includes(x)) base.push(x);
    });

    function rerender() {
      buildMultiChips(container, base, current, (next) => {
        current = uniq(next);
        onChange(current);
      });
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
    return { rerender, addCustom };
  }

  function collectPayloadFromState() {
    const love = normaliseLoveLanguages(state.loveLanguages, state.loveLanguages[0]);
    const payload = {
      name: norm(state.name),
      country: norm(state.country),
      birthday: norm(state.birthday),

      connectionType: norm(state.connectionType),

      loveLanguages: love,
      loveLanguage: love[0] || "",

      gender: norm(state.gender),
      genderSelf: norm(state.genderSelf),

      connectWith: uniq(toArray(state.connectWith).map(norm)).filter(Boolean),
      seekingGender: uniq(toArray(state.connectWith).map(norm)).filter(Boolean),
      connectWithCustom: norm(state.connectWithCustom),

      orientation: norm(state.orientation),

      hobbies: uniq(toArray(state.hobbies).map(norm)).filter(Boolean),
      values: uniq(toArray(state.values).map(norm)).filter(Boolean),

      unacceptable: norm(state.unacceptable),
      boundaries: norm(state.unacceptable),

      about: norm(state.about),
      aboutMe: norm(state.about),

      profilePhoto1: norm(state.profilePhoto1),
      profilePhoto2: norm(state.profilePhoto2),
      profilePhoto3: norm(state.profilePhoto3),

      mainPhotoSlot: state.mainPhotoSlot || null,
    };

    return payload;
  }

  function saveAll() {
    const payload = collectPayloadFromState();
    state = persistPatch(payload);
    updateBirthdayHint();
    updatePreview();
  }

  function normaliseStateFromRaw(raw) {
    const out = Object.assign({}, raw);

    out.name = norm(raw.name);
    out.country = norm(raw.country);
    out.birthday = norm(raw.birthday);

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

    out.orientation = normaliseFromLabelsOrKeep(raw.orientation, ORIENTATION_LABELS);

    out.hobbies = uniq(toArray(raw.hobbies || raw.interests).map(norm)).filter(Boolean);
    out.values = uniq(toArray(raw.values).map(norm)).filter(Boolean);

    out.unacceptable = norm(raw.unacceptable || raw.boundaries || raw.unacceptableBehavior || raw.notAllowed || raw.noGo);
    out.about = norm(raw.about || raw.aboutMe);

    out.profilePhoto1 = norm(raw.profilePhoto1);
    out.profilePhoto2 = norm(raw.profilePhoto2);
    out.profilePhoto3 = norm(raw.profilePhoto3);
    out.mainPhotoSlot = raw.mainPhotoSlot || raw.primaryPhotoSlot || null;

    return out;
  }

  function prefillInputsFromState() {
    if (ui.name) ui.name.value = state.name || "";
    if (ui.country) ui.country.value = state.country || "";
    if (ui.birthday) ui.birthday.value = state.birthday || "";
    if (ui.boundaries) ui.boundaries.value = state.unacceptable || "";
    if (ui.aboutMe) ui.aboutMe.value = state.about || "";
  }

  function bindText(el, key, { onAfter } = {}) {
    if (!el) return;
    const handler = () => {
      state[key] = el.value || "";
      state = persistPatch({ [key]: state[key] });
      if (key === "birthday") {
        updateBirthdayHint();
      }
      updatePreview();
      if (onAfter) onAfter();
    };
    el.addEventListener("change", handler);
    el.addEventListener("blur", handler);
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

    const genderSelected =
      state._genderMode === "self"
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
            state._genderMode = v ? "self" : "self";
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
              connectWithCustom: state.connectWithCustom,
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
        connectWithCustom: state.connectWithCustom,
      });
      updatePreview();
    });

    const orientationSelected = normaliseFromLabelsOrKeep(state.orientation, ORIENTATION_LABELS);
    buildSingleChips(ui.orientationChips, ORIENTATION_LABELS, orientationSelected, (lbl) => {
      state.orientation = lbl;
      state = persistPatch({ orientation: lbl });
      updatePreview();
    });
  }

  function initTagGroups() {
    const hobbyGroup = initTags(ui.hobbyChips, DEFAULT_HOBBIES, state.hobbies, (next) => {
      state.hobbies = next;
      state = persistPatch({ hobbies: next });
      updatePreview();
    });

    const valueGroup = initTags(ui.valueChips, DEFAULT_VALUES, state.values, (next) => {
      state.values = next;
      state = persistPatch({ values: next });
      updatePreview();
    });

    if (ui.hobbyInput) {
      ui.hobbyInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const t = ui.hobbyInput.value;
          ui.hobbyInput.value = "";
          hobbyGroup.addCustom(t);
        }
      });
    }

    if (ui.valueInput) {
      ui.valueInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const t = ui.valueInput.value;
          ui.valueInput.value = "";
          valueGroup.addCustom(t);
        }
      });
    }
  }

  function initActions() {
    if (ui.backQuiz) {
      ui.backQuiz.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "quiz.html";
      });
    }

    if (ui.nextSoul) {
      ui.nextSoul.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "my-soul.html";
      });
    }

    if (ui.saveBtn) {
      ui.saveBtn.addEventListener("click", (e) => {
        e.preventDefault();
        saveAll();
        try {
          const evt = new CustomEvent("soulink:saved", { bubbles: true });
          document.dispatchEvent(evt);
        } catch (e2) {}
      });
    }

    if (ui.resetForm) {
      ui.resetForm.addEventListener("click", (e) => {
        e.preventDefault();
        const ok = window.confirm("Clear your saved profile on this device?");
        if (!ok) return;

        try {
          localStorage.removeItem(PRIMARY_KEY);
          localStorage.removeItem(LEGACY_KEY);
        } catch (e2) {}

        state = {
          name: "",
          country: "",
          birthday: "",
          connectionType: "",
          loveLanguages: [],
          loveLanguage: "",
          gender: "",
          genderSelf: "",
          connectWith: [],
          seekingGender: [],
          connectWithCustom: "",
          orientation: "",
          hobbies: [],
          values: [],
          unacceptable: "",
          about: "",
          profilePhoto1: "",
          profilePhoto2: "",
          profilePhoto3: "",
          mainPhotoSlot: null,
          _genderMode: "none",
        };

        try {
          const json = JSON.stringify({});
          localStorage.setItem(PRIMARY_KEY, json);
          localStorage.setItem(LEGACY_KEY, json);
        } catch (e3) {}

        if (ui.genderSelfMount) ui.genderSelfMount.innerHTML = "";
        if (ui.connectWithCustomMount) ui.connectWithCustomMount.innerHTML = "";

        prefillInputsFromState();
        initChips();
        initTagGroups();
        initPhotos();

        updateBirthdayHint();
        updatePreview();
      });
    }
  }

  let state = {};

  function init() {
    const raw = readSoulRaw();
    state = normaliseStateFromRaw(raw);

    const needsFix =
      JSON.stringify(normaliseLoveLanguages(raw.loveLanguages || raw.loveLanguage || [], raw.loveLanguage)) !==
      JSON.stringify(state.loveLanguages) ||
      normaliseConnectionType(raw.connectionType) !== state.connectionType;

    if (needsFix) {
      const patch = collectPayloadFromState();
      state = persistPatch(patch);
      state = normaliseStateFromRaw(state);
    }

    prefillInputsFromState();

    bindText(ui.name, "name");
    bindText(ui.country, "country");
    bindText(ui.birthday, "birthday");

    if (ui.boundaries) {
      const handler = () => {
        state.unacceptable = ui.boundaries.value || "";
        state = persistPatch({ unacceptable: state.unacceptable, boundaries: state.unacceptable });
        updatePreview();
      };
      ui.boundaries.addEventListener("change", handler);
      ui.boundaries.addEventListener("blur", handler);
    }

    if (ui.aboutMe) {
      const handler = () => {
        state.about = ui.aboutMe.value || "";
        state = persistPatch({ about: state.about, aboutMe: state.about });
        updatePreview();
      };
      ui.aboutMe.addEventListener("change", handler);
      ui.aboutMe.addEventListener("blur", handler);
    }

    updateBirthdayHint();

    initChips();
    initTagGroups();
    initPhotos();
    initActions();

    if (state._genderMode === "self") {
      const input = showGenderSelfInput(true);
      if (input) input.value = state.genderSelf || state.gender || "";
      const chips = $$("button.chip", ui.genderIdChips || document);
      chips.forEach((b) => {
        if (b && b.dataset && b.dataset.value === "Self-describe") {
          setPressed(b, true);
        }
      });
    }

    const connectHasCustom =
      norm(state.connectWithCustom) !== "" ||
      (state.connectWith || []).includes("Custom preference") ||
      (state.seekingGender || []).includes("Custom preference");
    if (connectHasCustom) {
      const input = showConnectWithCustomInput(true);
      if (input) input.value = state.connectWithCustom || "";
    }

    updatePreview();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
