// BESTAND: public/js/driver/chauffeur-gegevens.js
const INLOG_NAAM = localStorage.getItem('userName') || "Anisha";

function setProfileText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Haal de gegevens live op uit de MySQL database via de centrale API
async function laadChauffeurGegevensLive() {
    try {
        console.log("🔄 Live profieldata laden uit database voor:", INLOG_NAAM);
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();

        if (!data.success) {
            console.error("❌ Kon geen verbinding maken met de API data.");
            return;
        }

        // Zoek de rij van de ingelogde chauffeur op basis van de voornaam
        let chauffeur = data.chauffeurs.find(c => 
            c.first_name.toLowerCase() === INLOG_NAAM.toLowerCase()
        );

        // Fallback voor testen: pak de eerste chauffeur als de naam niet direct matcht
        if (!chauffeur && data.chauffeurs && data.chauffeurs.length > 0) {
            chauffeur = data.chauffeurs[0];
        }

        if (chauffeur) {
            const voornaam = chauffeur.first_name || "";
            const achternaam = chauffeur.last_name || "";
            const volledigeNaam = `${voornaam} ${achternaam}`.trim();

            // 1. Bereken dynamisch de initialen (bijv. AP of VK)
            const initiaalVoor = voornaam.charAt(0).toUpperCase();
            const initiaalAchter = achternaam.charAt(0).toUpperCase();
            setProfileText("driverInitials", initiaalVoor + initiaalAchter);

            // 2. Vul de persoonlijke gegevens live in
            setProfileText("headerDriverName", volledigeNaam);
            setProfileText("profileFullName", volledigeNaam);
            setProfileText("profileEmail", chauffeur.email || "-");
            setProfileText("profilePhone", chauffeur.phone_number || "-");
            setProfileText("driverStatusLabel", (chauffeur.driver_status || "offline").toUpperCase());
            
            // 3. Vul de voertuiggegevens live in
            setProfileText("vehicleModel", chauffeur.auto_model || "Geen voertuig gekoppeld");
            setProfileText("vehiclePlate", chauffeur.kenteken || "-");
            
            console.log("✅ Gegevens succesvol op het scherm gezet!");
        } else {
            setProfileText("headerDriverName", "Geen chauffeur gevonden");
        }

    } catch (err) {
        console.error("❌ Fout bij het live inladen van de profieldata:", err);
    }
}

// Start de data-pomp zodra de pagina klaar staat
document.addEventListener("DOMContentLoaded", laadChauffeurGegevensLive);