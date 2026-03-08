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

  let currentListId = null;
  let currentListName = null;
  let contactsCache = [];
  let currentItems = [];

  function getUserId() {
    const id = localStorage.getItem("userId");
    return id ? Number(id) : 0;
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

  function renderMembersPlaceholder() {
    if (!listMembers) return;

    listMembers.innerHTML = "";

    const li = document.createElement("li");
    li.className = "member-placeholder";
    li.textContent = "Members will be connected in the share step";
    listMembers.appendChild(li);
  }

  function createToggleButton(item) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "item-toggle";
    button.setAttribute("data-item-id", item.id);

    if (item.is_completed) {
      button.classList.add("is-completed");
    }

    const icon = document.createElement("i");
    icon.className = "fa-solid fa-check";
    button.appendChild(icon);

    return button;
  }

  function createItemName(item) {
    const span = document.createElement("span");
    span.className = "item-name";
    span.textContent = item.text;

    if (item.is_completed) {
      span.classList.add("is-completed");
    }

    return span;
  }

  function createItemBadge(item) {
    const badge = document.createElement("span");
    badge.className = "item-badge";

    if (item.is_completed) {
      badge.classList.add("is-done");
      badge.textContent = "Bought";
    } else {
      badge.textContent = `${item.quantity} ${item.unit}`;
    }

    return badge;
  }

  function createDeleteButton(item) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "delete-btn";
    button.setAttribute("data-delete-item-id", item.id);
    button.setAttribute("aria-label", "Delete item");

    const icon = document.createElement("i");
    icon.className = "fa-solid fa-trash";
    button.appendChild(icon);

    return button;
  }

  function createShoppingItem(item) {
    const li = document.createElement("li");
    li.className = "shopping-item";

    const toggleButton = createToggleButton(item);
    const itemName = createItemName(item);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const badge = createItemBadge(item);
    const deleteButton = createDeleteButton(item);

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

    if (!currentListId) {
      const li = document.createElement("li");
      li.className = "empty-list-item";
      li.textContent = "Create the list first";
      shoppingList.appendChild(li);
      updateItemsCount([]);
      renderMembersPlaceholder();
      return;
    }

    if (currentItems.length === 0) {
      const li = document.createElement("li");
      li.className = "empty-list-item";
      li.textContent = "No items yet";
      shoppingList.appendChild(li);
      updateItemsCount(currentItems);
      renderMembersPlaceholder();
      return;
    }

    currentItems.forEach((item) => {
      shoppingList.appendChild(createShoppingItem(item));
    });

    updateItemsCount(currentItems);
    renderMembersPlaceholder();
  }

  async function loadItems() {
    const userId = getUserId();
    if (!currentListId || !userId) return;

    try {
      const res = await fetch(`/lists/${currentListId}/items?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Could not load items.");
        return;
      }

      currentItems = data.items || [];
      renderItems();
    } catch (err) {
      console.error("LOAD ITEMS ERROR:", err);
    }
  }

  async function openList(listId) {
    const userId = getUserId();
    if (!listId || !userId) return;

    try {
      const res = await fetch(`/lists/${listId}?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Could not open list.");
        return;
      }

      currentListId = data.list.id;
      currentListName = data.list.title;

      updateListNameDisplays(currentListName);

      if (listNameInput) {
        listNameInput.value = currentListName;
        listNameInput.disabled = true;
      }

      if (createListBtn) {
        createListBtn.disabled = true;
        createListBtn.textContent = "Created";
      }

      setControlsDisabled(false);
      await loadItems();
    } catch (err) {
      console.error("OPEN LIST ERROR:", err);
    }
  }

  async function createNewList() {
    const userId = getUserId();
    const listName = listNameInput?.value.trim();

    if (!userId) {
      alert("You must be logged in.");
      return;
    }

    if (!listName) {
      alert("Please enter a list name first.");
      return;
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
          listType: "other"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Could not create list.");
        return;
      }

      window.location.href = `other.html?id=${encodeURIComponent(data.listId)}`;
    } catch (err) {
      console.error("CREATE LIST ERROR:", err);
      alert("Server error while creating the list.");
    }
  }

  async function addItemToCurrentList() {
    const userId = getUserId();
    const itemName = itemInput?.value.trim();
    const quantity = quantityInput?.value.trim() || "1";
    const unit = unitSelect?.value || "pcs";

    if (!currentListId) {
      alert("Create the list first.");
      return;
    }

    if (!itemName) {
      alert("Please write an item name.");
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

      itemInput.value = "";
      if (quantityInput) quantityInput.value = "";
      if (unitSelect) unitSelect.value = "pcs";

      await loadItems();
    } catch (err) {
      console.error("ADD ITEM ERROR:", err);
      alert("Server error while adding the item.");
    }
  }

  async function addMemberToCurrentList() {
    const userId = getUserId();

    if (!currentListId) {
      alert("Create the list first.");
      return;
    }

    const selectedName = memberSelect?.value.trim();

    if (!selectedName) {
      alert("Please select a contact first.");
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

      alert(`List shared with ${selectedName}.`);
      memberSelect.value = "";
    } catch (err) {
      console.error("SHARE LIST ERROR:", err);
      alert("Server error while sharing the list.");
    }
  }

  async function handleListClick(event) {
    const toggleBtn = event.target.closest("[data-item-id]");
    const deleteBtn = event.target.closest("[data-delete-item-id]");
    const userId = getUserId();

    if (toggleBtn) {
      const itemId = Number(toggleBtn.getAttribute("data-item-id"));

      try {
        const item = currentItems.find((x) => x.id === itemId);
        if (!item) return;

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
          alert(data.message || "Could not update the item.");
          return;
        }

        await loadItems();
      } catch (err) {
        console.error("TOGGLE ITEM ERROR:", err);
      }
    }

    if (deleteBtn) {
      const itemId = Number(deleteBtn.getAttribute("data-delete-item-id"));

      try {
        const res = await fetch(`/items/${itemId}?userId=${encodeURIComponent(userId)}`, {
          method: "DELETE"
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Could not delete the item.");
          return;
        }

        await loadItems();
      } catch (err) {
        console.error("DELETE ITEM ERROR:", err);
      }
    }
  }

  function loadListFromURL() {
    const params = new URLSearchParams(window.location.search);
    const listIdFromURL = Number(params.get("id"));

    if (listIdFromURL) {
      openList(listIdFromURL);
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
    if (!currentListId) {
      alert("Create the list first.");
      return;
    }

    memberPickerBox?.classList.toggle("hidden-box");
  });

  addMemberBtn?.addEventListener("click", addMemberToCurrentList);
});