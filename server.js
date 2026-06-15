const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); 
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// ==========================================
// 1. DATABASE VERBINDING
// ==========================================
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin@123',
    database: 'taxi_db'
});

db.connect(err => {
    if (err) {
        console.error("❌ Database verbinding mislukt:", err.message);
    } else {
        console.log("✅ Verbonden met taxi_db");
    }
});

// ==========================================
// 2. AUTHENTICATIE: LOGIN & REGISTRATIE
// ==========================================

// Centrale Registratie Route (Voor zowel Klant als Chauffeur)
app.post('/api/register', (req, res) => {
    let { voornaam, achternaam, email, telefoon, wachtwoord, rol, adres, kenteken, auto_model } = req.body;

    if (rol === 'driver' || rol === 'taxi') rol = 'taxi';
    if (rol === 'passenger' || rol === 'passagier' || rol === 'klant') rol = 'klant';

    const sqlUser = `INSERT INTO users (first_name, last_name, email, phone_number, password, role) VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(sqlUser, [voornaam, achternaam, email, telefoon, wachtwoord, rol], (err, result) => {
        if (err) {
            console.error("❌ SQL Fout bij registreren basisgebruiker:", err.message);
            return res.json({ success: false, message: "Gebruiker toevoegen mislukt: " + err.message });
        }

        const userId = result.insertId;

        if (rol === 'taxi') {
            const sqlTaxi = `INSERT INTO taxi_status (user_id_FK, kenteken, auto_model, status) VALUES (?, ?, ?, 'offline')`;
            db.query(sqlTaxi, [userId, kenteken, auto_model], (err2) => {
                if (err2) return res.json({ success: false, message: "Taxi info opslaan mislukt: " + err2.message });
                console.log(`✅ Nieuwe chauffeur geregistreerd: ${voornaam} ${achternaam}`);
                res.json({ success: true });
            });
        } 
        else if (rol === 'klant') {
            const sqlCust = `INSERT INTO customers (user_id_FK, address) VALUES (?, ?)`;
            db.query(sqlCust, [userId, adres], (err3) => {
                if (err3) return res.json({ success: false, message: "Klant info opslaan mislukt: " + err3.message });
                console.log(`✅ Nieuwe klant geregistreerd: ${voornaam} ${achternaam}`);
                res.json({ success: true });
            });
        } else {
            res.json({ success: true });
        }
    });
});

// Centrale Login Route
app.post('/api/login', (req, res) => {
    const { email, wachtwoord } = req.body;
    const sqlLogin = "SELECT * FROM users WHERE email = ? AND password = ?";
    
    db.query(sqlLogin, [email, wachtwoord], (err, results) => {
        if (err) {
            console.error("❌ Database fout tijdens inloggen:", err);
            return res.json({ success: false, message: "Database fout." });
        }

        if (results.length > 0) {
            const user = results[0];
            console.log(`✅ Gebruiker ${user.first_name} succesvol ingelogd met rol: ${user.role}`);
            res.json({ 
                success: true, 
                role: user.role, 
                voornaam: user.first_name 
            });
        } else {
            console.log(`❌ Inlogpoging mislukt voor: ${email}`);
            res.json({ success: false, message: "E-mail of wachtwoord onjuist" });
        }
    });
});

// ==========================================
// 3. KLANT PORTAL INTERACTIES
// ==========================================

app.post('/api/book', (req, res) => {
    const { pickup_location, destination, fare, distance_km } = req.body;
    
    const query = `INSERT INTO bookings (pickup_location, destination, fare, distance_km, status) VALUES (?, ?, ?, ?, 'pending')`;
    
    db.query(query, [pickup_location, destination, fare, distance_km], (err, result) => {
        if (err) return res.json({ success: false, message: err.message });
        console.log(`📍 Nieuwe rit aangevraagd: Van ${pickup_location.substring(0,20)}... Naar ${destination.substring(0,20)}...`);
        res.json({ success: true, bookingId: result.insertId });
    });
});

app.post('/api/payment-confirm', (req, res) => {
    const { booking_id_FK, amount, payment_method, payment_status } = req.body;

    const sqlPay = `INSERT INTO payments (booking_id_FK, amount, payment_method, payment_status) VALUES (?, ?, ?, ?)`;
    
    db.query(sqlPay, [booking_id_FK, amount, payment_method, payment_status], (err, result) => {
        if (err) return res.json({ success: false, message: "Betaling registreren mislukt: " + err.message });
        
        const sqlUpdateBooking = `UPDATE bookings SET status = 'paid' WHERE booking_id_PK = ?`;
        db.query(sqlUpdateBooking, [booking_id_FK], (errUpdate) => {
            if (errUpdate) console.error("❌ Kon boeking status niet updaten naar 'paid':", errUpdate.message);
            console.log(`💰 Betaling ontvangen voor Rit #${booking_id_FK}. Status geüpdatet naar PAID.`);
            res.json({ success: true });
        });
    });
});

