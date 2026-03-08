const itemNameInput = document.getElementById("itemNameInput");
const quantityInput = document.getElementById("quantityInput");
const unitSelect = document.getElementById("unitSelect");
const addItemBtn = document.getElementById("addItemBtn");
const visualItemList = document.getElementById("visualItemList");
const listNameInput = document.getElementById("listNameInput");
const createListBtn = document.getElementById("createListBtn");
const saveListBtn = document.getElementById("saveListBtn");
const currentListNameEls = document.querySelectorAll(".current-list-name");

const toggleMemberPickerBtn = document.getElementById("toggleMemberPickerBtn");
const memberPickerBox = document.getElementById("memberPickerBox");
const memberSelect = document.getElementById("memberSelect");
const addMemberBtn = document.getElementById("addMemberBtn");
const memberList = document.getElementById("memberList");
const ownerText = document.getElementById("ownerText");


let currentListId = null;
let currentListName = null;
let shoppingItems = [];
let contactsCache = [];
let sharedMembers = [];

function getUserId() {
  const id = localStorage.getItem("userId");
  return id ? Number(id) : 0;
}

function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

function updateListNameDisplays(text) {
  currentListNameEls.forEach((el) => {
    el.textContent = text;
  });
}

function setControlsDisabled(disabled) {
  if (itemNameInput) itemNameInput.disabled = disabled;
  if (quantityInput) quantityInput.disabled = disabled;
  if (unitSelect) unitSelect.disabled = disabled;
  if (addItemBtn) addItemBtn.disabled = disabled;
  if (toggleMemberPickerBtn) toggleMemberPickerBtn.disabled = disabled;
  if (memberSelect) memberSelect.disabled = disabled;
  if (addMemberBtn) addMemberBtn.disabled = disabled;
  if (saveListBtn) saveListBtn.disabled = disabled;
}

