// BESTAND: public/js/driver/dashboard.js

window.addEventListener('DOMContentLoaded', () => {
    // 1. Haal direct de ingelogde naam op uit de localStorage (ingesteld bij login.js)
    const ingelogdeNaam = localStorage.getItem('userName') || "Chauffeur";
    const nameElement = document.getElementById('driverName');
    if (nameElement) {
        nameElement.innerText = ingelogdeNaam;
    }

    // 2. Start de live database updates
    laadLiveDashboardData(ingelogdeNaam);
    
    // Ververs de statistieken en verzoeken elke 5 seconden live
    setInterval(() => {
        laadLiveDashboardData(ingelogdeNaam);
    }, 5000);
});

// Functie die alle live data ophaalt uit de database
async function laadLiveDashboardData(chauffeurNaam) {
    try {
        // We trekken de gegevens uit de admin/dashboard API (veiligheidsnet)
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();

        if (data.success) {
            // A. UPDATE STATUS EN CHAUFFEUR INFO
            // We zoeken in de lijst van chauffeurs naar degene die nu is ingelogd
            const huidigeChauffeur = data.chauffeurs.find(c => c.first_name === chauffeurNaam);
            if (huidigeChauffeur) {
                const statusElement = document.getElementById('driverStatus');
                if (statusElement) {
                    statusElement.innerText = huidigeChauffeur.driver_status || "offline";
                    // Optioneel: geef kleur mee op basis van status
                    statusElement.style.color = huidigeChauffeur.driver_status === 'online' ? '#2ecc71' : '#e74c3c';
                }
            }

            // B. UPDATE NIEUWE VERZOEKEN COUNTER
            // We tellen hoeveel ritten de status 'paid' of 'pending' hebben (klaar voor chauffeur)
            const openRitten = data.liveRitten.filter(rit => rit.status === 'paid' || rit.status === 'pending');
            const reqCounter = document.getElementById('newRequests');
            if (reqCounter) {
                reqCounter.innerText = openRitten.length;
            }

            // C. UPDATE RITTEN VANDAAG COUNTER
            // We kijken hoeveel ritten de status 'completed' hebben voor deze specifieke chauffeur
            if (huidigeChauffeur) {
                const rittenVandaag = data.liveRitten.filter(rit => 
                    rit.driver_id_FK === huidigeChauffeur.user_id && rit.status === 'completed'
                );
                const todayCounter = document.getElementById('todayRides');
                if (todayCounter) {
                    todayCounter.innerText = rittenVandaag.length;
                }
            }
        }
    } catch (err) {
        console.error("❌ Fout bij het live bijwerken van het dashboard:", err);
    }
}