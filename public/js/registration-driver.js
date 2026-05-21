document.getElementById('driverRegForm').addEventListener('submit', async (e) => {

    e.preventDefault();

    const formData = {

        voornaam: document.getElementById('first_name').value,

        achternaam: document.getElementById('last_name').value,

        email: document.getElementById('email').value,

        telefoon: document.getElementById('phone_number').value,

        kenteken: document.getElementById('license_plate').value,

        auto_model: document.getElementById('car_model').value,

        wachtwoord: document.getElementById('password').value,

        rol: 'taxi'

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

            alert('Account aangemaakt! Je kunt nu inloggen als chauffeur.');

            window.location.href = 'login.html';

        } else {

            alert('Fout bij aanmaken chauffeur: ' + result.message);

        }

    } catch (error) {

        console.error(error);

        alert('Er ging iets mis bij het registreren.');

    }

});