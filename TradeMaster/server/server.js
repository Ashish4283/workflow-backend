import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import db from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 5000;

// State
let tradingState = {
    isRunning: false,
    mode: 'paper', // 'paper' or 'live'
    pnl: 0,
    dailyPnl: 0,
    trades: [],
    marketData: {
        sensex: 72000,
        change: 0
    },
    activePositions: []
};

// Simulation Loop
setInterval(() => {
    if (tradingState.isRunning) {
        // Mock price movement
        const move = (Math.random() - 0.5) * 50;
        tradingState.marketData.sensex += move;
        tradingState.marketData.change = move;

        // Strategy logic check would go here
        checkStrategy(tradingState.marketData.sensex);

        // Broadcast to all clients
        broadcast({
            type: 'MARKET_UPDATE',
            data: tradingState.marketData,
            pnl: tradingState.pnl,
            activePositions: tradingState.activePositions
        });
    }
}, 1000);

function checkStrategy(price) {
    // Implement Momentum Breakout logic
    // Trigger: >=120 point move
    // This is a simplified mock
}

function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(data));
        }
    });
}

async function addLog(msg, level = 'INFO') {
    try {
        await db.query('INSERT INTO tm_strategy_logs (message, log_level) VALUES (?, ?)', [msg, level]);
    } catch (err) {
        console.error('DB Logging Error:', err);
    }
}

// API Routes
app.get('/api/status', async (req, res) => {
    try {
        const [logs] = await db.query('SELECT * FROM tm_strategy_logs ORDER BY created_at DESC LIMIT 50');
        const [trades] = await db.query('SELECT * FROM tm_trades ORDER BY entry_time DESC LIMIT 10');
        res.json({
            ...tradingState,
            logs,
            recentTrades: trades
        });
    } catch (err) {
        res.json(tradingState);
    }
});

app.post('/api/toggle', (req, res) => {
    tradingState.isRunning = !tradingState.isRunning;
    broadcast({ type: 'STATUS_UPDATE', isRunning: tradingState.isRunning });
    res.json({ success: true, isRunning: tradingState.isRunning });
});

app.post('/api/mode', (req, res) => {
    tradingState.mode = req.body.mode;
    res.json({ success: true, mode: tradingState.mode });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
