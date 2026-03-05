const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => root.querySelectorAll(selector);

// --- BEFINTLIGA FUNKTIONER (Rör ej) ---
function hide(el) { if (el) el.style.display = "none"; }
function show(el) { if (el) el.style.display = "block"; }

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

function protectPrivatePage() {
  const p = window.location.pathname;
  const isPrivate = p.includes("PrivateHome2.html") || p.includes("contacts.html");
  if (isPrivate && !isLoggedIn()) {
    window.location.href = "PublicHome1.html";
  }
}

// --- LOGIN & SIGNUP HANDLERS (Rör ej) ---
async function handleLogin() {
  const username = $("#login-username")?.value.trim();
  const password = $("#login-password")?.value;
  if (!username || !password) {
    alert("Please enter username and password.");
    return;
  }
  try {
    const { res, data } = await postJSON("/login", { username, password });
    if (!res.ok) {
      alert(data.message || "Login failed.");
      return;
    }
    setLoggedIn(true);
    setUserId(data.userId);
    window.location.href = "PrivateHome2.html";
  } catch (err) {
    console.error(err);
    alert("Server error.");
  }
}

async function handleSignup() {
  const signupBox = $("#signup-box");
  if (!signupBox) return;
  const email = $('input[type="email"]', signupBox)?.value.trim() || "";
  const password = $('input[type="password"]', signupBox)?.value || "";
  const texts = $$('input[type="text"]', signupBox);
  const fullName = texts.length >= 1 ? texts[0].value.trim() : "";
  const username = texts.length >= 2 ? texts[1].value.trim() : "";
  const termsOk = $("#terms-checkbox")?.checked ?? false;

  if (!email || !fullName || !username || !password) {
    alert("Fill all fields");
    return;
  }
  if (!termsOk) { alert("You must agree to the terms."); return; }
  try {
    const { res, data } = await postJSON("/register", { username, email, password, fullName });
    if (!res.ok) { alert(data.message || "Registration failed."); return; }
    alert("Account created! Now log in.");
    showLogin();
  } catch (err) { console.error(err); alert("Server error."); }
}

function handleLogout() {
  clearAuth();
  window.location.href = "PublicHome1.html";
}

// --- INITIALISERING OCH MY ACCOUNT LOGIK ---
window.addEventListener("load", () => {
  protectPrivatePage();

  // FUNKTION: Hämtar användarens profilinfo från backend
  async function fetchUserProfile() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      // VIKTIGT: Denna route måste finnas i din server.js
      const res = await fetch(`/user/${userId}`);
      if (res.ok) {
        const userData = await res.json();
        // Fyller i fälten i rutan
        const nameInput = document.getElementById("acc-name");
        const userInput = document.getElementById("acc-username");
        const emailInput = document.getElementById("acc-email");

        if (nameInput) nameInput.value = userData.fullName || "";
        if (userInput) userInput.value = userData.username || "";
        if (emailInput) emailInput.value = userData.email || "";
      }
    } catch (err) {
      console.error("Kunde inte hämta profilinfo:", err);
    }
  }

  const accountBtn = document.getElementById("account-link");
  const accountSection = document.getElementById("account-section");

  if (accountBtn && accountSection) {
    accountBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      accountSection.classList.toggle("hidden");
      
      // Hämta data när rutan öppnas
      if (!accountSection.classList.contains("hidden")) {
        fetchUserProfile();
      }
    });
  }

  // Stäng om man klickar utanför
  document.addEventListener("click", (e) => {
    if (accountSection && !accountSection.contains(e.target) && e.target !== accountBtn) {
      accountSection.classList.add("hidden");
    }
  });

  // Stoppa stängning vid klick inuti rutan
  accountSection?.addEventListener("click", (e) => e.stopPropagation());

  // Befintliga event listeners
  $("#loginSubmitBtn")?.addEventListener("click", handleLogin);
  $("#signupSubmitBtn")?.addEventListener("click", handleSignup);
  $("#logout-btn")?.addEventListener("click", handleLogout);
  $("#open-login")?.addEventListener("click", showLogin);
  $("#open-signup")?.addEventListener("click", showSignup);
  $("#cta-get-started")?.addEventListener("click", showSignup);
  $("#go-signup")?.addEventListener("click", showSignup);
  $("#go-login")?.addEventListener("click", showLogin);

  const terms = $("#terms-checkbox");
  const signupBtn = $("#signupSubmitBtn");
  if (terms && signupBtn) {
    const sync = () => { signupBtn.disabled = !terms.checked; };
    sync();
    terms.addEventListener("change", sync);
  }
});