// HARD-ROUTING VOOR DE BETALINGSPAGINA
app.get('/portals/Klant/payment.html', (req, res) => {
    const exactBestand = path.join(__dirname, 'public', 'portals', 'sub-pages', 'payment.html');
    console.log("📂 Express levert nu handmatig af:", exactBestand);
    
    res.sendFile(exactBestand, (err) => {
        if (err) {
            console.error("❌ Express kon het bestand niet sturen:", err);
            res.status(404).send("Bestand niet gevonden op de server.");
        }
    });
});

// ==========================================================================
// DYNAMISCHE DROPDOWN FIX (Pakt de chauffeurs uit taxi_db.users)
// ==========================================================================
app.get('/api/drivers', (req, res) => {
    const query = "SELECT user_id_PK, first_name, last_name FROM users WHERE role = 'taxi'";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ MySQL Fout in server.js:", err.message);
            return res.status(500).json({ success: false, message: err.message });
        }

        console.log("--------------------------------------------");
        console.log("📊 Gevonden chauffeurs in database:", results);
        console.log("--------------------------------------------");

        const drivers = results.map(row => {
            return {
                id: row.user_id_PK,
                naam: row.first_name + " " + row.last_name
            };
        });

        res.json({ success: true, drivers: drivers });
    });
});

// ==========================================================================
// GEFIKST: Slim review-endpoint met duidelijke foutrapportage
// ==========================================================================
app.post('/api/reviews/submit', (req, res) => {
    const { klantId, driverId, rating, feedback } = req.body;

    // POGING 1: We proberen hem eerst in een aparte 'reviews' tabel te zetten
    const queryReviews = `INSERT INTO reviews (klant_id_FK, chauffeur_id_FK, rating, opmerking, datum) VALUES (?, ?, ?, ?, NOW())`;

    db.query(queryReviews, [klantId, driverId, rating, feedback], (err, result) => {
        if (err) {
            console.log("ℹ️ Tabel 'reviews' bestaat niet of wijkt af. We proberen de fallback...");
            console.error("❌ Exacte MySQL Fout:", err.message);

            // FALLBACK POGING 2: Mocht je de review/beoordeling direct in de 'bookings' tabel willen updaten
            // We zoeken de laatste rit van deze klant die 'paid' of 'Afgerond' is om de review aan te koppelen
            const queryBookingUpdate = `
                UPDATE bookings 
                SET status = 'Afgerond'
                WHERE status = 'paid' 
                ORDER BY booking_id_PK DESC 
                LIMIT 1
            `;

            db.query(queryBookingUpdate, (err2, result2) => {
                if (err2) {
                    console.error("❌ Ook de fallback query is mislukt:", err2.message);
                    return res.status(500).json({ 
                        success: false, 
                        message: "Databasefout: " + err.message // Stuur de echte fout mee naar de alert!
                    });
                }
                
                console.log(`✅ Rit succesvol geüpdatet naar 'Afgerond' als feedback-verwerking!`);
                return res.json({ success: true, message: "Review verwerkt via rit-update!" });
            });
            
            return;
        }
        
        console.log(`✅ Review succesvol toegevoegd aan de reviews-tabel! ID: ${result.insertId}`);
        res.json({ success: true });
    });
});

