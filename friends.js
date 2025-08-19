// friends.js

// Load friends from localStorage
function loadFriends() {
  return JSON.parse(localStorage.getItem("friendsList") || "[]");
}

// Save friends to localStorage
function saveFriends(arr) {
  localStorage.setItem("friendsList", JSON.stringify(arr));
}

// Render all friends
function render(arr) {
  const listEl = document.getElementById("friendsList");
  listEl.innerHTML = "";

  arr.forEach((f, i) => {
    const card = document.createElement("div");
    card.className = "friend-card";

    card.innerHTML = `
      <h3>${f.name || "No Name"}</h3>
      <p><strong>Connection:</strong> ${f.connection || ""}</p>
      <p><strong>About:</strong> ${f.about || ""}</p>
      
      <div class="social-icons">
        ${f.whatsapp ? `<a href="https://wa.me/${f.whatsapp}" target="_blank" title="WhatsApp"><i class="bi bi-whatsapp"></i></a>` : ""}
        ${f.instagram ? `<a href="https://instagram.com/${f.instagram}" target="_blank" title="Instagram"><i class="bi bi-instagram"></i></a>` : ""}
        ${f.facebook ? `<a href="https://facebook.com/${f.facebook}" target="_blank" title="Facebook"><i class="bi bi-facebook"></i></a>` : ""}
      </div>

      <div class="card-actions">
        <button class="btn" data-edit="${i}">Edit</button>
        <button class="btn btn-danger" data-rm="${i}">Remove</button>
      </div>
    `;

    listEl.appendChild(card);
  });
}

// Handle form submit
document.getElementById("friendForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const arr = loadFriends();
  const idx = document.getElementById("friendIndex").value;

  const data = {
    name: document.getElementById("friendName").value.trim(),
    connection: document.getElementById("friendConnection").value.trim(),
    about: document.getElementById("friendAbout").value.trim(),
    whatsapp: document.getElementById("friendWhatsapp").value.trim(),
    instagram: document.getElementById("friendInstagram").value.trim(),
    facebook: document.getElementById("friendFacebook").value.trim(),
  };

  if (idx === "") {
    arr.push(data);
  } else {
    arr[idx] = data;
  }

  saveFriends(arr);
  render(arr);
  e.target.reset();
  document.getElementById("friendIndex").value = "";
});

// Edit function
function openEdit(i) {
  const arr = loadFriends();
  const f = arr[i];

  document.getElementById("friendName").value = f.name || "";
  document.getElementById("friendConnection").value = f.connection || "";
  document.getElementById("friendAbout").value = f.about || "";
  document.getElementById("friendWhatsapp").value = f.whatsapp || "";
  document.getElementById("friendInstagram").value = f.instagram || "";
  document.getElementById("friendFacebook").value = f.facebook || "";
  document.getElementById("friendIndex").value = i;
}

// Handle Edit / Remove buttons
document.getElementById("friendsList").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-edit],[data-rm]");
  if (!btn) return;
  e.preventDefault();

  if (btn.hasAttribute("data-edit")) {
    openEdit(+btn.getAttribute("data-edit"));
  } else {
    const i = +btn.getAttribute("data-rm");
    const arr = loadFriends();
    arr.splice(i, 1);
    saveFriends(arr);
    render(arr);
  }
});

// Init render
render(loadFriends());
