// my-soul.js (fixed)
document.addEventListener("DOMContentLoaded", function () {
  const data = JSON.parse(localStorage.getItem("soulQuiz")) || {};

  function display(fieldId, value) {
    document.getElementById(fieldId).textContent = value ?? "–";
  }

  // 1) Keys must match what quiz.js actually saves:
  display("name",           data.name);
  display("birthdate",      data.birthdate);
  display("country",        data.country);
  display("height",         data.height);
  display("weight",         data.weight);

  // Type of Connection was stored under "connectionType"
  display("connection",     data.connectionType);

  // If you still want "Relationship Type" as a second field,
  // you can repurpose it (e.g. show loveLanguage again), or drop it.
  display("relationshipType", data.loveLanguage);

  display("hobbies",        (data.hobbies || []).join(", "));
  display("values",         (data.values  || []).join(", "));
  display("unacceptable",   data.unacceptable);
  // in quiz.js you named the "About Me" field `about`
  display("soulMessage",    data.about);

  display("loveLanguage",   data.loveLanguage);

  // Western & Chinese zodiacs were saved as plain strings, not objects:
  display("westernSign",    data.westernZodiac);
  // you don't have descriptions saved, so leave blank (or add your own):
  display("westernDescription", "");

  display("chineseSign",    data.chineseZodiac);
  display("chineseDescription", "");

  // Life Path Number wasn’t computed yet in quiz.js, so this will stay blank:
  display("lifePathNumber",     "");
  display("lifePathDescription","");
});