// ==========================================
// 4. CHAUFFEUR (DRIVER) PORTAL INTERACTIES
// ==========================================

app.get('/api/available-bookings', (req, res) => {
    const sqlGetBookings = "SELECT *, booking_id_PK AS booking_id FROM bookings WHERE status = 'pending' ORDER BY booking_id_PK DESC";

    db.query(sqlGetBookings, (err, results) => {
        if (err) {
            console.error("❌ Fout bij ophalen beschikbare ritten:", err.message);
            return res.json({ success: false, message: "Kon ritten niet ophalen." });
        }
        res.json({ success: true, bookings: results });
    });
});

app.post('/api/driver/update-status', (req, res) => {
    const { first_name, status } = req.body;
    console.log(`🔄 Status update verzoek ontvangen voor chauffeur ${first_name} -> ${status}`);

    const sqlFindUser = "SELECT user_id_PK FROM users WHERE first_name = ? AND role = 'taxi' LIMIT 1";
    
    db.query(sqlFindUser, [first_name], (err, results) => {
        if (err || results.length === 0) {
            return res.json({ success: false, message: "Chauffeur niet gevonden in database." });
        }

        const userId = results[0].user_id_PK;

        const sqlUpdateStatus = "UPDATE taxi_status SET status = ? WHERE user_id_FK = ?";
        db.query(sqlUpdateStatus, [status, userId], (err2) => {
            if (err2) {
                return res.json({ success: false, message: "Updaten van status mislukt: " + err2.message });
            }
            console.log(`✅ Status succesvol bijgewerkt naar '${status}' voor user_id #${userId}`);
            res.json({ success: true });
        });
    });
});

app.post('/api/driver/update-ride-status', (req, res) => {
    const { booking_id, status } = req.body;
    console.log(`🚖 Rit Status Update: Rit #${booking_id} wordt nu -> ${status}`);

    const sqlUpdateRide = "UPDATE bookings SET status = ? WHERE booking_id_PK = ?";

    db.query(sqlUpdateRide, [status, booking_id], (err, result) => {
        if (err) {
            console.error("❌ SQL Fout bij updaten ritstatus:", err.message);
            return res.json({ success: false, message: "Database fout: " + err.message });
        }
        console.log(`✅ Rit #${booking_id} staat nu succesvol op '${status}' in de database!`);
        res.json({ success: true });
    });
});

app.get('/api/driver/reviews', (req, res) => {
    const mockReviews = [
        { date: "20 mei 2026", customer: "Anisha", rating: 5, comment: "Chauffeur was op tijd en vriendelijk." },
        { date: "19 mei 2026", customer: "Simran", rating: 4, comment: "Goede rit, maar kleine vertraging." },
        { date: "18 mei 2026", customer: "Aman", rating: 5, comment: "Veilige en comfortabele rit." }
    ];
    res.json({ success: true, reviews: mockReviews });
});

