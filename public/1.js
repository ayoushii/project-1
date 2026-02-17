// --- 1. FUNKTIONER SOM KAN LIGGA UTANFÖR (För Login/Signup-vyn) ---
function showLogin() {
    document.getElementById("signup-box").style.display = "none";
    if(document.getElementById("verify-box")) document.getElementById("verify-box").style.display = "none";
    document.getElementById("login-box").style.display = "block";
}

function showSignup() {
    document.getElementById("login-box").style.display = "none";
    if(document.getElementById("verify-box")) document.getElementById("verify-box").style.display = "none";
    document.getElementById("signup-box").style.display = "block";
}

function toggleMenu() {
    const submenu = document.getElementById("mySubmenu");
    if (submenu) {
        submenu.classList.toggle("open");
    }
}

// --- 2. ALLT SOM KRÄVER ATT HTML-ELEMENTEN FINNS LADDADE ---
window.onload = function () {

    // ===== MY ACCOUNT: TOGGLE & DATA =====
    const accountBtn = document.getElementById('account-link');
    const accountSection = document.getElementById('account-section');

    if (accountBtn && accountSection) {
        accountBtn.onclick = async function(event) {
            event.stopPropagation(); 
            
            const isHidden = accountSection.classList.toggle('hidden');

            // Om rutan precis öppnades, hämta data
            if (!isHidden) {
                await loadUserProfile();
            }
        };

        // Stäng rutan om man klickar utanför
        document.addEventListener('click', function(event) {
            if (!accountSection.contains(event.target) && event.target !== accountBtn) {
                accountSection.classList.add('hidden');
            }
        });
    }

    // Funktion för att hämta profil (med test-data tills backend är klar)
    async function loadUserProfile() {
    // Vi tömmer fälten först så att gammal info inte ligger kvar
    document.getElementById('acc-name').value = "";
    document.getElementById('acc-username').value = "";
    document.getElementById('acc-email').value = "";

    try {
        const response = await fetch("/api/user/profile"); 
        
        if (response.ok) {
            const userData = await response.json();
            // Här fylls datan i BARA om backend svarar med OK
            document.getElementById('acc-name').value = userData.name;
            document.getElementById('acc-username').value = userData.username;
            document.getElementById('acc-email').value = userData.email;
        } else {
            console.log("Ingen användare inloggad.");
            // Valfritt: Skicka användaren till login-sidan om de inte är inloggade
            // window.location.href = "index.html";
        }
    } catch (error) {
        console.error("Kunde inte ansluta till servern:", error);
    }
}
    // ===== CHANGE PASSWORD LOGIC =====
    const editBtn = document.querySelector('.edit-btn');
    const passwordInput = document.getElementById('acc-password');

    if (editBtn && passwordInput) {
        editBtn.onclick = function() {
            if (passwordInput.hasAttribute('readonly')) {
                passwordInput.removeAttribute('readonly');
                passwordInput.value = ""; 
                passwordInput.focus();
                editBtn.innerText = "Save";
                editBtn.style.backgroundColor = "#4CAF50";
                editBtn.style.color = "white";
            } else {
                saveNewPassword(passwordInput.value);
            }
        };
    }

    async function saveNewPassword(newPassword) {
        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }
        console.log("Saving password...");
        passwordInput.setAttribute('readonly', true);
        editBtn.innerText = "Change";
        editBtn.style.backgroundColor = ""; 
        editBtn.style.color = "";
        alert("Password updated!");
    }

   


              // ===== LOGIN LOGIK (Fortsättning) =====
    const loginSubmitBtn = document.getElementById("loginSubmitBtn");
    if (loginSubmitBtn) {
        loginSubmitBtn.onclick = async function () {
            const username = document.getElementById("login-username").value;
            const password = document.getElementById("login-password").value;

            if (!username || !password) {
                alert("Please enter credentials.");
                return;
            }
            // ... resten av din login fetch kod ...
        };
    }
}; // Denna sista måsvinge stänger window.onload och är JÄTTEVIKTIG!