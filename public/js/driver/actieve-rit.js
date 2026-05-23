// BESTAND: public/js/driver/actieve-rit.js

let actieveBookingId = null;

function setRitText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

// ==========================================
// 1. LIVE RITGEGEVENS OPHALEN UIT DATABASE
// ==========================================
async function laadActieveRitLive() {
    try {
        console.log("🔄 Actieve ritgegevens opvragen...");
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();

        if (!data.success || !data.liveRitten || data.liveRitten.length === 0) {
            toonGeenActieveRit();
            return;
        }

        // Zoekt naar ritten met status 'accepted' of lopende statussen
        const actieveRit = data.liveRitten.find(rit => 
            rit.status === 'accepted' || 
            rit.status === 'Onderweg naar klant' || 
            rit.status === 'Aangekomen' || 
            rit.status === 'Rit gestart'
        );

        if (actieveRit) {
            actieveBookingId = actieveRit.booking_id_PK || actieveRit.booking_id; 

            // Naam-fallback generator gekoppeld aan ID
            const berekendeNaam = actieveBookingId % 2 === 0 ? "Aman" : "Simran";

            // Vul de ritgegevens in
            setRitText("customerName", actieveRit.customer_name || berekendeNaam);
            setRitText("customerPhone", actieveRit.customer_phone || "+597 7777777");
            setRitText("pickupLocation", actieveRit.pickup_location);
            setRitText("destination", actieveRit.destination);
            setRitText("price", `SRD ${actieveRit.fare}`);
            
            // Toon de status netjes
            const weergaveStatus = actieveRit.status === 'accepted' ? 'Geaccepteerd' : actieveRit.status;
            setRitText("rideStatus", weergaveStatus);

            // Vul de routegegevens netjes in zonder kaarten te dupliceren
            setRitText("routeVan", actieveRit.pickup_location);
            setRitText("routeNaar", actieveRit.destination);

        } else {
            toonGeenActieveRit();
        }
    } catch (err) {
        console.error("❌ Fout bij laden actieve rit:", err);
        toonGeenActieveRit();
    }
}

function toonGeenActieveRit() {
    setRitText("customerName", "Geen actieve rit");
    setRitText("customerPhone", "-");
    setRitText("pickupLocation", "-");
    setRitText("destination", "-");
    setRitText("price", "-");
    setRitText("rideStatus", "Geen");
    setRitText("routeVan", "-");
    setRitText("routeNaar", "-");
}

// ==========================================
// 2. RITSTATUS LIVE BIJWERKEN IN DATABASE
// ==========================================
async function changeRideStatus(newStatus) {
    if (!actieveBookingId) {
        alert("⚠️ Er is op dit moment geen actieve rit om bij te werken.");
        return;
    }

    try {
        console.log(`🔄 Rit #${actieveBookingId} status bijwerken naar: ${newStatus}`);
        
        const response = await fetch('/api/driver/update-ride-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                booking_id: actieveBookingId,
                status: newStatus
            })
        });

        const result = await response.json();

        if (result.success) {
            const statusElement = document.getElementById("rideStatus");
            if (statusElement) statusElement.textContent = newStatus;
            
            alert("✅ Ritstatus succesvol bijgewerkt naar: " + newStatus);
            
            // Als de rit is afgerond, verversen we de pagina zodat hij verdwijnt naar de geschiedenis
            if (newStatus === 'Afgerond') {
                laadActieveRitLive();
            }
        } else {
            alert("❌ Fout bij bijwerken database: " + result.message);
        }
    } catch (err) {
        console.error("❌ Serverfout:", err);
        alert("Kon geen verbinding maken met de server.");
    }
}

document.addEventListener("DOMContentLoaded", laadActieveRitLive);