document.addEventListener("DOMContentLoaded", () => {
  const myCreatedLists = document.getElementById("myCreatedLists");
  const savedListsMenu = document.getElementById("savedListsMenu");
  const createMenu = document.getElementById("mySubmenu");
  const toggleCreateMenuBtn = document.getElementById("toggleCreateMenuBtn");

  const createListSection = document.getElementById("createListSection");
  const activeListSection = document.getElementById("activeListSection");

  const listNameInput = document.getElementById("listNameInput");
  const createListBtn = document.getElementById("createListBtn");
  const createMessage = document.getElementById("createMessage");

  const currentListNameDisplay = document.getElementById("currentListNameDisplay");
  const itemInput = document.getElementById("itemInput");
  const addBtn = document.getElementById("addBtn");
  const shoppingList = document.getElementById("shoppingList");
  const itemsCount = document.getElementById("itemsCount");

  const logoLink = document.getElementById("logo-link");

  let currentListName = null;

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

  function getItemsForList(listName) {
    return JSON.parse(localStorage.getItem(`rayaListItems_${listName}`)) || [];
  }

  function setItemsForList(listName, items) {
    localStorage.setItem(`rayaListItems_${listName}`, JSON.stringify(items));
  }

  function updateItemsCount(items) {
    if (!itemsCount) return;

    const count = items.length;
    itemsCount.textContent = `${count} ${count === 1 ? "item" : "items"}`;
  }

  function showCreateMessage(text, isError = false) {
    if (!createMessage) return;

    createMessage.textContent = text;
    createMessage.classList.remove("message-error", "message-normal");
    createMessage.classList.add(isError ? "message-error" : "message-normal");
  }

  function createEmptyListMessage() {
    const li = document.createElement("li");
    li.className = "empty-list-item";
    li.textContent = "No lists yet";
    return li;
  }

  function createSavedListItem(listName) {
    const li = document.createElement("li");
    const link = document.createElement("a");

    link.href = `other.html?name=${encodeURIComponent(listName)}`;
    link.textContent = listName;

    li.appendChild(link);
    return li;
  }

  function loadLists() {
    if (!myCreatedLists) return;

    const allLists = getAllLists();
    myCreatedLists.innerHTML = "";

    if (allLists.length === 0) {
      myCreatedLists.appendChild(createEmptyListMessage());
      return;
    }

    allLists.forEach((listName) => {
      myCreatedLists.appendChild(createSavedListItem(listName));
    });
  }

  function createToggleButton(index, completed) {
    const button = document.createElement("button");
    const icon = document.createElement("i");

    button.type = "button";
    button.className = "item-toggle";
    if (completed) {
      button.classList.add("is-completed");
    }
    button.setAttribute("data-index", index);

    icon.className = "fa-solid fa-check";
    button.appendChild(icon);

    return button;
  }

  function createItemName(name, completed) {
    const span = document.createElement("span");
    span.className = "item-name";
    if (completed) {
      span.classList.add("is-completed");
    }
    span.textContent = name;
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
    const icon = document.createElement("i");

    button.type = "button";
    button.className = "delete-btn";
    button.setAttribute("data-delete-index", index);
    button.setAttribute("aria-label", "Delete item");

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
    if (!currentListName || !shoppingList) return;

    const items = getItemsForList(currentListName);
    shoppingList.innerHTML = "";

    items.forEach((item, index) => {
      shoppingList.appendChild(createShoppingItem(item, index));
    });

    updateItemsCount(items);
  }

  function openList(listName) {
    currentListName = listName;

    if (currentListNameDisplay) {
      currentListNameDisplay.textContent = listName;
    }

    if (createListSection) {
      createListSection.style.display = "none";
    }

    if (activeListSection) {
      activeListSection.style.display = "block";
    }

    renderItems();
  }

  function createNewList() {
    const listName = listNameInput?.value.trim();

    if (!listName) {
      showCreateMessage("Please enter a list name first.", true);
      return;
    }

    const allLists = getAllLists();

    if (!allLists.includes(listName)) {
      allLists.push(listName);
      setAllLists(allLists);
      setItemsForList(listName, []);
    }

    showCreateMessage("", false);
    loadLists();
    openList(listName);
  }


  function addItemToCurrentList() {
    const itemName = itemInput?.value.trim();
    const quantityInput = document.getElementById("quantityInput");
    const unitSelect = document.getElementById("unitSelect");

    const quantity = quantityInput?.value.trim();
    const unit = unitSelect?.value;

    if (!currentListName || !itemName) return;

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

      if (!Number.isNaN(index)) {
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
    }
  }

  function toggleCreateMenu() {
    if (!createMenu) return;

    createMenu.style.display =
      createMenu.style.display === "block" ? "none" : "block";
  }

  loadLists();
  loadListFromURL();

  toggleCreateMenuBtn?.addEventListener("click", toggleCreateMenu);
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

  shoppingList?.addEventListener("click", handleListClick);
});

function toggleSavedLists() {
  const menu = document.getElementById("savedListsMenu");
  if (!menu) return;

  menu.style.display = menu.style.display === "block" ? "none" : "block";
}