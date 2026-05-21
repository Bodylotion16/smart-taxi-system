/* =========================
   URL PARAMETERS
========================= */

const urlParams = new URLSearchParams(
    window.location.search
);

const bookingId =
    urlParams.get('booking_id');

const amount =
    urlParams.get('amount');

const method =
    urlParams.get('method');

/* =========================
   UI INVULLEN
========================= */

document.getElementById('amountDisplay')
    .innerText = amount || '0.00';

document.getElementById('bookingIdDisplay')
    .innerText = '#' + (bookingId || '0');

document.getElementById('methodDisplay')
    .innerText = method || 'onbekend';

document.getElementById('dateDisplay')
    .innerText = new Date().toLocaleDateString();

/* =========================
   BETALING VERWERKEN
========================= */

async function verwerkBetaling() {

    const btn =
        document.getElementById('payButton');

    btn.innerText = 'VERWERKEN...';

    btn.disabled = true;

    const paymentData = {

        booking_id_FK: bookingId,

        amount: amount,

        payment_method: method,

        payment_status: 'completed'

    };

    try {

        const response = await fetch(
            '/api/payment-confirm',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(paymentData)
            }
        );

        const result = await response.json();

        if (result.success) {

            btn.style.display = 'none';

            document.getElementById(
                'successMessage'
            ).style.display = 'block';

            const badge =
                document.querySelector('.status-badge');

            badge.innerText = 'Betaald';

            badge.style.background = '#2ecc71';

            setTimeout(() => {

                window.location.href =
                    '../portals/klant.html';

            }, 2000);

        } else {

            alert(
                'Fout: ' + result.message
            );

            btn.disabled = false;

            btn.innerText =
                'Bevestig Betaling';

        }

    } catch (err) {

        alert(
            'Er is een verbindingsfout opgetreden.'
        );

        btn.disabled = false;

        btn.innerText =
            'Bevestig Betaling';

    }

}