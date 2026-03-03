// Den här filen styr contacts-sidan
// Sök användare i DB + spara kontakter i contacts-tabellen

const $ = (selector, root = document) => root.querySelector(selector);

function getUserId() {
  // Jag tar userId från login (1.js sparar den)
  const id = localStorage.getItem("userId");
  return id ? Number(id) : 0;
}

function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

function clearAuthAndGoHome() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");
  window.location.href = "PublicHome1.html";
}

// Jag håller koll på "vem jag hittade" så Send Request vet exakt user
let lastFoundUser = null;

async function searchUserInDB(q) {
  const res = await fetch(`/users/search?q=${encodeURIComponent(q)}`);
  let data = {};
  try { data = await res.json(); } catch (e) {}
  return { res, data };
}

async function loadContactsFromDB() {
  const userId = getUserId();
  if (!userId) return;

  const res = await fetch(`/contacts?userId=${encodeURIComponent(userId)}`);
  let data = {};
  try { data = await res.json(); } catch (e) {}

  if (!res.ok) {
    alert(data.message || "Kunde inte hämta kontakter.");
    return;
  }

  renderContactsList(data.contacts || []);
}

function renderContactsList(contacts) {
  const list = $("#my-contacts-list");
  const empty = $("#contacts-empty");
  if (!list) return;

  list.innerHTML = "";

  if (contacts.length === 0) {
    if (empty) empty.style.display = "block";
    return;
  }

  if (empty) empty.style.display = "none";

  contacts.forEach((c) => {
    // Jag bygger samma struktur som din CSS redan stylar (contact-item)
    const li = document.createElement("li");
    li.className = "contact-item";

    // Lite info + en delete-knapp (rent, inga style-grejer här)
    li.innerHTML = `
      <i class="fa-solid fa-user-circle"></i>
      <span>${c.username}</span>
      <button class="decline-btn" data-contact-id="${c.contactId}" type="button">Remove</button>
    `;

    list.appendChild(li);
  });
}

async function addContactToDB(searchValue) {
  const userId = getUserId();
  if (!userId) {
    alert("Du är inte inloggad.");
    return;
  }

  const res = await fetch("/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, q: searchValue }),
  });

  let data = {};
  try { data = await res.json(); } catch (e) {}

  if (!res.ok) {
    alert(data.message || "Kunde inte lägga till kontakt.");
    return false;
  }

  return true;
}

async function removeContactFromDB(contactId) {
  const userId = getUserId();
  if (!userId) return;

  const res = await fetch(`/contacts/${encodeURIComponent(contactId)}?userId=${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });

  let data = {};
  try { data = await res.json(); } catch (e) {}

  if (!res.ok) {
    alert(data.message || "Kunde inte ta bort kontakten.");
    return false;
  }

  return true;
}

// 1) Sök-knappen: söker på riktigt i DB
async function performSearch() {
  const input = $("#search-input");
  const resultBox = $("#result-box");
  const usernameDisplay = $("#username-display");

  if (!input || !resultBox || !usernameDisplay) return;

  const q = input.value.trim();
  if (!q) {
    alert("Skriv username eller email.");
    return;
  }

  try {
    const { res, data } = await searchUserInDB(q);

    if (!res.ok) {
      lastFoundUser = null;
      resultBox.style.display = "none";
      alert(data.message || "Ingen användare hittades.");
      return;
    }

    lastFoundUser = data.user;

    // Visar resultatkortet bara när det är en riktig user
    usernameDisplay.textContent = `Found: ${lastFoundUser.username}`;
    resultBox.style.display = "flex";
  } catch (err) {
    console.error(err);
    alert("Server error vid sökning.");
  }
}

// 2) Send Request: sparar kontakten i DB
async function sendFriendRequest() {
  const input = $("#search-input");
  const resultBox = $("#result-box");

  if (!lastFoundUser) {
    alert("Sök först, och se till att användaren finns.");
    return;
  }

  // Jag skickar username (servern accepterar username eller email)
  const ok = await addContactToDB(lastFoundUser.username);
  if (!ok) return;

  // Laddar om listan från DB så allt blir “på riktigt”
  await loadContactsFromDB();

  // Städar lite i UI
  if (resultBox) resultBox.style.display = "none";
  if (input) input.value = "";
  lastFoundUser = null;

  alert("Kontakt sparad!");
}

// 3) Accept från “Friend Requests” boxen (t.ex. Kalle)
// Jag använder samma DB-funktion så det hamnar i contacts-tabellen
async function acceptFriend(name, buttonElement) {
  const ok = await addContactToDB(name);
  if (!ok) return;

  // Ta bort requesten från UI
  if (buttonElement) {
    const card = buttonElement.closest(".mini-card");
    if (card) card.remove();
  }

  // Uppdatera kontakter från DB
  await loadContactsFromDB();
}

// 4) Klick på remove-knappen i kontaktlistan
async function onContactsListClick(e) {
  const btn = e.target.closest("button[data-contact-id]");
  if (!btn) return;

  const contactId = btn.getAttribute("data-contact-id");
  if (!contactId) return;

  const ok = await removeContactFromDB(contactId);
  if (!ok) return;

  await loadContactsFromDB();
}

// När sidan laddar
document.addEventListener("DOMContentLoaded", async () => {
  // Om någon öppnar contacts utan login så skickar jag hem dem direkt
  if (!isLoggedIn()) {
    window.location.href = "PublicHome1.html";
    return;
  }

  // Log out-knappen (i headern)
  $("#logout-btn")?.addEventListener("click", clearAuthAndGoHome);

  // Search knappar
  $("#search-btn")?.addEventListener("click", performSearch);
  $("#search-input")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performSearch();
  });

  // Klick på remove inne i contacts-listan
  $("#my-contacts-list")?.addEventListener("click", onContactsListClick);

  // Hämta kontakter direkt från DB när sidan öppnas
  await loadContactsFromDB();
});