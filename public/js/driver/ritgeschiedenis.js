// BESTAND: public/js/driver/ritgeschiedenis.js

// Functie om de rittendetails via een simpele pop-up te tonen
function viewRideDetails(bookingId) {
    alert("🔍 Details van rit #" + bookingId + " worden geladen.");
}

// Helper om samenvattingsvelden makkelijk te vullen
function setStatText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

// ==========================================
// LIVE AFGERONDE RITTEN EN STATS OPHALEN
// ==========================================
async function laadRitgeschiedenisLive() {
    const tbody = document.getElementById("geschiedenisTbody");
    if (!tbody) return;

    try {
        console.log("🔄 Ritgeschiedenis opvragen uit database...");
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();

        if (!data.success || !data.liveRitten || data.liveRitten.length === 0) {
            toonLegeGeschiedenis();
            return;
        }

        // Filter alle ritten uit de database die de status 'Afgerond' hebben
        const afgerondeRitten = data.liveRitten.filter(rit => rit.status === 'Afgerond');

        if (afgerondeRitten.length === 0) {
            toonLegeGeschiedenis();
            return;
        }

        // Maak de tabel leeg voor de verse invoer
        tbody.innerHTML = "";

        let totaleInkomsten = 0;

        // Loop door alle afgeronde ritten en bouw de tabelrijen
        afgerondeRitten.forEach(rit => {
            const id = rit.booking_id_PK || rit.booking_id;
            const fare = parseFloat(rit.fare) || 0;
            totaleInkomsten += fare;

            // Dynamische testnaam-fallback gekoppeld aan ID (zodat het klopt met je eerdere pagina's)
            const klantNaam = id % 2 === 0 ? "Aman" : "Simran";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>#${id}</td>
                <td>${rit.customer_name || klantNaam}</td>
                <td>${rit.pickup_location} &rarr; ${rit.destination}</td>
                <td style="color: #f1c40f; font-weight: bold;">SRD ${fare.toFixed(2)}</td>
                <td><span class="status" style="background: rgba(46, 204, 113, 0.15); color: #2ecc71; border: 1px solid #2ecc71;">Afgerond</span></td>
                <td>
                    <button onclick="viewRideDetails(${id})" style="padding: 5px 10px; font-size: 0.8rem;">Details</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // ==========================================
        // REALTIME LIVE SAMENVATTING BEREKENEN
        // ==========================================
        const aantalRitten = afgerondeRitten.length;
        const gemiddelde = totaleInkomsten / aantalRitten;

        setStatText("statTotaalRitten", aantalRitten);
        setStatText("statTotaalVerdiend", `SRD ${totaleInkomsten.toFixed(2)}`);
        setStatText("statGemiddeldePrijs", `SRD ${gemiddelde.toFixed(2)}`);

    } catch (err) {
        console.error("❌ Fout bij laden geschiedenis:", err);
        tbody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center;">Kon geschiedenis niet live laden.</td></tr>`;
    }
}

function toonLegeGeschiedenis() {
    const tbody = document.getElementById("geschiedenisTbody");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" style="color: #888; text-align: center; padding: 20px;">Je hebt nog geen ritten afgerond.</td></tr>`;
    }
    setStatText("statTotaalRitten", "0");
    setStatText("statTotaalVerdiend", "SRD 0.00");
    setStatText("statGemiddeldePrijs", "SRD 0.00");
}

// Start het script direct zodra de pagina geladen is
document.addEventListener("DOMContentLoaded", laadRitgeschiedenisLive);