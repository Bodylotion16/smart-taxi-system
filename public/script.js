let map;
let pickupLatLng = null;
let destinationLatLng = null;
let routingControl = null;
let berekendeFare = 0;
let berekendeAfstand = 0;

// 1. Start de kaart gecentreerd op Paramaribo
map = L.map('map').setView([5.8520, -55.2038], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 2. Direct eigen GPS locatie opvragen en invullen als straatnaam
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        pickupLatLng = L.latLng(lat, lon);
        
        map.setView(pickupLatLng, 15);
        
        // Vertaal GPS coördinaten naar een kortere straatnaam (Gratis Geocoding)
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            .then(res => res.json())
            .then(data => {
                const kortAdres = data.address.road || data.display_name.split(',')[0];
                document.getElementById('pickup_location').value = kortAdres;
                updateRoute();
            });
    });
}

// 3. Functie voor de gratis Autocomplete suggesties (Matches met jouw CSS `.suggestions-list`)
function setupAutocomplete(inputId, listId, isPickup){
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    
    input.addEventListener('input', function(){
        const q = input.value;
        if(q.length < 3){ list.innerHTML = ''; list.style.display = 'none'; return; }
        
        // Zoeken binnen Suriname (SR)
        fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=SR&q=${encodeURIComponent(q)}`)
        .then(res => res.json())
        .then(data => {
            list.innerHTML = '';
            if(data.length > 0) {
                list.style.display = 'block';
                data.forEach(item => {
                    const li = document.createElement('li');
                    const cleanName = item.display_name.split(',').slice(0, 3).join(',');
                    li.textContent = cleanName;
                    
                    li.addEventListener('click', () => {
                        input.value = cleanName; // Straatnaam in het invoerveld tonen
                        list.innerHTML = '';
                        list.style.display = 'none';
                        
                        const latLng = L.latLng(parseFloat(item.lat), parseFloat(item.lon));
                        if(isPickup) pickupLatLng = latLng; else destinationLatLng = latLng;
                        
                        map.setView(latLng, 14);
                        updateRoute();
                    });
                    list.appendChild(li);
                });
            } else {
                list.style.display = 'none';
            }
        });
    });
    document.addEventListener('click', (e) => { if(e.target !== input) { list.innerHTML = ''; list.style.display = 'none'; } });
}

// Activeer autocomplete op de invoervelden
setupAutocomplete('pickup_location', 'pickup_suggestions', true);
setupAutocomplete('destination', 'destination_suggestions', false);

// 4. Route automatisch uittekenen zodra beide velden gevuld zijn
function updateRoute(){
    if(routingControl) map.removeControl(routingControl);
    
    if(pickupLatLng && destinationLatLng){
        routingControl = L.Routing.control({
            waypoints: [pickupLatLng, destinationLatLng],
            lineOptions: { styles: [{ color: '#2a66ff', opacity: 0.8, weight: 6 }] },
            show: false, // Verbergt het tekst-venster van Leaflet linksboven
            createMarker: function(i, wp) { 
                return L.marker(wp.latLng); 
            },
            router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' })
        }).addTo(map);

        // Pak de echte kilometers uit de route-machine
        routingControl.on('routesfound', function(e) {
            const routes = e.routes;
            berekendeAfstand = (routes[0].summary.totalDistance / 1000).toFixed(1);
        });
    }
}

// 5. Locaties wissen
document.getElementById('clearMap').addEventListener('click', ()=>{
    pickupLatLng = null; 
    destinationLatLng = null;
    document.getElementById('pickup_location').value = '';
    document.getElementById('destination').value = '';
    document.getElementById('priceBox').style.display = 'none';
    document.getElementById('payBtn').style.display = 'none';
    document.getElementById('calcBtn').style.display = 'block';
    berekendeAfstand = 0;
    berekendeFare = 0;
    if(routingControl) map.removeControl(routingControl);
    map.setView([5.8520, -55.2038], 13);
});

// ==========================================
// 6. BEREKEN RITPRIJS OP BASIS VAN DE MAP AFSTAND
// ==========================================
document.getElementById('calcBtn').addEventListener('click', () => {
    const origin = document.getElementById("pickup_location").value;
    const destination = document.getElementById("destination").value;

    // Check of beide velden wel echt zijn ingevuld
    if (!origin || !destination) {
        alert("Kies eerst een ophaallocatie en een bestemming via de suggesties.");
        return;
    }

    // Als de kaart nog bezig is met berekenen of op 0 staat
    if (berekendeAfstand == 0) {
        alert("De route wordt nog berekend of er is geen geldige route gevonden. Probeer het nogmaals.");
        return;
    }

    // REKENLOGICA: Kilometers * SRD 30 (toFixed(2) zorgt netjes voor 2 cijfers achter de komma)
    const TARIEF_PER_KM = 30;
    berekendeFare = (berekendeAfstand * TARIEF_PER_KM).toFixed(2); 

    // Toon de berekende kilometers en SRD prijs direct in jouw mooie HTML box
    document.getElementById('distText').innerText = berekendeAfstand;
    document.getElementById('fareText').innerText = "SRD " + berekendeFare;

    // Wissel de knoppen om en laat de prijs-tag zien (Jouw originele styling)
    document.getElementById('priceBox').style.display = 'block';
    document.getElementById('calcBtn').style.display = 'none';
    document.getElementById('payBtn').style.display = 'block';
});

// 7. Formulier verzenden naar server.js
document.getElementById('bookingForm').addEventListener('submit', async e => {
    e.preventDefault();
    const method = document.getElementById('payment_method').value;
    const bookingData = {
        pickup_location: document.getElementById('pickup_location').value,
        destination: document.getElementById('destination').value,
        distance_km: berekendeAfstand,
        fare: berekendeFare,
        payment_method: method
    };

    try {
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        const result = await response.json();
        if (result.success) {
            const idParam = encodeURIComponent(result.bookingId);
            const amountParam = encodeURIComponent(berekendeFare);
            const methodParam = encodeURIComponent(method);
            window.location.href = `payment.html?booking_id=${idParam}&amount=${amountParam}&method=${methodParam}`;
        } else {
            alert("Systeemfout: " + result.message);
        }
    } catch (err) {
        console.error(err);
        alert("Kan geen verbinding maken met de server.");
    }
});