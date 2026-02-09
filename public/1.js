// Funktion för att visa Logga in
function showLogin() {
  document.getElementById("signup-box").style.display = "none";
  document.getElementById("verify-box").style.display = "none";
  document.getElementById("login-box").style.display = "block";
}

// Funktion för att visa Skapa konto
function showSignup() {
  document.getElementById("login-box").style.display = "none";
  document.getElementById("verify-box").style.display = "none";
  document.getElementById("signup-box").style.display = "block";
}

// Funktion för att visa "Bekräfta mejl"
function showVerify() {
  document.getElementById("signup-box").style.display = "none";
  document.getElementById("login-box").style.display = "none";
  document.getElementById("verify-box").style.display = "block";
}
function toggleMenu() {
    const submenu = document.getElementById("mySubmenu");
    if (submenu) {
        submenu.classList.toggle("open");
    }
}
// Vänta på att dokumentet har laddats helt
window.onload = function () {

  // ===== LOGIN =====
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");

  if (loginSubmitBtn) {
    loginSubmitBtn.onclick = async function () {

      // 1. Hämta data från input-fälten
      const username = document.getElementById("login-username").value;
      const password = document.getElementById("login-password").value;

      if (!username || !password) {
        alert("Skriv in username och lösenord.");
        return;
      }

      // 2. Visa att något händer
      loginSubmitBtn.innerText = "Loggar in...";
      loginSubmitBtn.disabled = true;

      try {
        // 3. Skicka till backend /login
        const response = await fetch("http://localhost:5000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        // 4. Hantera svar
        if (response.ok) {
          alert("Login OK!");
          window.location.href = "2.html";
        } else {
          alert(data.message || "Fel vid login.");
        }

      } catch (error) {
        alert("Kunde inte kontakta servern. Är backend igång?");
      }

      // 5. Återställ knappen
      loginSubmitBtn.innerText = "Continue";
      loginSubmitBtn.disabled = false;
    };
  }

  // ===== SIGNUP / REGISTER =====
  const signupSubmitBtn = document.getElementById("signupSubmitBtn");

  if (signupSubmitBtn) {
    signupSubmitBtn.onclick = async function () {

      // 1. Hämta data från signup-boxens input-fält
      const fullName = document.querySelectorAll("#signup-box input")[0].value;
      const email = document.querySelectorAll("#signup-box input")[1].value;
      const username = document.querySelectorAll("#signup-box input")[2].value;
      const password = document.querySelectorAll("#signup-box input")[3].value;

      if (!fullName || !email || !username || !password) {
        alert("Fyll i alla fält.");
        return;
      }

      // 2. Visa att något händer
      signupSubmitBtn.innerText = "Skapar konto...";
      signupSubmitBtn.disabled = true;

      try {
        // 3. Skicka till backend /register
        const response = await fetch("http://localhost:5000/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        // 4. Hantera svar
        if (response.ok) {
          alert("Konto skapat! Logga in nu.");
          showLogin();
        } else {
          alert(data.message || "Kunde inte skapa konto.");
        }

      } catch (error) {
        alert("Kunde inte kontakta servern.");
      }

      // 5. Återställ knappen
      signupSubmitBtn.innerText = "Create Account";
      signupSubmitBtn.disabled = false;
    };
  }



};



    document.getElementById('logout-btn').addEventListener('click', function() {
        // Rensa lokalt minne
        localStorage.clear();
        sessionStorage.clear();

        // Skicka användaren till startsidan
        window.location.href = "index.html";
    });
