document.getElementById("resetBtn").onclick = async function () {
    const email = document.getElementById("reset-email").value.trim();

    if (!email) {
        alert("Write your email first.");
        return;
    }

    try {
        const res = await fetch("/forgot-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Something went wrong.");
            return;
        }

        alert(data.message || "Check your email!");
    } catch (err) {
        alert("Server error.");
    }
};