document.addEventListener("DOMContentLoaded", function () {
  const data = JSON.parse(localStorage.getItem("soulQuiz")) || {};

  function display(fieldId, value) {
    document.getElementById(fieldId).textContent = value || "–";
  }

  display("birthdate", data.birthday);
  display("country", data.country);
  display("height", data.height);
  display("weight", data.weight);
  display("connection", data.connection);
  display("relationshipType", data.relationshipType);
  display("hobbies", (data.hobbies || []).join(", "));
  display("values", (data.values || []).join(", "));
  display("unacceptable", data.unacceptable);
  display("soulMessage", data.about);
  display("loveLanguage", data.loveLanguage);
  display("name", data.name);

  display("westernSign", data.westernZodiac?.sign);
  display("westernDescription", data.westernZodiac?.description);

  display("chineseSign", data.chineseZodiac?.sign);
  display("chineseDescription", data.chineseZodiac?.description);

  display("lifePathNumber", data.lifePath?.number);
  display("lifePathDescription", data.lifePath?.description);

});