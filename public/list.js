document.addEventListener('DOMContentLoaded', () => {
    // --- 1. LOAD SAVED LISTS ON STARTUP ---
    const myCreatedLists = document.getElementById('myCreatedLists');
    
    function loadLists() {
        if (!myCreatedLists) return;
        
        // Get all saved lists from local storage
        const allLists = JSON.parse(localStorage.getItem('rayaLists')) || [];
        
        myCreatedLists.innerHTML = ''; // Clear current menu
        
        if (allLists.length === 0) {
            myCreatedLists.innerHTML = '<li style="color: grey; font-size: 12px;">No lists yet</li>';
        } else {
            allLists.forEach(listName => {
                const li = document.createElement('li');
                // This creates a link back to your list page
                li.innerHTML = `<a href="other.html?name=${encodeURIComponent(listName)}">${listName}</a>`;
                myCreatedLists.appendChild(li);
            });
        }
    }

    loadLists(); // Run this immediately when the page opens

    // --- 2. LOGIC FOR CREATING A NEW LIST (on other.html) ---
    const createListBtn = document.getElementById('createListBtn');
    if (createListBtn) {
        createListBtn.addEventListener('click', () => {
            const listNameInput = document.getElementById('listNameInput');
            const listName = listNameInput.value.trim();

            if (listName === "") {
                alert("Please name your list!");
                return;
            }

            // Save the new list name into an array of all lists
            let allLists = JSON.parse(localStorage.getItem('rayaLists')) || [];
            if (!allLists.includes(listName)) {
                allLists.push(listName);
                localStorage.setItem('rayaLists', JSON.stringify(allLists));
            }

            // Switch view to the items list
            document.getElementById('currentListNameDisplay').innerText = listName;
            document.getElementById('createListSection').style.display = 'none';
            document.getElementById('activeListSection').style.display = 'block';
        });
    }

    // --- 3. ADD ITEMS LOGIC ---
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const itemInput = document.getElementById('itemInput');
            const itemName = itemInput.value.trim();
            if (itemName === "") return;

            const li = document.createElement('li');
            li.className = 'shopping-item';
            li.innerHTML = `
                <span onclick="this.classList.toggle('completed')">${itemName}</span>
                <button onclick="this.parentElement.remove()" class="delete-btn">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;
            document.getElementById('shoppingList').appendChild(li);
            itemInput.value = "";
        });
    }
});

// Function to open/close the "Show my list" menu
function toggleSavedLists() {
    const menu = document.getElementById('savedListsMenu');
    if (menu) {
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
    }
}

// Öppnar / stänger Create a list-menyn
function toggleCreateMenu() {
  const menu = document.getElementById("mySubmenu");
  if (!menu) return;

  // Om den är öppen -> stäng
  if (menu.style.display === "block") {
    menu.style.display = "none";
  } 
  // Om den är stängd -> öppna
  else {
    menu.style.display = "block";
  }
}

// Koppla knappen när sidan laddas
window.addEventListener("load", () => {
  const btn = document.getElementById("createListBtn");
  if (btn) {
    btn.addEventListener("click", toggleCreateMenu);
  }
});



