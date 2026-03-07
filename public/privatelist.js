// 1. MINNET: En lista (array) som håller reda på dina varor i datorns minne
let shoppingItems = [];

// 2. NERVERNA: Vi kopplar ihop koden med elementen i din HTML
const addItemBtn = document.getElementById('addItemBtn');
const itemNameInput = document.getElementById('itemNameInput');
const visualItemList = document.getElementById('visualItemList');
const listNameInput = document.getElementById('listNameInput');
const saveListBtn = document.getElementById('saveListBtn');

// 3. LYSSNA PÅ KLICK: Vad händer när man trycker på "+"?
addItemBtn.addEventListener('click', function() {
    const itemValue = itemNameInput.value.trim(); // Hämtar vad du skrivit

    if (itemValue !== "") {
        // Lägg till varan i vårt minne (arrayen)
        shoppingItems.push(itemValue);
        
        // Uppdatera listan som syns på skärmen
        renderList();
        
        // Töm rutan så man kan skriva nästa sak
        itemNameInput.value = "";
        itemNameInput.focus(); 
    } else {
        alert("Skriv in en vara först!");
    }
});

// 4. ENTER-FUNKTION: Gör så att man kan trycka på Enter istället för att klicka på +
itemNameInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        addItemBtn.click(); // Detta "låtsas" klicka på plus-knappen åt dig
    }
});

// 5. VISA PÅ SKÄRMEN: Denna funktion ritar ut listan på nytt varje gång den ändras
function renderList() {
    visualItemList.innerHTML = ""; // Rensa först så det inte blir dubbelt

    shoppingItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item}</span>
            <button onclick="removeItem(${index})" style="margin-left:10px; color:red; cursor:pointer;">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        visualItemList.appendChild(li);
    });
}

// 6. TA BORT: Om man ångrar en vara i listan
window.removeItem = function(index) {
    shoppingItems.splice(index, 1); // Ta bort från minnet
    renderList(); // Rita om listan på skärmen
};

// 7. SPARA: Vad händer när man trycker på "Save"?
saveListBtn.addEventListener('click', function() {
    const listName = listNameInput.value.trim();

    if (listName === "") {
        alert("Du måste ge din lista ett namn!");
        return;
    }

    if (shoppingItems.length === 0) {
        alert("Din lista är tom, lägg till några varor först.");
        return;
    }

    // Skapa ett "paket" (JSON) med all data
    const finalData = {
        title: listName,
        items: shoppingItems,
        category: 'private'
    };

    console.log("Sparar paket till distribuerat system:", finalData);
    alert("Listan '" + listName + "' har sparats!");
    
    // Nästa steg: Skicka till databasen och navigera till "Show my list"
    // window.location.href = "show-my-list.html"; 
});