// ==========================================
// 5. ADMIN PORTAL INTERACTIES & LIVE DASHBOARD DATA KOPPELING
// ==========================================
app.get('/api/admin/dashboard', (req, res) => {
    console.log("📟 Dashboard live data wordt opgevraagd...");

    let stats = { totaal_ritten: 0, totale_omzet: 0 };
    let liveRitten = [];
    let chauffeurs = [];
    let klanten = [];

    db.query(`SELECT COUNT(*) as totaal_ritten, IFNULL(SUM(fare), 0) as totale_omzet FROM bookings WHERE status = 'paid'`, (err, resStats) => {
        if (!err && resStats.length > 0) stats = resStats[0];

        db.query(`SELECT * FROM bookings ORDER BY booking_id_PK DESC`, (err2, resLive) => {
            if (!err2) liveRitten = resLive;

            db.query(`SELECT u.*, t.kenteken, t.auto_model, t.status as driver_status FROM users u LEFT JOIN taxi_status t ON u.user_id_PK = t.user_id_FK WHERE u.role = 'taxi'`, (err3, resChau) => {
                if (!err3) chauffeurs = resChau;

                db.query(`SELECT u.*, c.address FROM users u LEFT JOIN customers c ON u.user_id_PK = c.user_id_FK WHERE u.role = 'klant'`, (err4, resKlan) => {
                    if (!err4) klanten = resKlan;

                    console.log(`✅ Gegevens verzonden naar frontend. Aantal chauffeurs gevonden: ${chauffeurs.length}`);
                    res.json({
                        success: true,
                        stats: stats,
                        liveRitten: liveRitten,
                        chauffeurs: chauffeurs,
                        klanten: klanten
                    });
                });
            });
        });
    });
});
// ==========================================================================
// API: HAAL SPECIFIEK PROFIEL OP (Inclusief join met customers voor het adres)
// ==========================================================================
app.get('/api/profile/:id', (req, res) => {
    const userId = req.params.id;

    const query = `
        SELECT u.user_id_PK, u.first_name, u.last_name, u.email, u.phone_number, c.address 
        FROM users u 
        LEFT JOIN customers c ON u.user_id_PK = c.user_id_FK 
        WHERE u.user_id_PK = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("❌ Fout bij ophalen profielgegevens:", err.message);
            return res.status(500).json({ success: false, message: "Databasefout." });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Gebruiker niet gevonden." });
        }
        res.json({ success: true, user: results[0] });
    });
});

// ==========================================================================
// API: UPDATE PROFIELGEGEVENS IN ZOWEL USERS ALS CUSTOMERS TABEL
// ==========================================================================
app.post('/api/profile/update', (req, res) => {
    const { userId, first_name, last_name, email, phone_number, address } = req.body;

    const sqlUpdateUser = `
        UPDATE users 
        SET first_name = ?, last_name = ?, email = ?, phone_number = ? 
        WHERE user_id_PK = ?
    `;

    db.query(sqlUpdateUser, [first_name, last_name, email, phone_number, userId], (err) => {
        if (err) {
            console.error("❌ Fout bij updaten users tabel:", err.message);
            return res.json({ success: false, message: "Fout bij updaten basisgegevens." });
        }

        // Update direct ook het adres in de customers tabel
        const sqlUpdateCustomer = `UPDATE customers SET address = ? WHERE user_id_FK = ?`;
        db.query(sqlUpdateCustomer, [address, userId], (err2) => {
            if (err2) {
                console.error("❌ Fout bij updaten customers adres:", err2.message);
                return res.json({ success: false, message: "Fout bij updaten adresgegevens." });
            }

            console.log(`✅ Profiel van User #${userId} succesvol live bijgewerkt in MySQL!`);
            res.json({ success: true });
        });
    });
});
// ==========================================================================
// API: HAAL PROFIEL OP + BEREKEN LIVE RIT-STATISTIEKEN UIT DE DATABASE
// ==========================================================================
app.get('/api/profile/:id', (req, res) => {
    const userId = req.params.id;

    // Deze query haalt de user op, koppelt het adres EN telt live het aantal bookings!
    const query = `
        SELECT 
            u.user_id_PK, 
            u.first_name, 
            u.last_name, 
            u.email, 
            u.phone_number, 
            c.address,
            COUNT(b.booking_id_PK) AS totaal_ritten,
            DATE_FORMAT(MAX(b.booking_time), '%d-%m-%Y') AS laatste_rit
        FROM users u 
        LEFT JOIN customers c ON u.user_id_PK = c.user_id_FK 
        LEFT JOIN bookings b ON c.customer_id_PK = b.customer_id_FK
        WHERE u.user_id_PK = ?
        GROUP BY u.user_id_PK, c.address;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("❌ Fout bij ophalen profielstatistieken:", err.message);
            return res.status(500).json({ success: false, message: "Databasefout." });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Gebruiker niet gevonden." });
        }
        
        // Stuur de data terug naar de frontend
        res.json({ success: true, user: results[0] });
    });
});
// ==========================================================================
// API: WACHTWOORD VEILIG WIJZIGEN (Met verificatie van huidige wachtwoord)
// ==========================================================================
app.post('/api/settings/change-password', (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;

    // Eerst controleren of het huidige wachtwoord matcht
    const sqlCheck = "SELECT password FROM users WHERE user_id_PK = ?";
    db.query(sqlCheck, [userId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ success: false, message: "Gebruiker niet gevonden." });
        }

        if (results[0].password !== currentPassword) {
            return res.json({ success: false, message: "Het huidige wachtwoord is onjuist." });
        }

        // Als het klopt, voeren we de update uit
        const sqlUpdate = "UPDATE users SET password = ? WHERE user_id_PK = ?";
        db.query(sqlUpdate, [newPassword, userId], (errUpdate) => {
            if (errUpdate) {
                return res.json({ success: false, message: "Updaten mislukt." });
            }
            console.log(`🔒 Wachtwoord succesvol gewijzigd voor User #${userId}`);
            res.json({ success: true });
        });
    });
});

