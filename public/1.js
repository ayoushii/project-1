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