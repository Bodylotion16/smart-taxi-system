document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Haal de ingevulde waarden op
    const email = document.getElementById('email').value;
    const wachtwoord = document.getElementById('password').value;

    try {
        // Verstuur login request naar je backend
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
            // FIX 1: Sla de live voornaam uit de database direct op in de browser!
            // Hierdoor weet dashboard.js straks exact wie er achter het stuur zit (Vyaas of Anisha)
            localStorage.setItem('userName', result.voornaam);

            alert(`Welkom terug, ${result.voornaam}!`);

            // GECORRIGEERDE REDIRECTS OP BASIS VAN JOUW MAPPENSTRUCTUUR:
            if (result.role === 'klant') {
                // Gaat naar: portals/Klant/dashboard.html
                window.location.href = '../portals/Klant/dashboard.html';

            } else if (result.role === 'taxi') {
                // Gaat naar: portals/driver/dashboard.html
                window.location.href = '../portals/driver/dashboard.html'; 

            } else {
                alert('Systeemfout: onbekende gebruikersrol.');
            }

        } else {
            alert('Inloggen mislukt: ' + result.message);
        }

    } catch (error) {
        console.error(error);
        alert('Er is een fout opgetreden bij het inloggen.');
    }
});

if (role === 'klant') {
    window.location.href = '../portals/Klant/dashboard.html';

} else if (role === 'taxi' || role === 'driver' || role === 'chauffeur') {
    window.location.href = '../portals/driver/dashboard.html';

} else if (role === 'admin') {
    window.location.href = '../portals/admin/dashboard.html';

} else {
    alert('Systeemfout: onbekende gebruikersrol.');
}