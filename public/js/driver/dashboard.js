const driver = {
    name: "Rohit Patandin",
    email: "rohit@example.com",
    phone: "+597 8888888",
    vehicle: "Toyota Prius",
    plate: "TX-2456",
    status: "Beschikbaar"
};

const activeRide = {
    customer: "Anisha",
    pickup: "Paramaribo Centrum",
    destination: "Zorg en Hoop",
    price: "SRD 150",
    status: "Onderweg naar klant"
};

const rideRequests = [
    {
        customer: "Simran",
        pickup: "Latour",
        destination: "Lelydorp",
        price: "SRD 220"
    },
    {
        customer: "Aman",
        pickup: "Flora",
        destination: "Centrum",
        price: "SRD 120"
    }
];

function loadDashboard() {
    setText("driverName", driver.name);
    setText("driverStatus", driver.status);
    setText("driverVehicle", driver.vehicle + " - " + driver.plate);

    setText("activeCustomer", activeRide.customer);
    setText("activePickup", activeRide.pickup);
    setText("activeDestination", activeRide.destination);
    setText("activePrice", activeRide.price);
    setText("activeRideStatus", activeRide.status);

    setText("todayRides", "5");
    setText("newRequests", rideRequests.length);
    setText("completedRides", "18");
    setText("rating", "4.8");

    loadRideRequests();
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function loadRideRequests() {
    const container = document.getElementById("requestList");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    rideRequests.forEach(function(request) {
        const item = document.createElement("div");
        item.className = "request-item";

        item.innerHTML = `
            <h3>${request.customer}</h3>
            <p><strong>Ophaallocatie:</strong> ${request.pickup}</p>
            <p><strong>Bestemming:</strong> ${request.destination}</p>
            <p><strong>Prijs:</strong> ${request.price}</p>
            <button class="btn btn-yellow" onclick="acceptRide('${request.customer}')">Accepteren</button>
            <button class="btn btn-outline" onclick="declineRide('${request.customer}')">Weigeren</button>
        `;

        container.appendChild(item);
    });
}

function acceptRide(customerName) {
    alert("Rit van " + customerName + " is geaccepteerd.");
}

function declineRide(customerName) {
    alert("Rit van " + customerName + " is geweigerd.");
}

function changeDriverStatus(status, button) {
    driver.status = status;

    setText("driverStatus", status);

    const buttons = document.querySelectorAll(".status-option");
    buttons.forEach(function(btn) {
        btn.classList.remove("active");
    });

    button.classList.add("active");

    alert("Status gewijzigd naar: " + status);
}

function completeRide() {
    setText("activeRideStatus", "Afgerond");
    alert("Actieve rit is afgerond.");
}

document.addEventListener("DOMContentLoaded", loadDashboard);