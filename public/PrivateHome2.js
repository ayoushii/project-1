const $ = (selector, root = document) => root.querySelector(selector);

function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

function clearAuth() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");
}

function protectPrivatePage() {
  if (!isLoggedIn()) {
    window.location.href = "PublicHome1.html";
  }
}

function handleLogout() {
  clearAuth();
  window.location.href = "PublicHome1.html";
}

function showToast(msg, type = "") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

async function fetchUserProfile() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  try {
    const res = await fetch(`/user/${userId}`);
    if (!res.ok) return;

    const userData = await res.json();
    const name = userData.full_name || "";
    const email = userData.email || "";
    const username = userData.username || "";

    const nameInput     = document.getElementById("acc-name");
    const usernameInput = document.getElementById("acc-username");
    const emailInput    = document.getElementById("acc-email");
    const displayName   = document.getElementById("acc-display-name");
    const displayEmail  = document.getElementById("acc-display-email");
    const avatarCircle  = document.getElementById("acc-avatar-circle");

    if (nameInput)     nameInput.value = name;
    if (usernameInput) usernameInput.value = username;
    if (emailInput)    emailInput.value = email;
    if (displayName)   displayName.textContent = name || username || "My Account";
    if (displayEmail)  displayEmail.textContent = email;

    if (avatarCircle && name) {
      const initials = name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      avatarCircle.textContent = initials;
    }
  } catch (err) {
    console.error("Could not load user profile:", err);
  }
}

async function handleChangePassword() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    showToast("You must be logged in.", "err");
    return;
  }

  const currentPassword = prompt("Enter your current password:");
  if (!currentPassword) return;

  const newPassword = prompt("Enter your new password:");
  if (!newPassword) return;

  const confirmPassword = prompt("Confirm your new password:");
  if (!confirmPassword) return;

  if (newPassword !== confirmPassword) {
    showToast("The new passwords do not match.", "err");
    return;
  }

  if (newPassword.length < 6) {
    showToast("New password must be at least 6 characters.", "err");
    return;
  }

  try {
    const res = await fetch("/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, currentPassword, newPassword })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Could not change password.", "err");
      return;
    }

    showToast(data.message || "Password updated successfully! 🔒", "ok");
  } catch (err) {
    showToast("Server error. Please try again.", "err");
  }
}