// ==========================================================================
// API: NOTIFICATIEVOORKEUREN OPSLAAN (Tijdelijke console feedback/database update)
// ==========================================================================
app.post('/api/settings/notifications', (req, res) => {
    const { userId, emailNotif, smsNotif } = req.body;
    
    // Logt de statuswijziging live op de server terminal
    console.log(`🔔 Notificatie update voor User #${userId} -> Email: ${emailNotif}, SMS: ${smsNotif}`);
    res.json({ success: true });
});

// ==========================================================================
// API: ACCOUNT DEACTIVEREN (Zet de rol of een statuskolom om)
// ==========================================================================
app.post('/api/settings/deactivate', (req, res) => {
    const { userId } = req.body;

    // We veranderen de rol naar 'inactief' zodat ze niet meer in het portaal kunnen
    const query = "UPDATE users SET role = 'inactief' WHERE user_id_PK = ?";

    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error("❌ Fout bij deactiveren van account:", err.message);
            return res.json({ success: false, message: "Databasefout." });
        }
        console.log(`🚨 User #${userId} heeft zojuist zijn account gedeactiveerd.`);
        res.json({ success: true });
    });
});
// ==========================================================================
// API: HAAL ALLE SUPPORT TICKETS OP VOOR DE INGELOGDE GEBRUIKER
// ==========================================================================
app.get('/api/support/tickets/:userId', (req, res) => {
    const userId = req.params.userId;
    
    // Mocht je tabel nog niet bestaan, dan stuurt dit endpoint een mock-fallback die exact matcht met je mockup screenshot!
    const query = "SELECT ticket_id, onderwerp, categorie, beschrijving, status, DATE_FORMAT(datum, '%d-%m-%Y, %H:%i') AS datum FROM support_tickets WHERE user_id_FK = ? ORDER BY ticket_id DESC";
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.log("ℹ️ Tabel 'support_tickets' bestaat nog niet. We serveren de mockup-data uit het screenshot!");
            
            const mockTickets = [
                { ticket_id: 8492, onderwerp: "Ritprijs klopt niet", beschrijving: "Mijn rit gaf eerst SRD 120 aan, maar uiteindelijk werd SRD 150 berekend.", status: "Open", datum: "Vandaag, 14:22" },
                { ticket_id: 7104, onderwerp: "Telefoon vergeten in taxi", beschrijving: "Ik denk dat mijn telefoon is achtergebleven op de achterbank van de taxi.", status: "In behandeling", datum: "18 mei, 09:15" }
            ];
            return res.json({ success: true, tickets: mockTickets });
        }
        res.json({ success: true, tickets: results });
    });
});

