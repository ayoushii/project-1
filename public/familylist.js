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

let shoppingItems = [];
let familyMembers = [];
let contactsCache = [];
let currentListName = null;

function getUserId() {
  const id = localStorage.getItem("userId");
  return id ? Number(id) : 0;
}

function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

function getAllLists() {
  return JSON.parse(localStorage.getItem("rayaLists")) || [];
}

function setAllLists(lists) {
  localStorage.setItem("rayaLists", JSON.stringify(lists));
}

function setItemsForList(listName, items) {
  localStorage.setItem(`rayaListItems_${listName}`, JSON.stringify(items));
}

function setMembersForList(listName, members) {
  localStorage.setItem(`rayaListMembers_${listName}`, JSON.stringify(members));
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

    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      data = {};
    }

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

function createCheckButton(index, completed) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "check-btn";
  button.setAttribute("data-index", index);

  if (completed) {
    button.classList.add("checked");
  }

  const icon = document.createElement("i");
  icon.className = "fa-solid fa-check";
  button.appendChild(icon);

  return button;
}

function createItemText(name, completed) {
  const span = document.createElement("span");
  span.className = "item-text";
  span.textContent = name;

  if (completed) {
    span.classList.add("completed");
  }

  return span;
}

function createBadge(quantity, unit, completed) {
  const badge = document.createElement("span");
  badge.className = "item-badge";
  badge.textContent = completed ? "Bought" : `${quantity} ${unit}`;
  return badge;
}

function createActionButton(className, iconClass, dataAttribute, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.setAttribute(dataAttribute, index);

  const icon = document.createElement("i");
  icon.className = iconClass;
  button.appendChild(icon);

  return button;
}

function createItemRow(item, index) {
  const li = document.createElement("li");
  li.className = "item-row";

  const left = document.createElement("div");
  left.className = "item-left";

  const actions = document.createElement("div");
  actions.className = "item-actions";

  const checkBtn = createCheckButton(index, item.completed);
  const text = createItemText(item.name, item.completed);
  const badge = createBadge(item.quantity, item.unit, item.completed);

  const editBtn = createActionButton(
    "edit-btn",
    "fa-solid fa-pen",
    "data-edit-index",
    index
  );

  const deleteBtn = createActionButton(
    "delete-btn",
    "fa-solid fa-trash",
    "data-delete-index",
    index
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

  if (!currentListName) {
    visualItemList.appendChild(createEmptyState("Create the list first."));
    return;
  }

  if (shoppingItems.length === 0) {
    visualItemList.appendChild(createEmptyState("No items added yet."));
    return;
  }

  shoppingItems.forEach((item, index) => {
    visualItemList.appendChild(createItemRow(item, index));
  });
}

function addItem() {
  if (!currentListName) {
    alert("Create the list first.");
    return;
  }

  const itemName = itemNameInput.value.trim();
  const quantity = quantityInput.value.trim() || "1";
  const unit = unitSelect.value || "pcs";

  if (!itemName) {
    alert("Write an item first.");
    return;
  }

  shoppingItems.push({
    name: itemName,
    quantity: quantity,
    unit: unit,
    completed: false
  });

  itemNameInput.value = "";
  quantityInput.value = "";
  unitSelect.value = "pcs";

  renderList();
}

function toggleComplete(index) {
  if (!shoppingItems[index]) return;

  shoppingItems[index].completed = !shoppingItems[index].completed;
  renderList();
}

function removeItem(index) {
  if (!shoppingItems[index]) return;

  shoppingItems.splice(index, 1);
  renderList();
}

function editItem(index) {
  if (!shoppingItems[index]) return;

  const newName = prompt("Edit item name:", shoppingItems[index].name);
  if (!newName || !newName.trim()) return;

  shoppingItems[index].name = newName.trim();
  renderList();
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

function createMemberChip(memberName, index) {
  const li = document.createElement("li");
  li.className = "member-chip";

  const icon = document.createElement("i");
  icon.className = "fa-solid fa-user";

  const text = document.createElement("span");
  text.textContent = memberName;

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

  if (!currentListName) {
    memberList.appendChild(createEmptyState("Create the list first."));
    return;
  }

  if (familyMembers.length === 0) {
    memberList.appendChild(createEmptyState("No members added yet."));
    return;
  }

  familyMembers.forEach((memberName, index) => {
    memberList.appendChild(createMemberChip(memberName, index));
  });
}

function addMemberToFamilyList() {
  if (!currentListName) {
    alert("Create the list first.");
    return;
  }

  const selectedName = memberSelect.value.trim();
  if (!selectedName) {
    alert("Select a contact first.");
    return;
  }

  if (!familyMembers.includes(selectedName)) {
    familyMembers.push(selectedName);
  }

  memberSelect.value = "";
  renderMembers();
}

function removeMember(index) {
  if (!familyMembers[index]) return;

  familyMembers.splice(index, 1);
  renderMembers();
}

function createFamilyList() {
  const listName = listNameInput.value.trim();

  if (!listName) {
    alert("Please enter a list name.");
    return;
  }

  currentListName = listName;
  updateListNameDisplays(listName);

  listNameInput.disabled = true;
  createListBtn.disabled = true;
  createListBtn.textContent = "Created";

  setControlsDisabled(false);
  renderList();
  renderMembers();
}

function saveFamilyList() {
  if (!currentListName) {
    alert("Create the list first.");
    return;
  }

  if (shoppingItems.length === 0) {
    alert("Please add at least one item.");
    return;
  }

  const allLists = getAllLists();

  if (!allLists.includes(currentListName)) {
    allLists.push(currentListName);
    setAllLists(allLists);
  }

  setItemsForList(currentListName, shoppingItems);
  setMembersForList(currentListName, familyMembers);

  window.location.href = `other.html?name=${encodeURIComponent(currentListName)}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!isLoggedIn()) {
    window.location.href = "PublicHome1.html";
    return;
  }

  updateListNameDisplays("New Family List");
  setControlsDisabled(true);

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
    if (!currentListName) {
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
    const checkBtn = event.target.closest("[data-index]");
    const editBtn = event.target.closest("[data-edit-index]");
    const deleteBtn = event.target.closest("[data-delete-index]");

    if (checkBtn) {
      toggleComplete(Number(checkBtn.getAttribute("data-index")));
    }

    if (editBtn) {
      editItem(Number(editBtn.getAttribute("data-edit-index")));
    }

    if (deleteBtn) {
      removeItem(Number(deleteBtn.getAttribute("data-delete-index")));
    }
  });

  await loadContactsFromDB();
  renderList();
  renderMembers();
});