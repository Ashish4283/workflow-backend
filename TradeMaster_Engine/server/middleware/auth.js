import { OAuth2Client } from 'google-auth-library';
import db from './db.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        
        // Find or create user in our DB
        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [payload.email]);
        
        let userId;
        if (users.length === 0) {
            // Create user if not exists (for SaaS onboarding)
            const [result] = await db.query('INSERT INTO users (name, email, role) VALUES (?, ?, ?)', 
                [payload.name, payload.email, 'user']);
            userId = result.insertId;
        } else {
            userId = users[0].id;
        }

        req.user = {
            id: userId,
            email: payload.email,
            name: payload.name,
            picture: payload.picture
        };
        next();
    } catch (err) {
        console.error('Auth Error:', err);
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