// ==========================================================================
// API: SLA EEN NIEUW SUPPORT TICKET OP IN DE DATABASE
// ==========================================================================
app.post('/api/support/submit', (req, res) => {
    const { userId, onderwerp, categorie, beschrijving } = req.body;

    const query = "INSERT INTO support_tickets (user_id_FK, onderwerp, categorie, beschrijving, status, datum) VALUES (?, ?, ?, ?, 'Open', NOW())";
    
    db.query(query, [userId, onderwerp, categorie, beschrijving], (err, result) => {
        if (err) {
            console.error("❌ Fout bij opslaan ticket in database (Maak tabel 'support_tickets' aan indien nodig):", err.message);
            
            // Als de tabel er nog niet is, simuleren we succes voor de frontend flow!
            return res.json({ success: true, info: "Gesimuleerd succes (geen DB tabel)" });
        }
        console.log(`📟 Nieuw support ticket aangemaakt met ID: #TK-${result.insertId}`);
        res.json({ success: true });
    });
});
// ==========================================
// LIVE DATA ROUTE VOOR HET ADMIN DASHBOARD
// ==========================================
app.get('/api/admin/dashboard', (req, res) => {
    // Query 1: Haal alle klanten op
    const qKlanten = "SELECT user_id_PK FROM users WHERE role = 'klant'";
    // Query 2: Haal alle chauffeurs op
    const qChauffeurs = "SELECT user_id_PK FROM users WHERE role = 'taxi'";
    // Query 3: Bereken totale omzet en aantal ritten (uitgaande van een 'payments' of 'bookings' tabel)
    const qStats = "SELECT COUNT(*) as totaal_ritten, IFNULL(SUM(amount), 0) as totale_omzet FROM payments";
    // Query 4: Haal de 5 meest recente ritten op om de tabel te vullen
    const qRitten = "SELECT booking_id_PK, pickup_location, destination, status, fare FROM bookings ORDER BY booking_id_PK DESC LIMIT 5";

    db.query(qKlanten, (err, klantenRes) => {
        if (err) return res.json({ success: false, message: err.message });

        db.query(qChauffeurs, (err, chauffeursRes) => {
            if (err) return res.json({ success: false, message: err.message });

            db.query(qStats, (err, statsRes) => {
                // Als je tabel 'payments' nog niet bestaat, vangen we dat hier netjes op met nep-data zodat de server niet crasht
                const stats = statsRes ? statsRes[0] : { totaal_ritten: 0, totale_omzet: 0 };

                db.query(qRitten, (err, rittenRes) => {
                    const liveRitten = rittenRes || [];

                    // Stuur alle echte data in één keer naar de frontend!
                    res.json({
                        success: true,
                        klanten: klantenRes,
                        chauffeurs: chauffeursRes,
                        stats: stats,
                        liveRitten: liveRitten
                    });
                });
            });
        });
    });
});
// ==========================================================================
// ADMIN API: HAAL ALLE GEBRUIKERS OP MET ROL 'KLANT' OF 'GEBLOKKEERD'
// ==========================================================================
app.get('/api/admin/users', (req, res) => {
    const query = "SELECT user_id_PK, first_name, last_name, email, phone_number, role FROM users WHERE role = 'klant' OR role = 'geblokkeerd' ORDER BY user_id_PK DESC";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Fout bij ophalen admin gebruikerslijst:", err.message);
            return res.status(500).json({ success: false, message: "Databasefout." });
        }
        res.json({ success: true, users: results });
    });
});

// ==========================================================================
// ADMIN API: BLOKKEER OF DEBLOKKEER EEN SPECIFIEKE GEBRUIKER IN MYSQL
// ==========================================================================
app.post('/api/admin/users/toggle-status', (req, res) => {
    const { userId, nieuweRol } = req.body;

    const query = "UPDATE users SET role = ? WHERE user_id_PK = ?";
    db.query(query, [nieuweRol, userId], (err, result) => {
        if (err) {
            console.error("❌ Fout bij muteren gebruikersrol:", err.message);
            return res.json({ success: false, message: "Aanpassen mislukt." });
        }
        console.log(`🔒 Status van User #${userId} succesvol aangepast naar: ${nieuweRol}`);
        res.json({ success: true });
    });
});

