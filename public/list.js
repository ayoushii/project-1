document.addEventListener("DOMContentLoaded", () => {
  const myCreatedLists = document.getElementById("myCreatedLists");
  const toggleCreateMenuBtn = document.getElementById("toggleCreateMenuBtn");
  const createMenu = document.getElementById("mySubmenu");

  function getAllLists() {
    return JSON.parse(localStorage.getItem("rayaLists")) || [];
  }

  function setAllLists(lists) {
    localStorage.setItem("rayaLists", JSON.stringify(lists));
  }

  function getHistoryLists() {
    return JSON.parse(localStorage.getItem("rayaHistoryLists")) || [];
  }

  function setHistoryLists(lists) {
    localStorage.setItem("rayaHistoryLists", JSON.stringify(lists));
  }

  function createEmptyListMessage(text) {
    const li = document.createElement("li");
    li.className = "empty-list-item";
    li.textContent = text;
    return li;
  }

  function toggleCreateMenu() {
    if (!createMenu) return;

    createMenu.style.display =
      createMenu.style.display === "block" ? "none" : "block";
  }

  function moveListToHistory(listName) {
    const allLists = getAllLists();
    const historyLists = getHistoryLists();

    const updatedLists = allLists.filter((name) => name !== listName);

    if (!historyLists.includes(listName)) {
      historyLists.push(listName);
    }

    setAllLists(updatedLists);
    setHistoryLists(historyLists);

    loadLists();
    loadHistoryLists();
  }

  function restoreListFromHistory(listName) {
    const allLists = getAllLists();
    const historyLists = getHistoryLists();

    if (!allLists.includes(listName)) {
      allLists.push(listName);
    }

    const updatedHistory = historyLists.filter((name) => name !== listName);

    setAllLists(allLists);
    setHistoryLists(updatedHistory);

    loadLists();
    loadHistoryLists();
  }

  function deleteListForever(listName) {
    const historyLists = getHistoryLists();
    const updatedHistory = historyLists.filter((name) => name !== listName);

    setHistoryLists(updatedHistory);
    localStorage.removeItem(`rayaListItems_${listName}`);
    localStorage.removeItem(`rayaListMembers_${listName}`);

    loadHistoryLists();
  }

  function createSavedListItem(listName) {
    const li = document.createElement("li");
    li.className = "saved-list-item";

    const link = document.createElement("a");
    link.href = `other.html?name=${encodeURIComponent(listName)}`;
    link.textContent = listName;
    link.className = "saved-list-link";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-list-btn";
    deleteBtn.setAttribute("aria-label", `Move ${listName} to history`);

    const icon = document.createElement("i");
    icon.className = "fa-solid fa-trash";
    deleteBtn.appendChild(icon);

    deleteBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      moveListToHistory(listName);
    });

    li.appendChild(link);
    li.appendChild(deleteBtn);

    return li;
  }

  function createHistoryListItem(listName) {
    const li = document.createElement("li");
    li.className = "history-list-item";

    const link = document.createElement("a");
    link.href = `other.html?name=${encodeURIComponent(listName)}`;
    link.textContent = listName;
    link.className = "history-list-link";

    const actions = document.createElement("div");
    actions.className = "history-actions";

    const restoreBtn = document.createElement("button");
    restoreBtn.type = "button";
    restoreBtn.className = "restore-list-btn";

    const restoreIcon = document.createElement("i");
    restoreIcon.className = "fa-solid fa-rotate-left";
    restoreBtn.appendChild(restoreIcon);

    restoreBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      restoreListFromHistory(listName);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-history-btn";

    const deleteIcon = document.createElement("i");
    deleteIcon.className = "fa-solid fa-trash";
    deleteBtn.appendChild(deleteIcon);

    deleteBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      deleteListForever(listName);
    });

    actions.appendChild(restoreBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(link);
    li.appendChild(actions);

    return li;
  }

  function loadLists() {
    if (!myCreatedLists) return;

    const allLists = getAllLists();
    myCreatedLists.innerHTML = "";

    if (allLists.length === 0) {
      myCreatedLists.appendChild(createEmptyListMessage("No lists yet"));
      return;
    }

    allLists.forEach((listName) => {
      myCreatedLists.appendChild(createSavedListItem(listName));
    });
  }

  function loadHistoryLists() {
    const historyContainer = document.getElementById("historyLists");
    if (!historyContainer) return;

    const historyLists = getHistoryLists();
    historyContainer.innerHTML = "";

    if (historyLists.length === 0) {
      historyContainer.appendChild(createEmptyListMessage("No history yet"));
      return;
    }

    historyLists.forEach((listName) => {
      historyContainer.appendChild(createHistoryListItem(listName));
    });
  }

  toggleCreateMenuBtn?.addEventListener("click", toggleCreateMenu);

  loadLists();
  loadHistoryLists();
});

function toggleSavedLists() {
  const menu = document.getElementById("savedListsMenu");
  if (!menu) return;

  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function toggleHistoryLists() {
  const menu = document.getElementById("historyMenu");
  if (!menu) return;

  menu.style.display = menu.style.display === "block" ? "none" : "block";
}