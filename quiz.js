
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("quizForm");

  const fields = [
    { id: "name", label: "Name", type: "text" },
    { id: "birthday", label: "Birth Date (YYYY-MM-DD)", type: "date" },
    { id: "zodiac", label: "Western Zodiac", type: "text", readonly: true },
    { id: "chineseZodiac", label: "Chinese Zodiac", type: "text", readonly: true },
    { id: "country", label: "Country", type: "select", options: ["— Select your country —", "Lithuania", "Norway", "Germany", "USA", "UK", "Italy", "Spain", "France", "India", "Japan"] },
    { id: "height", label: "Height (cm)", type: "number" },
    { id: "weight", label: "Weight (kg)", type: "number" },
    {
      id: "relationshipType", label: "Type of Connection", type: "radio", options: [
        { value: "Romantic", label: "Romantic" },
        { value: "Friendship", label: "Friendship" },
        { value: "Both", label: "Both" }
      ]
    },
    {
      id: "loveLanguage", label: "Primary Love Language", type: "radio", options: [
        { value: "Words of Affirmation", label: "Words of Affirmation" },
        { value: "Acts of Service", label: "Acts of Service" },
        { value: "Receiving Gifts", label: "Receiving Gifts" },
        { value: "Quality Time", label: "Quality Time" },
        { value: "Physical Touch", label: "Physical Touch" }
      ]
    },
    { id: "loveLanguageDesc", label: "Love Language Description", type: "textarea" },
    { id: "hobbies", label: "Select Your Hobbies", type: "text" },
    { id: "values", label: "Values Most Important to You", type: "text" },
    { id: "unacceptable", label: "What Is Unacceptable in Relationships?", type: "textarea", placeholder: "e.g. dishonesty…" },
    { id: "about", label: "Tell Us More About Yourself", type: "textarea", placeholder: "I am looking for real friends" }
  ];

  const saved = JSON.parse(localStorage.getItem("soulQuiz")) || {};
  fields.forEach(field => {
    const wrapper = document.createElement("div");
    wrapper.className = "form-group";
    const label = document.createElement("label");
    label.htmlFor = field.id;
    label.innerText = field.label;
    wrapper.appendChild(label);

    let input;
    if (field.type === "select") {
      input = document.createElement("select");
      input.id = field.id;
      input.name = field.id;
      field.options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.innerText = opt;
        input.appendChild(o);
      });
    } else if (field.type === "radio") {
      input = document.createElement("div");
      field.options.forEach(opt => {
        const r = document.createElement("input");
        r.type = "radio";
        r.name = field.id;
        r.value = opt.value;
        r.id = field.id + "-" + opt.value;
        const l = document.createElement("label");
        l.htmlFor = r.id;
        l.innerText = opt.label;
        input.appendChild(r);
        input.appendChild(l);
      });
    } else if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.id = field.id;
      input.name = field.id;
      if (field.placeholder) input.placeholder = field.placeholder;
    } else {
      input = document.createElement("input");
      input.type = field.type;
      input.id = field.id;
      input.name = field.id;
      if (field.readonly) input.readOnly = true;
    }

    if (saved[field.id]) {
      if (field.type === "radio") {
        const selected = input.querySelector(`input[value="${saved[field.id]}"]`);
        if (selected) selected.checked = true;
      } else if (field.type === "select") {
        input.value = saved[field.id];
      } else {
        input.value = saved[field.id];
      }
    }

    wrapper.appendChild(input);
    form.appendChild(wrapper);
  });

  
  // Add auto-description for love language
  const loveLangRadios = document.querySelectorAll('input[name="loveLanguage"]');
  const loveDescInput = document.getElementById("loveLanguageDesc");
  const descriptions = {
    "Words of Affirmation": "Expressing love through kind and encouraging words.",
    "Acts of Service": "Doing helpful, caring actions to show love.",
    "Receiving Gifts": "Feeling loved through thoughtful presents and symbols.",
    "Quality Time": "Giving undivided attention and shared moments.",
    "Physical Touch": "Love felt through hugs, kisses, and closeness."
  };

  loveLangRadios.forEach(radio => {
    radio.addEventListener("change", function () {
      if (radio.checked && descriptions[radio.value]) {
        loveDescInput.value = descriptions[radio.value];
        loveDescInput.placeholder = descriptions[radio.value];
      }
    });
    radio.title = descriptions[radio.value] || "Choose your primary love language";
  });

  
    e.preventDefault();
    const data = {};
    fields.forEach(field => {
      if (field.type === "radio") {
        const selected = form.querySelector(`input[name="${field.id}"]:checked`);
        data[field.id] = selected ? selected.value : "";
      } else {
        const el = form.querySelector(`#${field.id}`);
        data[field.id] = el ? el.value : "";
      }
    });

    // Zodiac calculation
    if (data.birthday) {
      const d = new Date(data.birthday);
      data.zodiac = getWesternZodiac(d);
      data.chineseZodiac = getChineseZodiac(d.getFullYear());
    }

    localStorage.setItem("soulQuiz", JSON.stringify(data));
    alert("✅ Data saved!");
    window.location.href = "my-soul.html";
  });

  function getWesternZodiac(d) {
    const m = d.getMonth() + 1, day = d.getDate();
    if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return 'Aquarius';
    if ((m === 2 && day >= 19) || (m === 3 && day <= 20)) return 'Pisces';
    if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return 'Aries';
    if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return 'Taurus';
    if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return 'Gemini';
    if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return 'Cancer';
    if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return 'Leo';
    if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return 'Virgo';
    if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return 'Libra';
    if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return 'Scorpio';
    if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return 'Sagittarius';
    return 'Capricorn';
  }

  function getChineseZodiac(year) {
    const animals = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];
    return animals[year % 12];
  }

