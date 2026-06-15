// ==========================================================================
// BESTAND: public/js/admin/dashboard.js
// FUNCTIONALITEIT: LIVE DATABASE DATA KOPPELEN AAN HET ADMIN DASHBOARD
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    // Haal direct bij het laden van de pagina de MySQL data op
    laadAdminDashboardData();
    initAdminLogout();

    // Systeem update: Ververs de data automatisch elke 15 seconden live
    setInterval(laadAdminDashboardData, 15000);
});

// ==========================================================================
// 1. REALTIME DATA OPHALEN UIT MYSQL EN CARDS VULLEN
// ==========================================================================
async function laadAdminDashboardData() {
    try {
        console.log("📡 Realtime platformgegevens opvragen bij server...");
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();

        if (!data.success) {
            console.error("❌ Foutmelding van API ontvangen:", data.message);
            return;
        }

        // --- A. KPI KAARTEN VULLEN ---
        const totaalKlanten = data.klanten ? data.klanten.length : 0;
        const totaalChauffeurs = data.chauffeurs ? data.chauffeurs.length : 0;
        const totaalGebruikers = totaalKlanten + totaalChauffeurs;

        // Schrijf de waarden live over in de HTML cards
        const kpiGebruikersEl = document.getElementById("kpiGebruikers");
        const kpiChauffeursEl = document.getElementById("kpiChauffeurs");
        const kpiOmzetEl = document.getElementById("kpiOmzet");
        const kpiRittenCountEl = document.getElementById("kpiRittenCount");

        if (kpiGebruikersEl) kpiGebruikersEl.textContent = totaalGebruikers;
        if (kpiChauffeursEl) kpiChauffeursEl.textContent = totaalChauffeurs;
        if (kpiOmzetEl) kpiOmzetEl.textContent = `SRD ${Math.round(data.stats.totale_omzet)}`;
        if (kpiRittenCountEl) kpiRittenCountEl.textContent = `${data.stats.totaal_ritten} ritten succesvol betaald`;

        // --- B. RECENTE RITTEN TABEL DYNAMISCH INITIALISEREN ---
        // We zoeken de <tbody> van je admin-table
        const tbody = document.querySelector(".admin-table tbody");
        
        if (tbody && data.liveRitten && data.liveRitten.length > 0) {
            tbody.innerHTML = ""; // Gooi de hardcoded HTML rijen leeg
            
            // Loop door de laatste 5 ritten uit je database
            data.liveRitten.slice(0, 5).forEach(rit => {
                const tr = document.createElement("tr");
                
                // Status badge styling bepalen
                let statusClass = "pending";
                if (rit.status === 'Afgerond' || rit.status === 'paid' || rit.status === 'completed') {
                    statusClass = "active"; // Dit activeert de groene kleur uit je CSS
                }

                tr.innerHTML = `
                    <td><strong>RT-${rit.booking_id_PK || rit.booking_id}</strong></td>
                    <td>${rit.pickup_location.split(',')[0]}</td>
                    <td>${rit.destination.split(',')[0]}</td>
                    <td>Centrum-Route</td> 
                    <td><span class="status ${statusClass}">${rit.status}</span></td>
                    <td style="color: #f1c40f; font-weight: bold;">SRD ${rit.fare}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        console.log("✅ Admin Dashboard succesvol gevuld met realtime database-waarden.");

    } catch (error) {
        console.error("❌ Kritieke netwerkfout in dashboard.js:", error);
    }
}

// ==========================================================================
// 2. VEILIGE PORTAL LOGOUT LOGICA
// ==========================================================================
function initAdminLogout() {
    const logoutLink = document.querySelector(".logout-link");
    if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
            if (!confirm("Weet je zeker dat je wilt uitloggen uit het Admin Portal?")) {
                e.preventDefault();
            } else {
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                localStorage.removeItem('userRole');
            }
        });
    }
}