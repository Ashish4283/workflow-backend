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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 5000;

// State Management
const engine = new QuantumMomentum();
const simulator = new MarketSimulator(72450);

let tradingState = {
    isRunning: false,
    mode: 'paper',
    pnl: 0,
    dailyPnl: 0,
    trades: [],
    marketData: {
        sensex: 72450,
        change: 0,
        isBurst: false
    },
    activePositions: []
};

// High-Frequency Core Loop (100ms for responsiveness)
setInterval(() => {
    if (tradingState.isRunning) {
        const tick = simulator.nextTick();
        tradingState.marketData.sensex = tick.price;
        tradingState.marketData.isBurst = tick.isBurst;

        // Feed to Strategy Engine
        const signal = engine.processPrice(tick.price);
        
        if (signal) {
            handleEngineSignal(signal);
        }

        // Broad-spectrum telemetry
        broadcast({
            type: 'QUANTUM_TELEMETRY',
            market: tradingState.marketData,
            pnl: tradingState.pnl,
            activePositions: tradingState.activePositions,
            engineStatus: engine.position ? 'IN_TRADE' : 'WANDERING',
            stats: {
                volatility: engine.calculateVolatility(),
                confidence: engine.position ? 0.85 : 0.42
            }
        });
    }
}, 500);

async function handleEngineSignal(signal) {
    console.log(`[ENGINE] ${signal.type}: ${signal.msg}`);
    
    // Log to DB
    await addLog(signal.msg, signal.event === 'STRATEGY_SIGNAL' ? 'SUCCESS' : 'INFO');

    if (signal.type === 'BREAKOUT_DETECTED') {
        tradingState.activePositions.push(signal.data);
    }
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
app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT setting_key, setting_value FROM tm_settings WHERE setting_key IN (?, ?, ?, ?)', 
            ['apiKey', 'clientId', 'totpSecret', 'openaiKey']);
        
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
            await db.query('INSERT INTO tm_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', 
                [key, value, value]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

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
