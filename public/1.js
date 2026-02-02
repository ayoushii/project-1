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

            if (!email || !password) {
                alert("Skriv in email och lösenord.");
                return;
            }

            // 2. Ändra knappens text så användaren ser att något händer
            loginSubmitBtn.innerText = "Loggar in...";
            loginSubmitBtn.disabled = true;

            try {
                // 3. FETCH-ANROPET (Här pratar vi med din kollegas backend)
                // Byt ut 'URL_FRÅN_KOLLEGA' 
                const response = await fetch('http://localhost:5000/register', {
                    method: 'POST', // Vi använder POST för att skicka hemlig data
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password})
                });

                const data = await response.json();
                // 4. Hantera svaret från Backend
                if (response.ok) {
                
                    // Om inloggningen lyckas: Spara t.ex. en token (nyckel)
                    if (data.token) {
                        localStorage.setItem("userToken", data.token);
                    }
                    
                    alert("Välkommen in!");
                    window.location.href = "2.html"; 
                }   else {
                    alert(data.message); // visar serverns fel, t.ex. "Wrong email or password"
                    resetButton();
                    // Om backend säger nej (t.ex. fel lösenord)   
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
        const response = await fetch("http://localhost:5000/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, email, username, password })
        });

        const data = await response.json();

        if (response.ok) {
          alert("Konto skapat! Logga in nu.");
          showLogin();
        } else {
          // Här ska backend skicka t.ex. "Username already exists"
          alert(data.message || "Kunde inte skapa konto.");
        }

      } catch (error) {
        alert("Kunde inte kontakta servern. Kontrollera att servern kör.");
      }

      signupSubmitBtn.innerText = "Create Account";
      signupSubmitBtn.disabled = false;
    };
  }

};