// BESTAND: public/js/klant/book-ride.js

let map;
let routingControl = null;
let pickupMarker = null;
let destinationMarker = null;

let calculatedDistance = 0;
let calculatedFare = 0;

// Instellingen voor ritprijs (SRD)
const STARTTARIEF = 40.00;
const PER_KM_TARIEF = 25.00;

// ==========================================
// 1. KAART INITIALISEREN (Gecentreerd op Paramaribo)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    console.log("🗺️ Kaart initialiseren op Paramaribo...");
    
    // Coördinaten van Paramaribo Centrum
    map = L.map('map').setView([5.8232, -55.1679], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Koppel event listeners
    setupAutocomplete('pickup_location', 'pickup_suggestions', 'pickup');
    setupAutocomplete('destination', 'destination_suggestions', 'destination');
    
    document.getElementById("calcBtn").addEventListener("click", berekenRitPrijs);
    document.getElementById("bookingForm").addEventListener("submit", slaRitOpInDatabase);
    document.getElementById("clearMap").addEventListener("click", wisKaartEnVelden);
    
    document.getElementById("logoutBtn").addEventListener("click", () => {
        if(confirm("Weet je zeker dat je wilt uitloggen?")) {
            window.location.href = "../../auth/login.html";
        }
    });
});

// ==========================================
// 2. AUTOCOMPLETE & GEOCODING (OSM Nominatim)
// ==========================================
function setupAutocomplete(inputId, suggestionsId, type) {
    const input = document.getElementById(inputId);
    const suggestionsList = document.getElementById(suggestionsId);
    let timeout = null;

    input.addEventListener("input", () => {
        clearTimeout(timeout);
        const query = input.value.trim();

        if (query.length < 3) {
            suggestionsList.classList.add("hidden");
            return;
        }

        // Voorkom teveel API requests achter elkaar (debounce)
        timeout = setTimeout(async () => {
            try {
                // We zoeken specifiek binnen Suriname voor accurate resultaten
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}+Suriname&limit=5`;
                const response = await fetch(url, {
                    headers: { 'Accept-Language': 'nl' }
                });
                const data = await response.json();

                suggestionsList.innerHTML = "";
                if (data.length === 0) {
                    suggestionsList.classList.add("hidden");
                    return;
                }

                suggestionsList.classList.remove("hidden");
                data.forEach(item => {
                    const li = document.createElement("li");
                    // Sla coördinaten op in de data-attributen
                    li.dataset.lat = item.lat;
                    li.dataset.lon = item.lon;
                    li.textContent = item.display_name.replace(", Suriname", "");
                    
                    li.addEventListener("click", () => {
                        input.value = li.textContent;
                        suggestionsList.classList.add("hidden");
                        
                        // Plaats marker op de kaart
                        updateMarker(parseFloat(item.lat), parseFloat(item.lon), type, li.textContent);
                    });
                    suggestionsList.appendChild(li);
                });
            } catch (err) {
                console.error("Geocoding fout:", err);
            }
        }, 500);
    });

    // Sluit suggestielijst als je buiten het veld klikt
    document.addEventListener("click", (e) => {
        if (e.target !== input) {
            suggestionsList.classList.add("hidden");
        }
    });
}

// Marker bijwerken of aanmaken
function updateMarker(lat, lon, type, label) {
    if (type === 'pickup') {
        if (pickupMarker) map.removeLayer(pickupMarker);
        pickupMarker = L.marker([lat, lon], { draggable: false }).addTo(map).bindPopup(`<b>Ophaalpunt:</b><br>${label}`).openPopup();
    } else {
        if (destinationMarker) map.removeLayer(destinationMarker);
        destinationMarker = L.marker([lat, lon], { draggable: false }).addTo(map).bindPopup(`<b>Bestemming:</b><br>${label}`).openPopup();
    }
    
    // Zoom naar de marker
    map.setView([lat, lon], 14);
    
    // Als beide markers er zijn, teken alvast de route preview
    if (pickupMarker && destinationMarker) {
        tekenRoute(pickupMarker.getLatLng(), destinationMarker.getLatLng());
    }
}

// ==========================================
// 3. ROUTE TEKENEN EN AFSTAND BEREKENEN
// ==========================================
function tekenRoute(startLatLng, endLatLng) {
    if (routingControl) {
        map.removeControl(routingControl);
    }

    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(startLatLng.lat, startLatLng.lng),
            L.latLng(endLatLng.lat, endLatLng.lng)
        ],
        lineOptions: {
            styles: [{ color: '#f1c40f', opacity: 0.8, weight: 6 }] // Smart Taxi goudgeel
        },
        createMarker: () => null, // Verberg de extra standaard routing markers
        addWaypoints: false,
        draggableWaypoints: false,
        show: false // Verberg het textuele routebeschrijvingspaneel
    }).addTo(map);

    // Luister naar het moment dat de route berekend is
    routingControl.on('routesfound', (e) => {
        const routes = e.routes;
        const summary = routes[0].summary;
        
        // summary.totalDistance is in meters -> omrekenen naar km
        calculatedDistance = (summary.totalDistance / 1000).toFixed(2);
        console.log(`📏 Route gevonden! Afstand: ${calculatedDistance} km`);
    });
}

// ==========================================
// 4. RITPRIJS BEREKENEN
// ==========================================
function berekenRitPrijs() {
    const pickupVal = document.getElementById("pickup_location").value.trim();
    const destVal = document.getElementById("destination").value.trim();

    if (!pickupVal || !destVal || !pickupMarker || !destinationMarker) {
        alert("⚠️ Selecteer eerst een geldige ophaallocatie en bestemming uit de lijst.");
        return;
    }

    // Wacht tot de route-machine de afstand heeft teruggegeven
    if (calculatedDistance == 0) {
        alert("🔄 De route wordt nog berekend. Wacht een moment en klik nogmaals.");
        return;
    }

    // Ritprijs formule: Starttarief + (Aantal KM * Prijs per KM)
    calculatedFare = parseFloat(STARTTARIEF) + (parseFloat(calculatedDistance) * parseFloat(PER_KM_TARIEF));
    
    // Rond af op hele SRD's voor een nette weergave
    calculatedFare = Math.round(calculatedFare);

    // Update de HTML elementen in de priceBox
    document.getElementById("distText").textContent = calculatedDistance;
    document.getElementById("fareText").textContent = `SRD ${calculatedFare}.00`;
    
    // Toon de prijsbox en wissel van actieknop
    document.getElementById("priceBox").style.display = "block";
    document.getElementById("calcBtn").style.display = "none";
    document.getElementById("payBtn").classList.remove("hidden");
}
if (data.success) {
    // We sturen de berekende ID, prijs en methode mee als veilige URL-parameters
    const gekozenMethode = document.getElementById("payment_method").value;
    window.location.href = `payments.html?booking_id=${data.bookingId}&amount=${calculatedFare}&method=${gekozenMethode}`;
}
// ==========================================
// 5. BOEKING OPSLAAN IN MYSQL DATABASE
// ==========================================
async function slaRitOpInDatabase(e) {
    e.preventDefault(); // Voorkom standaard pagina herlaad

    const pickup_location = document.getElementById("pickup_location").value;
    const destination = document.getElementById("destination").value;

    try {
        console.log("🚀 Rit verzenden naar backend...");
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pickup_location: pickup_location,
                destination: destination,
                fare: calculatedFare,
                distance_km: calculatedDistance
            })
        });

        const data = await response.json();

        if (data.success) {
            alert(`🎉 Rit succesvol aangevraagd (Boeking ID: #${data.bookingId})!\nChauffeurs kunnen je rit nu accepteren.`);
            
            // Stuur de klant direct door naar het dashboard overzicht
            window.location.href = "dashboard.html";
        } else {
            alert("❌ Reservering mislukt: " + data.message);
        }
    } catch (err) {
        console.error("Netwerkfout bij boeken:", err);
        alert("Kon geen verbinding maken met de server.");
    }
}

// Reset-functie voor de knop 'Locaties wissen'
function wisKaartEnVelden() {
    document.getElementById("bookingForm").reset();
    document.getElementById("priceBox").style.display = "none";
    document.getElementById("payBtn").classList.add("hidden");
    document.getElementById("calcBtn").style.display = "block";
    
    if (pickupMarker) map.removeLayer(pickupMarker);
    if (destinationMarker) map.removeLayer(destinationMarker);
    if (routingControl) map.removeControl(routingControl);
    
    pickupMarker = null;
    destinationMarker = null;
    routingControl = null;
    calculatedDistance = 0;
    calculatedFare = 0;
    
    map.setView([5.8232, -55.1679], 13);
}