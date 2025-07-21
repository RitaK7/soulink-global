
document.addEventListener("DOMContentLoaded", function () {
  populateCountries();

  function populateCountries() {
    const countries = [
      "Select your country", "Afghanistan", "Argentina", "Australia", "Belgium", "Brazil",
      "Canada", "Denmark", "France", "Germany", "India", "Italy", "Japan",
      "Lithuania", "Netherlands", "Norway", "Poland", "Portugal", "Spain", "Sweden", "USA", "UK"
    ];
    const countrySelect = document.getElementById("country");
    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country;
      option.text = country;
      countrySelect.appendChild(option);
    });
  }
});

function saveQuiz() {
  const data = {
    name: document.getElementById("name").value,
    birthDate: document.getElementById("birthDate").value,
    country: document.getElementById("country").value,
    height: document.getElementById("height").value,
    weight: document.getElementById("weight").value,
    unacceptable: document.getElementById("unacceptable").value,
    about: document.getElementById("about").value,
  };
  localStorage.setItem("soulQuiz", JSON.stringify(data));
  window.location.href = "my-soul.html";
}
