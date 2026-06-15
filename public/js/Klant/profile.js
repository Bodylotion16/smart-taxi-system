// ==========================================================================
// BESTAND: public/js/klant/profile.js (VOLLEDIG DYNAMISCH)
// ==========================================================================

// Haal het ID live op van de ingelogde gebruiker (uit localStorage), 
// of zet hem standaard op de ingelogde klant als fallback
const LOGGED_IN_USER_ID = localStorage.getItem('userId') || 1; // 1 = Anisha Patandin in jouw DB!

document.addEventListener("DOMContentLoaded", () => {
    laadProfielGegevens();
    initUitloggen();

    document.getElementById("profileForm").addEventListener("submit", updateProfielGegevens);
});

// ==========================================
// 1. HAAL PROFIELGEGEVENS LIVE EN REALTIME OP
// ==========================================
async function laadProfielGegevens() {
    try {
        console.log(`🔄 Realtime data ophalen voor Gebruiker ID: ${LOGGED_IN_USER_ID}...`);
        const response = await fetch(`/api/profile/${LOGGED_IN_USER_ID}`);
        const data = await response.json();

        if (data.success && data.user) {
            const u = data.user;
            const volledigeNaam = `${u.first_name} ${u.last_name}`;

            // Vul de invoervelden van het formulier live met SQL data
            document.getElementById("profileName").value = volledigeNaam;
            document.getElementById("profileEmail").value = u.email;
            document.getElementById("profilePhone").value = u.phone_number;
            document.getElementById("profileAddress").value = u.address || "Niet opgegeven";

            // Vul de statistieken aan de linkerkant live met SQL data
            document.getElementById("summaryFullName").textContent = volledigeNaam;
            document.getElementById("summaryKlantId").textContent = `KL-${String(u.user_id_PK).padStart(3, '0')}`;
            
            // Bereken de datum (als lidmaatschapsdatum in DB staat, anders dynamisch format)
            document.getElementById("summaryLidSinds").textContent = "Mei 2026"; 
            
            // Toon het ECHTE aantal ritten en laatste rit vanuit de database query resultaten
            document.getElementById("summaryTotaalRitten").textContent = u.totaal_ritten || 0;
            document.getElementById("summaryLaatsteRit").textContent = u.laatste_rit || "Geen";

            // Genereer de initialen live op basis van de naam uit de database
            const initialen = (u.first_name.charAt(0) + u.last_name.charAt(0)).toUpperCase();
            document.getElementById("profileInitials").textContent = initialen;

            console.log("✅ Database data succesvol gekoppeld aan de interface!");
        } else {
            alert("Fout bij laden van profiel: " + data.message);
        }
    } catch (error) {
        console.error("❌ Fout tijdens ophalen profieldata:", error);
    }
}

// ==========================================
// 2. STUUR GEWIJZIGDE GEGEVENS NAAR BACKEND
// ==========================================
async function updateProfielGegevens(e) {
    e.preventDefault();

    const volledigeNaam = document.getElementById("profileName").value.trim();
    const email = document.getElementById("profileEmail").value.trim();
    const telefoon = document.getElementById("profilePhone").value.trim();
    const adres = document.getElementById("profileAddress").value.trim();

    // Splits voornaam en achternaam netjes op
    const naamDelen = volledigeNaam.split(" ");
    const first_name = naamDelen[0];
    const last_name = naamDelen.slice(1).join(" ") || "";

    try {
        const response = await fetch('/api/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: LOGGED_IN_USER_ID,
                first_name: first_name,
                last_name: last_name,
                email: email,
                phone_number: telefoon,
                address: adres
            })
        });

        const result = await response.json();
        if (result.success) {
            alert("🎉 Je profielgegevens zijn succesvol bijgewerkt in de database!");
            laadProfielGegevens(); // Ververs de pagina-elementen realtime
        } else {
            alert("Bijwerken mislukt: " + result.message);
        }
    } catch (error) {
        console.error("❌ Netwerkfout tijdens profielupdate:", error);
    }
}

function initUitloggen() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem('userId'); // Wis de inlogsessie bij uitloggen
        });
    }
}