// --- 1. VISUELLA FUNKTIONER (Växla mellan Login/Signup) ---
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

// --- 2. LOGIK VID SIDLADDNING ---
window.onload = function () {

    // ----- INLOGGNING -----
    const loginSubmitBtn = document.getElementById("loginSubmitBtn");
    if (loginSubmitBtn) {
        loginSubmitBtn.onclick = async function () {
            const username = document.getElementById("login-username").value.trim();
            const password = document.getElementById("login-password").value;

            if (!username || !password) {
                alert("Please enter credentials.");
                return;
            }

            try {
                const res = await fetch("/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });

                const data = await res.json();

                if (res.ok) {
                    window.location.href = "PrivateHome2.html";
                } else {
                    alert(data.message || "Login failed.");
                }
            } catch (err) {
                console.error("Server error:", err);
            }
        };
    }

    // ----- REGISTRERING (SIGNUP) -----
    const signupSubmitBtn = document.getElementById("signupSubmitBtn");
    if (signupSubmitBtn) {
        signupSubmitBtn.onclick = async function () {
            const email = document.getElementById("signup-email").value;
            const username = document.getElementById("signup-username").value;
            const password = document.getElementById("signup-password").value;

            if (!email || !username || !password) {
                alert("Fill all fields");
                return;
            }

            try {
                const res = await fetch("/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email, password }),
                });

                const data = await res.json();

                if (res.ok) {
                    alert("Account created!");
                    window.location.href = "PrivateHome2.html";
                } else {
                    alert(data.message || "Registration failed.");
                }
            } catch (err) {
                console.error("Server error:", err);
            }
        };
    }
};

// --- 3. PROFILFUNKTIONER (Lösenordsändring) ---
async function saveNewPassword(newPassword) {
    if (newPassword.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }
    
    console.log("Saving password...");
    
    const passwordInput = document.getElementById('acc-password');
    const editBtn = document.querySelector('.edit-btn');
    
    if (passwordInput && editBtn) {
        passwordInput.setAttribute('readonly', true);
        editBtn.innerText = "Change";
        editBtn.style.backgroundColor = "";
        editBtn.style.color = "";
        alert("Password updated!");
    }
}