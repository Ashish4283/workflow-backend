// Hero Theme Data
const HERO_THEMES = [
    { identity: "Captain", emoji: "🛡️", color: "#448AFF" },
    { identity: "Spidey", emoji: "🕷️", color: "#F44336" },
    { identity: "Bat", emoji: "🦇", color: "#212121" },
    { identity: "Flash", emoji: "⚡", color: "#FFEB3B" },
    { identity: "Iron", emoji: "🦾", color: "#FF5252" },
    { identity: "Thor", emoji: "🔨", color: "#00BCD4" },
    { identity: "Hulk", emoji: "🌋", color: "#4CAF50" },
    { identity: "Widow", emoji: "🕷️", color: "#E91E63" },
    { identity: "Panther", emoji: "🐾", color: "#9C27B0" },
    { identity: "Strange", emoji: "👁️", color: "#FF9800" }
];

// State Management
let players = [];
let currentRound = 1;
let currentPlayerIndex = null;
let currentKeypadValue = "";

// Selectors
const setupScreen = document.getElementById('setup-screen');
const scoreboardScreen = document.getElementById('scoreboard-screen');
const playerNameInput = document.getElementById('player-name-input');
const addPlayerBtn = document.getElementById('add-player-btn');
const setupPlayerList = document.getElementById('setup-player-list');
const startGameBtn = document.getElementById('start-game-btn');
const playerCardsContainer = document.getElementById('player-cards-container');
const leaderboardContainer = document.getElementById('leaderboard-container');
const historyContainer = document.getElementById('history-container');
const keypadOverlay = document.getElementById('keypad-overlay');
const keypadDisplay = document.getElementById('keypad-display');
const keypadPlayerName = document.getElementById('keypad-player-name');
const newGameBtn = document.getElementById('new-game-btn');
const finishRoundBtn = document.getElementById('finish-round-btn');
const currentRoundText = document.getElementById('current-round-text');

// Initialization
function init() {
    setupEventListeners();
}

function setupEventListeners() {
    // Setup Screen
    addPlayerBtn.addEventListener('click', addPlayer);
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlayer();
    });
    startGameBtn.addEventListener('click', startGame);

    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Keypad Overlay
    document.querySelectorAll('.key').forEach(btn => {
        btn.addEventListener('click', () => {
            updateKeypadValue(btn.textContent);
        });
    });

    document.getElementById('key-clear').addEventListener('click', () => {
        currentKeypadValue = "";
        updateKeypadDisplay();
    });

    document.getElementById('keypad-cancel').addEventListener('click', closeKeypad);
    document.getElementById('keypad-confirm').addEventListener('click', confirmScore);

    // Round Management
    finishRoundBtn.addEventListener('click', finishRound);

    // Global Actions
    newGameBtn.addEventListener('click', resetGame);
}

// Player Management
function addPlayer() {
    const name = playerNameInput.value.trim();
    if (!name || players.length >= 10) return;

    // Assign a unique hero theme
    const theme = HERO_THEMES[players.length % HERO_THEMES.length];

    players.push({
        name: name,
        theme: theme,
        history: [],
        currentScore: 0
    });

    playerNameInput.value = "";
    renderSetupList();
    updateStartButton();
}

function removePlayer(index) {
    players.splice(index, 1);
    renderSetupList();
    updateStartButton();
}

function renderSetupList() {
    setupPlayerList.innerHTML = players.map((p, i) => `
        <li class="list-item" style="border-left: 4px solid ${p.theme.color}">
            <div class="setup-player-info">
                <span class="pfp-mini">${p.theme.emoji}</span>
                <div class="name-box">
                    <span class="real-name">${p.name}</span>
                    <span class="hero-name">${p.theme.identity}</span>
                </div>
            </div>
            <button onclick="removePlayer(${i})" class="btn-remove">×</button>
        </li>
    `).join('');
}

function updateStartButton() {
    startGameBtn.disabled = players.length === 0;
}

// Game Flow
function startGame() {
    currentRound = 1;
    currentRoundText.textContent = `Round ${currentRound}`;
    showView('scoreboard-screen');
    renderPlayerCards();
    renderLeaderboard();
}

function finishRound() {
    players.forEach(p => {
        p.history.push(p.currentScore || 0);
        p.currentScore = 0;
    });
    
    currentRound++;
    currentRoundText.textContent = `Round ${currentRound}`;
    
    finishRoundBtn.classList.add('animate-pop');
    setTimeout(() => finishRoundBtn.classList.remove('animate-pop'), 300);

    renderPlayerCards();
}

