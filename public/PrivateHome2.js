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
      nameInput.value = userData.fullName || "";
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

window.addEventListener("load", () => {
  protectPrivatePage();

  $("#logout-btn")?.addEventListener("click", handleLogout);

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