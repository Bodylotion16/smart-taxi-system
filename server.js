const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serveert je frontend mappen (auth, portals, sub-pages, etc.)

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

    // Normaliseer rollen voor de ENUM in de database
    if (rol === 'driver' || rol === 'taxi') rol = 'taxi';
    if (rol === 'passenger' || rol === 'passagier' || rol === 'klant') rol = 'klant';

    const sqlUser = `INSERT INTO users (first_name, last_name, email, phone_number, password, role) VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(sqlUser, [voornaam, achternaam, email, telefoon, wachtwoord, rol], (err, result) => {
        if (err) {
            console.error("❌ SQL Fout bij registreren basisgebruiker:", err.message);
            return res.json({ success: false, message: "Gebruiker toevoegen mislukt: " + err.message });
        }

        const userId = result.insertId;

        // Als het een taxi/chauffeur is, vul de status tabel aan
        if (rol === 'taxi') {
            const sqlTaxi = `INSERT INTO taxi_status (user_id_FK, kenteken, auto_model, status) VALUES (?, ?, ?, 'offline')`;
            db.query(sqlTaxi, [userId, kenteken, auto_model], (err2) => {
                if (err2) return res.json({ success: false, message: "Taxi info opslaan mislukt: " + err2.message });
                console.log(`✅ Nieuwe chauffeur geregistreerd: ${voornaam} ${achternaam}`);
                res.json({ success: true });
            });
        } 
        // Als het een klant is, vul de customers tabel aan met het adres
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

// Rit Aanmaken / Boeken (Vanaf bookingKlant.html of book-ride.html)
app.post('/api/book', (req, res) => {
    const { pickup_location, destination, fare, distance_km } = req.body;
    
    const query = `INSERT INTO bookings (pickup_location, destination, fare, distance_km, status) VALUES (?, ?, ?, ?, 'pending')`;
    
    db.query(query, [pickup_location, destination, fare, distance_km], (err, result) => {
        if (err) return res.json({ success: false, message: err.message });
        console.log(`📍 Nieuwe rit aangevraagd: Van ${pickup_location.substring(0,20)}... Naar ${destination.substring(0,20)}...`);
        res.json({ success: true, bookingId: result.insertId });
    });
});

// Betaling Bevestigen (Vanaf sub-pages/payment.html)
app.post('/api/payment-confirm', (req, res) => {
    const { booking_id_FK, amount, payment_method, payment_status } = req.body;

    const sqlPay = `INSERT INTO payments (booking_id_FK, amount, payment_method, payment_status) VALUES (?, ?, ?, ?)`;
    
    db.query(sqlPay, [booking_id_FK, amount, payment_method, payment_status], (err, result) => {
        if (err) return res.json({ success: false, message: "Betaling registreren mislukt: " + err.message });
        
        // Update de status van de boeking naar 'paid' met de juiste kolomnaam 'booking_id'
        const sqlUpdateBooking = `UPDATE bookings SET status = 'paid' WHERE booking_id = ?`;
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

// Beschikbare ritten ophalen voor rittenpoule (Vanaf portals/driver/dashboard.html)
app.get('/api/available-bookings', (req, res) => {
    const sqlGetBookings = `SELECT * FROM bookings WHERE status = 'paid' ORDER BY booking_id DESC`;

    db.query(sqlGetBookings, (err, results) => {
        if (err) {
            console.error("❌ Fout bij ophalen beschikbare ritten:", err.message);
            return res.json({ success: false, message: "Kon ritten niet ophalen." });
        }
        res.json({ success: true, bookings: results });
    });
});

// ==========================================
// 5. ADMIN PORTAL INTERACTIES (GELINKT AAN portals/admin.html)
// ==========================================
app.get('/api/admin/dashboard', (req, res) => {
    console.log("📟 Admin dashboard data wordt opgevraagd...");

    let stats = { totaal_ritten: 0, totale_omzet: 0 };
    let liveRitten = [];
    let chauffeurs = [];
    let klanten = [];

    // Query A: Algemene omzet-statistieken
    db.query(`SELECT COUNT(*) as totaal_ritten, IFNULL(SUM(fare), 0) as totale_omzet FROM bookings WHERE status = 'paid'`, (err, resStats) => {
        if (!err && resStats.length > 0) stats = resStats[0];

        // Query B: Alle ritten in het systeem
        db.query(`SELECT * FROM bookings ORDER BY booking_id DESC`, (err2, resLive) => {
            if (!err2) liveRitten = resLive;

            // Query C: Alle geregistreerde chauffeurs met hun auto details
            db.query(`SELECT u.*, t.kenteken, t.auto_model, t.status as driver_status FROM users u LEFT JOIN taxi_status t ON u.user_id = t.user_id_FK WHERE u.role = 'taxi'`, (err3, resChau) => {
                if (!err3) chauffeurs = resChau;

                // Query D: Alle geregistreerde klanten met hun opgeslagen adressen
                db.query(`SELECT u.*, c.address FROM users u LEFT JOIN customers c ON u.user_id = c.user_id_FK WHERE u.role = 'klant'`, (err4, resKlan) => {
                    if (!err4) klanten = resKlan;

                    // Stuur het gecombineerde pakket terug naar admin.html
                    console.log("✅ Admin data succesvol verzonden naar browser!");
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
// 6. SERVER ACTIVATIE
// ==========================================
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server draait op http://localhost:${PORT}`));