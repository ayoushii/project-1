const itemNameInput = document.getElementById("itemNameInput");
const addItemBtn = document.getElementById("addItemBtn");
const visualItemList = document.getElementById("visualItemList");
const listNameInput = document.getElementById("listNameInput");
const saveListBtn = document.getElementById("saveListBtn");

let shoppingItems = [];

function getAllLists() {
    return JSON.parse(localStorage.getItem("rayaLists")) || [];
}

function setAllLists(lists) {
    localStorage.setItem("rayaLists", JSON.stringify(lists));
}

function setItemsForList(listName, items) {
    localStorage.setItem(`rayaListItems_${listName}`, JSON.stringify(items));
}

function createEmptyState() {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = "No items added yet.";
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

function createBadge(quantity, unit) {
    const badge = document.createElement("span");
    badge.className = "item-badge";
    badge.textContent = `${quantity} ${unit}`;
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
    const badge = createBadge(item.quantity || 1, item.unit || "pcs");

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
    visualItemList.innerHTML = "";

    if (shoppingItems.length === 0) {
        visualItemList.appendChild(createEmptyState());
        return;
    }

    shoppingItems.forEach((item, index) => {
        visualItemList.appendChild(createItemRow(item, index));
    });
}

function addItem() {
    const value = itemNameInput.value.trim();

    if (!value) return;

    shoppingItems.push({
        name: value,
        quantity: 1,
        unit: "pcs",
        completed: false
    });

    itemNameInput.value = "";
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

    const newText = prompt("Edit item:", shoppingItems[index].name);

    if (!newText || !newText.trim()) return;

    shoppingItems[index].name = newText.trim();
    renderList();
}

function savePrivateList() {
    const listName = listNameInput.value.trim();

    if (!listName) {
        alert("Please enter a list name.");
        return;
    }

    if (shoppingItems.length === 0) {
        alert("Please add at least one item.");
        return;
    }

    const allLists = getAllLists();

    if (!allLists.includes(listName)) {
        allLists.push(listName);
        setAllLists(allLists);
    }

    setItemsForList(listName, shoppingItems);
    window.location.href = `other.html?name=${encodeURIComponent(listName)}`;
}

addItemBtn?.addEventListener("click", addItem);

itemNameInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addItem();
    }
});

saveListBtn?.addEventListener("click", savePrivateList);

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

renderList();