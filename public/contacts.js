// Sök användare + skicka friend request + accept/decline + visa contacts

const $ = (selector, root = document) => root.querySelector(selector);

function getUserId() {
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

// Liten toast så du slipper alerts överallt
function toast(msg, type = "info") {
  const el = $("#toast");
  if (!el) return alert(msg);

  el.textContent = msg;
  el.className = `toast toast--show toast--${type}`;
  setTimeout(() => el.classList.remove("toast--show"), 2200);
}

// Jag håller koll på senaste sökresultatet så "Send Request" vet vem
let lastFoundUser = null;

async function searchUserInDB(q) {
  const res = await fetch(`/users/search?q=${encodeURIComponent(q)}`);
  let data = {};
  try { data = await res.json(); } catch (e) {}
  return { res, data };
}

// =====================
// CONTACTS
// =====================

async function loadContactsFromDB() {
  const userId = getUserId();
  if (!userId) return;

  const res = await fetch(`/contacts?userId=${encodeURIComponent(userId)}`);
  let data = {};
  try { data = await res.json(); } catch (e) {}

  if (!res.ok) {
    toast(data.message || "Kunde inte hämta kontakter.", "danger");
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
    const li = document.createElement("li");
    li.className = "contact-item";
    li.innerHTML = `
      <i class="fa-solid fa-user-circle"></i>
      <span>${c.username}</span>
      <button class="decline-btn" data-contact-id="${c.contactId}" type="button">Remove</button>
    `;
    list.appendChild(li);
  });
}

async function removeContactFromDB(contactId) {
  const userId = getUserId();
  if (!userId) return false;

  const res = await fetch(
    `/contacts/${encodeURIComponent(contactId)}?userId=${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );

  let data = {};
  try { data = await res.json(); } catch (e) {}

  if (!res.ok) {
    toast(data.message || "Could not remove the contact.", "danger");
    return false;
  }

  return true;
}

async function onContactsListClick(e) {
  const btn = e.target.closest("button[data-contact-id]");
  if (!btn) return;

  const contactId = btn.getAttribute("data-contact-id");
  if (!contactId) return;

  const ok = await removeContactFromDB(contactId);
  if (!ok) return;

  toast("Removed.", "info");
  await loadContactsFromDB();
}

// =====================
// SEARCH + SEND REQUEST
// =====================

async function performSearch() {
  const input = $("#search-input");
  const resultBox = $("#result-box");
  const usernameDisplay = $("#username-display");

  if (!input || !resultBox || !usernameDisplay) return;

  const q = input.value.trim();
  if (!q) {
    toast("Enter username or email.", "warning");
    return;
  }

  try {
    const { res, data } = await searchUserInDB(q);

    if (!res.ok) {
      lastFoundUser = null;
      resultBox.style.display = "none";
      toast(data.message || "No user found.", "warning");
      return;
    }

    lastFoundUser = data.user;
    usernameDisplay.textContent = `Found: ${lastFoundUser.username}`;
    resultBox.style.display = "flex";
  } catch (err) {
    console.error(err);
    toast("Server error when searching.", "danger");
  }
}

async function sendFriendRequest() {
  const userId = getUserId();
  const input = $("#search-input");
  const resultBox = $("#result-box");

  if (!userId) {
    toast("Du är inte inloggad.", "danger");
    return;
  }

  if (!lastFoundUser) {
    toast("Search first, and make sure the user exists.", "warning");
    return;
  }

  try {
    const res = await fetch("/friend-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromUserId: userId, q: lastFoundUser.username }),
    });

    let data = {};
    try { data = await res.json(); } catch (e) {}

    if (!res.ok) {
      toast(data.message || "Could not send request.", "danger");
      return;
    }

    toast("Friend request sent!", "success");

    if (resultBox) resultBox.style.display = "none";
    if (input) input.value = "";
    lastFoundUser = null;
  } catch (err) {
    console.error(err);
    toast("Server error when sending request.", "danger");
  }
}

// =====================
// FRIEND REQUESTS (load + accept/decline)
// =====================

async function loadFriendRequests() {
  const userId = getUserId();
  if (!userId) return;

  const res = await fetch(`/friend-requests?userId=${encodeURIComponent(userId)}`);
  let data = {};
  try { data = await res.json(); } catch (e) {}

  if (!res.ok) {
    console.log(data.message || "Kunde inte hämta friend requests");
    return;
  }

  renderFriendRequests(data.requests || []);
}

function renderFriendRequests(requests) {
  const box = $("#requests-list");
  if (!box) return;

  box.innerHTML = "";

  if (requests.length === 0) {
    box.innerHTML = `<div class="empty-text">No requests.</div>`;
    return;
  }

  requests.forEach((r) => {
    const card = document.createElement("div");
    card.className = "mini-card";
    card.dataset.requestId = r.id;

    // backend skickar "username" och "email" från JOIN users
    card.innerHTML = `
      <span class="user-name">${r.username}</span>
      <div class="card-btns">
        <button class="accept-btn" type="button" data-action="accept">Accept</button>
        <button class="decline-btn" type="button" data-action="decline">Decline</button>
      </div>
    `;

    box.appendChild(card);
  });
}

async function onRequestsClick(e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const card = btn.closest(".mini-card");
  if (!card) return;

  const action = btn.dataset.action;
  const requestId = card.dataset.requestId;
  const userId = getUserId();

  if (!requestId || !userId) return;

  if (action === "accept") {
    const res = await fetch(`/friend-requests/${encodeURIComponent(requestId)}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    let data = {};
    try { data = await res.json(); } catch (e) {}

    if (!res.ok) {
      toast(data.message || "Could not accept request.", "danger");
      return;
    }

    toast("Accepted! Added to contacts.", "success");
    card.remove();

    await loadContactsFromDB();
    return;
  }

  if (action === "decline") {
    const res = await fetch(`/friend-requests/${encodeURIComponent(requestId)}/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    let data = {};
    try { data = await res.json(); } catch (e) {}

    if (!res.ok) {
      toast(data.message || "Could not decline request.", "danger");
      return;
    }

    toast("Declined.", "info");
    card.remove();
  }
}

// =====================
// INIT
// =====================

document.addEventListener("DOMContentLoaded", async () => {
  if (!isLoggedIn()) {
    window.location.href = "PublicHome1.html";
    return;
  }

  $("#logout-btn")?.addEventListener("click", clearAuthAndGoHome);

  $("#search-btn")?.addEventListener("click", performSearch);
  $("#search-input")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performSearch();
  });

  $("#send-request-btn")?.addEventListener("click", sendFriendRequest);

  $("#my-contacts-list")?.addEventListener("click", onContactsListClick);
  $("#requests-list")?.addEventListener("click", onRequestsClick);

  await loadContactsFromDB();
  await loadFriendRequests();
});