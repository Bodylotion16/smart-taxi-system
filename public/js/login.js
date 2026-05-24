document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Haal de ingevulde waarden op uit de inputvelden
    const email = document.getElementById('email').value;
    const wachtwoord = document.getElementById('password').value;

    try {
        // Verstuur login request naar je backend server
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                wachtwoord
            })
        });

        const result = await response.json();

        if (result.success) {
            // Sla de live gegevens uit de database direct op in de browser!
            localStorage.setItem('userName', result.voornaam);
            localStorage.setItem('userId', result.userId); // Belangrijk voor profiel/settings/support!
            localStorage.setItem('userRole', result.role);

            alert(`Welkom terug, ${result.voornaam}!`);

            // DYNAMISCHE REDIRECTS OP BASIS VAN DE EXCLUSIEVE ROLLEN UIT DE DATABASE:
            if (result.role === 'admin') {
                // Gaat naar: portals/admin/dashboard.html
                window.location.href = '../portals/admin/dashboard.html';

            } else if (result.role === 'klant') {
                // Gaat naar: portals/Klant/dashboard.html
                window.location.href = '../portals/Klant/dashboard.html';

            } else if (result.role === 'taxi' || result.role === 'driver' || result.role === 'chauffeur') {
                // Gaat naar: portals/driver/dashboard.html
                window.location.href = '../portals/driver/dashboard.html'; 

            } else {
                alert('⚠️ Systeemfout: Je account heeft een onbekende of inactieve rol.');
            }

        } else {
            alert('❌ Inloggen mislukt: ' + result.message);
        }

    } catch (error) {
        console.error("❌ Fout tijdens inlogproces:", error);
        alert('Er is een fout opgetreden bij het verbinden met de inlogserver.');
    }
});