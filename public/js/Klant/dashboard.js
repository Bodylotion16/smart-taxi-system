console.log("Klant dashboard geladen");

let map = null;
let pickupMarker = null;
let destinationMarker = null;
let routeLine = null;

document.addEventListener("DOMContentLoaded", function () {
    initKlantNaam();
    initLogout();
    initMap();
    initBookingForm();
});

function initKlantNaam() {
    const userName = localStorage.getItem("userName") || "Anisha";
    const welcomeTitle = document.querySelector(".topbar h2");

    if (welcomeTitle && welcomeTitle.textContent.includes("Welkom")) {
        welcomeTitle.textContent = "Welkom, " + userName;
    }
}

function initLogout() {
    const logoutLink = document.querySelector(".logout-link");

    if (!logoutLink) {
        return;
    }

    logoutLink.addEventListener("click", function (event) {
        const confirmed = confirm("Weet je zeker dat je wilt uitloggen?");

        if (!confirmed) {
            event.preventDefault();
            return;
        }

        localStorage.removeItem("userName");
        localStorage.removeItem("userRole");
    });
}

function initMap() {
    const mapElement = document.getElementById("map");

    if (!mapElement) {
        return;
    }

    if (typeof L === "undefined") {
        console.error("Leaflet is niet geladen. Controleer je Leaflet scripts in dashboard.html.");
        return;
    }

    map = L.map("map").setView([5.8520, -55.2038], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap"
    }).addTo(map);

    L.marker([5.8520, -55.2038])
        .addTo(map)
        .bindPopup("Paramaribo")
        .openPopup();

    map.on("click", handleMapClick);

    const clearMapButton = document.getElementById("clearMap");
    if (clearMapButton) {
        clearMapButton.addEventListener("click", clearMapLocations);
    }

    setTimeout(function () {
        map.invalidateSize();
    }, 300);
}

function handleMapClick(event) {
    const pickupInput = document.getElementById("pickup_location");
    const destinationInput = document.getElementById("destination");

    if (!pickupInput || !destinationInput) {
        return;
    }

    const lat = event.latlng.lat.toFixed(5);
    const lng = event.latlng.lng.toFixed(5);
    const locationText = lat + ", " + lng;

    if (!pickupInput.value) {
        pickupInput.value = locationText;

        if (pickupMarker) {
            map.removeLayer(pickupMarker);
        }

        pickupMarker = L.marker(event.latlng)
            .addTo(map)
            .bindPopup("Ophaallocatie")
            .openPopup();

        return;
    }

    if (!destinationInput.value) {
        destinationInput.value = locationText;

        if (destinationMarker) {
            map.removeLayer(destinationMarker);
        }

        destinationMarker = L.marker(event.latlng)
            .addTo(map)
            .bindPopup("Bestemming")
            .openPopup();

        drawRoute();
    }
}

function drawRoute() {
    if (!pickupMarker || !destinationMarker) {
        return;
    }

    if (routeLine) {
        map.removeLayer(routeLine);
    }

    const pickupLatLng = pickupMarker.getLatLng();
    const destinationLatLng = destinationMarker.getLatLng();

    routeLine = L.polyline([pickupLatLng, destinationLatLng], {
        weight: 4
    }).addTo(map);

    map.fitBounds(routeLine.getBounds(), {
        padding: [40, 40]
    });
}

function clearMapLocations() {
    const pickupInput = document.getElementById("pickup_location");
    const destinationInput = document.getElementById("destination");

    if (pickupInput) {
        pickupInput.value = "";
    }

    if (destinationInput) {
        destinationInput.value = "";
    }

    if (pickupMarker) {
        map.removeLayer(pickupMarker);
        pickupMarker = null;
    }

    if (destinationMarker) {
        map.removeLayer(destinationMarker);
        destinationMarker = null;
    }

    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }

    hidePriceBox();
    map.setView([5.8520, -55.2038], 13);
}

function initBookingForm() {
    const calcButton = document.getElementById("calcBtn");
    const bookingForm = document.getElementById("bookingForm");

    if (calcButton) {
        calcButton.addEventListener("click", calculateFare);
    }

    if (bookingForm) {
        bookingForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const pickup = document.getElementById("pickup_location").value.trim();
            const destination = document.getElementById("destination").value.trim();

            if (!pickup || !destination) {
                alert("Vul eerst de ophaallocatie en bestemming in.");
                return;
            }

            window.location.href = "../sub-pages/payment.html";
        });
    }
}

function calculateFare() {
    const pickup = document.getElementById("pickup_location").value.trim();
    const destination = document.getElementById("destination").value.trim();

    if (!pickup || !destination) {
        alert("Vul eerst de ophaallocatie en bestemming in.");
        return;
    }

    const estimatedDistance = 8.5;
    const baseFare = 50;
    const pricePerKm = 15;
    const totalFare = baseFare + estimatedDistance * pricePerKm;

    const priceBox = document.getElementById("priceBox");
    const distText = document.getElementById("distText");
    const fareText = document.getElementById("fareText");
    const payButton = document.getElementById("payBtn");

    if (distText) {
        distText.textContent = estimatedDistance.toFixed(1);
    }

    if (fareText) {
        fareText.textContent = "SRD " + totalFare.toFixed(2);
    }

    if (priceBox) {
        priceBox.style.display = "block";
    }

    if (payButton) {
        payButton.classList.remove("hidden");
    }
}

function hidePriceBox() {
    const priceBox = document.getElementById("priceBox");
    const payButton = document.getElementById("payBtn");

    if (priceBox) {
        priceBox.style.display = "none";
    }

    if (payButton) {
        payButton.classList.add("hidden");
    }
}