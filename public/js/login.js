document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Haal de ingevulde waarden op
    const email = document.getElementById('email').value;
    const wachtwoord = document.getElementById('password').value;

    try {

        // Verstuur login request
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

            alert(`Welkom terug, ${result.voornaam}!`);

            // Redirect op basis van rol
            if (result.role === 'klant') {

                window.location.href = '../portals/klant.html';

            } else if (result.role === 'taxi') {

                window.location.href = '../portals/driver.html';

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