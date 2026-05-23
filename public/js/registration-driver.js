// BESTAND: public/js/registration-driver.js

document.getElementById('driverRegForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Voorkom herladen van de pagina

    // Verzamel de gegevens uit de opgeschoonde HTML-ID's
    const chauffeurData = {
        voornaam: document.getElementById('voornaam').value,
        achternaam: document.getElementById('achternaam').value,
        email: document.getElementById('email').value,
        telefoon: document.getElementById('telefoon').value,
        wachtwoord: document.getElementById('wachtwoord').value,
        rol: 'taxi', 
        kenteken: document.getElementById('kenteken').value,
        auto_model: document.getElementById('auto_model').value
    };

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chauffeurData)
        });

        const result = await response.json();

        if (result.success) {
            alert("🚖 Chauffeur succesvol geregistreerd!");
            window.location.href = 'login.html'; // Stuur door naar login
        } else {
            alert("❌ Registratie mislukt: " + result.message);
        }
    } catch (err) {
        console.error("Fetch fout:", err);
        alert("Kan geen verbinding maken met de server.");
    }
});
// BESTAND: public/js/registration-driver.js

document.getElementById('driverRegForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const chauffeurData = {
        voornaam: document.getElementById('voornaam').value,
        achternaam: document.getElementById('achternaam').value,
        email: document.getElementById('email').value,
        telefoon: document.getElementById('telefoon').value,
        wachtwoord: document.getElementById('wachtwoord').value,
        rol: 'taxi', 
        kenteken: document.getElementById('kenteken').value,
        auto_model: document.getElementById('auto_model').value
    };

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chauffeurData)
        });

        const result = await response.json();

        if (result.success) {
            alert("🚖 Chauffeur succesvol geregistreerd via de nieuwe schone structuur!");
            window.location.href = 'login.html';
        } else {
            alert("❌ Registratie mislukt: " + result.message);
        }
    } catch (err) {
        console.error("Fetch fout:", err);
        alert("Kan geen verbinding maken met de server.");
    }
});