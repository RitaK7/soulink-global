document.addEventListener("DOMContentLoaded", function () {
  const soulQuiz = JSON.parse(localStorage.getItem("soulQuiz") || "{}");

  const fields = [
    { id: "name", label: "Name" },
    { id: "birthday", label: "Birthday" },
    { id: "type", label: "Type" },
    { id: "language", label: "Love Language" },
    { id: "hobbies", label: "Hobbies" },
    { id: "values", label: "Values" },
    { id: "unacceptable", label: "Unacceptable" },
    { id: "about", label: "About" },
  ];

  fields.forEach(field => {
    const span = document.getElementById(`${field.id}Display`);
    span.textContent = soulQuiz[field.id] || "Not provided";

    const btn = document.getElementById(`edit-${field.id}`);
    btn?.addEventListener("click", () => {
      const newVal = prompt(`Edit your ${field.label}`, soulQuiz[field.id] || "");
      if (newVal !== null) {
        soulQuiz[field.id] = newVal;
        span.textContent = newVal;
      }
    });
  });

  // Load photos
  for (let i = 1; i <= 3; i++) {
    const img = document.getElementById(`photo${i}Preview`);
    if (soulQuiz[`profilePhoto${i}`]) {
      img.src = soulQuiz[`profilePhoto${i}`];
    }
  }

  // Save button
  document.getElementById("saveBtn")?.addEventListener("click", () => {
    localStorage.setItem("soulQuiz", JSON.stringify(soulQuiz));
    alert("✅ Profile saved!");
  });
});