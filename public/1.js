window.onload = function () {
    const loginBtn = document.getElementById("loginSubmitBtn");
    if (loginBtn) {
        loginBtn.onclick = async function () {
            const user = document.getElementById("login-username").value;
            const pass = document.getElementById("login-password").value;

            try {
                const response = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: user, password: pass })
                });

                if (response.ok) {
                    // Detta skickar dig till din snygga meny!
                    window.location.href = "PrivateHome2.html"; 
                } else {
                    alert("Fel användarnamn eller lösenord!");
                }
            } catch (err) {
                console.error("Kunde inte nå backend:", err);
            }
        };
    }
};

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

// ===== LOGIN LOGIK =====
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

      if (!res.ok) {
        alert(data.message);
        return;
      }

      window.location.href = "/PrivateHome2.html";

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };
}

// ===== SIGNUP =====
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

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Account created!");
      showLogin();

      window.location.href = "/PrivateHome2.html";

    } catch (err) {
      console.log(err);
      alert("Server error");
    }
  };
}

};
