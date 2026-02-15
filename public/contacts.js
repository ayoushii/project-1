document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const resultBox = document.getElementById('result-box');
    const usernameDisplay = document.getElementById('username-display');

    // 1. Sökfunktion
    const performSearch = () => {
        const searchValue = searchInput.value.trim();

        if (searchValue === "") {
            alert("Please enter a username or email.");
            return;
        }

        // Visar namnet man sökte på i resultat-rutan
        usernameDisplay.innerText = "Found: " + searchValue; 
        resultBox.style.display = 'flex'; 
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
});

// 2. Skicka förfrågan - Här hämtar vi det sökta namnet dynamiskt
function sendFriendRequest() {
    const usernameDisplay = document.getElementById('username-display');
    const requestsList = document.getElementById('requests-list');
    const resultBox = document.getElementById('result-box');
    const searchInput = document.getElementById('search-input');

    // Hämtar namnet från sökresultatet (tar bort "Found: " för att få rent namn)
    const name = usernameDisplay.innerText.replace("Found: ", "");

    // Skapar det nya kortet i Friend Requests med RÄTT namn
    const div = document.createElement('div');
    div.className = 'mini-card';
    div.innerHTML = `
        <span class="user-name">${name}</span>
        <div class="card-btns">
            <button class="accept-btn" onclick="acceptFriend('${name}', this)">Accept</button>
            <button class="decline-btn" onclick="this.closest('.mini-card').remove()">Decline</button>
        </div>
    `;

    requestsList.appendChild(div);
    
    // Städar upp efteråt
    resultBox.style.display = 'none';
    searchInput.value = "";
}

// 3. Acceptera vän
function acceptFriend(name, buttonElement) {
    const contactsList = document.getElementById('my-contacts-list');
    
    const li = document.createElement('li');
    li.className = 'contact-item';
    li.innerHTML = `
        <i class="fa-solid fa-user-circle"></i>
        <span>${name}</span>
    `;
    
    contactsList.appendChild(li);
    buttonElement.closest('.mini-card').remove();
}