let map;
let pickupLatLng = null;
let destinationLatLng = null;
let routingControl = null;
let berekendeFare = 0;
let berekendeAfstand = 0;

/* =========================
   MAP INITIALISATIE
========================= */
map = L.map('map').setView([5.8520, -55.2038], 13);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);

/* =========================
   INTEGRATIE: NAVIGATIE & LOGOUT
========================= */
document.getElementById("logoutBtn").addEventListener("click", () => {
    window.location.href = "../login.html";
});

/* =========================
   INTEGRATIE: RIT HERBOEKEN (SESSIONSTORAGE)
========================= */
window.addEventListener("DOMContentLoaded", async () => {
    const vanLocatie = sessionStorage.getItem("rebookVan");
    const naarLocatie = sessionStorage.getItem("rebookNaar");

    if (vanLocatie && naarLocatie) {
        document.getElementById('pickup_location').value = vanLocatie;
        document.getElementById('destination').value = naarLocatie;

        // Gegevens direct wissen uit het geheugen voor herladen
        sessionStorage.removeItem("rebookVan");
        sessionStorage.removeItem("rebookNaar");

        // Start het omzetten van tekst naar kaartcoördinaten (Geocoding)
        try {
            const coordVan = await geocodeAddress(vanLocatie);
            if (coordVan) pickupLatLng = coordVan;

            const coordNaar = await geocodeAddress(naarLocatie);
            if (coordNaar) destinationLatLng = coordNaar;

            if (pickupLatLng && destinationLatLng) {
                updateRoute();
                map.fitBounds(L.latLngBounds(pickupLatLng, destinationLatLng), { padding: [50, 50] });
            }
        } catch (error) {
            console.error("Herboeken mislukt tijdens geocoding:", error);
        }
    } else {
        // Alleen GPS ophalen als de gebruiker GEEN rit herboekt
        initGPS();
    }
});

// Helperfunctie om een tekstlocatie om te zetten naar coördinaten via Nominatim
async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=SR&limit=1&q=${encodeURIComponent(address)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 0) {
        return L.latLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
    }
    return null;
}

/* =========================
   GPS LOCATIE
========================= */
function initGPS() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            pickupLatLng = L.latLng(lat, lon);
            map.setView(pickupLatLng, 15);

            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                .then(res => res.json())
                .then(data => {
                    const kortAdres = data.address.road || data.display_name.split(',')[0];
                    document.getElementById('pickup_location').value = kortAdres;
                    updateRoute();
                });
        });
    }
}

/* =========================
   AUTOCOMPLETE
========================= */
function setupAutocomplete(inputId, listId, isPickup) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);

    input.addEventListener('input', function () {
        const q = input.value;

        if (q.length < 3) {
            list.innerHTML = '';
            list.classList.add('hidden');
            return;
        }

        fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=SR&q=${encodeURIComponent(q)}`)
            .then(res => res.json())
            .then(data => {
                list.innerHTML = '';

                if (data.length > 0) {
                    list.classList.remove('hidden');

                    data.forEach(item => {
                        const li = document.createElement('li');
                        const cleanName = item.display_name.split(',').slice(0, 3).join(',');
                        li.textContent = cleanName;

                        li.addEventListener('click', () => {
                            input.value = cleanName;
                            list.innerHTML = '';
                            list.classList.add('hidden');

                            const latLng = L.latLng(
                                parseFloat(item.lat),
                                parseFloat(item.lon)
                            );

                            if (isPickup) {
                                pickupLatLng = latLng;
                            } else {
                                destinationLatLng = latLng;
                            }

                            map.setView(latLng, 14);
                            updateRoute();
                        });

                        list.appendChild(li);
                    });
                } else {
                    list.classList.add('hidden');
                }
            });
    });

    document.addEventListener('click', (e) => {
        if (e.target !== input) {
            list.innerHTML = '';
            list.classList.add('hidden');
        }
    });
}

/* =========================
   ACTIVEER AUTOCOMPLETE
========================= */
setupAutocomplete('pickup_location', 'pickup_suggestions', true);
setupAutocomplete('destination', 'destination_suggestions', false);

/* =========================
   ROUTE UPDATE
========================= */
function updateRoute() {
    if (routingControl) {
        map.removeControl(routingControl);
    }

    if (pickupLatLng && destinationLatLng) {
        routingControl = L.Routing.control({
            waypoints: [
                pickupLatLng,
                destinationLatLng
            ],
            lineOptions: {
                styles: [{
                    color: '#f1c40f', // Aangepast naar jouw goudgele themakleur!
                    opacity: 0.8,
                    weight: 6
                }]
            },
            show: false,
            createMarker: function (i, wp) {
                return L.marker(wp.latLng);
            },
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1'
            })
        }).addTo(map);

        routingControl.on('routesfound', function (e) {
            const routes = e.routes;
            berekendeAfstand = (routes[0].summary.totalDistance / 1000).toFixed(1);
        });
    }
}

/* =========================
   LOCATIES RESETTEN
========================= */
document.getElementById('clearMap').addEventListener('click', () => {
    pickupLatLng = null;
    destinationLatLng = null;

    document.getElementById('pickup_location').value = '';
    document.getElementById('destination').value = '';
    document.getElementById('priceBox').style.display = 'none';
    document.getElementById('payBtn').classList.add('hidden');
    document.getElementById('calcBtn').style.display = 'block';

    berekendeAfstand = 0;
    berekendeFare = 0;

    if (routingControl) {
        map.removeControl(routingControl);
    }

    map.setView([5.8520, -55.2038], 13);
});

/* =========================
   RITPRIJS BEREKENEN
========================= */
document.getElementById('calcBtn').addEventListener('click', () => {
    const origin = document.getElementById('pickup_location').value;
    const destination = document.getElementById('destination').value;

    if (!origin || !destination) {
        alert('Kies eerst een ophaallocatie en een bestemming via de suggesties.');
        return;
    }

    if (berekendeAfstand == 0) {
        alert('De route wordt nog berekend of er is geen geldige route gevonden.');
        return;
    }

    const TARIEF_PER_KM = 30;
    berekendeFare = (berekendeAfstand * TARIEF_PER_KM).toFixed(2);

    document.getElementById('distText').innerText = berekendeAfstand;
    document.getElementById('fareText').innerText = 'SRD ' + berekendeFare;

    document.getElementById('priceBox').style.display = 'block';
    document.getElementById('calcBtn').style.display = 'none';
    document.getElementById('payBtn').classList.remove('hidden');
});

/* =========================
   BOEKING VERSTUREN
========================= */
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        if (result.success) {
            const idParam = encodeURIComponent(result.bookingId);
            const amountParam = encodeURIComponent(berekendeFare);
            const methodParam = encodeURIComponent(method);

            window.location.href = `../sub-pages/payments.html?booking_id=${idParam}&amount=${amountParam}&method=${methodParam}`;
        } else {
            alert('Systeemfout: ' + result.message);
        }
    } catch (err) {
        console.error(err);
        alert('Kan geen verbinding maken met de server.');
    }
});