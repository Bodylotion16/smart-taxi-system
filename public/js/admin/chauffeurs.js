// ==========================================================================
// BESTAND: public/js/admin/chauffeurs.js
// FUNCTIONALITEIT: LIVE CHAUFFEURS MUTATIES EN DATA INTERACTIES
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    laadLiveChauffeurs();
});

// ==========================================
// 1. HAAL ALLE CHAUFFEURS + TAXI STATUSSEN OP
// ==========================================
async function laadLiveChauffeurs() {
    const tbody = document.getElementById("driverTable");
    if (!tbody) return;

    try {
        console.log("🔄 Chauffeursdata ophalen uit de database...");
        const response = await fetch('/api/admin/drivers');
        const data = await response.json();

        if (!data.success) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Fout: ${data.message}</td></tr>`;
            return;
        }

        tbody.innerHTML = ""; // Gooi de placeholder leeg
        
        let activeCount = 0;
        let blockedCount = 0;
        let onlineCount = 0;

        data.drivers.forEach(driver => {
            const tr = document.createElement("tr");
            
            const volledigeNaam = `${driver.first_name} ${driver.last_name}`;
            const kenteken = driver.kenteken || "Niet geregistreerd";
            
            tr.dataset.name = volledigeNaam.toLowerCase();
            tr.dataset.plate = kenteken.toLowerCase();

            // Status evaluatie op basis van rol-kolom in MySQL
            const isBlocked = driver.role === 'geblokkeerd';
            const statusText = isBlocked ? "Geblokkeerd" : "Actief";
            const statusClass = isBlocked ? "blocked" : "active";
            const btnText = isBlocked ? "Deblokkeren" : "Blokkeren";
            const btnClass = isBlocked ? "btn-success" : "btn-warning";
            
            tr.dataset.status = isBlocked ? "blocked" : "active";

            if (isBlocked) blockedCount++; else activeCount++;
            if (driver.driver_status === 'online') onlineCount++;

            tr.innerHTML = `
                <td>
                    <strong>${volledigeNaam}</strong><br>
                    <span class="muted-text">Driver ID: DR-${String(driver.user_id_PK).padStart(3, '0')}</span>
                </td>
                <td>
                    ${driver.email}<br>
                    <span class="muted-text">${driver.phone_number}</span>
                </td>
                <td>
                    ${driver.auto_model || "Geen voertuig"}<br>
                    <span class="muted-text">Kenteken: ${kenteken}</span>
                </td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-small ${btnClass}" onclick="toggleDriverStatus(this, ${driver.user_id_PK})">${btnText}</button>
                    <button class="btn-small btn-danger" onclick="deleteDriver(this, ${driver.user_id_PK}, '${volledigeNaam}')">Verwijderen</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Update de KPI-kaarten live met database-waarden
        document.getElementById("totalDrivers").textContent = activeCount + blockedCount;
        document.getElementById("activeDrivers").textContent = activeCount;
        document.getElementById("blockedDrivers").textContent = blockedCount;
        document.getElementById("onlineDrivers").textContent = onlineCount;

    } catch (error) {
        console.error("❌ Kritieke fout bij laden chauffeurs:", error);
    }
}

// ==========================================
// 2. LIVE BLOKKEREN / DEBLOKKEREN IN DB
// ==========================================
async function toggleDriverStatus(button, userId) {
    const row = button.closest("tr");
    const momenteelActief = row.dataset.status === "active";
    const nieuweRol = momenteelActief ? "geblokkeerd" : "taxi";

    try {
        console.log(`📡 Status update voor Chauffeur #${userId} naar -> ${nieuweRol}`);
        const response = await fetch('/api/admin/drivers/toggle-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId, nieuweRol: nieuweRol })
        });

        const result = await response.json();
        if (result.success) {
            laadLiveChauffeurs(); // Ververs het overzicht
        } else {
            alert("Fout bij bijwerken status: " + result.message);
        }
    } catch (error) {
        console.error("❌ Netwerkfout bij status toggle:", error);
    }
}

// ==========================================
// 3. CHAUFFEUR PERMANENT WISSEN UIT DB
// ==========================================
async function deleteDriver(button, userId, driverName) {
    const confirmed = confirm(`Weet je zeker dat je chauffeur ${driverName} wilt verwijderen?\n\nDit wist ook de gekoppelde voertuigstatus.`);
    if (!confirmed) return;

    try {
        console.log(`🚨 Record verwijderen voor Chauffeur #${userId}`);
        const response = await fetch('/api/admin/drivers/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId })
        });

        const result = await response.json();
        if (result.success) {
            alert(`${driverName} is succesvol verwijderd.`);
            laadLiveChauffeurs();
        } else {
            alert("Verwijderen mislukt: " + result.message);
        }
    } catch (error) {
        console.error("❌ Netwerkfout bij verwijderen chauffeur:", error);
    }
}

// ==========================================
// 4. FILTERING LOGICA
// ==========================================
function filterDrivers() {
    const searchValue = document.getElementById("searchDriver").value.toLowerCase().trim();
    const statusValue = document.getElementById("driverStatusFilter").value;
    const rows = document.querySelectorAll("#driverTable tr");

    rows.forEach(row => {
        const name = row.dataset.name || "";
        const plate = row.dataset.plate || "";
        const status = row.dataset.status || "";

        const matchesSearch = searchValue === "" || name.includes(searchValue) || plate.includes(searchValue);
        const matchesStatus = statusValue === "all" || status === statusValue;

        row.style.display = matchesSearch && matchesStatus ? "" : "none";
    });
}