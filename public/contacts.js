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
    alert(data.message || "Kunde inte lägga till.");
    return null;
  }

  return data;
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
    alert(data.message || "Could not remove the contact.");
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
    alert("Enter username or email.");
    return;
  }

  try {
    const { res, data } = await searchUserInDB(q);

    if (!res.ok) {
      lastFoundUser = null;
      resultBox.style.display = "none";
      alert(data.message || "No user found.");
      return;
    }

    lastFoundUser = data.user;

    // Visar resultatkortet bara när det är en riktig user
    usernameDisplay.textContent = `Found: ${lastFoundUser.username}`;
    resultBox.style.display = "flex";
  } catch (err) {
    console.error(err);
    alert("Server error when searching.");
  }
}

// 2) Send Request: sparar kontakten i DB

async function sendFriendRequest() {
  const input = $("#search-input");
  const resultBox = $("#result-box");

  if (!lastFoundUser) {
    alert("Search first, and make sure the user exists.");
    return;
  }

  // Jag skickar username (servern accepterar username eller email)
  const result = await addContactToDB(lastFoundUser.username);
  if (!result) return;
// Visa rätt meddelande beroende på backend
  if (result.mode === "sent") {
    alert("Friend request sent!");
  } else if (result.mode === "accepted") {
    alert("Request accepted! Contact added.");
  }
  // Laddar om listan från DB så allt blir “på riktigt”
  await loadContactsFromDB();

  // Städar lite i UI
  if (resultBox) resultBox.style.display = "none";
  if (input) input.value = "";
  lastFoundUser = null;
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

// ================================
// FRIEND REQUESTS (vänförfrågningar)
// ================================

// Hämtar alla "pending" requests som är skickade till den inloggade användaren
async function loadFriendRequests() {
  const userId = getUserId();          // vem är inloggad?
  if (!userId) return;                // om ingen är inloggad: gör inget

  // Frågar backend: "vilka requests har jag?"
  const res = await fetch(`/friend-requests?userId=${encodeURIComponent(userId)}`);

  // Försöker läsa JSON-svaret från servern
  let data = {};
  try { data = await res.json(); } catch (e) {}

  // Om servern svarar med error (t.ex 500 eller 400)
  if (!res.ok) {
    console.log(data.message || "Kunde inte hämta friend requests");
    return;
  }

  // Skickar listan vidare till en funktion som ritar upp dem på sidan
  renderFriendRequests(data.requests || []);
}


// Ritar (visar) friend requests i vänster-boxen på sidan
function renderFriendRequests(requests) {
  const box = $("#requests-list");     // div'en i HTML där requests ska synas
  if (!box) return;

  box.innerHTML = "";                 // töm boxen så vi inte får dubbletter

  // Om man inte har några requests alls
  if (requests.length === 0) {
    box.innerHTML = `<div class="empty-text">No requests.</div>`;
    return;
  }

  // För varje request: skapa ett "kort" med Accept/Decline
  requests.forEach((r) => {
    const card = document.createElement("div");
    card.className = "mini-card";

    // Spara info på elementet (så vi kan läsa den när man klickar på knapparna)
    card.dataset.requestId = r.id;                // requestens id i databasen
    card.dataset.fromUsername = r.fromUsername;   // vem skickade requesten?

    // Själva HTML:en för kortet
    card.innerHTML = `
      <span class="user-name">${r.fromUsername}</span>
      <div class="card-btns">
        <button class="accept-btn" type="button" data-action="accept">Accept</button>
        <button class="decline-btn" type="button" data-action="decline">Decline</button>
      </div>
    `;

    // Lägg kortet i listan
    box.appendChild(card);
  });
}


// När man klickar på Accept/Decline i requests-boxen
// (event delegation = vi lyssnar på boxen och kollar vad man klickade på)
async function onRequestsClick(e) {
  const btn = e.target.closest("button[data-action]"); // kolla om man klickade på en av knapparna
  if (!btn) return;

  const card = btn.closest(".mini-card");              // hittar "kortet" knappen ligger i
  if (!card) return;

  const action = btn.dataset.action;                   // "accept" eller "decline"
  const requestId = card.dataset.requestId;            // id i DB
  const fromUsername = card.dataset.fromUsername;      // vem skickade requesten

  // ----------------
  // ACCEPT
  // ----------------
  if (action === "accept") {
    // Vi använder samma endpoint som din Send Request använder:
    // POST /contacts
    // Backend kommer automatiskt att fatta att detta är en ACCEPT
    // om det finns en "incoming pending request".
    const result = await addContactToDB(fromUsername);
    if (!result) return;

    // Ta bort kortet direkt från UI
    card.remove();

    // Uppdatera listan med kontakter (nu ska personen synas där)
    await loadContactsFromDB();
    return;
  }

  // ----------------
  // DECLINE
  // ----------------
  if (action === "decline") {
    const userId = getUserId();

    // Säg till backend att vi nekar requesten
    const res = await fetch(`/friend-requests/${encodeURIComponent(requestId)}/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    let data = {};
    try { data = await res.json(); } catch (e) {}

    // Om servern säger nej / error
    if (!res.ok) {
      alert(data.message || "Kunde inte neka request");
      return;
    }

    // Ta bort kortet från UI när det lyckas
    card.remove();
  }
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
  $("#send-request-btn")?.addEventListener("click", sendFriendRequest);
  $("#my-contacts-list")?.addEventListener("click", onContactsListClick);

   $("#requests-list")?.addEventListener("click", onRequestsClick);

  // Hämta kontakter direkt från DB när sidan öppnas
  await loadContactsFromDB();
  await loadFriendRequests();
});