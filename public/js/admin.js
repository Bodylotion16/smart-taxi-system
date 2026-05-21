let adminData = {};

/* =========================
   DATA OPHALEN
========================= */

async function fetchAdminData() {

    try {

        const response = await fetch('/api/admin/dashboard');

        const result = await response.json();

        const content = document.getElementById('main-content');

        if (result.success) {

            adminData = result;

            const activeMenu = document.querySelector('.menu-item.active');

            if (activeMenu) {

                const tabName = activeMenu.innerText
                    .replace(/[^\w\s]/gi, '')
                    .trim()
                    .toLowerCase();

                renderTab(tabName);

            }

        } else {

            content.innerHTML = `
                <h2 class="error-title">❌ Database Fout</h2>

                <pre class="error-box">${result.message}</pre>
            `;

        }

    } catch (err) {

        console.error('Fout bij laden admin gegevens:', err);

        document.getElementById('main-content').innerHTML = `
            <h2 class="error-title">❌ Verbindingsfout</h2>

            <p>
                Kan geen verbinding maken met de Node.js server.
            </p>

            <p>
                Zorg dat <strong>node server.js</strong> draait.
            </p>
        `;

    }

}

/* =========================
   TAB SWITCHING
========================= */

function switchTab(tabName, element) {

    document.querySelectorAll('.menu-item')
        .forEach(item => item.classList.remove('active'));

    element.classList.add('active');

    renderTab(tabName);

}

/* =========================
   TAB RENDERING
========================= */

function renderTab(tab) {

    const content = document.getElementById('main-content');

    if (!adminData.stats) {

        content.innerHTML = '<h2>Gegevens worden geladen...</h2>';

        return;

    }

    if (tab === 'dashboard') {

        renderDashboard(content);

    } else if (tab === 'chauffeurs' || tab === 'taxi chauffeurs') {

        renderChauffeurs(content);

    } else if (tab === 'klanten') {

        renderKlanten(content);

    } else if (tab === 'live-ritten' || tab === 'live ritten') {

        renderLiveRitten(content);

    } else if (tab === 'financien' || tab === 'financiën') {

        renderFinancien(content);

    }

}

/* =========================
   DASHBOARD
========================= */

function renderDashboard(content) {

    const rittenCount = adminData.stats.totaal_ritten || 0;

    const omzetSum = adminData.stats.totale_omzet
        ? parseFloat(adminData.stats.totale_omzet).toFixed(2)
        : '0.00';

    const chauffeursCount = adminData.chauffeurs
        ? adminData.chauffeurs.length
        : 0;

    content.innerHTML = `
        <h1>📟 Systeem Overzicht</h1>

        <div class="stats-grid">

            <div class="stat-card">
                <h3>Voltooide Ritten</h3>
                <p>${rittenCount}</p>
            </div>

            <div class="stat-card">
                <h3>Totale Omzet</h3>
                <p>SRD ${omzetSum}</p>
            </div>

            <div class="stat-card">
                <h3>Chauffeurs</h3>
                <p>${chauffeursCount}</p>
            </div>

        </div>

        <h3>
            Actieve ritten of wachtende klanten (Top 5):
        </h3>

        ${renderRittenTabel(adminData.liveRitten.slice(0, 5))}
    `;

}

/* =========================
   CHAUFFEURS
========================= */

function renderChauffeurs(content) {

    let rows = adminData.chauffeurs.map(c => `
        <tr>

            <td>ID #${c.id}</td>

            <td>${c.first_name} ${c.last_name}</td>

            <td>${c.phone_number || 'Geen'}</td>

            <td>
                <strong style="color: #f1c40f;">
                    ${c.kenteken || 'Onbekend'}
                </strong>
            </td>

            <td>${c.auto_model || 'Onbekend'}</td>

        </tr>
    `).join('');

    content.innerHTML = `
        <h1>🚕 Geregistreerde Chauffeurs</h1>

        <table class="admin-table">

            <thead>
                <tr>
                    <th>ID</th>
                    <th>Naam</th>
                    <th>Telefoon</th>
                    <th>Kenteken</th>
                    <th>Auto Model</th>
                </tr>
            </thead>

            <tbody>
                ${rows || '<tr><td colspan="5">Geen chauffeurs gevonden.</td></tr>'}
            </tbody>

        </table>
    `;

}

/* overige render functies blijven hetzelfde */
fetchAdminData();

setInterval(fetchAdminData, 5000);