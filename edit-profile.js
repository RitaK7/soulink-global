// edit-profile.js — Soulink
// Uses shared data helpers: getSoulData, patchSoulData, ensureSoulDataShape (from data-helpers.js)
// Prefills Edit Profile from quiz data and keeps it in sync via patchSoulData().

(function () {
  // Bail out if data helpers are missing AND localStorage is unavailable
  if (typeof window === "undefined") return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ===== Data helpers wrapper =====
  function readSoulData() {
    try {
      if (typeof getSoulData === "function") {
        // Allow data-helpers to normalise shape if it supports an options object
        try {
          const data = getSoulData({ ensureShape: true });
          if (data) return data;
        } catch (e) {
          // Fallback: older signature without options
          const data = getSoulData();
          if (data) return data;
        }
      }
    } catch (e) {
      console.warn("Soulink: getSoulData threw, using localStorage fallback", e);
    }

    // Fallback to direct localStorage read (keeps compatibility with older builds)
    try {
      const primary = localStorage.getItem("soulink.soulQuiz");
      const legacy = localStorage.getItem("soulQuiz");
      const raw = primary || legacy;
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn("Soulink: failed to read from localStorage", e);
      return {};
    }
  }

  function writeSoulPatch(patch) {
    if (!patch || typeof patch !== "object") return;

    let merged;
    try {
      if (typeof patchSoulData === "function") {
        patchSoulData(patch);
        // After patching, re-read to keep local state fresh
        merged = readSoulData();
      } else {
        // Fallback: merge manually into localStorage
        const current = readSoulData() || {};
        merged = Object.assign({}, current, patch);
        const json = JSON.stringify(merged);
        try {
          localStorage.setItem("soulink.soulQuiz", json);
          localStorage.setItem("soulQuiz", json);
        } catch (e) {
          console.warn("Soulink: failed to persist patch to localStorage", e);
        }
      }
    } catch (e) {
      console.error("Soulink: patchSoulData failed", e);
    }

    // Return the fresh snapshot so callers can update in-memory copy
    return merged || readSoulData() || {};
  }

  // ===== Option catalogues for chips =====

  const CONNECTION_TYPES = [
    { value: "romantic", label: "Romantic relationship" },
    { value: "friendship", label: "Friendship" },
    { value: "both", label: "Both (romantic & friendship)" },
    { value: "networking", label: "Open to any connection" },
  ];

  const LOVE_LANGUAGES = [
    { value: "words", label: "Words of Affirmation" },
    { value: "quality", label: "Quality Time" },
    { value: "service", label: "Acts of Service" },
    { value: "touch", label: "Physical Touch" },
    { value: "gifts", label: "Gifts" },
  ];

  const GENDER_OPTS = [
    { value: "woman", label: "Woman" },
    { value: "man", label: "Man" },
    { value: "nonbinary", label: "Non-binary" },
    { value: "nosay", label: "Prefer not to say" },
    { value: "self", label: "Self-describe" },
  ];

  const CONNECT_OPTS = [
    { value: "women", label: "Women" },
    { value: "men", label: "Men" },
    { value: "nonbinary", label: "Non-binary" },
    { value: "all", label: "Open to all" },
    { value: "custom", label: "Custom preference" },
  ];

  const ORIENTATION_OPTS = [
    { value: "heterosexual", label: "Heterosexual" },
    { value: "gay", label: "Gay" },
    { value: "lesbian", label: "Lesbian" },
    { value: "bisexual", label: "Bisexual" },
    { value: "pansexual", label: "Pansexual" },
    { value: "asexual", label: "Asexual" },
    { value: "queer", label: "Queer" },
    { value: "questioning", label: "Questioning" },
    { value: "nosay", label: "Prefer not to say" },
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

  // ===== DOM cache =====

  const ui = {
    // basics
    name: $("#name"),
    country: $("#country"),
    birthday: $("#birthday"),
    birthdayHint: $("#birthdayHint"),

    // chips
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

    // long-form text
    boundaries: $("#boundaries"),
    aboutMe: $("#aboutMe"),

    // photos
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

    // actions
    backQuiz: $("#backQuiz"),
    saveBtn: $("#saveBtn"),
    nextSoul: $("#nextSoul"),
    resetForm: $("#resetForm"),

    // preview
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

  // Local snapshot of soul data, kept in sync with storage
  let soul = readSoulData() || {};
  if (!soul || typeof soul !== "object") soul = {};

  // ===== Small utils =====

  function toArray(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return [v];
  }

  function normaliseText(v) {
    return (v || "").toString().trim();
  }

  function uniquePush(list, value) {
    const out = list.slice();
    if (!out.includes(value)) out.push(value);
    return out;
  }

  function removeFromList(list, value) {
    return list.filter((v) => v !== value);
  }

  function computeBirthdayInfo(birthdayRaw) {
    const raw = normaliseText(birthdayRaw);
    if (!raw) return {};

    // accept "YYYY-MM-DD" or "YYYYMMDD" or "YYYY.MM.DD"
    const digits = raw.replace(/[^\d]/g, "");
    let year, month, day;
    if (/^\d{8}$/.test(digits)) {
      year = Number(digits.slice(0, 4));
      month = Number(digits.slice(4, 6));
      day = Number(digits.slice(6, 8));
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parts = raw.split("-");
      year = Number(parts[0]);
      month = Number(parts[1]);
      day = Number(parts[2]);
    } else {
      return {};
    }

    const dt = new Date(Date.UTC(year, month - 1, day));
    if (isNaN(dt.getTime())) return {};

    const now = new Date();
    let age = now.getFullYear() - year;
    const m = now.getMonth() - (month - 1);
    const d = now.getDate() - day;
    if (m < 0 || (m === 0 && d < 0)) age -= 1;

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
      // 1900 is a Rat year; adjust index
      const idx = (y - 1900) % 12;
      return animals[(idx + 12) % 12];
    }

    function lifePath(yyyy, mm, dd) {
      const digitsAll =
        String(yyyy) +
        String(mm).padStart(2, "0") +
        String(dd).padStart(2, "0");
      const sumDigits = (s) =>
        s.split("").reduce((acc, ch) => acc + Number(ch || 0), 0);
      let n = sumDigits(digitsAll);
      const isMaster = (x) => x === 11 || x === 22 || x === 33;
      while (n > 9 && !isMaster(n)) {
        n = sumDigits(String(n));
      }
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
    if (!ui.birthday || !ui.birthdayHint) return;
    const info = computeBirthdayInfo(ui.birthday.value);
    if (!info.date) {
      ui.birthdayHint.textContent =
        "Example: 1993-02-24 (or type 19930224)";
      return;
    }
    const pieces = [];
    if (Number.isFinite(info.age)) pieces.push("Age: " + info.age);
    if (info.zodiac) pieces.push("Zodiac: " + info.zodiac);
    if (info.chinese) pieces.push("Chinese sign: " + info.chinese);
    if (info.lifePath) pieces.push("Life path: " + info.lifePath);
    ui.birthdayHint.textContent = pieces.join(" • ");
  }

  // ===== Preview rendering =====

  function renderListChips(container, items) {
    if (!container) return;
    const list = (items || []).filter(Boolean);
    container.innerHTML = "";
    if (!list.length) return;
    list.forEach((label) => {
      const span = document.createElement("span");
      span.className = "chip gem";
      span.textContent = label;
      container.appendChild(span);
    });
  }

  function updatePreview() {
    if (!ui.prevName || !ui.prevAge) return;

    const data = soul || {};

    // Name
    ui.prevName.textContent = normaliseText(data.name) || "Your Name";

    // Age + tags
    const info = computeBirthdayInfo(data.birthday);
    if (info.date) {
      ui.prevAge.textContent = Number.isFinite(info.age)
        ? "Age: " + info.age
        : "Age: –";
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
    } else {
      ui.prevAge.textContent = "Age: –";
      if (ui.tagZodiac) ui.tagZodiac.hidden = true;
      if (ui.tagChinese) ui.tagChinese.hidden = true;
      if (ui.tagLife) ui.tagLife.hidden = true;
    }

    // Connection tag
    if (ui.tagConn) {
      const ct = normaliseText(data.connectionType);
      if (ct) {
        ui.tagConn.hidden = false;
        ui.tagConn.textContent = ct;
      } else {
        ui.tagConn.hidden = true;
      }
    }

    // Lists
    const loveList = toArray(data.loveLanguages || data.loveLanguage).map(
      String
    );
    renderListChips(ui.prevLove, loveList);

    renderListChips(ui.prevValues, toArray(data.values));
    renderListChips(
      ui.prevHobbies,
      toArray(data.hobbies || data.interests)
    );

    if (ui.prevAbout) {
      const about = normaliseText(data.about || data.aboutMe);
      ui.prevAbout.textContent = about || "";
    }

    // Avatar
    if (ui.prevAvatar) {
      const photos = [
        data.profilePhoto1,
        data.profilePhoto2,
        data.profilePhoto3,
      ].filter(Boolean);
      const mainSlot = data.mainPhotoSlot || data.primaryPhotoSlot;
      let src = "";
      if (mainSlot && data["profilePhoto" + mainSlot]) {
        src = data["profilePhoto" + mainSlot];
      } else if (photos.length) {
        src = photos[0];
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

  function applyPatch(patch) {
    if (!patch || typeof patch !== "object") return;
    soul = Object.assign({}, soul, patch);
    writeSoulPatch(patch);
    updatePreview();
  }

  // ===== Chip builders =====

  function createChip(
    label,
    value,
    { selected = false, onToggle, multiple = false } = {}
  ) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.dataset.value = value;
    btn.setAttribute("aria-pressed", selected ? "true" : "false");
    btn.innerHTML = '<span class="ico">✦</span><span class="label"></span>';
    const labelSpan = btn.querySelector(".label");
    if (labelSpan) labelSpan.textContent = label;
    else btn.textContent = label;

    btn.addEventListener("click", () => {
      const nowPressed = btn.getAttribute("aria-pressed") === "true";
      const nextPressed = multiple ? !nowPressed : true;

      if (!multiple && !nowPressed) {
        // turn off siblings
        const parent = btn.parentElement;
        if (parent) {
          $$("button.chip", parent).forEach((other) => {
            if (other === btn) return;
            other.setAttribute("aria-pressed", "false");
          });
        }
      }

      btn.setAttribute("aria-pressed", nextPressed ? "true" : "false");
      if (typeof onToggle === "function") {
        onToggle({ value, label, pressed: nextPressed, button: btn });
      }
    });

    return btn;
  }

  function initSingleChoiceChips(
    container,
    options,
    currentValue,
    { onChange } = {}
  ) {
    if (!container) return;
    container.innerHTML = "";
    const currentNorm = normaliseText(currentValue).toLowerCase();

    options.forEach((opt) => {
      const isSelected =
        currentNorm &&
        (currentNorm === String(opt.value).toLowerCase() ||
          currentNorm === String(opt.label).toLowerCase());

      const chip = createChip(opt.label, opt.value, {
        selected: isSelected,
        multiple: false,
        onToggle: ({ pressed }) => {
          if (!pressed) {
            if (typeof onChange === "function") onChange("");
            return;
          }
          if (typeof onChange === "function") onChange(opt.value);
        },
      });
      container.appendChild(chip);
    });
  }

  function initMultiChoiceChips(
    container,
    options,
    currentList,
    { onChange } = {}
  ) {
    if (!container) return;
    container.innerHTML = "";

    const set = new Set(toArray(currentList).map((v) => String(v)));

    options.forEach((opt) => {
      const isSelected =
        set.has(String(opt.value)) || set.has(String(opt.label));

      const chip = createChip(opt.label, opt.value, {
        selected: isSelected,
        multiple: true,
        onToggle: ({ pressed }) => {
          let next = toArray(currentList).map(String);
          if (pressed) {
            next = uniquePush(next, opt.value);
          } else {
            next = removeFromList(next, opt.value);
          }
          if (typeof onChange === "function") onChange(next);
          currentList = next;
        },
      });
      container.appendChild(chip);
    });
  }

  function initTagChipGroup(container, defaults, existingList, fieldName) {
    if (!container) return;

    let current = toArray(existingList);

    const options = defaults.map((label) => ({ value: label, label }));

    // Ensure custom items from data also appear as chips
    toArray(existingList).forEach((label) => {
      if (!defaults.includes(label)) {
        options.push({ value: label, label });
      }
    });

    const rerender = () => {
      initMultiChoiceChips(container, options, current, {
        onChange: (next) => {
          current = next;
          const patch = {};
          patch[fieldName] = next;
          applyPatch(patch);
        },
      });
    };

    rerender();

    return {
      addCustom(label) {
        const clean = normaliseText(label);
        if (!clean) return;
        if (!defaults.includes(clean)) defaults.push(clean);
        if (!options.find((o) => o.label === clean)) {
          options.push({ value: clean, label: clean });
        }
        current = uniquePush(current, clean);
        const patch = {};
        patch[fieldName] = current;
        applyPatch(patch);
        rerender();
      },
    };
  }

  // ===== Photos =====

  function initPhotoSlot(slot) {
    const file = ui["file" + slot];
    const thumb = ui["thumb" + slot];
    const remove = ui["remove" + slot];
    const ph = ui["ph" + slot];
    const main = ui["main" + slot];

    if (!file && !thumb && !remove && !ph && !main) return;

    const key = "profilePhoto" + slot;

    function syncFromData() {
      const url = soul[key];
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

    syncFromData();

    if (file) {
      file.addEventListener("change", (ev) => {
        const f = ev.target.files && ev.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = String(e.target?.result || "");
          const patch = {};
          patch[key] = dataUrl;
          applyPatch(patch);
          syncFromData();
        };
        reader.readAsDataURL(f);
      });
    }

    if (remove) {
      remove.addEventListener("click", (ev) => {
        ev.preventDefault();
        const patch = {};
        patch[key] = "";
        applyPatch(patch);
        syncFromData();
      });
    }

    if (main) {
      main.addEventListener("click", (ev) => {
        ev.preventDefault();
        applyPatch({ mainPhotoSlot: slot });
      });
    }
  }

  // ===== Binding for basics =====

  function bindTextField(el, fieldName, { transform, extraPatch } = {}) {
    if (!el) return;

    const initial = soul[fieldName];
    if (initial != null && initial !== undefined) {
      el.value = String(initial);
    }

    const handler = () => {
      let value = el.value;
      if (transform) value = transform(value);
      const patch = Object.assign({ [fieldName]: value }, extraPatch || {});
      applyPatch(patch);
      if (fieldName === "birthday") {
        updateBirthdayHint();
      }
    };

    el.addEventListener("change", handler);
    el.addEventListener("blur", handler);
  }

  function bindLongTextField(el, fieldName) {
    if (!el) return;
    const initial =
      soul[fieldName] ||
      soul[fieldName === "about" ? "aboutMe" : "unacceptable"];
    if (initial != null) el.value = String(initial);

    const handler = () => {
      const patch = {};
      patch[fieldName] = el.value || "";
      applyPatch(patch);
    };
    el.addEventListener("change", handler);
    el.addEventListener("blur", handler);
  }

  function initBasics() {
    bindTextField(ui.name, "name");
    bindTextField(ui.country, "country");
    bindTextField(ui.birthday, "birthday");

    bindLongTextField(ui.boundaries, "unacceptable");
    bindLongTextField(ui.aboutMe, "about");
  }

  // ===== Binding for chips & complex fields =====

  function initChips() {
    // Connection type (single)
    if (ui.connectionChips) {
      initSingleChoiceChips(
        ui.connectionChips,
        CONNECTION_TYPES,
        soul.connectionType,
        {
          onChange: (value) => {
            // Store the readable label for connectionType
            const opt = CONNECTION_TYPES.find((o) => o.value === value);
            const label = opt ? opt.label : value;
            applyPatch({ connectionType: label || "" });
          },
        }
      );
    }

    // Love languages (multi, plus primary)
    if (ui.loveChips) {
      const existing = toArray(
        soul.loveLanguages || soul.loveLanguage || []
      );
      initMultiChoiceChips(ui.loveChips, LOVE_LANGUAGES, existing, {
        onChange: (next) => {
          const arr = toArray(next);
          const primary = arr[0] || "";
          applyPatch({
            loveLanguages: arr,
            loveLanguage: primary,
          });
        },
      });
    }

    // Gender identity
    if (ui.genderIdChips) {
      const genderSelfInput =
        $("#genderSelf") ||
        (ui.genderSelfMount
          ? ui.genderSelfMount.querySelector("input")
          : null);

      const currentGender = soul.genderSelf || soul.gender || "";

      initSingleChoiceChips(
        ui.genderIdChips,
        GENDER_OPTS,
        currentGender,
        {
          onChange: (value) => {
            const opt = GENDER_OPTS.find((o) => o.value === value);
            const label = opt ? opt.label : value;

            if (value === "self") {
              // ensure text input exists
              let input = genderSelfInput;
              if (!input && ui.genderSelfMount) {
                input = document.createElement("input");
                input.id = "genderSelf";
                input.type = "text";
                input.placeholder = "Describe your gender…";
                ui.genderSelfMount.appendChild(input);
              }
              if (input) {
                input.value = soul.genderSelf || "";
                input.focus();
                input.addEventListener("change", () => {
                  applyPatch({
                    gender: input.value || "",
                    genderSelf: input.value || "",
                  });
                });
              }
            } else {
              applyPatch({
                gender: label,
                genderSelf: "",
              });
            }
          },
        }
      );
    }

    // Who you want to connect with (multi)
    if (ui.connectWithChips) {
      const existing = toArray(soul.seekingGender || soul.connectWith);
      initMultiChoiceChips(ui.connectWithChips, CONNECT_OPTS, existing, {
        onChange: (next) => {
          applyPatch({
            seekingGender: next,
            connectWith: next,
          });
        },
      });
    }

    // Orientation (single)
    if (ui.orientationChips) {
      initSingleChoiceChips(
        ui.orientationChips,
        ORIENTATION_OPTS,
        soul.orientation,
        {
          onChange: (value) => {
            const opt = ORIENTATION_OPTS.find((o) => o.value === value);
            applyPatch({
              orientation: opt ? opt.label : value,
            });
          },
        }
      );
    }

    // Hobbies / Values tags
    let hobbyGroup, valueGroup;

    if (ui.hobbyChips) {
      hobbyGroup = initTagChipGroup(
        ui.hobbyChips,
        DEFAULT_HOBBIES.slice(),
        soul.hobbies || soul.interests,
        "hobbies"
      );
    }

    if (ui.valueChips) {
      valueGroup = initTagChipGroup(
        ui.valueChips,
        DEFAULT_VALUES.slice(),
        soul.values,
        "values"
      );
    }

    if (ui.hobbyInput && hobbyGroup) {
      ui.hobbyInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const txt = ui.hobbyInput.value;
          ui.hobbyInput.value = "";
          hobbyGroup.addCustom(txt);
        }
      });
    }

    if (ui.valueInput && valueGroup) {
      ui.valueInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const txt = ui.valueInput.value;
          ui.valueInput.value = "";
          valueGroup.addCustom(txt);
        }
      });
    }
  }

  // ===== Actions =====

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

    if (ui.resetForm) {
      ui.resetForm.addEventListener("click", (e) => {
        e.preventDefault();
        const ok = window.confirm(
          "Clear your saved profile on this device?"
        );
        if (!ok) return;
        const patch = {
          name: "",
          birthday: "",
          country: "",
          connectionType: "",
          loveLanguage: "",
          loveLanguages: [],
          gender: "",
          genderSelf: "",
          seekingGender: [],
          connectWith: [],
          orientation: "",
          hobbies: [],
          values: [],
          unacceptable: "",
          about: "",
          aboutMe: "",
          profilePhoto1: "",
          profilePhoto2: "",
          profilePhoto3: "",
          mainPhotoSlot: null,
        };
        applyPatch(patch);
        // Also reset form fields visually
        if (ui.name) ui.name.value = "";
        if (ui.country) ui.country.value = "";
        if (ui.birthday) ui.birthday.value = "";
        if (ui.boundaries) ui.boundaries.value = "";
        if (ui.aboutMe) ui.aboutMe.value = "";
      });
    }

    if (ui.saveBtn) {
      ui.saveBtn.addEventListener("click", (e) => {
        e.preventDefault();
        // All changes are already patched live; just give a gentle confirmation
        try {
          const evt = new CustomEvent("soulink:saved", { bubbles: true });
          document.dispatchEvent(evt);
        } catch (e2) {
          window.alert("Your profile has been saved on this device.");
        }
      });
    }
  }

  // ===== Init =====

  function init() {
    // Prefill raw inputs from data
    initBasics();

    // Chips & tags
    initChips();

    // Photos
    initPhotoSlot(1);
    initPhotoSlot(2);
    initPhotoSlot(3);

    // Actions (navigation, reset, save)
    initActions();

    // Initial hint + preview
    updateBirthdayHint();
    updatePreview();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
