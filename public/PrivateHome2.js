const $ = (selector, root = document) => root.querySelector(selector);

// Kollar om användaren är inloggad
function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

// Tar bort sparad login-data
function clearAuth() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");
}

// Skyddar privata sidor
function protectPrivatePage() {
  if (!isLoggedIn()) {
    window.location.href = "PublicHome1.html";
  }
}

// Logout
function handleLogout() {
  clearAuth();
  window.location.href = "PublicHome1.html";
}

// Hämtar användarens profil till My Account
async function fetchUserProfile() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  try {
    const res = await fetch(`/user/${userId}`);
    if (!res.ok) return;

    const userData = await res.json();

    const nameInput = document.getElementById("acc-name");
    const usernameInput = document.getElementById("acc-username");
    const emailInput = document.getElementById("acc-email");

    if (nameInput) {
      nameInput.value = userData.full_name || "";
    }

    if (usernameInput) {
      usernameInput.value = userData.username || "";
    }

    if (emailInput) {
      emailInput.value = userData.email || "";
    }
  } catch (err) {
    console.error("Could not load user profile:", err);
  }
}

async function handleChangePassword() {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    alert("Du måste vara inloggad.");
    return;
  }

  const currentPassword = prompt("Skriv ditt nuvarande lösenord:");
  if (!currentPassword) return;

  const newPassword = prompt("Skriv ditt nya lösenord:");
  if (!newPassword) return;

  const confirmPassword = prompt("Bekräfta ditt nya lösenord:");
  if (!confirmPassword) return;

  if (newPassword !== confirmPassword) {
    alert("Det nya lösenordet matchar inte.");
    return;
  }

  if (newPassword.length < 6) {
    alert("Nya lösenordet måste vara minst 6 tecken.");
    return;
  }

  try {
    const res = await fetch("/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        currentPassword,
        newPassword
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Kunde inte ändra lösenord.");
      return;
    }

    alert(data.message || "Lösenordet har ändrats.");
  } catch (err) {
    console.error("CHANGE PASSWORD FRONTEND ERROR:", err);
    alert("Serverfel vid lösenordsbyte.");
  }
}

window.addEventListener("load", () => {
  protectPrivatePage();

  $("#logout-btn")?.addEventListener("click", handleLogout);

  const changePasswordBtn = document.getElementById("change-password-btn");
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", handleChangePassword);
  }

  const accountBtn = document.getElementById("account-link");
  const accountSection = document.getElementById("account-section");

  if (accountBtn && accountSection) {
    accountBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      accountSection.classList.toggle("hidden");

      if (!accountSection.classList.contains("hidden")) {
        await fetchUserProfile();
      }
    });

    accountSection.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    document.addEventListener("click", (event) => {
      const clickedButton = event.target.closest("#account-link");

      if (!clickedButton && !accountSection.contains(event.target)) {
        accountSection.classList.add("hidden");
      }
    });
  }

  const logoLink = document.getElementById("logo-link");

  if (logoLink) {
    logoLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "PrivateHome2.html";
    });
  }
});