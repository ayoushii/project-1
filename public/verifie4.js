// 1. Hämta token (koden) från adressfältet (t.ex. ?token=abc123)
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Hämta elementen från din HTML som vi vill kunna ändra
const h1Element = document.querySelector('h1');
const iconElement = document.querySelector('.icon-circle');
const iconInner = iconElement.querySelector('i');

// 2. Kontrollera om en token faktiskt finns
if (token) {
    console.log("Verifierar token: " + token);
    
    // 3. Här skickar man koden till din server (Backend)
    // Ersätt '/api/verify' med din faktiska länk när du har din backend klar
    fetch('/api/verify?token=' + token)
        .then(response => {
            if (response.ok) {
                // Om backend svarar att allt är OK
                h1Element.innerText = "Grattis du har verifierat ditt konto";
            } else {
                // Om token är ogiltig eller har gått ut
                visaFelmeddelande("Länken är ogiltig eller har gått ut.");
            }
        })
        .catch(error => {
            // Om det inte går att nå servern alls
            console.error("Fel vid verifiering:", error);
            visaFelmeddelande("Ett tekniskt fel uppstod. Försök igen senare.");
        });
} else {
    // Om användaren går till sidan utan att ha klickat på en länk i ett mail
    visaFelmeddelande("Ingen verifieringskod hittades.");
}

// Funktion för att ändra utseendet om verifieringen misslyckas
function visaFelmeddelande(meddelande) {
    h1Element.innerText = meddelande;
    iconElement.style.borderColor = "#ff4d4d"; // Gör cirkeln röd
    iconInner.style.color = "#ff4d4d";        // Gör bocken röd
    iconInner.className = "fa-solid fa-xmark"; // Byt bocken till ett kryss
}