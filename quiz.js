
document.getElementById("quiz-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const userData = {};

  formData.forEach((value, key) => {
    if (userData[key]) {
      if (Array.isArray(userData[key])) {
        userData[key].push(value);
      } else {
        userData[key] = [userData[key], value];
      }
    } else {
      userData[key] = value;
    }
  });

  localStorage.setItem("soulQuiz", JSON.stringify(userData));
  window.location.href = "my-soul.html";
});
