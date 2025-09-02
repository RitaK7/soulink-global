// /assets/js/pages/my-soul.js
(function () {
  const {
    parseSoulQuiz,
    normalizeList,
    zodiacFromDate,
    chineseZodiac,
    lifePath,
    typeText,
  } = window.SoulUtils;

  const $id = (id) => document.getElementById(id);

  const ui = {
    avatar: $id("avatar"),
    userName: $id("userName"),
    nameInStory: $id("nameInStory"),
    zodiacTag: $id("zodiacTag"),
    chineseTag: $id("chineseTag"),
    lifePathTag: $id("lifePathTag"),
    connectionTag: $id("connectionTag"),
    storyText: $id("storyText"),

    loveList: $id("loveList"),
    loveEmpty: $id("loveEmpty"),

    valuesList: $id("valuesList"),
    valuesEmpty: $id("valuesEmpty"),

    hobbiesList: $id("hobbiesList"),
    hobbiesEmpty: $id("hobbiesEmpty"),

    summaryText: $id("summaryText"),

    regenBtn: $id("regenBtn"),
    copyBtn: $id("copyBtn"),
    editBtn: $id("editBtn"),
    homeBtn: $id("homeBtn"),
    downloadBtn: $id("downloadBtn"),
  };

  function pickPrimaryLove(loves) {
    return loves && loves.length ? loves[0] : null;
  }

  function buildBasicStory(data) {
    const name = data.name || "Friend";
    const sign = data.zodiac || zodiacFromDate(data.birthday) || "";
    const lp = data.lifePath || lifePath(data.birthday) || "";
    const loves = normalizeList(data.loveLanguages || data.loveLanguage);
    const primary = pickPrimaryLove(loves);
    const other = loves.filter((l) => l !== primary);
    const vals = normalizeList(data.values);
    const hobs = normalizeList(data.hobbies);

    const parts = [];
    parts.push(`Tavo siela švyti kaip žvaigždė, ${name}.`);
    if (sign) parts.push(`Gimei po ${sign} ženklu — jis dovanoja tau unikalias dovanas.`);
    if (lp) parts.push(`Tavo gyvenimo kelio skaičius ${lp} yra tavo vidinis kompasas.`);
    if (primary && other.length) {
      parts.push(`Tavo širdies kalba — ${primary}, bet ji atpažįsta ir ${other.join(", ")}.`);
    } else if (primary) {
      parts.push(`Tavo širdies kalba — ${primary}.`);
    }
    if (vals.length) parts.push(`Tave veda vertybės: ${vals.join(", ")}.`);
    if (hobs.length) parts.push(`Tavo kasdienybės ritualai: ${hobs.join(", ")}.`);
    return parts.join(" ");
  }

function buildSummary(d){
  const n = d.name || 'You';
  const loves = Array.isArray(d.loveLanguages) ? d.loveLanguages : (d.loveLanguage ? [d.loveLanguage] : []);
  const p = loves[0];
  const ct = d.connectionType || 'meaningful connections';
  const about = (d.about || '').trim();

  const blessing = 'Your soul is seeking resonance. Trust your path, and the right connections will find you.';

  // jei About turi mažai teksto — pridedam švelnų palaiminimą
  if (about) {
    const normalized = about.replaceAll('!','.').replaceAll('?','.');
    const count = normalized.split('.').filter(s => s.trim()).length;
    if (count < 2) {
      const ensured = normalized.trim().endsWith('.') ? normalized.trim() : normalized.trim() + '.';
      return ensured + ' ' + blessing;
    }
    return about;
  }

  const a = p
    ? `${n} is ready for ${ct}. Your heart blossoms in ${p}—let it be seen.`
    : `${n} is ready for ${ct}. Lead with your values and steady light.`;

  const b = `Trust your pace. The right souls will recognize your glow.`;
  return `${a} ${b} ${blessing}`;
}


  function render() {
    const data = parseSoulQuiz();

    // Avatar
    const avatar = data.profilePhoto1 || localStorage.getItem("profilePhoto1") || "";
    if (avatar) {
      ui.avatar.src = avatar;
      ui.avatar.alt = "avatar";
    } else {
      ui.avatar.src =
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="24" r="14" fill="%2300fdd833"/><rect x="10" y="40" width="44" height="18" rx="9" fill="%2300fdd820"/></svg>';
    }

    // Name & tags
    const name = data.name || "My Soul";
    ui.userName.textContent = name;
    ui.nameInStory.textContent = name;

    const sign = data.zodiac || zodiacFromDate(data.birthday);
    if (sign) {
      ui.zodiacTag.textContent = sign;
      ui.zodiacTag.classList.remove("hidden");
    }

    const byear = (() => {
      if (data.birthday) {
        const d = new Date(data.birthday);
        if (!isNaN(d.getTime())) return d.getFullYear();
        const yr = String(data.birthday).slice(0, 4);
        if (/^\d{4}$/.test(yr)) return Number(yr);
      }
      return null;
    })();

    const cz = chineseZodiac(byear);
    if (cz) {
      ui.chineseTag.textContent = cz;
      ui.chineseTag.classList.remove("hidden");
    }

    const lp = data.lifePath || lifePath(data.birthday);
    if (lp) {
      ui.lifePathTag.textContent = `Life Path ${lp}`;
      ui.lifePathTag.classList.remove("hidden");
    }

    const ct = data.connectionType;
    if (ct) {
      ui.connectionTag.textContent = ct;
      ui.connectionTag.classList.remove("hidden");
    }

    // Story (placeholder, vėliau jį keis GPT-5 išvestis)
    const story = buildBasicStory(data);
    typeText(ui.storyText, story);

    // Love Languages
    const loves = normalizeList(data.loveLanguages || data.loveLanguage);
    ui.loveList.innerHTML = "";
    if (loves.length) {
      loves.forEach((l, idx) => {
        const span = document.createElement("span");
        span.className = "chip" + (idx === 0 ? " primary" : "");
        span.textContent = idx === 0 ? `${l} · Primary` : l;
        ui.loveList.appendChild(span);
      });
      ui.loveEmpty.classList.add("hidden");
    } else {
      ui.loveEmpty.classList.remove("hidden");
    }

    // Values
    const vals = normalizeList(data.values);
    ui.valuesList.innerHTML = "";
    if (vals.length) {
      vals.forEach((v) => {
        const s = document.createElement("span");
        s.className = "chip";
        s.textContent = v;
        ui.valuesList.appendChild(s);
      });
      ui.valuesEmpty.classList.add("hidden");
    } else {
      ui.valuesEmpty.classList.remove("hidden");
    }

    // Hobbies
    const hobs = normalizeList(data.hobbies);
    ui.hobbiesList.innerHTML = "";
    if (hobs.length) {
      hobs.forEach((h) => {
        const s = document.createElement("span");
        s.className = "chip";
        s.textContent = h;
        ui.hobbiesList.appendChild(s);
      });
      ui.hobbiesEmpty.classList.add("hidden");
    } else {
      ui.hobbiesEmpty.classList.remove("hidden");
    }

    // Summary
    ui.summaryText.textContent = buildSummary(data);
  }

  // Actions
  function bindActions() {
    ui.regenBtn?.addEventListener("click", render);
    ui.copyBtn?.addEventListener("click", () => {
      const text = ui.storyText.textContent.trim();
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        ui.copyBtn.textContent = "Copied";
        setTimeout(() => (ui.copyBtn.textContent = "Copy"), 900);
      });
    });
    ui.editBtn?.addEventListener("click", () => (location.href = "edit-profile.html"));
    ui.homeBtn?.addEventListener("click", () => (location.href = "index.html"));
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindActions();
    render();
  });
})();
