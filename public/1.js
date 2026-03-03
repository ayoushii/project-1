// Den här filen styr login, signup och logout
// + skyddar privata sidor

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => root.querySelectorAll(selector);

// Små hjälpfunktioner för att visa/dölja saker
function hide(el) {
  if (el) el.style.display = "none";
}

function show(el) {
  if (el) el.style.display = "block";
}

// Skickar POST-request till servern
// och försöker läsa JSON utan att krascha
async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    // om servern inte skickar JSON så fortsätter vi ändå
  }

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

// Sätter login-status i localStorage
function setLoggedIn(flag) {
  if (flag) localStorage.setItem("isLoggedIn", "true");
  else localStorage.removeItem("isLoggedIn");
}

// Sparar userId från databasen
// behövs senare för contacts och friend requests
function setUserId(id) {
  if (!id) return;
  localStorage.setItem("userId", String(id));
}

// Tar bort all login-info
function clearAuth() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");
}

// Kollar om man är inloggad
function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

// Skyddar privata sidor
// Om man försöker gå direkt till en privat sida utan login → skickas tillbaka
function protectPrivatePage() {
  const p = window.location.pathname;

  const isPrivate =
    p.includes("PrivateHome2.html") ||
    p.includes("contacts.html");

  if (isPrivate && !isLoggedIn()) {
    window.location.href = "PublicHome1.html";
  }
}

// LOGIN
async function handleLogin() {
  const username = $("#login-username")?.value.trim();
  const password = $("#login-password")?.value;

  if (!username || !password) {
    alert("Please enter credentials.");
    return;
  }

  try {
    const { res, data } = await postJSON("/login", { username, password });

    if (!res.ok) {
      alert(data.message || "Login failed.");
      return;
    }

    // Om vi kommer hit betyder det att login lyckades
    setLoggedIn(true);
    setUserId(data.userId);

    // Skickar användaren till privata startsidan
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

    if (!res.ok) {
      alert(data.message || "Registration failed.");
      return;
    }

    // Jag skickar inte direkt till privata sidan här, för jag vill att man loggar in “på riktigt”
    alert("Account created! Now log in.");
    showLogin();
  } catch (err) {
    console.error(err);
    alert("Server error.");
  }
}

// LOGOUT
function handleLogout() {
  // Tar bort allt som har med login att göra
  clearAuth();

  // Skickar tillbaka till public startsidan
  window.location.href = "PublicHome1.html";
}

// När sidan laddas
window.addEventListener("load", () => {
  protectPrivatePage();

  // Koppla knappar (finns inte på alla sidor, därför ?. )
  $("#loginSubmitBtn")?.addEventListener("click", handleLogin);
  $("#signupSubmitBtn")?.addEventListener("click", handleSignup);
  $("#logout-btn")?.addEventListener("click", handleLogout);

  // Koppla topbar-knapparna på startsidan
  $("#open-login")?.addEventListener("click", showLogin);
  $("#open-signup")?.addEventListener("click", showSignup);
  $("#cta-get-started")?.addEventListener("click", showSignup);

  // Koppla “byt ruta” knapparna inne i modalerna
  $("#go-signup")?.addEventListener("click", showSignup);
  $("#go-login")?.addEventListener("click", showLogin);
});

// Lösenordsändring (bara UI, inte kopplad till DB än)
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
    editBtn.style.backgroundColor = "";
    editBtn.style.color = "";
    alert("Password updated!");
  }
}
window.addEventListener("load", () => {
  const signupBox = document.getElementById("signup-box");
  const terms = document.getElementById("terms-checkbox");
  const btn = document.getElementById("signupSubmitBtn");

  function syncButton() {
    if (!btn || !terms) return;
    btn.disabled = !terms.checked;
  }

  // om vi inte har signup på sidan så skippar vi
  if (!signupBox || !terms || !btn) return;

  syncButton();
  terms.addEventListener("change", syncButton);
});
// Stänger login och signup
function closeAuth() {
  hide($("#login-box"));
  hide($("#signup-box"));
}