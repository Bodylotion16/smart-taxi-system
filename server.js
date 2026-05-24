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
        
        // FIX: Gewijzigd naar booking_id_PK op basis van jouw schema
        const sqlUpdateBooking = `UPDATE bookings SET status = 'paid' WHERE booking_id_PK = ?`;
        db.query(sqlUpdateBooking, [booking_id_FK], (errUpdate) => {
            if (errUpdate) console.error("❌ Kon boeking status niet updaten naar 'paid':", errUpdate.message);
            console.log(`💰 Betaling ontvangen voor Rit #${booking_id_FK}. Status geüpdatet naar PAID.`);
            res.json({ success: true });
        });
    });
});

// ==========================================
// 4. CHAUFFEUR (DRIVER) PORTAL INTERACTIES
// ==========================================

// GECORRIGEERD: Haalt nu ALLEEN ritten op die op 'pending' staan + matcht jouw primary key kolom!
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

// NIEUWE LIVE ROUTE OM CHAUFFEUR STATUS BIJ TE WERKEN VIA HET DASHBOARD
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

// ==========================================
// API: RITSTATUS CHAUFFEUR LIVE BIJWERKEN (Gecorrigeerd naar booking_id_PK!)
// ==========================================
app.post('/api/driver/update-ride-status', (req, res) => {
    const { booking_id, status } = req.body;
    console.log(`🚖 Rit Status Update: Rit #${booking_id} wordt nu -> ${status}`);

    // GECORRIGEERD: Maakt nu gebruik van booking_id_PK op basis van jouw Workbench tabel schema
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
// ==========================================
// API: CHAUFFEUR REVIEWS OPHALEN
// ==========================================
app.get('/api/driver/reviews', (req, res) => {
    // Gesimuleerde live data op basis van jouw array
    const mockReviews = [
        { date: "20 mei 2026", customer: "Anisha", rating: 5, comment: "Chauffeur was op tijd en vriendelijk." },
        { date: "19 mei 2026", customer: "Simran", rating: 4, comment: "Goede rit, maar kleine vertraging." },
        { date: "18 mei 2026", customer: "Aman", rating: 5, comment: "Veilige en comfortabele rit." }
    ];
    
    res.json({ success: true, reviews: mockReviews });
});
// ==========================================
// 6. SERVER ACTIVATIE
// ==========================================
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server draait op http://localhost:${PORT}`));