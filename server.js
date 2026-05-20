const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serveert je HTML, CSS en JS bestanden

// 1. DATABASE VERBINDING
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin@123',
    database: 'taxi_db'
});

db.connect(err => {
    if (err) console.error("Database verbinding mislukt:", err);
    else console.log("✅ Verbonden met taxi_db");
});

// 2. REGISTRATIE ROUTE
app.post('/api/register', (req, res) => {
    let { voornaam, achternaam, email, telefoon, wachtwoord, rol, adres, kenteken, auto_model } = req.body;

    if (rol === 'driver') rol = 'taxi';
    if (rol === 'passenger' || rol === 'passagier') rol = 'klant';

    const sqlUser = `INSERT INTO users (first_name, last_name, email, phone_number, password, role) VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(sqlUser, [voornaam, achternaam, email, telefoon, wachtwoord, rol], (err, result) => {
        if (err) return res.json({ success: false, message: "Gebruiker toevoegen mislukt: " + err.message });

        const userId = result.insertId;

        if (rol === 'taxi') {
            const sqlTaxi = `INSERT INTO taxi_status (user_id_FK, kenteken, auto_model) VALUES (?, ?, ?)`;
            db.query(sqlTaxi, [userId, kenteken, auto_model], (err2) => {
                if (err2) return res.json({ success: false, message: "Taxi info opslaan mislukt: " + err2.message });
                res.json({ success: true });
            });
        } else if (rol === 'klant') {
            const sqlCust = `INSERT INTO customers (user_id_FK, address) VALUES (?, ?)`;
            db.query(sqlCust, [userId, adres], (err3) => {
                if (err3) return res.json({ success: false, message: "Klant info opslaan mislukt: " + err3.message });
                res.json({ success: true });
            });
        } else {
            res.json({ success: true });
        }
    });
});

// 3. LOGIN ROUTE
app.post('/api/login', (req, res) => {
    const { email, wachtwoord } = req.body;
    const sqlLogin = "SELECT * FROM users WHERE email = ? AND password = ?";
    
    db.query(sqlLogin, [email, wachtwoord], (err, results) => {
        if (err) {
            console.error("Database fout tijdens inloggen:", err);
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

// 4. BOEKING ROUTE
app.post('/api/book', (req, res) => {
    const { pickup_location, destination, fare, distance_km, payment_method } = req.body;
    
    const query = `INSERT INTO bookings (pickup_location, destination, fare, distance_km, status) VALUES (?, ?, ?, ?, 'pending')`;
    
    db.query(query, [pickup_location, destination, fare, distance_km], (err, result) => {
        if (err) return res.json({ success: false, message: err.message });
        res.json({ success: true, bookingId: result.insertId });
    });
});

// 5. PAYMENT CONFIRMATION ROUTE
app.post('/api/payment-confirm', (req, res) => {
    const { booking_id_FK, amount, payment_method, payment_status } = req.body;

    const sqlPay = `INSERT INTO payments (booking_id_FK, amount, payment_method, payment_status) VALUES (?, ?, ?, ?)`;
    
    db.query(sqlPay, [booking_id_FK, amount, payment_method, payment_status], (err, result) => {
        if (err) return res.json({ success: false, message: "Betaling mislukt: " + err.message });
        
        const sqlUpdateBooking = `UPDATE bookings SET status = 'paid' WHERE id = ?`;
        db.query(sqlUpdateBooking, [booking_id_FK], (errUpdate) => {
            if (errUpdate) console.error("Kon boeking status niet updaten");
            res.json({ success: true });
        });
    });
});

// 6. SERVER START
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server draait op http://localhost:${PORT}`));
// 7. HAAL BESCHIKBARE RITTEN OP (Voor de Chauffeur)
app.get('/api/available-bookings', (req, res) => {
    // We halen ritten op die de status 'paid' (of 'pending') hebben en nog geen chauffeur hebben
    const sqlGetBookings = `SELECT * FROM bookings WHERE status = 'paid' ORDER BY id DESC`;

    db.query(sqlGetBookings, (err, results) => {
        if (err) {
            console.error("Fout bij ophalen ritten:", err);
            return res.json({ success: false, message: "Kon ritten niet ophalen." });
        }
        res.json({ success: true, bookings: results });
    });
});
// ==========================================
// ADMIN DASHBOARD DATA API
// ==========================================
app.get('/api/admin/dashboard', (req, res) => {
    // Query 1: Totale Financiën (Omzet & aantal verwerkte/betaalde ritten)
    const sqlStats = `
        SELECT 
            COUNT(id) as totaal_ritten,
            IFNULL(SUM(fare), 0) as totale_omzet
        FROM bookings WHERE status = 'paid'`;

    // Query 2: Live Ritten (Ritten die nu bezig of aangevraagd zijn)
    const sqlLiveRitten = `SELECT * FROM bookings WHERE status IN ('pending', 'paid', 'accepted') ORDER BY id DESC`;

    // Query 3: Chauffeurs + Status (Haalt gebruikers op met rol 'taxi')
    const sqlChauffeurs = `
        SELECT u.id, u.first_name, u.last_name, u.phone_number, t.kenteken, t.auto_model 
        FROM users u
        LEFT JOIN taxi_status t ON u.id = t.user_id_FK
        WHERE u.role = 'taxi'`;

    // Query 4: Klanten overzicht
    const sqlKlanten = `
        SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number, c.address
        FROM users u
        LEFT JOIN customers c ON u.id = c.user_id_FK
        WHERE u.role = 'klant'`;

    // Voer de queries uit (we gebruiken nesten voor de eenvoud van je project)
    db.query(sqlStats, (err, statsRes) => {
        if (err) return res.json({ success: false, message: err.message });
        
        db.query(sqlLiveRitten, (err2, liveRes) => {
            if (err2) return res.json({ success: false, message: err2.message });

            db.query(sqlChauffeurs, (err3, chauRes) => {
                if (err3) return res.json({ success: false, message: err3.message });

                db.query(sqlKlanten, (err4, klanRes) => {
                    if (err4) return res.json({ success: false, message: err4.message });

                    // Stuur alle data in één keer georganiseerd terug!
                    res.json({
                        success: true,
                        stats: statsRes[0],
                        liveRitten: liveRes,
                        chauffeurs: chauRes,
                        klanten: klanRes
                    });
                });
            });
        });
    });
});