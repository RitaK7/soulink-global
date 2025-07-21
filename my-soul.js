
// my-soul.js – Soul Profile Viewer

window.addEventListener('DOMContentLoaded', () => {
  const data = JSON.parse(localStorage.getItem("soulQuiz") || "{}");

  function fill(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "Unknown";
  }

  fill("name", data.name);
  fill("birthdate", data.birthdate);
  fill("country", data.country);
  fill("height", data.height + " cm");
  fill("weight", data.weight + " kg");
  fill("connection", data.connection);
  fill("hobbies", (data.hobbies || []).join(", "));
  fill("values", (data.values || []).join(", "));
  fill("unacceptable", data.unacceptable);
  fill("about", data.about);

  fill("westernZodiac", data.westernZodiac || "Unknown");
  fill("chineseZodiac", data.chineseZodiac || "Unknown");
  fill("lifePath", data.lifePath || "Unknown");

  // Avatar
  const avatar = document.getElementById("avatar");
  if (avatar && data.name) {
    avatar.textContent = data.name.charAt(0).toUpperCase();
  }

  // Plan (Free or Premium)
  const planTag = document.getElementById("planTag");
  const plan = localStorage.getItem("plan") || "free";
  if (planTag) {
    planTag.textContent = plan === "premium" ? "💎 Premium" : "🔓 Free";
  }
});
