// ==========================================================================
// BESTAND: public/js/admin/gebruikers.js
// FUNCTIONALITEIT: LIVE GEBRUIKERS BEHEREN (SQL INTEGRATIE)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    laadLiveGebruikers();
});

// ==========================================
// 1. HAAL ALLE KLANTEN OP UIT DE DATABASE
// ==========================================
async function laadLiveGebruikers() {
    const tbody = document.getElementById("userTable");
    if (!tbody) return;

    try {
        console.log("🔄 Live gebruikerslijst ophalen uit database...");
        const response = await fetch('/api/admin/users');
        const data = await response.json();

        if (!data.success) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Fout: ${data.message}</td></tr>`;
            return;
        }

        tbody.innerHTML = ""; // Wis hardcoded mockup rijen
        
        let activeCount = 0;
        let blockedCount = 0;

        data.users.forEach(user => {
            const tr = document.createElement("tr");
            
            // Zet data-attributen voor de filter-functionaliteit
            const volledigeNaam = `${user.first_name} ${user.last_name}`;
            tr.dataset.name = volledigeNaam.toLowerCase();
            tr.dataset.email = user.email.toLowerCase();
            
            // Bepaal de status op basis van de opgeslagen database-waarde
            const isBlocked = user.role === 'geblokkeerd' || user.account_status === 'blocked';
            const statusText = isBlocked ? "Geblokkeerd" : "Actief";
            const statusClass = isBlocked ? "blocked" : "active";
            const btnText = isBlocked ? "Deblokkeren" : "Blokkeren";
            const btnClass = isBlocked ? "btn-success" : "btn-warning";
            
            tr.dataset.status = isBlocked ? "blocked" : "active";

            // Tellers bijwerken
            if (isBlocked) blockedCount++; else activeCount++;

            tr.innerHTML = `
                <td>
                    <strong>${volledigeNaam}</strong>
                    <br>
                    <span class="muted-text">Klant ID: KL-${String(user.user_id_PK).padStart(3, '0')}</span>
                </td>
                <td>
                    ${user.email}
                    <br>
                    <span class="muted-text">${user.phone_number || '+597 000000'}</span>
                </td>
                <td>24 mei 2026</td>
                <td>
                    <span class="status ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <button class="btn-small ${btnClass}" onclick="toggleUserStatus(this, ${user.user_id_PK})">${btnText}</button>
                    <button class="btn-small btn-danger" onclick="deleteUser(this, ${user.user_id_PK}, '${volledigeNaam}')">Verwijderen</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Update de KPI-kaarten live op basis van de SQL tellingen
        document.getElementById("totalCount").textContent = activeCount + blockedCount;
        document.getElementById("activeCount").textContent = activeCount;
        document.getElementById("blockedCount").textContent = blockedCount;

    } catch (error) {
        console.error("❌ Kritieke fout bij laden gebruikers:", error);
    }
}

// ==========================================
// 2. LIVE BLOKKEREN / DEBLOKKEREN IN DB
// ==========================================
async function toggleUserStatus(button, userId) {
    const row = button.closest("tr");
    const momenteelActief = row.dataset.status === "active";
    const nieuweRol = momenteelActief ? "geblokkeerd" : "klant";

    try {
        console.log(`📡 Status update voor User #${userId} naar -> ${nieuweRol}`);
        const response = await fetch('/api/admin/users/toggle-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId, nieuweRol: nieuweRol })
        });

        const result = await response.json();
        if (result.success) {
            // Herlaad de complete lijst om alle tellers en knoppen synchroon te houden
            laadLiveGebruikers();
        } else {
            alert("Fout bij bijwerken status: " + result.message);
        }
    } catch (error) {
        console.error("❌ Netwerkfout bij status toggle:", error);
    }
}

// ==========================================
// 3. GEBRUIKER DEFINITIEF VERWIJDEREN (DELETE)
// ==========================================
async function deleteUser(button, userId, userName) {
    const confirmed = confirm(`Weet je zeker dat je ${userName} wilt verwijderen?\n\nDeze actie verwijdert de gebruiker permanent uit de database.`);
    if (!confirmed) return;

    try {
        console.log(`🚨 Record verwijderen voor User #${userId}`);
        const response = await fetch('/api/admin/users/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId })
        });

        const result = await response.json();
        if (result.success) {
            alert(`${userName} is succesvol verwijderd.`);
            laadLiveGebruikers();
        } else {
            alert("Verwijderen mislukt: " + result.message);
        }
    } catch (error) {
        console.error("❌ Netwerkfout bij verwijderen gebruiker:", error);
    }
}

// ==========================================
// 4. METADATA FILTERING (LOKALE LIVE ZOEKBALK)
// ==========================================
function filterUsers() {
    const searchValue = document.getElementById("searchUser").value.toLowerCase().trim();
    const statusValue = document.getElementById("statusFilter").value;
    const rows = document.querySelectorAll("#userTable tr");

    rows.forEach(row => {
        const name = row.dataset.name || "";
        const email = row.dataset.email || "";
        const status = row.dataset.status || "";

        const matchesSearch = name.includes(searchValue) || email.includes(searchValue);
        const matchesStatus = statusValue === "all" || status === statusValue;

        row.style.display = (matchesSearch && matchesStatus) ? "" : "none";
    });
}