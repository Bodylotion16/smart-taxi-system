let isOnline = true;

/* =========================
   STATUS TOGGLE
========================= */

function toggleStatus() {

    const btn = document.getElementById('statusBtn');

    const label = document.getElementById('statusLabel');

    const pulse = document.querySelector('.pulse');

    const liveLabel = document.getElementById('liveLabel');

    const requests = document.getElementById('rideRequests');

    if (isOnline) {

        isOnline = false;

        btn.innerText = 'Ga Online';

        btn.style.background = '#555';

        btn.style.color = '#fff';

        label.innerText = 'Je bent momenteel offline';

        pulse.style.background = '#e74c3c';

        pulse.style.boxShadow = '0 0 10px #e74c3c';

        liveLabel.style.color = '#e74c3c';

        liveLabel.innerText = 'OFFLINE';

        requests.innerHTML = `
            <p class="empty-message">
                Ga online om ritten te ontvangen.
            </p>
        `;

    } else {

        isOnline = true;

        btn.innerText = 'Ga Offline';

        btn.style.background = '#f1c40f';

        btn.style.color = '#000';

        label.innerText = 'Je bent momenteel beschikbaar';

        pulse.style.background = '#2ecc71';

        pulse.style.boxShadow = '0 0 10px #2ecc71';

        liveLabel.style.color = '#2ecc71';

        liveLabel.innerText = 'LIVE';

        laadRitten();

    }

}

/* =========================
   LOAD RIDES
========================= */

async function laadRitten() {

    if (!isOnline) return;

    try {

        const response = await fetch('/api/available-bookings');

        const result = await response.json();

        const container = document.getElementById('rideRequests');

        if (result.success && result.bookings.length > 0) {

            container.innerHTML = '';

            result.bookings.forEach(rit => {

                const ritElement = document.createElement('div');

                ritElement.className = 'ride-request';

                ritElement.innerHTML = `
                    <div class="ride-top">

                        <div>

                            <p class="location-label">
                                OPHAAL LOCATIE
                            </p>

                            <p class="location-text">
                                ${rit.pickup_location}
                            </p>

                            <p class="location-label">
                                BESTEMMING
                            </p>

                            <p class="location-text">
                                ${rit.destination}
                                (${rit.distance_km} km)
                            </p>

                        </div>

                        <div class="price-area">

                            <p class="location-label">
                                TARIEF
                            </p>

                            <p class="price-tag">
                                SRD ${rit.fare}
                            </p>

                        </div>

                    </div>

                    <div class="ride-actions">

                        <button
                            class="btn-accept"
                            onclick="acceptRide(this, ${rit.id})"
                        >
                            Accepteer Rit
                        </button>

                        <button
                            class="btn-decline"
                            onclick="this.parentElement.parentElement.remove()"
                        >
                            Weiger
                        </button>

                    </div>
                `;

                container.appendChild(ritElement);

            });

        } else {

            container.innerHTML = `
                <p class="empty-message">
                    Er zijn momenteel geen ritten beschikbaar.
                </p>
            `;

        }

    } catch (err) {

        console.error('Fout bij ophalen ritten:', err);

    }

}

/* =========================
   ACCEPT RIDE
========================= */

function acceptRide(btn, ritId) {

    btn.innerText = 'BEZIG MET RIT...';

    btn.style.background = '#2ecc71';

    btn.style.color = '#fff';

    btn.disabled = true;

    if (btn.nextElementSibling) {

        btn.nextElementSibling.style.display = 'none';

    }

    alert(
        'Je hebt rit #' +
        ritId +
        ' succesvol geaccepteerd!'
    );

}

/* =========================
   INIT
========================= */

laadRitten();

setInterval(laadRitten, 5000);