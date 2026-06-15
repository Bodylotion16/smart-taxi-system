const mysql = require('mysql2');
const db = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'admin@123',
    database: process.env.DB_NAME || 'taxi_db',
    port: 3306
});
module.exports = db;