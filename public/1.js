// ==========================================
// 1. VISUELLA FUNKTIONER (Login/Signup-vyn)
// ==========================================
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

// ==========================================
// 2. LOGIK VID SIDLADDNING (window.onload)
// ==========================================
window.onload = function () {

    // ----- INLOGGNING (Skickar dig till PrivateHome2.html) -----
    const loginSubmitBtn = document.getElementById("loginSubmitBtn");
    if (loginSubmitBtn) {
        loginSubmitBtn.onclick = async function () {
            const username = document.getElementById("login-username").value;
            const password = document.getElementById("login-password").value;

            if (!username || !password) {
                alert("Please enter credentials.");
                return;
            }

            try {
                const response = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    // HÄR ÄR ÄNDRINGEN: Skickar dig till din Private Home-sida
                    window.location.href = "PrivateHome2.html"; 
                } else {
                    alert("Login failed. Please check your username and password.");
                }
            } catch (error) {
                console.error("Connection error:", error);
            }
        };
    }

    // ----- MY ACCOUNT: VISA & HÄMTA DATA -----
    const accountBtn = document.getElementById('account-link');
    const accountSection = document.getElementById('account-section');

    if (accountBtn && accountSection) {
        accountBtn.onclick = async function(event) {
            event.stopPropagation(); 
            const isHidden = accountSection.classList.toggle('hidden');

            if (!isHidden) {
                await loadUserProfile();
            }
        };

        // Stäng profilrutan om man klickar utanför
        document.addEventListener('click', function(event) {
            if (!accountSection.contains(event.target) && event.target !== accountBtn) {
                accountSection.classList.add('hidden');
            }
        });
    }

    // ----- ÄNDRA LÖSENORD (EDIT-KNAPPEN) -----
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
};

// ==========================================
// 3. BACKEND-ANROP (Fetch)
// ==========================================

async function loadUserProfile() {
    // Tömmer fält så gammal info inte blinkar till
    document.getElementById('acc-name').value = "";
    document.getElementById('acc-username').value = "";
    document.getElementById('acc-email').value = "";

    try {
        const response = await fetch("/api/user/profile"); 
        if (response.ok) {
            const userData = await response.json();
            document.getElementById('acc-name').value = userData.name;
            document.getElementById('acc-username').value = userData.username;
            document.getElementById('acc-email').value = userData.email;
        }
    } catch (error) {
        console.error("Could not load profile:", error);
    }
}

async function saveNewPassword(newPassword) {
    if (newPassword.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }
    
    // Här skickar du till backend senare
    console.log("Saving password...");
    
    const passwordInput = document.getElementById('acc-password');
    const editBtn = document.querySelector('.edit-btn');
    
    passwordInput.setAttribute('readonly', true);
    editBtn.innerText = "Change";
    editBtn.style.backgroundColor = ""; 
    editBtn.style.color = "";
    alert("Password updated!");
}