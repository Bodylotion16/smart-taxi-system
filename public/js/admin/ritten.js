// ==========================================================================
// BESTAND: public/js/admin/ritten.js
// FUNCTIONALITEIT: LIVE RITTEN DATA OPHALEN EN DETAIL INSPECTIE
// ==========================================================================

let liveRidesArray = []; // Houdt de database ritten tijdelijk vast in het geheugen
let selectedRideId = null;

document.addEventListener("DOMContentLoaded", () => {
    laadLiveRitten();
});

// ==========================================
// 1. HAAL ALLE RITTEN OP UIT DE DATABASE
// ==========================================
async function laadLiveRitten() {
    const tbody = document.getElementById("rideTable");
    if (!tbody) return;

    try {
        console.log("🔄 Live rittengegevens opvragen bij server...");
        const response = await fetch('/api/admin/rides');
        const data = await response.json();

        if (!data.success) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Fout: ${data.message}</td></tr>`;
            return;
        }

        // Sla de ritten globaal op zodat de showRideDetails knop hiernaar kan zoeken
        liveRidesArray = data.rides;
        tbody.innerHTML = ""; 

        liveRidesArray.forEach(rit => {
            const tr = document.createElement("tr");
            
            const klantNaam = rit.klant_voornaam ? `${rit.klant_voornaam} ${rit.klant_achternaam || ''}` : "Onbekend";
            const chauffeurNaam = rit.chauffeur_voornaam ? `${rit.chauffeur_voornaam} ${rit.chauffeur_achternaam || ''}` : "Nog niet gekoppeld";
            
            // Map database statussen naar de juiste CSS filters
            let interneStatus = "planned";
            if (rit.status === 'Onderweg') interneStatus = "active";
            if (rit.status === 'Afgerond' || rit.status === 'paid') interneStatus = "completed";
            if (rit.status === 'Geannuleerd') interneStatus = "cancelled";

            tr.dataset.id = `RT-${rit.booking_id_PK}`;
            tr.dataset.customer = klantNaam.toLowerCase();
            tr.dataset.driver = chauffeurNaam.toLowerCase();
            tr.dataset.status = interneStatus;

            tr.innerHTML = `
                <td>
                    <strong>RT-${rit.booking_id_PK}</strong><br>
                    <span class="muted-text">${rit.rit_datum || '24 mei 2026'}</span>
                </td>
                <td>${klantNaam}</td>
                <td>${chauffeurNaam}</td>
                <td><span class="status ${getStatusClass(interneStatus)}">${rit.status}</span></td>
                <td>
                    <button class="btn-small" onclick="showRideDetails(${rit.booking_id_PK})">Details</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Bereken en update direct de KPI-tellers bovenin het scherm
        updateRideCounts();

    } catch (error) {
        console.error("❌ Kritieke fout bij inladen rittentabel:", error);
    }
}

// ==========================================
// 2. TOON DETAILS VAN DE GESELECTEERDE RIT
// ==========================================
function showRideDetails(bookingId) {
    // Zoek de juiste rit op in onze runtime database array
    const rit = liveRidesArray.find(r => r.booking_id_PK === bookingId);
    if (!rit) return;

    selectedRideId = `RT-${rit.booking_id_PK}`;

    const klantNaam = rit.klant_voornaam ? `${rit.klant_voornaam} ${rit.klant_achternaam || ''}` : "Onbekend";
    const chauffeurNaam = rit.chauffeur_voornaam ? `${rit.chauffeur_voornaam} ${rit.chauffeur_achternaam || ''}` : "Nog niet gekoppeld";

    document.getElementById("detailRideId").textContent = `RT-${rit.booking_id_PK}`;
    document.getElementById("detailCustomer").textContent = klantNaam;
    document.getElementById("detailDriver").textContent = chauffeurNaam;
    document.getElementById("detailRoute").textContent = `${rit.pickup_location} → ${rit.destination}`;
    document.getElementById("detailPrice").textContent = `SRD ${rit.fare}`;
    document.getElementById("detailStatus").textContent = rit.status;
}

function flagRide() {
    if (!selectedRideId) {
        alert("⚠️ Selecteer eerst een rit uit de lijst.");
        return;
    }
    alert(`🎉 Rit ${selectedRideId} is succesvol gemarkeerd voor controle door de hoofdbeheerder.`);
}

function filterRides() {
    const searchValue = document.getElementById("searchRide").value.toLowerCase().trim();
    const statusValue = document.getElementById("rideStatusFilter").value;
    const rows = document.querySelectorAll("#rideTable tr");

    rows.forEach(row => {
        const id = row.dataset.id ? row.dataset.id.toLowerCase() : "";
        const customer = row.dataset.customer || "";
        const driver = row.dataset.driver || "";
        const status = row.dataset.status || "";

        const matchesSearch = searchValue === "" || id.includes(searchValue) || customer.includes(searchValue) || driver.includes(searchValue);
        const matchesStatus = statusValue === "all" || status === statusValue;

        row.style.display = matchesSearch && matchesStatus ? "" : "none";
    });
}

function updateRideCounts() {
    const rows = document.querySelectorAll("#rideTable tr");
    let planned = 0, active = 0, completed = 0, cancelled = 0;

    rows.forEach(row => {
        if (row.dataset.status === "planned") planned++;
        else if (row.dataset.status === "active") active++;
        else if (row.dataset.status === "completed") completed++;
        else if (row.dataset.status === "cancelled") cancelled++;
    });

    document.getElementById("plannedCount").textContent = planned;
    document.getElementById("activeRideCount").textContent = active;
    document.getElementById("completedCount").textContent = completed;
    document.getElementById("cancelledCount").textContent = cancelled;
}

function getStatusClass(status) {
    if (status === "completed") return "active";
    if (status === "cancelled") return "cancelled";
    return "pending";
}