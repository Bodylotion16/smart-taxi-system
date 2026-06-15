document.getElementById('klantRegForm').addEventListener('submit', async (e) => {

    e.preventDefault();

    const formData = {

        voornaam: document.getElementById('first_name').value,

        achternaam: document.getElementById('last_name').value,

        email: document.getElementById('email').value,

        telefoon: document.getElementById('phone_number').value,

        adres: document.getElementById('address').value,

        wachtwoord: document.getElementById('password').value,

        rol: 'klant'

    };

    try {

        const response = await fetch('/api/register', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(formData)

        });

        const result = await response.json();

        if (result.success) {

            alert('Welkom! Je kunt nu inloggen.');

            window.location.href = 'login.html';

        } else {

            alert('Fout bij aanmaken user: ' + result.message);

        }

    } catch (error) {

        console.error(error);

        alert('Er ging iets mis bij het registreren.');

    }

});