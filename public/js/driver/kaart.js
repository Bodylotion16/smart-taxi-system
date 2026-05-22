// Demo coördinaten voor Smart Taxi
// Later kan de backend deze coördinaten vervangen door echte data.

const driverLocation = [5.8248, -55.1700];      // Paramaribo Centrum
const pickupLocation = [5.7890, -55.1800];      // Latour
const destinationLocation = [5.7000, -55.2333]; // Lelydorp

// Kaart starten
const map = L.map("map").setView(driverLocation, 12);

// OpenStreetMap kaartlaag toevoegen
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// Markers toevoegen
const driverMarker = L.marker(driverLocation)
    .addTo(map)
    .bindPopup("<strong>Chauffeur</strong><br>Paramaribo Centrum");

const pickupMarker = L.marker(pickupLocation)
    .addTo(map)
    .bindPopup("<strong>Ophaallocatie klant</strong><br>Latour");

const destinationMarker = L.marker(destinationLocation)
    .addTo(map)
    .bindPopup("<strong>Bestemming</strong><br>Lelydorp");

// Route-lijn tekenen
const routeLine = L.polyline(
    [driverLocation, pickupLocation, destinationLocation],
    {
        color: "#facc15",
        weight: 5,
        opacity: 0.9
    }
).addTo(map);

// Kaart automatisch rond alle markers zetten
map.fitBounds(routeLine.getBounds(), {
    padding: [40, 40]
});

// Knoppen
function focusDriver() {
    map.setView(driverLocation, 15);
    driverMarker.openPopup();
}

function focusPickup() {
    map.setView(pickupLocation, 15);
    pickupMarker.openPopup();
}

function focusDestination() {
    map.setView(destinationLocation, 15);
    destinationMarker.openPopup();
}

function showFullRoute() {
    map.fitBounds(routeLine.getBounds(), {
        padding: [40, 40]
    });
}