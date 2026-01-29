// Funktion för att visa Logga in
function showLogin() {
    // Vi ser till att alla andra rutor är stängda först
    document.getElementById('signup-box').style.display = 'none';
    document.getElementById('verify-box').style.display = 'none';
    
    // Sen visar vi login-rutan
    document.querySelector('.login-box').style.display = 'block';
}

// Funktion för att visa Skapa konto
function showSignup() {
    // Gömmer login
    document.querySelector('.login-box').style.display = 'none';
    
    // Visar signup-boxen (se till att du har detta ID i din HTML)
    document.getElementById('signup-box').style.display = 'block';
}

// Funktion för att visa "Bekräfta mejl"
function showVerify() {
    // Gömmer signup
    document.getElementById('signup-box').style.display = 'none';
    
    // Visar verify-boxen
    document.getElementById('verify-box').style.display = 'block';
}


function toggleMenu() {
    var submenu = document.getElementById("mySubmenu");
    
    // Om menyn är dold, visa den. Om den syns, dölj den.
    if (submenu.style.display === "none") {
        submenu.style.display = "block";
    } else {
        submenu.style.display = "none";
    }
}