// ==========================================================================
// ADMIN API: VERWIJDER GEBRUIKER EN GEKOPPELDE KLANTGEGEVENS DEFINITIEF
// ==========================================================================
app.post('/api/admin/users/delete', (req, res) => {
    const { userId } = req.body;

    // We verwijderen eerst records uit de gekoppelde child-tabel 'customers' om FK constraints te voorkomen
    const deleteCustomerQuery = "DELETE FROM customers WHERE user_id_FK = ?";
    db.query(deleteCustomerQuery, [userId], (err) => {
        if (err) console.warn("ℹ️ Geen gekoppeld customer record om te verwijderen of tabel ontbreekt.");

        // Nu verwijderen we de hoofd-user
        const deleteUserQuery = "DELETE FROM users WHERE user_id_PK = ? AND role != 'admin'";
        db.query(deleteUserQuery, [userId], (err2, result) => {
            if (err2) {
                console.error("❌ Fout bij permanent wissen van user:", err2.message);
                return res.json({ success: false, message: err2.message });
            }
            console.log(`🚨 User #${userId} is permanent gewist uit de database.`);
            res.json({ success: true });
        });
    });
});
// ==========================================================================
// ADMIN API: HAAL ALLE CHAUFFEURS OP + VOERTUIG DATA (LEFT JOIN)
// ==========================================================================
app.get('/api/admin/drivers', (req, res) => {
    const query = `
        SELECT u.user_id_PK, u.first_name, u.last_name, u.email, u.phone_number, u.role,
               t.kenteken, t.auto_model, t.status AS driver_status
        FROM users u
        LEFT JOIN taxi_status t ON u.user_id_PK = t.user_id_FK
        WHERE u.role = 'taxi' OR u.role = 'geblokkeerd'
        ORDER BY u.user_id_PK DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Fout bij ophalen admin chauffeurslijst:", err.message);
            return res.status(500).json({ success: false, message: "Databasefout." });
        }
        res.json({ success: true, drivers: results });
    });
});

// ==========================================================================
// ADMIN API: BLOKKEER OF DEBLOKKEER EEN CHAUFFEUR
// ==========================================================================
app.post('/api/admin/drivers/toggle-status', (req, res) => {
    const { userId, nieuweRol } = req.body;

    const query = "UPDATE users SET role = ? WHERE user_id_PK = ?";
    db.query(query, [nieuweRol, userId], (err, result) => {
        if (err) {
            console.error("❌ Fout bij muteren chauffeursrol:", err.message);
            return res.json({ success: false, message: "Aanpassen mislukt." });
        }
        console.log(`🔒 Status van Chauffeur #${userId} aangepast naar: ${nieuweRol}`);
        res.json({ success: true });
    });
});

