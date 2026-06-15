const jwt = require('jsonwebtoken');

function verifieerToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: "Geen token geleverd" });
    
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
        if (err) return res.status(500).json({ message: "Authenticatie mislukt" });
        req.userId = decoded.id;
        next();
    });
}

function valideerData(req, res, next) {
    // Basis validatie check voor invoergegevens
    if (req.body && Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "Invoerdata mag niet leeg zijn" });
    }
    next();
}

module.exports = { verifieerToken, valideerData };