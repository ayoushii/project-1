document.getElementById("resetBtn").onclick = function () {

    const email = document.getElementById("reset-email").value;

    if (!email) {
        alert("Write your email first.");
        return;
    }

    alert("Check your email!");
};