async function loadContactsFromDB() {
  const userId = getUserId();

  if (!userId) {
    contactsCache = [];
    renderMemberOptions();
    return;
  }

  try {
    const res = await fetch(`/contacts?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();

    if (!res.ok) {
      contactsCache = [];
      renderMemberOptions();
      return;
    }

    contactsCache = data.contacts || [];
    renderMemberOptions();
  } catch (error) {
    console.error("Could not load contacts:", error);
    contactsCache = [];
    renderMemberOptions();
  }
}

function createEmptyState(text) {
  const li = document.createElement("li");
  li.className = "empty-state";
  li.textContent = text;
  return li;
}

function createCheckButton(item) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "check-btn";
  button.setAttribute("data-item-id", item.id);

  if (item.is_completed) {
    button.classList.add("checked");
  }

  const icon = document.createElement("i");
  icon.className = "fa-solid fa-check";
  button.appendChild(icon);

  return button;
}

function createItemText(item) {
  const span = document.createElement("span");
  span.className = "item-text";
  span.textContent = item.text;

  if (item.is_completed) {
    span.classList.add("completed");
  }

  return span;
}

function createBadge(item) {
  const badge = document.createElement("span");
  badge.className = "item-badge";
  badge.textContent = item.is_completed ? "Bought" : `${item.quantity} ${item.unit}`;
  return badge;
}

function createActionButton(className, iconClass, dataAttribute, value) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.setAttribute(dataAttribute, value);

  const icon = document.createElement("i");
  icon.className = iconClass;
  button.appendChild(icon);

  return button;
}

function createItemRow(item) {
  const li = document.createElement("li");
  li.className = "item-row";

  const left = document.createElement("div");
  left.className = "item-left";

  const actions = document.createElement("div");
  actions.className = "item-actions";

  const checkBtn = createCheckButton(item);
  const text = createItemText(item);
  const badge = createBadge(item);

  const editBtn = createActionButton(
    "edit-btn",
    "fa-solid fa-pen",
    "data-edit-item-id",
    item.id
  );

  const deleteBtn = createActionButton(
    "delete-btn",
    "fa-solid fa-trash",
    "data-delete-item-id",
    item.id
  );

  left.appendChild(checkBtn);
  left.appendChild(text);

  actions.appendChild(badge);
  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(left);
  li.appendChild(actions);

  return li;
}

function renderList() {
  if (!visualItemList) return;

  visualItemList.innerHTML = "";

  if (!currentListId && shoppingItems.length === 0) {
    visualItemList.appendChild(createEmptyState("Create the list first."));
    return;
  }

  if (shoppingItems.length === 0) {
    visualItemList.appendChild(createEmptyState("No items added yet."));
    return;
  }

  shoppingItems.forEach((item) => {
    visualItemList.appendChild(createItemRow(item));
  });
}

function renderMemberOptions() {
  if (!memberSelect) return;

  memberSelect.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a contact";
  memberSelect.appendChild(defaultOption);

  contactsCache.forEach((contact) => {
    const option = document.createElement("option");
    option.value = contact.username;
    option.textContent = contact.username;
    memberSelect.appendChild(option);
  });
}

function createMemberChip(member, index) {
  const li = document.createElement("li");
  li.className = "member-chip";

  const icon = document.createElement("i");
  icon.className = "fa-solid fa-user";

  const text = document.createElement("span");
  text.textContent = member.username;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "member-remove-btn";
  removeBtn.setAttribute("data-member-remove-index", index);

  const removeIcon = document.createElement("i");
  removeIcon.className = "fa-solid fa-xmark";
  removeBtn.appendChild(removeIcon);

  li.appendChild(icon);
  li.appendChild(text);
  li.appendChild(removeBtn);

  return li;
}

function renderMembers() {
  if (!memberList) return;

  memberList.innerHTML = "";

  if (!currentListId && sharedMembers.length === 0) {
    memberList.appendChild(createEmptyState("Create the list first."));
    return;
  }

  if (sharedMembers.length === 0) {
    memberList.appendChild(createEmptyState("No members added yet."));
    return;
  }

  sharedMembers.forEach((member, index) => {
    memberList.appendChild(createMemberChip(member, index));
  });
}

async function createFamilyList() {
  const userId = getUserId();
  const listName = listNameInput.value.trim();

  if (!userId) {
    alert("You must be logged in.");
    return false;
  }

  if (!listName) {
    alert("Please enter a list name.");
    return false;
  }

  try {
    const res = await fetch("/lists", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        title: listName,
        listType: "family"
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Could not create family list.");
      return false;
    }

    currentListId = data.listId;
    currentListName = listName;

    updateListNameDisplays(listName);

    listNameInput.disabled = true;
    createListBtn.disabled = true;
    createListBtn.textContent = "Created";

    setControlsDisabled(false);
    return true;
  } catch (error) {
    console.error("CREATE FAMILY LIST ERROR:", error);
    alert("Server error while creating the family list.");
    return false;
  }
}

async function loadOwnerName(ownerId) {
  if (!ownerText) return;

  if (!ownerId) {
    ownerText.textContent = "";
    return;
  }

  const currentUserId = getUserId();

  if (Number(ownerId) === Number(currentUserId)) {
    ownerText.innerHTML = `Owned by <strong>you</strong>`;
    return;
  }

  try {
    const res = await fetch(`/user/${ownerId}`);
    const data = await res.json();

    if (!res.ok) {
      ownerText.textContent = "";
      return;
    }

    ownerText.innerHTML = `Owned by <strong>${data.username}</strong>`;
  } catch (error) {
    console.error("LOAD OWNER ERROR:", error);
    ownerText.textContent = "";
  }
}
async function loadListById(listId) {
  const userId = getUserId();

  if (!userId || !listId) return;

  try {
    const res = await fetch(`/lists/${listId}?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Could not load the family list.");
      return;
    }

    currentListId = data.list.id;
    currentListName = data.list.title;

    updateListNameDisplays(currentListName);

    await loadOwnerName(data.list.owner_id);

    listNameInput.value = currentListName;
    listNameInput.disabled = true;

    createListBtn.disabled = true;
    createListBtn.textContent = "Created";

    setControlsDisabled(false);
  } catch (error) {
    console.error("LOAD FAMILY LIST ERROR:", error);
    alert("Server error while loading the family list.");
  }
}

