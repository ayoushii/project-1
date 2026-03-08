document.addEventListener("DOMContentLoaded", async () => {
  const itemInput = document.getElementById("itemInput");
  const addBtn = document.getElementById("addBtn");
  const shoppingList = document.getElementById("shoppingList");
  const logoLink = document.getElementById("logo-link");
  const quantityInput = document.getElementById("quantityInput");
  const unitSelect = document.getElementById("unitSelect");
  const listNameInput = document.getElementById("listNameInput");
  const createListBtn = document.getElementById("createListBtn");
  const toggleMemberPickerBtn = document.getElementById("toggleMemberPickerBtn");
  const memberPickerBox = document.getElementById("memberPickerBox");
  const memberSelect = document.getElementById("memberSelect");
  const addMemberBtn = document.getElementById("addMemberBtn");
  const listMembers = document.getElementById("listMembers");

  let currentListName = null;
  let contactsCache = [];

  if (logoLink) {
    logoLink.addEventListener("click", (event) => {
      event.preventDefault();

      if (localStorage.getItem("isLoggedIn") === "true") {
        window.location.href = "PrivateHome2.html";
      } else {
        window.location.href = "PublicHome1.html";
      }
    });
  }

  function getAllLists() {
    return JSON.parse(localStorage.getItem("rayaLists")) || [];
  }

  function setAllLists(lists) {
    localStorage.setItem("rayaLists", JSON.stringify(lists));
  }

  function getUserId() {
    const id = localStorage.getItem("userId");
    return id ? Number(id) : 0;
  }

  function getItemsForList(listName) {
    return JSON.parse(localStorage.getItem(`rayaListItems_${listName}`)) || [];
  }

  function setItemsForList(listName, items) {
    localStorage.setItem(`rayaListItems_${listName}`, JSON.stringify(items));
  }

  function getMembersForList(listName) {
    return JSON.parse(localStorage.getItem(`rayaListMembers_${listName}`)) || [];
  }

  function setMembersForList(listName, members) {
    localStorage.setItem(`rayaListMembers_${listName}`, JSON.stringify(members));
  }

  function updateListNameDisplays(listName) {
    const nameEls = document.querySelectorAll(".current-list-name");
    nameEls.forEach((el) => {
      el.textContent = listName;
    });
  }

  function updateItemsCount(items) {
    const count = items.length;
    const countEls = document.querySelectorAll(".items-count");
    countEls.forEach((el) => {
      el.textContent = `${count} ${count === 1 ? "item" : "items"}`;
    });
  }

  function setControlsDisabled(disabled) {
    if (itemInput) itemInput.disabled = disabled;
    if (quantityInput) quantityInput.disabled = disabled;
    if (unitSelect) unitSelect.disabled = disabled;
    if (addBtn) addBtn.disabled = disabled;
    if (toggleMemberPickerBtn) toggleMemberPickerBtn.disabled = disabled;
    if (memberSelect) memberSelect.disabled = disabled;
    if (addMemberBtn) addMemberBtn.disabled = disabled;
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

  function renderMembers() {
    if (!listMembers) return;

    listMembers.innerHTML = "";

    if (!currentListName) {
      const li = document.createElement("li");
      li.className = "member-placeholder";
      li.textContent = "Create the list first";
      listMembers.appendChild(li);
      return;
    }

    const members = getMembersForList(currentListName);

    if (members.length === 0) {
      const li = document.createElement("li");
      li.className = "member-placeholder";
      li.textContent = "No members";
      listMembers.appendChild(li);
      return;
    }

    members.forEach((memberName) => {
      const li = document.createElement("li");
      li.className = "member-chip";

      const icon = document.createElement("i");
      icon.className = "fa-solid fa-user";

      const text = document.createElement("span");
      text.textContent = memberName;

      li.appendChild(icon);
      li.appendChild(text);
      listMembers.appendChild(li);
    });
  }

  function createToggleButton(index, completed) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "item-toggle";
    button.setAttribute("data-index", index);

    if (completed) {
      button.classList.add("is-completed");
    }

    const icon = document.createElement("i");
    icon.className = "fa-solid fa-check";
    button.appendChild(icon);

    return button;
  }

  function createItemName(name, completed) {
    const span = document.createElement("span");
    span.className = "item-name";
    span.textContent = name;

    if (completed) {
      span.classList.add("is-completed");
    }

    return span;
  }

  function createItemBadge(item) {
    const badge = document.createElement("span");
    badge.className = "item-badge";

    if (item.completed) {
      badge.classList.add("is-done");
      badge.textContent = "Bought";
    } else {
      badge.textContent = `${item.quantity} ${item.unit}`;
    }

    return badge;
  }

  function createDeleteButton(index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "delete-btn";
    button.setAttribute("data-delete-index", index);
    button.setAttribute("aria-label", "Delete item");

    const icon = document.createElement("i");
    icon.className = "fa-solid fa-trash";
    button.appendChild(icon);

    return button;
  }

  function createShoppingItem(item, index) {
    const li = document.createElement("li");
    li.className = "shopping-item";

    const toggleButton = createToggleButton(index, item.completed);
    const itemName = createItemName(item.name, item.completed);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const badge = createItemBadge(item);
    const deleteButton = createDeleteButton(index);

    actions.appendChild(badge);
    actions.appendChild(deleteButton);

    li.appendChild(toggleButton);
    li.appendChild(itemName);
    li.appendChild(actions);

    return li;
  }

  function renderItems() {
    if (!shoppingList) return;

    shoppingList.innerHTML = "";

    if (!currentListName) {
      const li = document.createElement("li");
      li.className = "empty-list-item";
      li.textContent = "Create the list first";
      shoppingList.appendChild(li);
      updateItemsCount([]);
      renderMembers();
      return;
    }

    const items = getItemsForList(currentListName);

    if (items.length === 0) {
      const li = document.createElement("li");
      li.className = "empty-list-item";
      li.textContent = "No items yet";
      shoppingList.appendChild(li);
      updateItemsCount(items);
      renderMembers();
      return;
    }

    items.forEach((item, index) => {
      shoppingList.appendChild(createShoppingItem(item, index));
    });

    updateItemsCount(items);
    renderMembers();
  }

  function openList(listName) {
    currentListName = listName;
    updateListNameDisplays(listName);
    renderItems();

    if (listNameInput) {
      listNameInput.value = listName;
      listNameInput.disabled = true;
    }

    if (createListBtn) {
      createListBtn.disabled = true;
      createListBtn.textContent = "Created";
    }

    setControlsDisabled(false);
  }

  function createNewList() {
    const listName = listNameInput?.value.trim();

    if (!listName) {
      alert("Write a list name first.");
      return;
    }

    const allLists = getAllLists();

    if (!allLists.includes(listName)) {
      allLists.push(listName);
      setAllLists(allLists);
      setItemsForList(listName, []);
      setMembersForList(listName, []);
    }

    openList(listName);
  }

  function addItemToCurrentList() {
    const itemName = itemInput?.value.trim();
    const quantity = quantityInput?.value.trim();
    const unit = unitSelect?.value;

    if (!currentListName) {
      alert("Create the list first.");
      return;
    }

    if (!itemName) {
      alert("Write an item first.");
      return;
    }

    const items = getItemsForList(currentListName);

    items.push({
      name: itemName,
      quantity: quantity || "1",
      unit: unit || "pcs",
      completed: false
    });

    setItemsForList(currentListName, items);

    itemInput.value = "";
    if (quantityInput) quantityInput.value = "";
    if (unitSelect) unitSelect.value = "pcs";

    renderItems();
  }

  function addMemberToCurrentList() {
    if (!currentListName) {
      alert("Create the list first.");
      return;
    }

    const selectedName = memberSelect?.value.trim();

    if (!selectedName) {
      alert("Select a contact first.");
      return;
    }

    const members = getMembersForList(currentListName);

    if (!members.includes(selectedName)) {
      members.push(selectedName);
      setMembersForList(currentListName, members);
    }

    memberSelect.value = "";
    renderMembers();
  }

  function handleListClick(event) {
    const toggleBtn = event.target.closest("[data-index]");
    const deleteBtn = event.target.closest("[data-delete-index]");

    if (!currentListName) return;

    const items = getItemsForList(currentListName);

    if (toggleBtn) {
      const index = Number(toggleBtn.getAttribute("data-index"));

      if (!Number.isNaN(index) && items[index]) {
        items[index].completed = !items[index].completed;
        setItemsForList(currentListName, items);
        renderItems();
      }
    }

    if (deleteBtn) {
      const index = Number(deleteBtn.getAttribute("data-delete-index"));

      if (!Number.isNaN(index) && items[index]) {
        items.splice(index, 1);
        setItemsForList(currentListName, items);
        renderItems();
      }
    }
  }

  function loadListFromURL() {
    const params = new URLSearchParams(window.location.search);
    const listNameFromURL = params.get("name");

    if (listNameFromURL) {
      openList(listNameFromURL);
    } else {
      updateListNameDisplays("New List");
      setControlsDisabled(true);
      renderItems();
    }
  }

  loadListFromURL();
  await loadContactsFromDB();

  createListBtn?.addEventListener("click", createNewList);

  listNameInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      createNewList();
    }
  });

  addBtn?.addEventListener("click", addItemToCurrentList);

  itemInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addItemToCurrentList();
    }
  });

  quantityInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addItemToCurrentList();
    }
  });

  shoppingList?.addEventListener("click", handleListClick);

  toggleMemberPickerBtn?.addEventListener("click", () => {
    if (!currentListName) {
      alert("Create the list first.");
      return;
    }

    memberPickerBox?.classList.toggle("hidden-box");
  });

  addMemberBtn?.addEventListener("click", addMemberToCurrentList);
});