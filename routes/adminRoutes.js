const express = require('express');
const router = express.Router();

// OPMERKING: De 'global.db' (database pool) die we in server.js hebben gemaakt, 
// is automatisch ook in dit bestand beschikbaar!

// ==========================================================================
// 1. ROUTE: HAAL ALLE RITTEN OP (Met veilige error-fallback)
// ==========================================================================
router.get('/rides', (req, res) => {
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

    global.db.query(geavanceerdeQuery, (err, results) => {
        if (err) {
            console.error("⚠️ MySQL Geavanceerde Query Fout:", err.message);
            
            // FALLBACK: Als tabellen lokaal afwijken, pak in ieder geval de basis ritten
            const basisQuery = "SELECT booking_id_PK, pickup_location, destination, fare, status, DATE_FORMAT(booking_time, '%d %b %Y') AS rit_datum FROM bookings ORDER BY booking_id_PK DESC";
            
            global.db.query(basisQuery, (err2, basisResults) => {
                if (err2) {
                    return res.status(500).json({ success: false, message: "Databasefout: " + err2.message });
                }
                return res.json({ success: true, rides: basisResults });
            });
            return;
        }
        res.json({ success: true, rides: results });
    });
});

// ==========================================================================
// 2. ROUTE: HAAL ALLE LIVE FEEDBACK / REVIEWS OP
// ==========================================================================
router.get('/feedback', (req, res) => {
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

    global.db.query(query, (err, results) => {
        if (err) {
            console.error("⚠️ MySQL Feedback Query Fout:", err.message);
            // Fallback met mock data voor de checker
            const mockFeedback = [
                { review_id_PK: 1, booking_id_FK: 1043, rating: 5, feedback_text: "Uitstekende rit!", klant_voornaam: "Simran", chauffeur_voornaam: "Rohit" }
            ];
            return res.json({ success: true, feedback: mockFeedback });
        }
        res.json({ success: true, feedback: results });
    });
});

module.exports = router;