function resetGame() {
    if (confirm("REBOOT SYSTEM? This will wipe all scores and start a fresh Hero Session.")) {
        players = [];
        currentRound = 1;
        currentRoundText.textContent = "Round 1";
        renderSetupList();
        updateStartButton();
        showView('setup-screen');
        
        // Clear containers
        playerCardsContainer.innerHTML = "";
        leaderboardContainer.innerHTML = "";
        historyContainer.innerHTML = "";
    }
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const content = document.getElementById(`${tabName}-tab`);
    if (content) content.classList.add('active');

    if (tabName === 'leaderboard') {
        renderLeaderboard();
    } else if (tabName === 'history') {
        renderHistory();
    } else {
        renderPlayerCards();
    }
}

// Score Management
function getPlayerTotal(player) {
    const historySum = player.history.reduce((a, b) => a + b, 0);
    return historySum + (player.currentScore || 0);
}

function renderPlayerCards() {
    let leaderIndex = -1;
    let maxScore = -Infinity;
    players.forEach((p, i) => {
        const total = getPlayerTotal(p);
        if (total > maxScore && total > 0) {
            maxScore = total;
            leaderIndex = i;
        }
    });

    playerCardsContainer.innerHTML = players.map((p, i) => {
        const total = getPlayerTotal(p);
        const isLeader = i === leaderIndex;
        return `
            <div class="player-card ${isLeader ? 'is-leader' : ''}" onclick="openKeypad(${i})" style="border-bottom: 3px solid ${p.theme.color}">
                <div class="pfp">${p.theme.emoji}</div>
                <div class="hero-identity">${p.theme.identity}</div>
                <span class="name">${p.name}</span>
                <span class="score">${p.currentScore || 0}</span>
                <span class="latest-scores">Total: ${total}</span>
            </div>
        `;
    }).join('');
}

function renderHistory() {
    if (players.length === 0 || players.every(p => p.history.length === 0)) {
        historyContainer.innerHTML = `<div class="history-empty">No rounds completed yet. Finish a round to see history!</div>`;
        return;
    }

    historyContainer.innerHTML = players.map(p => {
        const roundsHtml = p.history.map((s, ri) => `
            <div class="round-chip">
                <span class="label">R${ri + 1}</span>
                <span class="val">${s}</span>
            </div>
        `).join('');

        return `
            <div class="history-card" style="border-left: 4px solid ${p.theme.color}">
                <div class="history-card-header">
                    <span class="pfp-mini">${p.theme.emoji}</span>
                    <div class="name-stack">
                        <span class="hero-name">${p.theme.identity}</span>
                        <span class="real-name">${p.name}</span>
                    </div>
                    <div class="total" style="font-weight:600; color:var(--md-sys-color-primary)">${p.history.reduce((a,b)=>a+b,0)}</div>
                </div>
                <div class="rounds-grid">
                    ${roundsHtml}
                </div>
            </div>
        `;
    }).join('');
}

function renderLeaderboard() {
    const sorted = [...players].sort((a, b) => getPlayerTotal(b) - getPlayerTotal(a));

    leaderboardContainer.innerHTML = sorted.map((p, i) => {
        const total = getPlayerTotal(p);
        return `
            <div class="leaderboard-item" style="border-right: 4px solid ${p.theme.color}">
                <div class="rank">${i + 1}</div>
                <div class="pfp-mini">${p.theme.emoji}</div>
                <div class="name-stack">
                    <div class="hero-name">${p.theme.identity}</div>
                    <div class="real-name">${p.name}</div>
                </div>
                <div class="total">${total}</div>
            </div>
        `;
    }).join('');
}

// Keypad Logic
function openKeypad(index) {
    currentPlayerIndex = index;
    currentKeypadValue = players[index].currentScore ? players[index].currentScore.toString() : "";
    keypadPlayerName.innerHTML = `${players[index].theme.emoji} ${players[index].name} <span style="font-size:12px; color:var(--md-sys-color-outline)">(${players[index].theme.identity})</span>`;
    updateKeypadDisplay();
    keypadOverlay.classList.add('active');
}

function closeKeypad() {
    keypadOverlay.classList.remove('active');
}

function updateKeypadValue(val) {
    if (currentKeypadValue.length >= 6) return;
    currentKeypadValue += val;
    updateKeypadDisplay();
}

function updateKeypadDisplay() {
    keypadDisplay.textContent = currentKeypadValue || "0";
}

function confirmScore() {
    const value = parseInt(currentKeypadValue) || 0;
    if (currentPlayerIndex !== null) {
        players[currentPlayerIndex].currentScore = value;
        renderPlayerCards();
    }
    closeKeypad();
}

// Expose functions
window.removePlayer = removePlayer;
window.openKeypad = openKeypad;

// Start App
init();
