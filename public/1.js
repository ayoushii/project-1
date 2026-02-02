// Funktion för att visa Logga in
function showLogin() {
    // Vi ser till att alla andra rutor är stängda först
    document.getElementById('signup-box').style.display = 'none';
    document.getElementById('verify-box').style.display = 'none';

    // Sen visar vi login-rutan
    document.getElementById('login-box').style.display = 'block';
}

// Funktion för att visa Skapa konto
function showSignup() {
    // Gömmer login
    document.getElementById('login-box').style.display = 'none';
    document.getElementById('verify-box').style.display = 'none';

    // Visar signup-boxen
    document.getElementById('signup-box').style.display = 'block';
}

// Funktion för att visa "Bekräfta mejl"
function showVerify() {
    // Gömmer signup och login
    document.getElementById('signup-box').style.display = 'none';
    document.getElementById('login-box').style.display = 'none';

    // Visar verify-boxen
    document.getElementById('verify-box').style.display = 'block';
}

// Funktion för att visa/dölja menyn
function toggleMenu() {
    var submenu = document.getElementById("mySubmenu");

    // Om menyn är dold, visa den. Om den syns, dölj den.
    if (submenu.style.display === "none") {
        submenu.style.display = "block";
    } else {
        submenu.style.display = "none";
    }
}

// Vänta på att dokumentet har laddats helt
window.onload = function () {

    // ===== LOGIN =====
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');

    if (loginSubmitBtn) {
        loginSubmitBtn.onclick = async function () {

            // 1. Hämta data från input-fälten
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                alert("Skriv in email och lösenord.");
                return;
            }

            // 2. Visa att något händer
            loginSubmitBtn.innerText = "Loggar in...";
            loginSubmitBtn.disabled = true;

            try {
                // 3. Skicka data till backend (login)
                const response = await fetch("http://localhost:5000/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                // 4. Hantera svaret från servern
                if (response.ok) {
                    alert("Välkommen in!");
                    window.location.href = "2.html";
                } else {
                    alert(data.message || "Fel email eller lösenord.");
                }

            } catch (error) {
                alert("Kunde inte kontakta servern. Kontrollera att servern kör.");
            }

            // Återställ knappen
            loginSubmitBtn.innerText = "Continue";
            loginSubmitBtn.disabled = false;
        };
    }

    // ===== SKAPA KONTO =====
    const signupSubmitBtn = document.getElementById("signupSubmitBtn");

    if (signupSubmitBtn) {
        signupSubmitBtn.onclick = async function () {

            // Hämta värden från signup-boxens input-fält
            const fullName = document.querySelectorAll("#signup-box input")[0].value;
            const email = document.querySelectorAll("#signup-box input")[1].value;
            const username = document.querySelectorAll("#signup-box input")[2].value;
            const password = document.querySelectorAll("#signup-box input")[3].value;

            if (!fullName || !email || !username || !password) {
                alert("Fyll i alla fält.");
                return;
            }

            signupSubmitBtn.innerText = "Skapar konto...";
            signupSubmitBtn.disabled = true;

            try {
                // Skicka data till backend (register)
                const response = await fetch("http://localhost:5000/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ fullName, email, username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Konto skapat! Logga in nu.");
                    showLogin();
                } else {
                    alert(data.message || "Kunde inte skapa konto.");
                }

            } catch (error) {
                alert("Kunde inte kontakta servern. Kontrollera att servern kör.");
            }

            // Återställ knappen
            signupSubmitBtn.innerText = "Create Account";
            signupSubmitBtn.disabled = false;
        };
    }
};
