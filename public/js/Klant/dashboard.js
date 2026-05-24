// BESTAND: public/js/klant/dashboard.js

let map = null;
let routingControl = null;
let pickupMarker = null;
let destinationMarker = null;

let calculatedDistance = 0;
let calculatedFare = 0;

const STARTTARIEF = 40.00;
const PER_KM_TARIEF = 25.00;

document.addEventListener("DOMContentLoaded", () => {
    initKlantNaam();
    initLogout();
    initMap();
    initLiveDatabaseData();
    bepaalAutomatischeLocatie();

    // Event listeners instellen voor live straatsuggesties
    setupAutocomplete('pickup_location', 'pickup_suggestions', 'pickup');
    setupAutocomplete('destination', 'destination_suggestions', 'destination');
    
    document.getElementById("calcBtn").addEventListener("click", calculateFare);
    document.getElementById("bookingForm").addEventListener("submit", handelBoekingAf);
});

function initKlantNaam() {
    const userName = localStorage.getItem("userName") || "Simran";
    document.getElementById("welcomeUser").textContent = "Welkom, " + userName;
}

function initLogout() {
    const logoutLink = document.querySelector(".logout-link");
    if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
            if (!confirm("Weet je zeker dat je wilt uitloggen?")) e.preventDefault();
        });
    }
}

// ==========================================
// 1. AUTOMATISCHE GPS GEOLOCATION
// ==========================================
function bepaalAutomatischeLocatie() {
    const pickupInput = document.getElementById("pickup_location");
    
    if (!navigator.geolocation) {
        pickupInput.placeholder = "Typ je ophaallocatie...";
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
            // Vraag OpenStreetMap Nominatim om de coördinaten om te zetten naar een straatnaam
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await response.json();
            
            if (data && data.display_name) {
                const schoneStraat = data.address.road || data.address.suburb || "Huidige Locatie";
                pickupInput.value = schoneStraat;
                updateMarker(lat, lon, 'pickup', schoneStraat);
            }
        } catch (err) {
            console.error("GPS Reverse Geocoding fout:", err);
            pickupInput.placeholder = "Typ je ophaallocatie...";
        }
    }, () => {
        pickupInput.placeholder = "Typ je ophaallocatie...";
    });
}

// ==========================================
// 2. KAART INITIALISATIE & AUTOMCOMPLETE
// ==========================================
function initMap() {
    map = L.map("map").setView([5.8232, -55.1679], 13); // Centraal Paramaribo

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    document.getElementById("clearMap").addEventListener("click", clearMapLocations);
    setTimeout(() => { map.invalidateSize(); }, 300);
}

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

        timeout = setTimeout(async () => {
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}+Suriname&limit=5`;
                const response = await fetch(url);
                const data = await response.json();

                suggestionsList.innerHTML = "";
                if (data.length === 0) {
                    suggestionsList.classList.add("hidden");
                    return;
                }

                suggestionsList.classList.remove("hidden");
                data.forEach(item => {
                    const li = document.createElement("li");
                    li.textContent = item.display_name.replace(", Suriname", "");
                    li.style.padding = "10px";
                    li.style.cursor = "pointer";
                    
                    li.addEventListener("click", () => {
                        input.value = li.textContent;
                        suggestionsList.classList.add("hidden");
                        updateMarker(parseFloat(item.lat), parseFloat(item.lon), type, li.textContent);
                    });
                    suggestionsList.appendChild(li);
                });
            } catch (err) {
                console.error(err);
            }
        }, 400);
    });
}

function updateMarker(lat, lon, type, label) {
    if (type === 'pickup') {
        if (pickupMarker) map.removeLayer(pickupMarker);
        pickupMarker = L.marker([lat, lon]).addTo(map).bindPopup(`Ophaal: ${label}`).openPopup();
    } else {
        if (destinationMarker) map.removeLayer(destinationMarker);
        destinationMarker = L.marker([lat, lon]).addTo(map).bindPopup(`Bestemming: ${label}`).openPopup();
    }
    map.setView([lat, lon], 14);

    if (pickupMarker && destinationMarker) {
        tekenRoute(pickupMarker.getLatLng(), destinationMarker.getLatLng());
    }
}

function tekenRoute(start, end) {
    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
        waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
        lineOptions: { styles: [{ color: '#f1c40f', opacity: 0.8, weight: 6 }] },
        createMarker: () => null,
        show: false
    }).addTo(map);

    routingControl.on('routesfound', (e) => {
        calculatedDistance = (e.routes[0].summary.totalDistance / 1000).toFixed(2);
    });
    
    // Reset de afstand als er een routing error optreedt (bijv. CORS/Overbelasting)
    routingControl.on('routingerror', () => {
        calculatedDistance = 0;
    });
}

// ==========================================
// 3. LIVE DATABASE GEGEVENS INLADEN
// ==========================================
async function initLiveDatabaseData() {
    const tbody = document.getElementById("recentRidesTbody");
    try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();

        if (!data.success || !data.liveRitten || data.liveRitten.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#888;">Nog geen ritten gereden.</td></tr>`;
            return;
        }

        const ritten = data.liveRitten;

        // 1. Vul de Recente Ritten tabel
        tbody.innerHTML = "";
        ritten.slice(0, 5).forEach(rit => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>#${rit.booking_id_PK || rit.booking_id}</td>
                <td>${rit.pickup_location}</td>
                <td>${rit.destination}</td>
                <td style="color:#f1c40f; font-weight:bold;">SRD ${rit.fare}</td>
                <td><span class="status">${rit.status}</span></td>
            `;
            tbody.appendChild(tr);
        });

        // 2. Vul de actuele status box
        const actieveRit = ritten.find(r => r.status !== 'Afgerond');
        const statusContainer = document.getElementById("liveStatusContainer");
        if (actieveRit) {
            statusContainer.classList.remove("empty");
            statusContainer.innerHTML = `
                <p style="margin:0;"><strong>Huidige Rit (#${actieveRit.booking_id_PK || actieveRit.booking_id}):</strong> Van <em>${actieveRit.pickup_location}</em> naar <em>${actieveRit.destination}</em>.</p>
                <p style="margin:5px 0 0 0;">Status Chauffeur: <span class="status" style="background:#f1c40f; color:#000; padding:2px 6px; border-radius:4px; font-weight:bold;">${actieveRit.status}</span></p>
            `;
        }

        // 3. Vul de "Laatste rit" card
        const afgerondeRit = ritten.find(r => r.status === 'Afgerond');
        if (afgerondeRit) {
            document.getElementById("lastVan").textContent = afgerondeRit.pickup_location;
            document.getElementById("lastNaar").textContent = afgerondeRit.destination;
            document.getElementById("lastPrijs").textContent = `SRD ${afgerondeRit.fare}`;
            document.getElementById("lastStatus").textContent = "Afgerond";
        }

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Fout bij laden rittendata.</td></tr>`;
    }
}

