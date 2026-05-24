// BESTAND: public/js/klant/review.js

document.addEventListener("DOMContentLoaded", () => {
    laadBeschikbareChauffeurs();
    initLogout();

    const reviewForm = document.getElementById('customerReviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', handelReviewInzending);
    }
});

async function laadBeschikbareChauffeurs() {
    const select = document.getElementById('driverSelect');
    if (!select) return;
    
    try {
        console.log("🔄 Fetch uitvoeren naar /api/drivers...");
        const response = await fetch('/api/drivers');
        const data = await response.json();
        
        console.log("📥 Data ontvangen van server:", data);

        if (data.success && data.drivers && data.drivers.length > 0) {
            select.innerHTML = '<option value="">Selecteer chauffeur</option>';
            
            data.drivers.forEach(chauffeur => {
                const option = document.createElement('option');
                option.value = chauffeur.id; // Dit wordt de user_id_PK
                option.textContent = chauffeur.naam; // Dit wordt first_name + last_name
                select.appendChild(option);
            });
            console.log(`✅ Dropdown gevuld met ${data.drivers.length} chauffeurs.`);
        } else {
            console.warn("⚠️ Server stuurde succes:true, maar de lijst met chauffeurs is leeg.");
            select.innerHTML = '<option value="">Geen chauffeurs gevonden</option>';
        }
    } catch (error) {
        console.error('❌ Kritieke fout in review.js frontend:', error);
        select.innerHTML = '<option value="">Fout bij laden van data</option>';
    }
}

async function handelReviewInzending(e) {
    e.preventDefault();
    const driverId = document.getElementById('driverSelect').value;
    const rating = document.getElementById('rating').value;
    const reviewText = document.getElementById('reviewText').value.trim();

    if (!driverId || !rating || !reviewText) {
        alert("⚠️ Vul alle velden in.");
        return;
    }

    try {
        const response = await fetch('/api/reviews/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                klantId: 3, // Tijdelijk hardcoded Simran uit jouw database screenshot!
                driverId: parseInt(driverId),
                rating: parseInt(rating),
                feedback: reviewText
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('🎉 Review succesvol verzonden!');
            window.location.href = 'dashboard.html';
        } else {
            alert('Fout: ' + result.message);
        }
    } catch (error) {
        console.error('❌ Fout bij verzenden review:', error);
    }
}

function initLogout() {
    const logoutLink = document.querySelector(".logout-link");
    if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
            if (!confirm("Weet je zeker dat je wilt uitloggen?")) e.preventDefault();
        });
    }
}