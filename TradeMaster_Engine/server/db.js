import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'u879603724_creative4ai',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection silently
pool.getConnection()
    .then(conn => {
        console.log('✅ Connected to u879603724_creative4ai database');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed. Engine will run in memory-only mode.');
    });

export default pool;
