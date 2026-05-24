// ==========================================================================
// BESTAND: public/js/klant/review.js
// FUNCTIONALITEIT: DYNAMISCH CHAUFFEURS INLADEN EN REVIEWS OPSLAAN
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    // Start direct met het ophalen van de database-chauffeurs zodra de pagina laadt
    laadBeschikbareChauffeurs();
    
    // Initialiseer de uitlog-beveiliging
    initLogout();
    
    // Koppel het formulier aan de submit-handler
    const reviewForm = document.getElementById('customerReviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', handelReviewInzending);
    }
});

// ==========================================================================
// 1. LIVE CHAUFFEURS INLADEN UIT DE DATABASE
// ==========================================================================
async function laadBeschikbareChauffeurs() {
    const select = document.getElementById('driverSelect');
    if (!select) return;
    
    try {
        console.log("🔄 Fetch uitvoeren naar /api/drivers...");
        const response = await fetch('/api/drivers');
        const data = await response.json();
        
        console.log("📥 Data ontvangen van server:", data);

        if (data.success && data.drivers && data.drivers.length > 0) {
            // Reset de select-box naar de standaard beginstatus
            select.innerHTML = '<option value="">Selecteer chauffeur</option>';
            
            // Loop door alle chauffeurs uit de database en voeg ze toe
            data.drivers.forEach(chauffeur => {
                const option = document.createElement('option');
                option.value = chauffeur.id;   // Dit koppelt aan user_id_PK van de chauffeur
                option.textContent = chauffeur.naam; // Dit toont de first_name + last_name
                select.appendChild(option);
            });
            console.log(`✅ Dropdown succesvol gevuld met ${data.drivers.length} chauffeurs.`);
        } else {
            console.warn("⚠️ Server stuurde antwoord, maar de lijst met chauffeurs is leeg.");
            select.innerHTML = '<option value="">Geen chauffeurs gevonden</option>';
        }
    } catch (error) {
        console.error('❌ Kritieke fout tijdens laden van chauffeurs:', error);
        select.innerHTML = '<option value="">Fout bij laden van data</option>';
    }
}

// ==========================================================================
// 2. REVIEWDATAMODEL VERWERKEN EN VERZENDEN (POST)
// ==========================================================================
async function handelReviewInzending(e) {
    e.preventDefault(); // Voorkom dat de browser de pagina hard ververst

    const driverSelectElement = document.getElementById('driverSelect');
    const ratingElement = document.getElementById('rating');
    const reviewTextElement = document.getElementById('reviewText');

    if (!driverSelectElement.value || !ratingElement.value || !reviewTextElement.value.trim()) {
        alert("⚠️ Vul alstublieft alle verplichte velden in.");
        return;
    }

    // Tijdelijke klant_id (Koppelt aan Simran, user_id_PK = 3 uit jouw database)
    const klantId = 3; 

    const reviewPayload = {
        klantId: klantId,
        driverId: parseInt(driverSelectElement.value),
        rating: parseInt(ratingElement.value),
        feedback: reviewTextElement.value.trim()
    };

    try {
        console.log("🚀 Review data verzenden naar backend...", reviewPayload);
        
        const response = await fetch('/api/reviews/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reviewPayload)
        });

        const result = await response.json();
        console.log("📥 Server response ontvangen:", result);

        if (result.success) {
            alert('🎉 Bedankt! Je beoordeling is succesvol verwerkt en opgeslagen.');
            
            // Maak het formulier direct netjes leeg
            document.getElementById('customerReviewForm').reset();
            
            // Schiet de klant direct terug naar de dashboard home
            window.location.href = 'dashboard.html';
        } else {
            alert('Inzenden mislukt: ' + (result.message || 'Onbekende serverfout'));
        }

    } catch (error) {
        console.error('❌ Kritieke fout tijdens verzenden van de review:', error);
        alert('Er is een netwerkfout opgetreden. Controleer of de backend-server draait.');
    }
}

// ==========================================================================
// 3. VEILIGE EN GEKOPPELDE SIDEBAR UITLOG-LOGICA
// ==========================================================================
function initLogout() {
    const logoutLink = document.querySelector(".logout-link");
    if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
            if (!confirm("Weet je zeker dat je wilt uitloggen?")) {
                e.preventDefault(); // Annuleer de navigatie als de klant 'Annuleren' klikt
            }
        });
    }
}