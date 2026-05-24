// ==========================================================================
// BESTAND: public/js/admin/feedback.js
// FUNCTIONALITEIT: DATABASE REVIEWS RENDEREN EN FILTEREN
// ==========================================================================

let liveFeedbackArray = []; // Slaat de database records op in de runtime

document.addEventListener("DOMContentLoaded", () => {
    laadLiveFeedback();
});

// ==========================================
// 1. REALTIME REVIEWS OPHALEN EN STATS BEREKENEN
// ==========================================
async function laadLiveFeedback() {
    const listContainer = document.getElementById("feedbackList");
    if (!listContainer) return;

    try {
        console.log("🔄 Live platform feedback opvragen bij server...");
        const response = await fetch('/api/admin/feedback');
        const data = await response.json();

        if (!data.success) {
            listContainer.innerHTML = `<p style="text-align:center; color:red;">Fout bij laden: ${data.message}</p>`;
            return;
        }

        liveFeedbackArray = data.feedback;
        listContainer.innerHTML = ""; // Gooi placeholder leeg

        if (liveFeedbackArray.length === 0) {
            listContainer.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">Er zijn nog geen klantbeoordelingen achtergelaten.</p>`;
            return;
        }

        let scoreTotaal = 0;

        liveFeedbackArray.forEach(fb => {
            scoreTotaal += fb.rating;
            
            const klantNaam = `${fb.klant_voornaam} ${fb.klant_achternaam || ''}`.trim();
            const chauffeurNaam = `${fb.chauffeur_voornaam} ${fb.chauffeur_achternaam || ''}`.trim();

            const card = document.createElement("div");
            card.className = "feedback-card";
            card.dataset.customer = klantNaam.toLowerCase();
            card.dataset.driver = chauffeurNaam.toLowerCase();
            card.setAttribute("onclick", `showFeedbackDetails(${fb.review_id_PK})`);

            card.innerHTML = `
                <div>
                    <h3>${klantNaam} → ${chauffeurNaam}</h3>
                    <p>Rit: RT-${fb.booking_id_FK} • ${fb.review_datum || 'Mei 2026'}</p>
                </div>
                <span class="stars">${createStars(fb.rating)}</span>
            `;
            listContainer.appendChild(card);
        });

        // Bereken statistieken voor de bovenste KPI kaarten
        const gemiddelde = Math.round(scoreTotaal / liveFeedbackArray.length);
        document.getElementById("avgScore").textContent = createStars(gemiddelde);
        document.getElementById("totalFeedback").textContent = liveFeedbackArray.length;
        document.getElementById("lastScore").textContent = createStars(liveFeedbackArray[0].rating);

    } catch (error) {
        console.error("❌ Kritieke fout in feedback.js frontend:", error);
    }
}

// ==========================================
// 2. MAP STERREN CODES
// ==========================================
function createStars(rating) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
        stars += (i <= rating) ? "★" : "☆";
    }
    return stars;
}

// ==========================================
// 3. TOON SPECIFIEKE FEEDBACK DETAILS IN HET RECHTERPANEEL
// ==========================================
function showFeedbackDetails(reviewId) {
    const feedback = liveFeedbackArray.find(f => f.review_id_PK === reviewId);
    if (!feedback) return;

    const klantNaam = `${feedback.klant_voornaam} ${feedback.klant_achternaam || ''}`.trim();
    const chauffeurNaam = `${feedback.chauffeur_voornaam} ${feedback.chauffeur_achternaam || ''}`.trim();

    document.getElementById("feedbackId").textContent = `FB-${String(feedback.review_id_PK).padStart(3, '0')}`;
    document.getElementById("feedbackCustomer").textContent = klantNaam;
    document.getElementById("feedbackDriver").textContent = chauffeurNaam;
    document.getElementById("feedbackRide").textContent = `RT-${feedback.booking_id_FK}`;
    document.getElementById("feedbackRating").textContent = createStars(feedback.rating);
    document.getElementById("feedbackMessage").textContent = feedback.feedback_text || "Geen opmerking achtergelaten.";
}

// ==========================================
// 4. ZOEKBALK FILTERING
// ==========================================
function filterFeedback() {
    const searchValue = document.getElementById("searchFeedback").value.toLowerCase().trim();
    const cards = document.querySelectorAll(".feedback-card");

    cards.forEach(card => {
        const customer = card.dataset.customer || "";
        const driver = card.dataset.driver || "";

        if (searchValue === "" || customer.includes(searchValue) || driver.includes(searchValue)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}