document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("soulQuiz") || "{}");

  // Soul Summary
  const summaryBox = document.getElementById("soul-summary-box");
  if (data.name && data.loveLanguage && data.connectionType && data.bio) {
    summaryBox.innerHTML = `
      <div class="glow-box">
        <p><strong>${data.name}</strong> seeks a <strong>${data.connectionType}</strong> connection, communicates love through <strong>${data.loveLanguage}</strong>, and describes themselves as: <em>${data.bio}</em>.</p>
      </div>`;
  }

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || "–";
  };

  setText("userName", data.name);
  setText("birthday", data.birthday);
  setText("country", data.country);
  setText("height", data.height);
  setText("weight", data.weight);
  setText("connectionType", data.connectionType);
  setText("loveLanguage", data.loveLanguage);
  setText("unacceptable", data.unacceptable);
  setText("bio", data.bio);
  setText("westernZodiac", data.westernZodiac);
  setText("chineseZodiac", data.chineseZodiac);
  setText("lifePathNumber", data.lifePathNumber);

  const renderList = (id, arr) => {
    const ul = document.getElementById(id);
    if (ul) {
      ul.innerHTML = "";
      (arr || []).forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
    }
  };

  renderList("hobbiesList", data.hobbies);
  renderList("valuesList", data.values);
});