// ==========================================
// 4. BEREKENING EN VERZENDING
// ==========================================
function calculateFare() {
    const pickupVal = document.getElementById("pickup_location").value.trim();
    const destVal = document.getElementById("destination").value.trim();

    if (!pickupVal || !destVal) {
        alert("⚠️ Vul eerst een ophaallocatie en bestemming in.");
        return;
    }

    // VEILIGE FALLBACK: Als de gratis OSRM routeerserver offline is of blokkeert door CORS rate-limiting
    if (calculatedDistance == 0) {
        console.warn("⚠️ Route-server reageert niet of weigert toegang. Fallback afstand activeren...");
        
        if (pickupMarker && destinationMarker) {
            // Wiskundige afstand in vogelvlucht berekenen tussen de twee markers
            const startLatLng = pickupMarker.getLatLng();
            const endLatLng = destinationMarker.getLatLng();
            const vogelvluchtMeters = startLatLng.distanceTo(endLatLng);
            
            // +25% extra afstand als compensatie voor bochten en echte straten
            calculatedDistance = ((vogelvluchtMeters / 1000) * 1.25).toFixed(2);
        } else {
            // Ultieme fallback-waarde mochten de markers ook niet bestaan
            calculatedDistance = 5.50;
        }
        console.log(`📏 Gecorrigeerde Fallback Afstand: ${calculatedDistance} km`);
    }

    // Ritprijs formule: Starttarief + (Aantal KM * Prijs per KM)
    calculatedFare = Math.round(parseFloat(STARTTARIEF) + (parseFloat(calculatedDistance) * parseFloat(PER_KM_TARIEF)));

    // Velden op het scherm vullen
    document.getElementById("distText").textContent = calculatedDistance;
    document.getElementById("fareText").textContent = `SRD ${calculatedFare}.00`;
    
    document.getElementById("priceBox").style.display = "block";
    document.getElementById("calcBtn").style.display = "none";
    document.getElementById("payBtn").classList.remove("hidden");
}

async function handelBoekingAf(e) {
    e.preventDefault();
    const pickup = document.getElementById("pickup_location").value.trim();
    const dest = document.getElementById("destination").value.trim();
    const methode = document.getElementById("payment_method").value;

    try {
        console.log("🚀 Gegevens versturen naar /api/book...");
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                pickup_location: pickup, 
                destination: dest, 
                fare: calculatedFare, 
                distance_km: calculatedDistance 
            })
        });
        
        const data = await response.json();
        console.log("📥 Server response ontvangen:", data);

        if (data.success) {
            // Matcht met data.bookingId of data.insertId vanuit de backend controller
            const verkregenId = data.bookingId || data.insertId;
            
            if (!verkregenId) {
                alert("⚠️ Rit succesvol opgeslagen, maar de server gaf geen geldig ID terug.");
                return;
            }

            console.log(`➡️ Succesvol geboekt! Doorsturen naar payment.html voor ID #${verkregenId}`);
            
            // GEFIKST PAD: Verwijdert definitief de 's' en stuurt de echte dynamische variabelen mee
          
// VERVANG DE STRATEGIE DOOR DIT:
console.log("➡️ Relatieve redirect uitvoeren binnen dezelfde map...");
window.location.href = `payment.html?booking_id=${verkregenId}&amount=${calculatedFare}&method=${methode}`;
        } else {
            alert("Boeking mislukt: " + data.message);
        }
    } catch (err) {
        console.error("Netwerkfout in handelBoekingAf:", err);
        alert("Er is een verbindingsfout opgetreden bij het aanmaken van de rit.");
    }
}
// GECORRIGEERD: Schrijf dit exact zo op (zonder mappenstructuur ervoor!)
window.location.href = `payment.html?booking_id=${verkregenId}&amount=${calculatedFare}&method=${methode}`;
function clearMapLocations() {
    document.getElementById("bookingForm").reset();
    document.getElementById("priceBox").style.display = "none";
    document.getElementById("payBtn").classList.add("hidden");
    document.getElementById("calcBtn").style.display = "block";
    if (pickupMarker) map.removeLayer(pickupMarker);
    if (destinationMarker) map.removeLayer(destinationMarker);
    if (routingControl) map.removeControl(routingControl);
    pickupMarker = null; destinationMarker = null; routingControl = null; calculatedDistance = 0;
    bepaalAutomatischeLocatie();
}