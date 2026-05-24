// BESTAND: public/js/klant/payments.js

const urlParams = new URLSearchParams(window.location.search);
const bookingId = urlParams.get('booking_id');
const amount = urlParams.get('amount');
const method = urlParams.get('method');

// UI Elementen direct live invullen bij het laden
document.getElementById('amountDisplay').innerText = amount ? parseFloat(amount).toFixed(2) : '0.00';
document.getElementById('bookingIdDisplay').innerText = '#' + (bookingId || '0');
document.getElementById('methodDisplay').innerText = method || 'contant';
document.getElementById('dateDisplay').innerText = new Date().toLocaleDateString('nl-SR');

async function verwerkBetaling() {
    const btn = document.getElementById('payButton');
    const successMsg = document.getElementById('successMessage');
    const badge = document.querySelector('.status-badge');

    btn.innerText = 'VERWERKEN...';
    btn.disabled = true;

    const paymentData = {
        booking_id_FK: bookingId,
        amount: amount,
        payment_method: method,
        payment_status: 'completed'
    };

    try {
        // We sturen de betalingsbevestiging naar de server
        const response = await fetch('/api/payment-confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        if (result.success) {
            btn.style.display = 'none';
            successMsg.style.display = 'block';

            badge.innerText = 'Betaald';
            badge.style.background = 'rgba(46, 204, 113, 0.15)';
            badge.style.color = '#2ecc71';
            badge.style.borderColor = '#2ecc71';

            // Stuur de gebruiker na 2 seconden door naar het overzichtsdashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } else {
            alert('❌ Fout bij verwerken betaling: ' + result.message);
            btn.disabled = false;
            btn.innerText = 'Bevestig Betaling';
        }
    } catch (err) {
        console.error("Betalingsfout:", err);
        alert('Er is een verbindingsfout opgetreden tijdens de transactie.');
        btn.disabled = false;
        btn.innerText = 'Bevestig Betaling';
    }
}