async function loadItems() {
  const userId = getUserId();

  if (!userId || !currentListId) return;

  try {
    const res = await fetch(`/lists/${currentListId}/items?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Could not load items.");
      return;
    }

    shoppingItems = data.items || [];
    renderList();
  } catch (error) {
    console.error("LOAD FAMILY ITEMS ERROR:", error);
    alert("Server error while loading items.");
  }
}

async function loadMembers() {
  const userId = getUserId();

  if (!userId || !currentListId) {
    sharedMembers = [];
    renderMembers();
    return;
  }

  try {
    const res = await fetch(`/lists/${currentListId}/members?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();

    if (!res.ok) {
      sharedMembers = [];
      renderMembers();
      return;
    }

    sharedMembers = data.members || [];
    renderMembers();
  } catch (error) {
    console.error("LOAD FAMILY MEMBERS ERROR:", error);
    sharedMembers = [];
    renderMembers();
  }
}

async function addItem() {
  const userId = getUserId();

  if (!currentListId) {
    alert("Create the list first.");
    return;
  }

  const itemName = itemNameInput.value.trim();
  const quantity = quantityInput.value.trim() || "1";
  const unit = unitSelect.value || "pcs";

  if (!itemName) {
    alert("Please write an item first.");
    return;
  }

  try {
    const res = await fetch(`/lists/${currentListId}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        text: itemName,
        quantity,
        unit
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Could not add item.");
      return;
    }

    itemNameInput.value = "";
    quantityInput.value = "";
    unitSelect.value = "pcs";

    await loadItems();
  } catch (error) {
    console.error("ADD FAMILY ITEM ERROR:", error);
    alert("Server error while adding item.");
  }
}

async function toggleComplete(itemId) {
  const userId = getUserId();
  const item = shoppingItems.find((x) => x.id === itemId);

  if (!item) return;

  try {
    const res = await fetch(`/items/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        is_completed: !item.is_completed
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Could not update item.");
      return;
    }

    await loadItems();
  } catch (error) {
    console.error("TOGGLE FAMILY ITEM ERROR:", error);
    alert("Server error while updating item.");
  }
}

async function removeItem(itemId) {
  const userId = getUserId();

  try {
    const res = await fetch(`/items/${itemId}?userId=${encodeURIComponent(userId)}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Could not delete item.");
      return;
    }

    await loadItems();
  } catch (error) {
    console.error("DELETE FAMILY ITEM ERROR:", error);
    alert("Server error while deleting item.");
  }
}

async function editItem(itemId) {
  const userId = getUserId();
  const item = shoppingItems.find((x) => x.id === itemId);

  if (!item) return;

  const newName = prompt("Edit item name:", item.text);

  if (!newName || !newName.trim()) return;

  try {
    const res = await fetch(`/items/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        text: newName.trim()
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Could not edit item.");
      return;
    }

    await loadItems();
  } catch (error) {
    console.error("EDIT FAMILY ITEM ERROR:", error);
    alert("Server error while editing item.");
  }
}

async function addMemberToFamilyList() {
  const userId = getUserId();

  if (!currentListId) {
    alert("Create the list first.");
    return;
  }

  const selectedName = memberSelect.value.trim();

  if (!selectedName) {
    alert("Select a contact first.");
    return;
  }

  try {
    const res = await fetch(`/lists/${currentListId}/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        q: selectedName,
        permission: "edit"
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Could not share the list.");
      return;
    }


    memberSelect.value = "";
    await loadMembers();

  } catch (error) {
    console.error("SHARE FAMILY LIST ERROR:", error);
    alert("Server error while sharing the list.");
  }
}

async function removeMember(index) {
  const userId = getUserId();
  const member = sharedMembers[index];

  if (!member || !member.user_id || !currentListId) return;

  const confirmed = confirm(`Remove ${member.username} from this list?`);
  if (!confirmed) return;

  try {
    const res = await fetch(
      `/lists/${currentListId}/share/${member.user_id}?userId=${encodeURIComponent(userId)}`,
      {
        method: "DELETE"
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Could not remove member.");
      return;
    }

    await loadMembers();
  } catch (error) {
    console.error("REMOVE FAMILY MEMBER ERROR:", error);
    alert("Server error while removing member.");
  }
}
async function saveFamilyList() {
  if (!currentListId) {
    alert("Create the list first.");
    return;
  }

  if (shoppingItems.length === 0) {
    alert("Please add at least one item.");
    return;
  }

  window.location.href = `familylist.html?id=${encodeURIComponent(currentListId)}`;
}

function loadListFromURL() {
  const params = new URLSearchParams(window.location.search);
  const listId = Number(params.get("id"));

  if (listId) {
    currentListId = listId;
    loadListById(listId).then(async() => {
      await loadItems();
      await loadMembers();
    });
  } else {
    updateListNameDisplays("New Family List");
    if (ownerText) ownerText.textContent = "";
    setControlsDisabled(true);
    renderList();
    renderMembers();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!isLoggedIn()) {
    window.location.href = "PublicHome1.html";
    return;
  }

  await loadContactsFromDB();
  loadListFromURL();

  createListBtn?.addEventListener("click", createFamilyList);

  listNameInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      createFamilyList();
    }
  });

  addItemBtn?.addEventListener("click", addItem);

  itemNameInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addItem();
    }
  });

  quantityInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addItem();
    }
  });

  saveListBtn?.addEventListener("click", saveFamilyList);

  toggleMemberPickerBtn?.addEventListener("click", () => {
    if (!currentListId) {
      alert("Create the list first.");
      return;
    }

    memberPickerBox?.classList.toggle("hidden-box");
  });

  addMemberBtn?.addEventListener("click", addMemberToFamilyList);

  memberList?.addEventListener("click", (event) => {
    const removeBtn = event.target.closest("[data-member-remove-index]");
    if (!removeBtn) return;

    removeMember(Number(removeBtn.getAttribute("data-member-remove-index")));
  });

  visualItemList?.addEventListener("click", (event) => {
    const checkBtn = event.target.closest("[data-item-id]");
    const editBtn = event.target.closest("[data-edit-item-id]");
    const deleteBtn = event.target.closest("[data-delete-item-id]");

    if (checkBtn) {
      toggleComplete(Number(checkBtn.getAttribute("data-item-id")));
    }

    if (editBtn) {
      editItem(Number(editBtn.getAttribute("data-edit-item-id")));
    }

    if (deleteBtn) {
      removeItem(Number(deleteBtn.getAttribute("data-delete-item-id")));
    }
  });
});