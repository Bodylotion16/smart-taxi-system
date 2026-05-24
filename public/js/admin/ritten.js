const rides = {
    "RT-1041": {
        id: "RT-1041",
        customer: "Anisha",
        driver: "Rohit",
        route: "Paramaribo Centrum → Zorg en Hoop",
        price: "SRD 150",
        status: "completed",
        statusText: "Afgerond"
    },
    "RT-1042": {
        id: "RT-1042",
        customer: "Simran",
        driver: "Aman",
        route: "Latour → Lelydorp",
        price: "SRD 220",
        status: "active",
        statusText: "Onderweg"
    },
    "RT-1043": {
        id: "RT-1043",
        customer: "Jayden",
        driver: "Vyaas",
        route: "Flora → Centrum",
        price: "SRD 120",
        status: "planned",
        statusText: "Gepland"
    },
    "RT-1044": {
        id: "RT-1044",
        customer: "Aman",
        driver: "Rohit",
        route: "Maretraite → Latour",
        price: "SRD 0",
        status: "cancelled",
        statusText: "Geannuleerd"
    }
};

let selectedRideId = null;

function showRideDetails(rideId) {
    const ride = rides[rideId];

    if (!ride) {
        return;
    }

    selectedRideId = rideId;

    document.getElementById("detailRideId").textContent = ride.id;
    document.getElementById("detailCustomer").textContent = ride.customer;
    document.getElementById("detailDriver").textContent = ride.driver;
    document.getElementById("detailRoute").textContent = ride.route;
    document.getElementById("detailPrice").textContent = ride.price;
    document.getElementById("detailStatus").textContent = ride.statusText;
    document.getElementById("newRideStatus").value = ride.status;
}

function flagRide() {
    if (!selectedRideId) {
        alert("Selecteer eerst een rit.");
        return;
    }

    alert("Rit " + selectedRideId + " is gemarkeerd voor controle.");
}

function filterRides() {
    const searchValue = document.getElementById("searchRide").value.toLowerCase().trim();
    const statusValue = document.getElementById("rideStatusFilter").value;
    const rows = document.querySelectorAll("#rideTable tr");

    rows.forEach(function(row) {
        const id = row.dataset.id.toLowerCase();
        const customer = row.dataset.customer;
        const driver = row.dataset.driver;
        const status = row.dataset.status;

        const matchesSearch =
            searchValue === "" ||
            id.includes(searchValue) ||
            customer.includes(searchValue) ||
            driver.includes(searchValue);

        const matchesStatus = statusValue === "all" || status === statusValue;

        row.style.display = matchesSearch && matchesStatus ? "table-row" : "none";
    });
}

function updateRideCounts() {
    const rows = document.querySelectorAll("#rideTable tr");

    let planned = 0;
    let active = 0;
    let completed = 0;
    let cancelled = 0;

    rows.forEach(function(row) {
        if (row.dataset.status === "planned") {
            planned++;
        } else if (row.dataset.status === "active") {
            active++;
        } else if (row.dataset.status === "completed") {
            completed++;
        } else if (row.dataset.status === "cancelled") {
            cancelled++;
        }
    });

    document.getElementById("plannedCount").textContent = planned;
    document.getElementById("activeRideCount").textContent = active;
    document.getElementById("completedCount").textContent = completed;
    document.getElementById("cancelledCount").textContent = cancelled;
}

function getStatusText(status) {
    if (status === "planned") {
        return "Gepland";
    }

    if (status === "active") {
        return "Onderweg";
    }

    if (status === "completed") {
        return "Afgerond";
    }

    if (status === "cancelled") {
        return "Geannuleerd";
    }

    return "Onbekend";
}

function getStatusClass(status) {
    if (status === "completed") {
        return "active";
    }

    if (status === "cancelled") {
        return "cancelled";
    }

    return "pending";
}

document.addEventListener("DOMContentLoaded", updateRideCounts);