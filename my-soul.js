// my-soul.js (corrected to match quiz.js keys)
document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("soulQuiz")) || {};

  function display(id, val) {
    document.getElementById(id).textContent = 
      (val !== undefined && val !== null && val !== "") ? val : "–";
  }

  // Basic fields
  display("name",           data.name);
  display("birthdate",      data.birthdate);
  display("country",        data.country);
  display("height",         data.height);
  display("weight",         data.weight);

  // Connection & relationship
  display("connection",     data.connectionType);
  // You were using "Relationship Type" as a secondary slot — here we repurpose it
  // to show the love language again (or you can drop this line if you prefer)
  display("relationshipType", data.loveLanguage);

  // Lists
  display("hobbies",        (data.hobbies || []).join(", "));
  display("values",         (data.values  || []).join(", "));

  // Free‑form
  display("unacceptable",   data.unacceptable);
  display("soulMessage",    data.about);

  // Single‑choice
  display("loveLanguage",   data.loveLanguage);

  // Zodiacs (quiz.js stores these as simple strings)
  display("westernSign",    data.westernZodiac);
  // no description saved by quiz.js, so you can leave this blank or add one if you like
  display("westernDescription", "");

  display("chineseSign",    data.chineseZodiac);
  display("chineseDescription", "");

  // Life Path Number isn’t computed in quiz.js yet, so this will remain blank
  display("lifePathNumber",     "");
  display("lifePathDescription","");
});
