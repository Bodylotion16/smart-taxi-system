// js/klant/review.js

document.getElementById('customerReviewForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Zorg dat de pagina niet herlaadt

    // Haal de ingevulde waardes op uit het formulier
    const driverId = document.getElementById('driverSelect').value;
    const rating = document.getElementById('rating').value;
    const reviewText = document.getElementById('reviewText').value;

    try {
        // Verstuur de review via een POST request naar je backend
        const response = await fetch('/api/reviews/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                driverId: driverId,
                rating: parseInt(rating), // Zet de tekst '5' om naar een getal 5
                feedback: reviewText,
                date: new Date().toISOString() // Voegt direct de huidige datum en tijd toe
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Bedankt! Je review is succesvol ingediend en gekoppeld aan de chauffeur.');
            
            // Maak het formulier leeg
            document.getElementById('customerReviewForm').reset();
            
            // Stuur de klant optioneel direct terug naar het dashboard home
            window.location.href = 'dashboard.html';
        } else {
            alert('Inzenden mislukt: ' + result.message);
        }

    } catch (error) {
        console.error('Error tijdens versturen review:', error);
        alert('Er is een netwerkfout opgetreden. Controleer of de server draait.');
    }
});

// Zorg dat de algemene uitlogknop ook werkt op deze pagina
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (confirm('Weet je zeker dat je wilt uitloggen?')) {
        window.location.href = '../../auth/login.html';
    }
});