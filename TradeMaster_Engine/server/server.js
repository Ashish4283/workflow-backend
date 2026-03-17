import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import db from './db.js';
import { QuantumMomentum } from './engine/QuantumMomentum.js';
import { MarketSimulator } from './engine/MarketSimulator.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config(); // Local .env
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') }); // Root .env (Hostinger)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Self-Healing DB Schema: Ensure user_id column exists for multi-tenancy
async function harmonizeSchema() {
    try {
        console.log('🔍 Checking database schema health...');
        const [columns] = await db.query("SHOW COLUMNS FROM tm_settings LIKE 'user_id'");
        if (columns.length === 0) {
            console.log('🛠️ Harmonizing tm_settings... adding user_id column.');
            try { await db.query("ALTER TABLE tm_settings DROP PRIMARY KEY"); } catch(e){}
            await db.query("ALTER TABLE tm_settings ADD COLUMN user_id INT NOT NULL FIRST");
            await db.query("ALTER TABLE tm_settings ADD PRIMARY KEY (user_id, setting_key)");
            console.log('✅ tm_settings harmonized.');
        }
        
        // Also ensure logs and trades have user_id
        const [logCols] = await db.query("SHOW COLUMNS FROM tm_strategy_logs LIKE 'user_id'");
        if (logCols.length === 0) {
            await db.query("ALTER TABLE tm_strategy_logs ADD COLUMN user_id INT NOT NULL");
            console.log('✅ tm_strategy_logs harmonized.');
        }

        const [tradeCols] = await db.query("SHOW COLUMNS FROM tm_trades LIKE 'user_id'");
        if (tradeCols.length === 0) {
            await db.query("ALTER TABLE tm_trades ADD COLUMN user_id INT NOT NULL");
            console.log('✅ tm_trades harmonized.');
        }
    } catch (e) {
        console.error('⚠️ Schema harmonization failed. Please run multi_user_migration.sql manually.', e);
    }
}
harmonizeSchema();

// Multi-Tenant Engine Pool
const enginePool = new Map(); // email -> { engine, simulator, state }

function getOrCreateUserEngine(email) {
    if (!enginePool.has(email)) {
        enginePool.set(email, {
            engine: new QuantumMomentum(),
            simulator: new MarketSimulator(72450),
            state: {
                isRunning: false,
                mode: 'paper',
                pnl: 0,
                dailyPnl: 0,
                trades: [],
                marketData: { sensex: 72450, change: 0, isBurst: false },
                activePositions: []
            }
        });
    }
    return enginePool.get(email);
}

// User-Scoped High-Frequency Loop
setInterval(() => {
    enginePool.forEach(async (tenant, email) => {
        if (tenant.state.isRunning) {
            const tick = tenant.simulator.nextTick();
            tenant.state.marketData.sensex = tick.price;
            tenant.state.marketData.isBurst = tick.isBurst;

            const signal = tenant.engine.processPrice(tick.price);
            if (signal) {
                await handleEngineSignal(email, tenant, signal);
            }

            broadcastToUser(email, {
                type: 'QUANTUM_TELEMETRY',
                market: tenant.state.marketData,
                pnl: tenant.state.pnl,
                activePositions: tenant.state.activePositions,
                engineStatus: tenant.engine.position ? 'IN_TRADE' : 'WANDERING',
                stats: {
                    volatility: tenant.engine.calculateVolatility(),
                    confidence: tenant.engine.position ? 0.85 : 0.42
                }
            });
        }
    });
}, 500);

async function handleEngineSignal(email, tenant, signal) {
    console.log(`[USER ${email}] ${signal.type}: ${signal.msg}`);
    // We fetch user ID for database logging
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
        await addLog(users[0].id, signal.msg, signal.event === 'STRATEGY_SIGNAL' ? 'SUCCESS' : 'INFO');
    }
    
    if (signal.type === 'BREAKOUT_DETECTED') {
        tenant.state.activePositions.push(signal.data);
    }
}

// WebSocket Auth & Connection
wss.on('connection', (ws, req) => {
    console.log('New connection attempt...');
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'AUTH') {
                ws.userEmail = data.email;
                console.log(`WS Authenticated for User: ${ws.userEmail}`);
            }
        } catch (e) {}
    });
});

function broadcastToUser(email, data) {
    wss.clients.forEach(client => {
        if (client.readyState === 1 && client.userEmail === email) {
            client.send(JSON.stringify(data));
        }
    });
}

async function addLog(userId, msg, level = 'INFO') {
    try {
        await db.query('INSERT INTO tm_strategy_logs (user_id, message, log_level) VALUES (?, ?, ?)', [userId, msg, level]);
    } catch (err) {
        console.error('DB Logging Error:', err);
    }
}

// API Routes (Authenticated)
app.use('/api', authMiddleware);

app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT setting_key, setting_value FROM tm_settings WHERE user_id = ? AND setting_key IN (?, ?, ?, ?)', 
            [req.user.id, 'apiKey', 'clientId', 'totpSecret', 'openaiKey']);
        
        const settings = {};
        rows.forEach(r => settings[r.setting_key] = r.setting_value);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const entries = Object.entries(req.body);
        for (const [key, value] of entries) {
            await db.query('INSERT INTO tm_settings (user_id, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', 
                [req.user.id, key, value, value]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

app.get('/api/status', async (req, res) => {
    try {
        const tenant = getOrCreateUserEngine(req.user.email);
        const [logs] = await db.query('SELECT * FROM tm_strategy_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
        const [trades] = await db.query('SELECT * FROM tm_trades WHERE user_id = ? ORDER BY entry_time DESC LIMIT 10', [req.user.id]);
        res.json({
            ...tenant.state,
            logs,
            recentTrades: trades
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

app.post('/api/toggle', (req, res) => {
    const tenant = getOrCreateUserEngine(req.user.email);
    tenant.state.isRunning = !tenant.state.isRunning;
    broadcastToUser(req.user.email, { type: 'STATUS_UPDATE', isRunning: tenant.state.isRunning });
    res.json({ success: true, isRunning: tenant.state.isRunning });
});

app.post('/api/mode', (req, res) => {
    tradingState.mode = req.body.mode;
    res.json({ success: true, mode: tradingState.mode });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
