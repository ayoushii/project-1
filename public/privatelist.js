let shoppingItems = [];

const addItemBtn = document.getElementById('addItemBtn');
const itemNameInput = document.getElementById('itemNameInput');
const visualItemList = document.getElementById('visualItemList');
const listNameInput = document.getElementById('listNameInput');
const saveListBtn = document.getElementById('saveListBtn');

// Lägg till vara
addItemBtn.addEventListener('click', () => {
    const val = itemNameInput.value.trim();
    if (val) {
        shoppingItems.push({ text: val, completed: false });
        itemNameInput.value = "";
        renderList();
    }
});

// Rita ut listan
function renderList() {
    visualItemList.innerHTML = "";
    shoppingItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = "item-row";
        li.innerHTML = `
            <div class="item-left">
                <input type="checkbox" class="item-checkbox" ${item.completed ? 'checked' : ''} onchange="toggleComplete(${index})">
                <span class="item-text ${item.completed ? 'completed' : ''}">${item.text}</span>
            </div>
            <div class="item-actions">
                <button class="edit-btn" onclick="editItem(${index})"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-btn" onclick="removeItem(${index})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        visualItemList.appendChild(li);
    });
}

// Funktioner för knapparna
window.toggleComplete = (index) => {
    shoppingItems[index].completed = !shoppingItems[index].completed;
    renderList();
};

window.removeItem = (index) => {
    shoppingItems.splice(index, 1);
    renderList();
};

window.editItem = (index) => {
    const newText = prompt("Redigera vara:", shoppingItems[index].text);
    if (newText) {
        shoppingItems[index].text = newText;
        renderList();
    }
};

saveListBtn.addEventListener('click', () => {
    if (!listNameInput.value.trim()) return alert("Namnge listan!");
    alert("Listan '" + listNameInput.value + "' sparad!");
    console.log("Data att skicka till databas:", { title: listNameInput.value, items: shoppingItems });
});