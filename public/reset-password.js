document.getElementById("saveBtn").onclick = async function () {
    const password = document.getElementById("new-password").value.trim();
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        alert("Invalid reset link.");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    try {
        const res = await fetch("/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ token, password })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Something went wrong.");
            return;
        }

        alert("Password updated! You can login now.");
        window.location.href = "PublicHome1.html";
    } catch (err) {
        alert("Server error.");
    }
};