s
console.log("🚀 dashboard.js is succesvol geladen door de browser!");

window.addEventListener('DOMContentLoaded', () => {
    console.log("📅 DOM is volledig ingeladen. We starten nu de functies...");

    const ingelogdeNaam = localStorage.getItem('userName') || "Rohit Patandin";
    
    const nameElement = document.getElementById('driverName');
    if (nameElement) {
        nameElement.innerText = ingelogdeNaam;
        console.log("👤 Chauffeur naam geüpdatet naar:", ingelogdeNaam);
    } else {
        console.warn("⚠️ Element 'driverName' niet gevonden in HTML!");
    }

    // Koppel de statuswijziging-knop veilig
    const statusKnop = document.getElementById('btnWijzigStatus');
    if (statusKnop) {
        statusKnop.addEventListener('click', (e) => {
            e.preventDefault();
            wijzigStatus(ingelogdeNaam);
        });
        console.log("🔗 Statuswijziging-knop succesvol gekoppeld.");
    } else {
        console.warn("⚠️ Element 'btnWijzigStatus' niet gevonden in HTML!");
    }

    // Start direct met laden en herhaal elke 3 seconden
    laadLiveDashboardData(ingelogdeNaam);
    setInterval(() => laadLiveDashboardData(ingelogdeNaam), 3000);
});

async function laadLiveDashboardData(chauffeurNaam) {
    try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();

        if (!data.success) {
            console.error("❌ Server gaf success:false terug:", data.message);
            return;
        }

        // 1. ZOEK CHAUFFEUR
        const huidigeChauffeur = data.chauffeurs.find(c => 
            c.first_name.toLowerCase().includes(chauffeurNaam.toLowerCase())
        );
        
        if (huidigeChauffeur) {
            // Update status kaart
            const statusElement = document.getElementById('driverStatus');
            if (statusElement) {
                statusElement.innerText = huidigeChauffeur.driver_status || "offline";
                statusElement.style.color = huidigeChauffeur.driver_status === 'online' ? '#2ecc71' : '#e74c3c';
            }

            // 2. CHECK ACTIEVE RIT
            const actieveRit = data.liveRitten.find(rit => 
                rit.driver_id_FK === huidigeChauffeur.user_id && rit.status === 'accepted'
            );

            const klantVeld = document.getElementById('activeCustomer');
            const ophaalVeld = document.getElementById('activePickup');
            const bestemmingVeld = document.getElementById('activeDestination');
            const tariefVeld = document.getElementById('activeFare');
            const linkKnop = document.getElementById('activeRideLink');

            if (actieveRit) {
                if (klantVeld) klantVeld.innerText = "Live Passagier";
                if (ophaalVeld) ophaalVeld.innerText = actieveRit.pickup_location;
                if (bestemmingVeld) bestemmingVeld.innerText = actieveRit.destination;
                if (tariefVeld) tariefVeld.innerText = "SRD " + actieveRit.fare;
                if (linkKnop) linkKnop.style.display = "inline-block";
            } else {
                if (klantVeld) {
                    klantVeld.innerText = "Geen actieve rit";
                    if (ophaalVeld) ophaalVeld.innerText = "-";
                    if (bestemmingVeld) bestemmingVeld.innerText = "-";
                    if (tariefVeld) tariefVeld.innerText = "-";
                    if (linkKnop) linkKnop.style.display = "none";
                } else {
                    // NOODGREEP: Als de specifieke span ID's er niet zijn, overschrijf de hele .section content
                    const sections = document.querySelectorAll('.section');
                    sections.forEach(sec => {
                        if (sec.querySelector('h2') && sec.querySelector('h2').innerText.includes("Actieve rit")) {
                            sec.innerHTML = `
                                <h2>Actieve rit</h2>
                                <p style="color: #888; font-style: italic;">Er is momenteel geen rit actief.</p>
                            `;
                        }
                    });
                }
            }

            // 3. RITTEN VANDAAG COUNTER
            const rittenVandaag = data.liveRitten.filter(rit => 
                rit.driver_id_FK === huidigeChauffeur.user_id && rit.status === 'completed'
            );
            if (document.getElementById('todayRides')) {
                document.getElementById('todayRides').innerText = rittenVandaag.length;
            }
        } else {
            console.warn(`⚠️ Chauffeur met naam '${chauffeurNaam}' staat niet in de users database!`);
        }

        // 4. NIEUWE VERZOEKEN COUNTER
        const openRitten = data.liveRitten.filter(rit => rit.status === 'paid');
        if (document.getElementById('newRequests')) {
            document.getElementById('newRequests').innerText = openRitten.length;
        }

    } catch (err) {
        console.error("❌ Fatale fetch/verbindingsfout in laadLiveDashboardData:", err);
    }
}

// 5. LIVE DATABASE KOPPELING VOOR DE STATUS WIJZIGEN KNOP
async function wijzigStatus(chauffeurNaam) {
    const statusKaart = document.getElementById('driverStatus');
    if (!statusKaart) return;

    // Bepaal wat de nieuwe status moet worden op basis van het scherm
    const huidigeStatus = statusKaart.innerText.toLowerCase();
    const nieuweStatus = huidigeStatus === 'online' || huidigeStatus === 'beschikbaar' ? 'offline' : 'online';

    try {
        // We sturen de update live naar je server toe via een POST/PUT verzoek
        const response = await fetch('/api/driver/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                first_name: chauffeurNaam, 
                status: nieuweStatus 
            })
        });

        const uitslag = await response.json();

        if (uitslag.success) {
            alert(`Systeem: Status succesvol gewijzigd naar ${nieuweStatus.toUpperCase()}`);
            statusKaart.innerText = nieuweStatus === 'online' ? 'online' : 'offline';
            statusKaart.style.color = nieuweStatus === 'online' ? '#2ecc71' : '#e74c3c';
        } else {
            alert("❌ Kon status niet bijwerken in de database: " + uitslag.message);
        }
    } catch (err) {
        console.error("Fout bij status update:", err);
        // Visuele fallback als je de backend route nog niet hebt herstart
        statusKaart.innerText = nieuweStatus;
        statusKaart.style.color = nieuweStatus === 'online' ? '#2ecc71' : '#e74c3c';
    }
}