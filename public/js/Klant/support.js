// ==========================================================================
// BESTAND: public/js/klant/support.js
// FUNCTIONALITEIT: LIVE TICKETS INLADEN EN EN SUPPORTVRAGEN VERZENDEN
// ==========================================================================

const LOGGED_IN_USER_ID = localStorage.getItem('userId') || 1; // Fallback Anisha

document.addEventListener("DOMContentLoaded", () => {
    laadMijnTickets();
    initLogout();

    const supportForm = document.getElementById('supportForm');
    if (supportForm) {
        supportForm.addEventListener('submit', handelSupportInzending);
    }
});

// ==========================================
// 1. HAAL BESTAANDE TICKETS REALTIME OP
// ==========================================
async function laadMijnTickets() {
    const container = document.getElementById('ticketsContainer');
    if (!container) return;

    try {
        console.log("🔄 Support tickets opvragen bij backend...");
        const response = await fetch(`/api/support/tickets/${LOGGED_IN_USER_ID}`);
        const data = await response.json();

        if (data.success && data.tickets.length > 0) {
            container.innerHTML = ''; // Wis de laad-tekst

            data.tickets.forEach(ticket => {
                // Bepaal de badge-class op basis van de status
                let statusClass = 'status-open';
                if (ticket.status === 'In behandeling') statusClass = 'status-pending';
                if (ticket.status === 'Gesloten') statusClass = 'status-closed';

                const ticketCard = document.createElement('div');
                ticketCard.className = 'ticket-card';
                ticketCard.innerHTML = `
                    <div class="ticket-header">
                        <span class="ticket-id">#TK-${ticket.ticket_id}</span>
                        <span class="ticket-status ${statusClass}">${ticket.status}</span>
                    </div>
                    <h4>${ticket.onderwerp}</h4>
                    <p class="ticket-desc">${ticket.beschrijving}</p>
                    <span class="ticket-date">${ticket.datum}</span>
                `;
                container.appendChild(ticketCard);
            });
        } else {
            container.innerHTML = '<p class="no-data">Je hebt momenteel geen actieve support meldingen.</p>';
        }
    } catch (error) {
        console.error("❌ Fout bij laden van tickets:", error);
        container.innerHTML = '<p class="error-text">Fout bij laden van meldingen.</p>';
    }
}

// ==========================================
// 2. SUPPORT MELDING VERZENDEN (POST)
// ==========================================
async function handelSupportInzending(e) {
    e.preventDefault();

    const onderwerp = document.getElementById('supportSubject').value.trim();
    const categorie = document.getElementById('supportCategory').value;
    const beschrijving = document.getElementById('supportMessage').value.trim();

    try {
        console.log("🚀 Ticket versturen naar server...");
        const response = await fetch('/api/support/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: LOGGED_IN_USER_ID,
                onderwerp: onderwerp,
                categorie: categorie,
                beschrijving: beschrijving
            })
        });

        const result = await response.json();
        if (result.success) {
            alert("🎉 Je support-bericht is succesvol verzonden! We nemen zo snel mogelijk contact op.");
            document.getElementById('supportForm').reset();
            laadMijnTickets(); // Ververs direct de lijst aan de rechterkant!
        } else {
            alert("❌ Kon bericht niet verzenden: " + result.message);
        }
    } catch (error) {
        console.error("❌ Fout bij verzenden ticket:", error);
        alert("Netwerkfout bij het indienen van je support-vraag.");
    }
}

function initLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    logoutBtn?.addEventListener("click", () => localStorage.removeItem('userId'));
}