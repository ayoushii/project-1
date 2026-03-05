const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => root.querySelectorAll(selector);

function hide(el) { if (el) el.style.display = "none"; }
function show(el) { if (el) el.style.display = "block"; }

// Skickar POST-request till servern
async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch (e) {}
  return { res, data };
}

// Växlar mellan login och signup-rutor
function showLogin() {
  hide($("#signup-box"));
  hide($("#verify-box"));
  show($("#login-box"));
}

function showSignup() {
  hide($("#login-box"));
  hide($("#verify-box"));
  show($("#signup-box"));
}

// Auth-funktioner (LocalStorage)
function setLoggedIn(flag) {
  if (flag) localStorage.setItem("isLoggedIn", "true");
  else localStorage.removeItem("isLoggedIn");
}

function setUserId(id) {
  if (!id) return;
  localStorage.setItem("userId", String(id));
}

function clearAuth() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");
}

function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

// Skyddar privata sidor
function protectPrivatePage() {
  const p = window.location.pathname;
  const isPrivate = p.includes("PrivateHome2.html") || p.includes("contacts.html");
  if (isPrivate && !isLoggedIn()) {
    window.location.href = "PublicHome1.html";
  }
}

// LOGIN
async function handleLogin() {
  const username = $("#login-username")?.value.trim();
  const password = $("#login-password")?.value;
  if (!username || !password) {
    alert("Please enter username and password.");
    return;
  }
  try {
    const { res, data } = await