async function loadTargetInvitations() {
  const userId = localStorage.getItem("userId");
  const listEl = document.getElementById("targetInvitationsList");
  const badgeEl = document.getElementById("inv-badge");

  if (!userId || !listEl) return;

  try {
    const res = await fetch(`/target-list-invitations?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();

    if (!res.ok) {
      listEl.innerHTML = `<li class="request-empty"><i class="fa-solid fa-triangle-exclamation"></i> Could not load invitations.</li>`;
      return;
    }

    const invitations = data.invitations || [];
    if (badgeEl) badgeEl.textContent = invitations.length;

    if (invitations.length === 0) {
      listEl.innerHTML = `<li class="request-empty"><i class="fa-regular fa-envelope"></i> No invitations right now.</li>`;
      return;
    }

    listEl.innerHTML = "";
    invitations.forEach((invitation) => {
      const li = document.createElement("li");
      li.className = "request-item";
      li.innerHTML = `
        <div class="request-text">
          <strong>${invitation.owner_username}</strong> invited you to join
          <strong>${invitation.list_title}</strong>
        </div>
        <div class="request-actions">
          <button class="accept-invitation-btn" data-invitation-id="${invitation.id}" type="button">
            <i class="fa-solid fa-check"></i> Join
          </button>
          <button class="decline-invitation-btn" data-invitation-id="${invitation.id}" type="button">
            Decline
          </button>
        </div>`;
      listEl.appendChild(li);
    });
  } catch (error) {
    listEl.innerHTML = `<li class="request-empty"><i class="fa-solid fa-triangle-exclamation"></i> Server error while loading invitations.</li>`;
  }
}

async function acceptTargetInvitation(invitationId) {
  const userId = localStorage.getItem("userId");
  if (!userId || !invitationId) return;

  try {
    const res = await fetch(`/target-list-invitations/${invitationId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();

    if (!res.ok) { showToast(data.message || "Could not accept invitation.", "err"); return; }
    showToast(data.message || "Invitation accepted! 🎉", "ok");
    await loadTargetInvitations();
  } catch (error) {
    showToast("Server error while accepting invitation.", "err");
  }
}

async function declineTargetInvitation(invitationId) {
  const userId = localStorage.getItem("userId");
  if (!userId || !invitationId) return;

  try {
    const res = await fetch(`/target-list-invitations/${invitationId}/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();

    if (!res.ok) { showToast(data.message || "Could not decline invitation.", "err"); return; }
    showToast(data.message || "Invitation declined.", "");
    await loadTargetInvitations();
  } catch (error) {
    showToast("Server error while declining invitation.", "err");
  }
}

async function loadListShareRequests() {
  const userId = localStorage.getItem("userId");
  const listEl = document.getElementById("listShareRequestsList");
  const badgeEl = document.getElementById("req-badge");

  if (!userId || !listEl) return;

  try {
    const res = await fetch(`/list-share-requests?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();

    if (!res.ok) {
      listEl.innerHTML = `<li class="request-empty"><i class="fa-solid fa-triangle-exclamation"></i> Could not load requests.</li>`;
      return;
    }

    const requests = data.requests || [];
    if (badgeEl) badgeEl.textContent = requests.length;

    if (requests.length === 0) {
      listEl.innerHTML = `<li class="request-empty"><i class="fa-regular fa-handshake"></i> No pending requests.</li>`;
      return;
    }

    listEl.innerHTML = "";
    requests.forEach((request) => {
      const li = document.createElement("li");
      li.className = "request-item";
      li.innerHTML = `
        <div class="request-text">
          <strong>${request.requester_username}</strong> wants to add
          <strong>${request.target_username}</strong> to
          <strong>${request.list_title}</strong>
        </div>
        <div class="request-actions">
          <button class="accept-request-btn" data-request-id="${request.id}" type="button">
            <i class="fa-solid fa-check"></i> Accept
          </button>
          <button class="decline-request-btn" data-request-id="${request.id}" type="button">
            Decline
          </button>
        </div>`;
      listEl.appendChild(li);
    });
  } catch (error) {
    listEl.innerHTML = `<li class="request-empty"><i class="fa-solid fa-triangle-exclamation"></i> Server error while loading requests.</li>`;
  }
}

async function acceptListShareRequest(requestId) {
  const userId = localStorage.getItem("userId");
  if (!userId || !requestId) return;

  try {
    const res = await fetch(`/list-share-requests/${requestId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();

    if (!res.ok) { showToast(data.message || "Could not accept request.", "err"); return; }
    showToast(data.message || "Request accepted!", "ok");
    await loadListShareRequests();
    await loadTargetInvitations();
  } catch (error) {
    showToast("Server error while accepting request.", "err");
  }
}

async function declineListShareRequest(requestId) {
  const userId = localStorage.getItem("userId");
  if (!userId || !requestId) return;

  try {
    const res = await fetch(`/list-share-requests/${requestId}/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();

    if (!res.ok) { showToast(data.message || "Could not decline request.", "err"); return; }
    showToast(data.message || "Request declined.", "");
    await loadListShareRequests();
  } catch (error) {
    showToast("Server error while declining request.", "err");
  }
}

window.addEventListener("load", () => {
  protectPrivatePage();

  $("#logout-btn")?.addEventListener("click", handleLogout);

  const changePasswordBtn = document.getElementById("change-password-btn");
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", handleChangePassword);
  }

  const accountBtn     = document.getElementById("account-link");
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
      if (!event.target.closest("#account-link") && !accountSection.contains(event.target)) {
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

  const toggleCreateMenuBtn = document.getElementById("toggleCreateMenuBtn");
  const mySubmenu = document.getElementById("mySubmenu");
  const createChevron = document.getElementById("create-chevron");

  if (toggleCreateMenuBtn && mySubmenu) {
    toggleCreateMenuBtn.addEventListener("click", () => {
      const isOpen = mySubmenu.style.display === "block";
      mySubmenu.style.display = isOpen ? "none" : "block";
      if (createChevron) createChevron.classList.toggle("open", !isOpen);
      toggleCreateMenuBtn.classList.toggle("active-link", !isOpen);
    });
  }

  loadTargetInvitations();
  loadListShareRequests();

  const invitationsList = document.getElementById("targetInvitationsList");
  if (invitationsList) {
    invitationsList.addEventListener("click", (event) => {
      const acceptBtn  = event.target.closest(".accept-invitation-btn");
      const declineBtn = event.target.closest(".decline-invitation-btn");
      if (acceptBtn)  acceptTargetInvitation(Number(acceptBtn.getAttribute("data-invitation-id")));
      if (declineBtn) declineTargetInvitation(Number(declineBtn.getAttribute("data-invitation-id")));
    });
  }

  const requestsList = document.getElementById("listShareRequestsList");
  if (requestsList) {
    requestsList.addEventListener("click", (event) => {
      const acceptBtn  = event.target.closest(".accept-request-btn");
      const declineBtn = event.target.closest(".decline-request-btn");
      if (acceptBtn)  acceptListShareRequest(Number(acceptBtn.getAttribute("data-request-id")));
      if (declineBtn) declineListShareRequest(Number(declineBtn.getAttribute("data-request-id")));
    });
  }
});