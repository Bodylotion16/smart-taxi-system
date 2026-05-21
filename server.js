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
// ==========================================
// KOGELVRIJE ADMIN DASHBOARD DATA API (GEALISEERD MET U.*)
// ==========================================
app.get('/api/admin/dashboard', (req, res) => {
    console.log("📟 Admin dashboard data wordt opgevraagd...");

    // Query 1: Totale Financiën
    const sqlStats = `SELECT COUNT(*) as totaal_ritten, IFNULL(SUM(fare), 0) as totale_omzet FROM bookings`;

    db.query(sqlStats, (err, statsRes) => {
        if (err) {
            console.error("❌ SQL Fout bij statsRes:", err.message);
            return res.json({ success: false, message: "Fout in tabel 'bookings': " + err.message });
        }
        
        // Query 2: Live Ritten
        const sqlLiveRitten = `SELECT * FROM bookings`;
        
        db.query(sqlLiveRitten, (err2, liveRes) => {
            if (err2) {
                console.error("❌ SQL Fout bij liveRes:", err2.message);
                return res.json({ success: false, message: "Fout in tabel 'bookings' bij ritten: " + err2.message });
            }

            // FIX 1: We gebruiken u.* in plaats van u.id om naamgevingsfouten te voorkomen
            const sqlChauffeurs = `
                SELECT u.*, t.kenteken, t.auto_model 
                FROM users u
                LEFT JOIN taxi_status t ON u.id_users = t.user_id_FK OR u.user_id = t.user_id_FK OR u.id = t.user_id_FK
                WHERE u.role = 'taxi'`;

            // Als de JOIN hierboven te complex is door de OR, gebruiken we de meest veilige basisversie:
            const sqlChauffeursSimpel = `
                SELECT u.*, t.kenteken, t.auto_model 
                FROM users u
                LEFT JOIN taxi_status t ON u.id = t.user_id_FK
                WHERE u.role = 'taxi'`;

            db.query(sqlChauffeursSimpel, (err3, chauRes) => {
                if (err3) {
                    console.error("❌ SQL Fout bij chauRes:", err3.message);
                    return res.json({ success: false, message: "Fout bij chauffeurs: " + err3.message });
                }

                // FIX 2: Ook hier u.* toegepast voor de klanten
                const sqlKlanten = `
                    SELECT u.*, c.address
                    FROM users u
                    LEFT JOIN customers c ON u.id = c.user_id_FK
                    WHERE u.role = 'klant'`;

                db.query(sqlKlanten, (err4, klanRes) => {
                    if (err4) {
                        console.error("❌ SQL Fout bij klanRes:", err4.message);
                        return res.json({ success: false, message: "Fout bij klanten: " + err4.message });
                    }

                    // Alles is goedgekeurd en opgevangen!
                    console.log("✅ Admin data succesvol verzonden naar browser!");
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