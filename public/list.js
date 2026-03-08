document.addEventListener("DOMContentLoaded", async () => {
  const myCreatedLists = document.getElementById("myCreatedLists");
  const toggleCreateMenuBtn = document.getElementById("toggleCreateMenuBtn");
  const createMenu = document.getElementById("mySubmenu");
  const historyListsEl = document.getElementById("historyLists");

  function getUserId() {
    const id = localStorage.getItem("userId");
    return id ? Number(id) : 0;
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

  function getListPage(list) {
    if (list.list_type === "private") {
      return "privatelist.html";
    }

    if (list.list_type === "family") {
      return "familylist.html";
    }

    return "other.html";
  }

  async function fetchLists() {
    const userId = getUserId();
    if (!userId) return [];

    try {
      const res = await fetch(`/lists?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();

      if (!res.ok) {
        console.error("GET LISTS ERROR:", data.message);
        return [];
      }

      return data.lists || [];
    } catch (err) {
      console.error("Could not fetch lists:", err);
      return [];
    }
  }

  async function deleteListFromDB(listId) {
    const userId = getUserId();

    if (!userId || !listId) {
      return {
        ok: false,
        message: "Missing userId or listId."
      };
    }

    try {
      const res = await fetch(`/lists/${listId}?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          ok: false,
          message: data.message || "Could not delete the list."
        };
      }

      return { ok: true, data };
    } catch (err) {
      console.error("DELETE LIST ERROR:", err);
      return {
        ok: false,
        message: "Server error while deleting the list."
      };
    }
  }

  function moveListToHistory(list) {
    const historyLists = getHistoryLists();

    if (!historyLists.find((x) => x.id === list.id)) {
      historyLists.push(list);
      setHistoryLists(historyLists);
    }
  }

  function restoreListFromHistory(listId) {
    const historyLists = getHistoryLists();
    const updatedHistory = historyLists.filter((x) => x.id !== listId);
    setHistoryLists(updatedHistory);
    loadHistoryLists();
  }

  function deleteListForever(listId) {
    const historyLists = getHistoryLists();
    const updatedHistory = historyLists.filter((x) => x.id !== listId);
    setHistoryLists(updatedHistory);
    loadHistoryLists();
  }

  function createSavedListItem(list) {
    const li = document.createElement("li");
    li.className = "saved-list-item";

    const link = document.createElement("a");
    link.href = `${getListPage(list)}?id=${encodeURIComponent(list.id)}`;
    link.textContent = list.title;
    link.className = "saved-list-link";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-list-btn";
    deleteBtn.setAttribute("aria-label", `Delete ${list.title}`);

    const icon = document.createElement("i");
    icon.className = "fa-solid fa-trash";
    deleteBtn.appendChild(icon);

    deleteBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const confirmed = confirm(`Delete the list "${list.title}"?`);
      if (!confirmed) return;

      const result = await deleteListFromDB(list.id);

      if (!result.ok) {
        alert(result.message);
        return;
      }

      moveListToHistory(list);
      await loadLists();
      loadHistoryLists();
    });

    li.appendChild(link);
    li.appendChild(deleteBtn);

    return li;
  }

  function createHistoryListItem(list) {
    const li = document.createElement("li");
    li.className = "history-list-item";

    const link = document.createElement("a");
    link.href = "#";
    link.textContent = list.title;
    link.className = "history-list-link";

    const actions = document.createElement("div");
    actions.className = "history-actions";

    const restoreBtn = document.createElement("button");
    restoreBtn.type = "button";
    restoreBtn.className = "restore-list-btn";
    restoreBtn.title = "Remove from history";

    const restoreIcon = document.createElement("i");
    restoreIcon.className = "fa-solid fa-rotate-left";
    restoreBtn.appendChild(restoreIcon);

    restoreBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      restoreListFromHistory(list.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-history-btn";
    deleteBtn.title = "Delete from history";

    const deleteIcon = document.createElement("i");
    deleteIcon.className = "fa-solid fa-trash";
    deleteBtn.appendChild(deleteIcon);

    deleteBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      deleteListForever(list.id);
    });

    actions.appendChild(restoreBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(link);
    li.appendChild(actions);

    return li;
  }

  async function loadLists() {
    if (!myCreatedLists) return;

    const allLists = await fetchLists();
    myCreatedLists.innerHTML = "";

    if (allLists.length === 0) {
      myCreatedLists.appendChild(createEmptyListMessage("No lists yet"));
      return;
    }

    allLists.forEach((list) => {
      myCreatedLists.appendChild(createSavedListItem(list));
    });
  }

  function loadHistoryLists() {
    if (!historyListsEl) return;

    const historyLists = getHistoryLists();
    historyListsEl.innerHTML = "";

    if (historyLists.length === 0) {
      historyListsEl.appendChild(createEmptyListMessage("No history yet"));
      return;
    }

    historyLists.forEach((list) => {
      historyListsEl.appendChild(createHistoryListItem(list));
    });
  }

  toggleCreateMenuBtn?.addEventListener("click", toggleCreateMenu);

  await loadLists();
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