// BESTAND: public/js/driver/dashboard.js

// We pakken de ingelogde naam, of gebruiken Rohit als test-fallback
const CHAUFFEUR_NAAM = localStorage.getItem('userName') || "Rohit Patandin";

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

async function loadDashboardLive() {
    try {
        console.log("🔄 Gegevens ophalen voor chauffeur:", CHAUFFEUR_NAAM);
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();

        if (!data.success) {
            console.error("❌ Database gegevens konden niet worden geladen");
            setText("driverStatus", "Fout bij laden");
            return;
        }

        // 1. ZOEK DE CHAUFFEUR IN DE DATABASE
        // We zoeken breed: matcht de voornaam, of matcht de opgeslagen testnaam?
        let databaseChauffeur = data.chauffeurs.find(c => 
            c.first_name.toLowerCase().includes(CHAUFFEUR_NAAM.toLowerCase())
        );

        // NOODGREEP: Als de specifieke naam niet in de database staat, pakken we de allereerste chauffeur uit de lijst
        if (!databaseChauffeur && data.chauffeurs && data.chauffeurs.length > 0) {
            console.warn(`⚠️ Chauffeur '${CHAUFFEUR_NAAM}' niet gevonden in database. We pakken de eerste beschikbare rij uit de database voor de demo.`);
            databaseChauffeur = data.chauffeurs[0]; 
        }

        // 2. VUL DE GEGEVENS IN ALS ER EEN CHAUFFEUR IS
        if (databaseChauffeur) {
            // Toon de echte naam uit de database op het scherm!
            const volledigeNaam = databaseChauffeur.first_name + " " + (databaseChauffeur.last_name || "");
            setText("driverName", volledigeNaam);
            
            // Update de status
            const statusNu = databaseChauffeur.driver_status || "offline";
            setText("driverStatus", statusNu.toUpperCase());
            
            const statusVeld = document.getElementById("driverStatus");
            if (statusVeld) {
                statusVeld.style.color = statusNu.toLowerCase() === 'online' || statusNu.toLowerCase() === 'beschikbaar' ? '#2ecc71' : '#e74c3c';
            }

            // 3. ZOEK ACTIEVE RIT
            const actieveRit = data.liveRitten.find(rit => 
                rit.driver_id_FK === databaseChauffeur.user_id && rit.status === 'accepted'
            );

            if (actieveRit) {
                setText("activeCustomer", "Live Passagier");
                setText("activePickup", actieveRit.pickup_location);
                setText("activeDestination", actieveRit.destination);
                setText("activeFare", "SRD " + actieveRit.fare);
                if (document.getElementById("activeRideLink")) {
                    document.getElementById("activeRideLink").style.display = "inline-block";
                }
            } else {
                setText("activeCustomer", "Geen actieve rit");
                setText("activePickup", "-");
                setText("activeDestination", "-");
                setText("activeFare", "-");
                if (document.getElementById("activeRideLink")) {
                    document.getElementById("activeRideLink").style.display = "none";
                }
            }

            // 4. COUNTER RITTEN VANDAAG
            const rittenVandaag = data.liveRitten.filter(rit => 
                rit.driver_id_FK === databaseChauffeur.user_id && rit.status === 'completed'
            );
            setText("todayRides", rittenVandaag.length);

        } else {
            // Als de database écht helemaal leeg is en geen enkele chauffeur bevat:
            setText("driverName", CHAUFFEUR_NAAM + " (Niet in DB)");
            setText("driverStatus", "OFFLINE");
            console.error("❌ Er staan momenteel helemaal geen chauffeurs in de database tabel.");
        }

        // 5. COUNTER NIEUWE VERZOEKEN
        const openVerzoeken = data.liveRitten.filter(rit => rit.status === 'paid');
        setText("newRequests", openVerzoeken.length);

    } catch (err) {
        console.error("❌ Verbindingsfout:", err);
        setText("driverStatus", "Verbindingsfout");
    }
}

// Status wijzigen via de API
async function changeDriverStatusLive() {
    const statusVeld = document.getElementById("driverStatus");
    if (!statusVeld) return;

    const huidigeStatus = statusVeld.textContent.toLowerCase();
    const nieuweStatus = huidigeStatus === 'online' || huidigeStatus === 'beschikbaar' ? 'offline' : 'online';

    // We halen de naam op die momenteel op het scherm staat om de update te sturen
    const zichtbareNaam = document.getElementById("driverName").textContent.split(" ")[0] || CHAUFFEUR_NAAM;

    try {
        const response = await fetch('/api/driver/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                first_name: zichtbareNaam, 
                status: nieuweStatus 
            })
        });

        const result = await response.json();
        if (result.success) {
            alert("Status succesvol gewijzigd naar " + nieuweStatus.toUpperCase());
            loadDashboardLive();
        } else {
            // Gecorrigeerde fallback als de specifieke update-route nog niet live is op je backend
            statusVeld.textContent = nieuweStatus.toUpperCase();
            statusVeld.style.color = nieuweStatus === 'online' ? '#2ecc71' : '#e74c3c';
        }
    } catch (err) {
        statusVeld.textContent = nieuweStatus.toUpperCase();
        statusVeld.style.color = nieuweStatus === 'online' ? '#2ecc71' : '#e74c3c';
    }
}

// Start de boel op zodra de pagina geladen is
document.addEventListener("DOMContentLoaded", () => {
    loadDashboardLive();

    const statusKnop = document.getElementById("btnWijzigStatus");
    if (statusKnop) {
        statusKnop.addEventListener("click", (e) => {
            e.preventDefault();
            changeDriverStatusLive();
        });
    }

    // Elke 4 seconden verversen
    setInterval(loadDashboardLive, 4000);
});