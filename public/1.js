// 1.js (renare version)

// ---------- Små hjälpfunktioner ----------
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => root.querySelectorAll(selector);

function hide(el) { if (el) el.style.display = "none"; }
function show(el) { if (el) el.style.display = "block"; }

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // Om servern råkar skicka något som inte är JSON så kraschar vi inte direkt
  let data = {};
  try { data = await res.json(); } catch (_) {}

  return { res, data };
}

// ---------- 1) Visa / Dölj Login & Signup ----------
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

// ---------- 2) Auth (localStorage) ----------
function setLoggedIn(value) {
  if (value) localStorage.setItem("isLoggedIn", "true");
  else localStorage.removeItem("isLoggedIn");
}

function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

function protectPrivatePage() {
  if (window.location.pathname.includes("PrivateHome2.html") && !isLoggedIn()) {
    window.location.href = "PublicHome1.html";
  }
}

// ---------- 3) Login / Signup / Logout ----------
async function handleLogin() {
  const username = $("#login-username")?.value.trim();
  const password = $("#login-password")?.value;

  if (!username || !password) {
    alert("Please enter credentials.");
    return;
  }

  try {
    const { res, data } = await postJSON("/login", { username, password });

    if (res.ok) {
      setLoggedIn(true);
      window.location.href = "PrivateHome2.html";
    } else {
      alert(data.message || "Login failed.");
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Check console.");
  }
}

async function handleSignup() {
  const signupBox = $("#signup-box");
  if (!signupBox) {
    alert("Signup box not found.");
    return;
  }

  // HTML saknar id på signup inputs, därför selectors:
  const email = $('input[type="email"]', signupBox)?.value.trim() || "";
  const password = $('input[type="password"]', signupBox)?.value || "";

  // Två textfält: [0] Full Name, [1] Username
  const texts = $$('input[type="text"]', signupBox);
  const username = texts.length >= 2 ? texts[1].value.trim() : "";

  const termsOk = $('input[type="checkbox"]', signupBox)?.checked ?? true;

  if (!email || !username || !password) {
    alert("Fill all fields");
    return;
  }

  if (!termsOk) {
    alert("You must agree to the terms.");
    return;
  }

  try {
    const { res, data } = await postJSON("/register", { username, email, password });

    if (res.ok) {
      alert("Account created!");
      setLoggedIn(true); // ta bort denna raden om du INTE vill auto-logga in efter signup
      window.location.href = "PrivateHome2.html";
    } else {
      alert(data.message || "Registration failed.");
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Check console.");
  }
}

function handleLogout() {
  setLoggedIn(false);
  window.location.href = "PublicHome1.html";
}

// ---------- 4) Kör när sidan laddas ----------
window.addEventListener("load", () => {
  protectPrivatePage();

  // Knappar (finns inte på alla sidor, därför null-check)
  $("#loginSubmitBtn")?.addEventListener("click", handleLogin);
  $("#signupSubmitBtn")?.addEventListener("click", handleSignup);
  $("#logout-btn")?.addEventListener("click", handleLogout);
});

// ---------- 5) Profilfunktion (som du hade) ----------
async function saveNewPassword(newPassword) {
  if (newPassword.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  const passwordInput = $("#acc-password");
  const editBtn = $(".edit-btn");

  if (passwordInput && editBtn) {
    passwordInput.setAttribute("readonly", true);
    editBtn.innerText = "Change";
    editBtn.style.backgroundColor = "";
    editBtn.style.color = "";
    alert("Password updated!");
  }
}