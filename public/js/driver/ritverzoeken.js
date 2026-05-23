// BESTAND: public/js/driver/ritverzoeken.js

// ==========================================
// 1. LIVE VERZOEKEN LADEN UIT DATABASE (Alleen 'pending')
// ==========================================
async function laadRitverzoekenLive() {
    const container = document.getElementById("ritverzoekenContainer");
    if (!container) return;

    try {
        console.log("🔄 Beschikbare rittenpoule (pending) opvragen...");
        const response = await fetch('/api/available-bookings');
        const data = await response.json();

        if (!data.success || !data.bookings || data.bookings.length === 0) {
            container.innerHTML = `
                <div class="section">
                    <p style="color: #888; margin: 0;">🎉 Er zijn momenteel geen nieuwe ritverzoeken beschikbaar.</p>
                </div>`;
            return;
        }

        container.innerHTML = "";

        data.bookings.forEach(rit => {
            const id = rit.booking_id; // Mapping vanuit server.js (booking_id_PK)
            const ophaal = rit.pickup_location;
            const bestemming = rit.destination;
            const prijs = rit.fare;

            // Dynamische naam-toewijzing op basis van ID (Aman of Simran)
            const klantNaam = id % 2 === 0 ? "Aman" : "Simran";

            const ritKaart = document.createElement("div");
            ritKaart.className = "section";
            ritKaart.id = `rit-kaart-${id}`;
            ritKaart.innerHTML = `
                <h2>Nieuw ritverzoek (#${id})</h2>
                <p><strong>Klant:</strong> <span>${klantNaam}</span></p>
                <p><strong>Ophaallocatie:</strong> <span>${ophaal}</span></p>
                <p><strong>Bestemming:</strong> <span>${bestemming}</span></p>
                <p><strong>Prijsindicatie:</strong> <span>SRD ${prijs}</span></p>
                <p><strong>Status:</strong> <span class="status" id="status-${id}" style="text-transform: capitalize;">${rit.status}</span></p>

                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button class="btn-accept" onclick="acceptRide(${id})" style="background: #f1c40f; color: #000; font-weight: bold; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Accepteren</button>
                    <button class="btn-decline" onclick="declineRide(${id})" style="background: #333; color: #fff; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Weigeren</button>
                </div>
            `;
            container.appendChild(ritKaart);
        });

    } catch (err) {
        console.error("❌ Fout bij ophalen van ritverzoeken:", err);
        container.innerHTML = `<p style="color: red;">Kon rittenpoule niet live inladen.</p>`;
    }
}

// ==========================================
// 2. ACTIE: RIT ACCEPTEREN (DATABASE UPDATE)
// ==========================================
async function acceptRide(bookingId) {
    const statusElement = document.getElementById(`status-${bookingId}`);
    console.log(`🚖 Rit #${bookingId} accepteren met status 'accepted'...`);

    try {
        const response = await fetch('/api/driver/update-ride-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                booking_id: bookingId,
                status: 'accepted' // 'accepted' past binnen je VARCHAR/ENUM lengte
            })
        });

        const result = await response.json();

        if (result.success) {
            if (statusElement) {
                statusElement.textContent = "Geaccepteerd";
                statusElement.style.color = "#4ade80";
                statusElement.style.borderColor = "#4ade80";
                statusElement.style.backgroundColor = "rgba(34, 197, 94, 0.15)";
            }
            alert("✅ Rit succesvol geaccepteerd! Deze staat nu op je 'Actieve rit' pagina.");
            
            setTimeout(laadRitverzoekenLive, 1500);
        } else {
            alert("❌ Fout bij accepteren: " + result.message);
        }
    } catch (err) {
        console.error("❌ Serverfout bij accepteren:", err);
        alert("Serverfout bij accepteren.");
    }
}

// ==========================================
// 3. ACTIE: RIT WEIGEREN (UI VISUEEL BIJWERKEN)
// ==========================================
async function declineRide(bookingId) {
    const statusElement = document.getElementById(`status-${bookingId}`);
    console.log(`❌ Rit #${bookingId} geweigerd door chauffeur.`);
    
    if (statusElement) {
        statusElement.textContent = "Geweigerd";
        statusElement.style.color = "#f87171";
        statusElement.style.borderColor = "#f87171";
        statusElement.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
    }

    setTimeout(() => {
        const kaart = document.getElementById(`rit-kaart-${bookingId}`);
        if (kaart) kaart.remove();
        
        const container = document.getElementById("ritverzoekenContainer");
        if (container && container.children.length === 0) {
            container.innerHTML = `
                <div class="section">
                    <p style="color: #888; margin: 0;">🎉 Er zijn momenteel geen nieuwe ritverzoeken beschikbaar.</p>
                </div>`;
        }
    }, 1000);
}

document.addEventListener("DOMContentLoaded", laadRitverzoekenLive);