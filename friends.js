// friends.js — Soulink (polished)
// Simple friend list stored in localStorage 'soulinkFriends'.
// Compatibility score vs your profile from 'soulQuiz'.

(() => {
  const KEY_PROFILE = "soulQuiz";
  const KEY_FRIENDS = "soulinkFriends";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const me = (() => { try { return JSON.parse(localStorage.getItem(KEY_PROFILE) || "{}"); } catch { return {}; } })();
  const friends = (() => { try { return JSON.parse(localStorage.getItem(KEY_FRIENDS) || "[]"); } catch { return []; } })();

  // Snapshot
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || "–"; };
  set("me-name", me.name);
  set("me-ct", me.connectionType);
  set("me-ll", me.loveLanguage);
  set("me-hobbies", (me.hobbies && me.hobbies.length) ? me.hobbies.join(", ") : "–");
  set("me-values", (me.values && me.values.length) ? me.values.join(", ") : "–");

  // Scoring
  function tokenizeCSV(s) {
    return (s || "")
      .split(",")
      .map(x => x.trim())
      .filter(Boolean);
  }
  function scoreFriend(f) {
    let score = 50; // base
    // Connection
    if (me.connectionType && f.ct) {
      const match = (me.connectionType === f.ct) || f.ct === "Both" || me.connectionType === "Both";
      if (match) score += 20;
    }
    // Love language
    if (me.loveLanguage && f.ll && me.loveLanguage === f.ll) score += 20;

    // Hobbies overlap
    const myH = new Set((me.hobbies || []).map(String));
    const hisH = new Set((f.hobbies || []).map(String));
    let hShared = 0;
    hisH.forEach(h => { if (myH.has(h)) hShared++; });
    score += Math.min(20, hShared * 5);

    // Values overlap
    const myV = new Set((me.values || []).map(String));
    const hisV = new Set((f.values || []).map(String));
    let vShared = 0;
    hisV.forEach(v => { if (myV.has(v)) vShared++; });
    score += Math.min(30, vShared * 3);

    return Math.max(0, Math.min(100, score));
  }

  function saveFriends(arr) {
    localStorage.setItem(KEY_FRIENDS, JSON.stringify(arr));
  }

  // Render
  const container = $("#friends-list");
  const emptyNote = $("#empty-note");

  function render(list) {
    container.innerHTML = "";
    if (!list.length) {
      emptyNote.style.display = "block";
      return;
    }
    emptyNote.style.display = "none";
    list
      .map(f => ({ ...f, score: scoreFriend(f) }))
      .sort((a, b) => b.score - a.score)
      .forEach((f, i) => {
        const div = document.createElement("div");
        div.className = "friend";
        div.innerHTML = `
          <div class="row" style="justify-content:space-between;">
            <strong>${f.name || "Friend"}</strong>
            <span class="score">${f.score}</span>
          </div>
          <div style="margin-top:.3rem; font-size:.95rem;">
            <div><strong>Connection:</strong> ${f.ct || "–"}</div>
            <div><strong>Love Language:</strong> ${f.ll || "–"}</div>
            <div><strong>Hobbies:</strong> ${(f.hobbies && f.hobbies.length) ? f.hobbies.join(", ") : "–"}</div>
            <div><strong>Values:</strong> ${(f.values && f.values.length) ? f.values.join(", ") : "–"}</div>
          </div>
          <div class="row" style="margin-top:.5rem;">
            <button class="btn" data-del="${i}">Remove</button>
          </div>
        `;
        container.appendChild(div);
      });

    // delete handlers
    $$('[data-del]').forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = +btn.getAttribute("data-del");
        const arr = friends.slice();
        arr.splice(idx, 1);
        saveFriends(arr);
        location.reload();
      });
    });
  }

  render(friends);

  // Add form
  $("#add-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = {
      name: $("#f-name")?.value.trim(),
      ct: $("#f-ct")?.value,
      ll: $("#f-ll")?.value,
      hobbies: tokenizeCSV($("#f-hobbies")?.value),
      values: tokenizeCSV($("#f-values")?.value),
    };
    if (!f.name) { alert("Please enter a name."); return; }
    const arr = friends.slice();
    arr.push(f);
    saveFriends(arr);
    e.target.reset();
    render(arr);
  });

  // Clear all
  $("#clearAll")?.addEventListener("click", () => {
    if (confirm("Clear all friends?")) {
      saveFriends([]);
      location.reload();
    }
  });

  // Export / Import
  $("#exportFriends")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(friends, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "soulink-friends.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  $("#importFriends")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const arr = JSON.parse(ev.target.result);
        if (!Array.isArray(arr)) throw new Error("Not an array");
        saveFriends(arr);
        location.reload();
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  });
})();
