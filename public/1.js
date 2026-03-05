// + skyddar privata sidor

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => root.querySelectorAll(selector);

function hide(el) {
  if (el) el.style.display = "none";
}

function show(el) {
  if (el) el.style.display = "block";
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data = {};
  try {
    data = await res.json();
  } catch (e) {}

  return { res, data };
}


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

// Sätter login-status i localStorage
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

  const isPrivate =
    p.includes("PrivateHome2.html") ||
    p.includes("contacts.html");

  if (isPrivate && !isLoggedIn()) {
    window.location.href = "PublicHome1.html";
  }
}

// LOGIN (utan reCAPTCHA)
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

// SIGNUP
async function handleSignup() {
  const signupBox = $("#signup-box");
  if (!signupBox) return;

  const email = $('input[type="email"]', signupBox)?.value.trim() || "";
  const password = $('input[type="password"]', signupBox)?.value || "";

  // Två textfält: [0] Full Name, [1] Username
  const texts = $$('input[type="text"]', signupBox);
  const fullName = texts.length >= 1 ? texts[0].value.trim() : "";
  const username = texts.length >= 2 ? texts[1].value.trim() : "";

  const termsOk = $("#terms-checkbox")?.checked ?? false;

  if (!email || !fullName || !username || !password) {
    alert("Fill all fields");
    return;
  }

  if (!termsOk) {
    alert("You must agree to the terms.");
    return;
  }

  try {
    const { res, data } = await postJSON("/register", {
      username,
      email,
      password,
      fullName, 
    });

    if (!res.ok) {
      alert(data.message || "Registration failed.");
      return;
    }

    alert("Account created! Now log in.");
    showLogin();
  } catch (err) {
    console.error(err);
    alert("Server error.");
  }
}

// LOGOUT
function handleLogout() {
  clearAuth();
  window.location.href = "PublicHome1.html";
}

// Stänger login och signup
function closeAuth() {
  hide($("#login-box"));
  hide($("#signup-box"));
}



window.addEventListener("load", () => {
  protectPrivatePage();

  // --- KOD FÖR ATT VISA/DÖLJA MY ACCOUNT ---
  const accountBtn = document.getElementById("account-link");
  const accountSection = document.getElementById("account-section");

  if (accountBtn && accountSection) {
    accountBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      accountSection.classList.toggle("hidden");
      
      if (!accountSection.classList.contains("hidden")) {
        console.log("Hämtar användarinfo...");
        // Här kan du anropa en funktion som fyller i data senare
      }
    });
  }

  // Stäng My Account om man klickar utanför rutan
  document.addEventListener("click", () => {
    accountSection?.classList.add("hidden");
  });

  // Förhindra att rutan stängs om man klickar inuti den
  accountSection?.addEventListener("click", (e) => e.stopPropagation());
  // SLUT PÅ MY ACCOUNT LOGIK ---

  // Event Listeners för knappar
  $("#loginSubmitBtn")?.addEventListener("click", handleLogin);
  $("#signupSubmitBtn")?.addEventListener("click", handleSignup);
  $("#logout-btn")?.addEventListener("click", handleLogout);

  $("#open-login")?.addEventListener("click", showLogin);
  $("#open-signup")?.addEventListener("click", showSignup);
  $("#cta-get-started")?.addEventListener("click", showSignup);

  $("#go-signup")?.addEventListener("click", showSignup);
  $("#go-login")?.addEventListener("click", showLogin);

  // Terms-checkbox styr signup-knappen
  const terms = $("#terms-checkbox");
  const signupBtn = $("#signupSubmitBtn");

  function syncButton() {
    if (!signupBtn || !terms) return;
    signupBtn.disabled = !terms.checked;
  }

  if (terms && signupBtn) {
    syncButton();
    terms.addEventListener("change", syncButton);
  }
}); // <--- Här stängs load-funktionen på rätt ställe

// Lösenordsändring (bara UI)
async function saveNewPassword(newPassword) {
  if (newPassword.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  const passwordInput = document.getElementById("acc-password");
  const editBtn = document.querySelector(".edit-btn");

  if (passwordInput && editBtn) {
    passwordInput.setAttribute("readonly", true);
    editBtn.innerText = "Change";
    alert("Password updated!");
  }
}