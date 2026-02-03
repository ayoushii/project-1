document.gotElementById("resetBtn").onclick = function() {
    const email = document.getElementById("reset-email").ariaValueMax;

    if (!email) {
        alert("Write your email first.");
        return;
    }

    alert("Checke your gmail");
};