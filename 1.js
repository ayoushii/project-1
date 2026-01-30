// Funktion för att visa Logga in
function showLogin() {
    // Vi ser till att alla andra rutor är stängda först
    document.getElementById('signup-box').style.display = 'none';
    document.getElementById('verify-box').style.display = 'none';
    
    // Sen visar vi login-rutan
    document.querySelector('.login-box').style.display = 'block';
}

// Funktion för att visa Skapa konto
function showSignup() {
    // Gömmer login
    document.querySelector('.login-box').style.display = 'none';
    
    // Visar signup-boxen (se till att du har detta ID i din HTML)
    document.getElementById('signup-box').style.display = 'block';
}

// Funktion för att visa "Bekräfta mejl"
function showVerify() {
    // Gömmer signup
    document.getElementById('signup-box').style.display = 'none';
    
    // Visar verify-boxen
    document.getElementById('verify-box').style.display = 'block';
}


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
window.onload = function() {
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');

    if (loginSubmitBtn) {
        loginSubmitBtn.onclick = async function() { // Vi lägger till 'async' för att kunna vänta på svar
            
            // 1. Hämta data från dina input-fält
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // 2. Ändra knappens text så användaren ser att något händer
            loginSubmitBtn.innerText = "Loggar in...";
            loginSubmitBtn.disabled = true;

            try {
                // 3. FETCH-ANROPET (Här pratar vi med din kollegas backend)
                // Byt ut 'URL_FRÅN_KOLLEGA' mot den adress hon ger dig senare
                const response = await fetch('https://din-kollegas-api.com/login', {
                    method: 'POST', // Vi använder POST för att skicka hemlig data
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });

                // 4. Hantera svaret från Backend
                if (response.ok) {
                    const data = await response.json();
                    
                    // Om inloggningen lyckas: Spara t.ex. en token (nyckel)
                    localStorage.setItem('userToken', data.token);
                    
                    alert("Välkommen in!");
                    window.location.href = "2.html"; 
                } else {
                    // Om backend säger nej (t.ex. fel lösenord)
                    alert("Fel mejl eller lösenord. Försök igen!");
                    resetButton();
                }

            } catch (error) {
                // Om nätverket dör eller servern är nere
                alert("Kunde inte kontakta servern. Försök igen senare.");
                resetButton();
            }
        };
    }
    
    // Hjälpfunktion för att återställa knappen vid fel
    function resetButton() {
        loginSubmitBtn.innerText = "Continue";
        loginSubmitBtn.disabled = false;
    }
};