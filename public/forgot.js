const resetButton = document.getElementById("resetBtn");
const emailInput = document.getElementById("reset-email");
const messageBox = document.getElementById("messageBox");

// Visar ett meddelande under knappen
function showMessage(text, type) {
  if (!messageBox) return;

  messageBox.textContent = text;
  messageBox.classList.remove("hidden-message", "message-success", "message-error");

  if (type === "success") {
    messageBox.classList.add("message-success");
  } else {
    messageBox.classList.add("message-error");
  }
}

// Skickar förfrågan om att återställa lösenord
async function handleResetPassword() {
  const email = emailInput?.value.trim();

  if (!email) {
    showMessage("Skriv din e-postadress först.", "error");
    return;
  }

  try {
    resetButton.disabled = true;
    resetButton.textContent = "Skickar...";

    const res = await fetch("/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || "Något gick fel.", "error");
      return;
    }

    showMessage(data.message || "Kolla din e-post!", "success");
  } catch (err) {
    showMessage("Serverfel.", "error");
  } finally {
    resetButton.disabled = false;
    resetButton.textContent = "Skicka återställningslänk";
  }
}

// Klick på knappen
resetButton?.addEventListener("click", handleResetPassword);

// Enter i inputfältet gör samma sak
emailInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleResetPassword();
  }
});