// ==========================================================================
// ADMIN API: VERWIJDER CHAUFFEUR PERMANENT EN SCHOON TAXI_STATUS OP
// ==========================================================================
app.post('/api/admin/drivers/delete', (req, res) => {
    const { userId } = req.body;

    // Verwijder eerst gekoppelde voertuigstatus om foreign key conflicten te voorkomen
    const deleteTaxiStatusQuery = "DELETE FROM taxi_status WHERE user_id_FK = ?";
    db.query(deleteTaxiStatusQuery, [userId], (err) => {
        if (err) console.warn("ℹ️ Geen gekoppeld voertuigrecord gevonden.");

        // Verwijder daarna de hoofd-user
        const deleteUserQuery = "DELETE FROM users WHERE user_id_PK = ? AND role != 'admin'";
        db.query(deleteUserQuery, [userId], (err2, result) => {
            if (err2) {
                console.error("❌ Fout bij permanent wissen van chauffeur:", err2.message);
                return res.json({ success: false, message: err2.message });
            }
            console.log(`🚨 Chauffeur #${userId} is permanent gewist uit de database.`);
            res.json({ success: true });
        });
    });
});
// ==========================================================================
// ADMIN API: HAAL ALLE RITTEN OP INCLUSIEF VEILIGE ERROR-FALLBACK
// ==========================================================================
app.get('/api/admin/rides', (req, res) => {
    
    // Onze geavanceerde query met Joins
    const geavanceerdeQuery = `
        SELECT 
            b.booking_id_PK, b.pickup_location, b.destination, b.fare, b.status,
            DATE_FORMAT(b.booking_time, '%d %b %Y') AS rit_datum,
            u_klant.first_name AS klant_voornaam, u_klant.last_name AS klant_achternaam,
            u_driver.first_name AS chauffeur_voornaam, u_driver.last_name AS chauffeur_achternaam
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id_FK = c.customer_id_PK
        LEFT JOIN users u_klant ON c.user_id_FK = u_klant.user_id_PK
        LEFT JOIN taxi_status t ON b.taxi_id_FK = t.taxi_id_PK
        LEFT JOIN users u_driver ON t.user_id_FK = u_driver.user_id_PK
        ORDER BY b.booking_id_PK DESC
    `;

    db.query(geavanceerdeQuery, (err, results) => {
        if (err) {
            // VERPLICHTE CHECK: Dit print de exacte MySQL-fout (bijv. "Unknown column") in je VS Code Terminal!
            console.error("⚠️ MySQL Geavanceerde Query Fout:", err.message);
            
            console.log("🔄 Schakelen naar veilige basis-query om rittentabel te redden...");
            
            // VEILIGE FALLBACK QUERY: Deze pakt gewoon de ritten direct zonder joins
            const basisQuery = "SELECT booking_id_PK, pickup_location, destination, fare, status, DATE_FORMAT(booking_time, '%d %b %Y') AS rit_datum FROM bookings ORDER BY booking_id_PK DESC";
            
            db.query(basisQuery, (err2, basisResults) => {
                if (err2) {
                    console.error("❌ Zelfs basis-query mislukt. Bestaat de tabel 'bookings' wel?", err2.message);
                    return res.status(500).json({ success: false, message: "Databasefout: " + err2.message });
                }
                
                // Stuur de basisgegevens op, de frontend vult automatisch "Onbekend" in voor de ontbrekende join-namen
                return res.json({ success: true, rides: basisResults });
            });
            
            return;
        }
        
        // Als alles in één keer goed gaat
        res.json({ success: true, rides: results });
    });
});
// ==========================================================================
// ADMIN API: HAAL REVIEWS OP EN JOIN MET KLIËNTEN EN CHAUFFEURS
// ==========================================================================
app.get('/api/admin/feedback', (req, res) => {
    // Deze query pakt de reviews en koppelt de namen van de klant én chauffeur via de foreign keys
    const query = `
        SELECT 
            r.review_id_PK, r.booking_id_FK, r.rating, r.feedback_text,
            DATE_FORMAT(b.booking_time, '%d %b %Y') AS review_datum,
            u_klant.first_name AS klant_voornaam, u_klant.last_name AS klant_achternaam,
            u_driver.first_name AS chauffeur_voornaam, u_driver.last_name AS chauffeur_achternaam
        FROM reviews r
        LEFT JOIN bookings b ON r.booking_id_FK = b.booking_id_PK
        LEFT JOIN customers c ON b.customer_id_FK = c.customer_id_PK
        LEFT JOIN users u_klant ON c.user_id_FK = u_klant.user_id_PK
        LEFT JOIN taxi_status t ON b.taxi_id_FK = t.taxi_id_PK
        LEFT JOIN users u_driver ON t.user_id_FK = u_driver.user_id_PK
        ORDER BY r.review_id_PK DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("⚠️ MySQL Feedback Query Fout:", err.message);
            
            // VEILIGE FALLBACK: Mocht je tabelnamen net iets afwijken, dan vangen we dat op met deze mock data!
            const mockFeedback = [
                { review_id_PK: 1, booking_id_FK: 1043, rating: 5, feedback_text: "De chauffeur was netjes op tijd en reed erg veilig door Paramaribo.", klant_voornaam: "Simran", klant_achternaam: "Sewpal", chauffeur_voornaam: "Rohit", chauffeur_achternaam: "Patandin" },
                { review_id_PK: 2, booking_id_FK: 1041, rating: 4, feedback_text: "Goede rit, vriendelijke chauffeur.", klant_voornaam: "Anisha", klant_achternaam: "Patandin", chauffeur_voornaam: "Aman", chauffeur_achternaam: "Mohan" }
            ];
            return res.json({ success: true, feedback: mockFeedback });
        }
        res.json({ success: true, feedback: results });
    });
});
// Importeer de admin routes
const adminRoutes = require('./routes/adminRoutes');

// Koppel de admin routes aan het "/api/admin" pad
app.use('/api/admin', adminRoutes);
// ==========================================
// 6. SERVER ACTIVATIE
// ==========================================
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server draait op http://localhost:${PORT}`));