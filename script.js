// Game state
let currentGame = {
    mode: null,
    players: [],
    currentPlayerIndex: 0,
    currentPlayer: null,
    score: 0,
    streak: 0,
    isPlaying: false
};

// Player data
let playersData = {
    current: [],
    new: [],
    legends: []
};

// Statistics
let gameStats = {
    totalScore: 0,
    gamesPlayed: 0,
    modeStats: {
        current: { score: 0, games: 0 },
        new: { score: 0, games: 0 },
        legends: { score: 0, games: 0 }
    }
};

// DOM elements
const screens = {
    home: document.getElementById('homeScreen'),
    game: document.getElementById('gameScreen'),
    scoreboard: document.getElementById('scoreboardScreen')
};

const nav = {
    menuBtn: document.getElementById('menuBtn'),
    menu: document.getElementById('navMenu'),
    items: document.querySelectorAll('.nav-item')
};

const game = {
    modeTitle: document.getElementById('gameModeTitle'),
    currentScore: document.getElementById('currentScore'),
    currentStreak: document.getElementById('currentStreak'),
    exitBtn: document.getElementById('exitGameBtn'),
    playerImage: document.getElementById('playerImage'),
    playerNumber: document.getElementById('playerNumber'),
    playerPosition: document.getElementById('playerPosition'),
    playerHeight: document.getElementById('playerHeight'),
    playerWeight: document.getElementById('playerWeight'),
    playerCollege: document.getElementById('playerCollege'),
    playerExperience: document.getElementById('playerExperience'),
    playerTrivia: document.getElementById('playerTrivia'),
    guessInput: document.getElementById('guessInput'),
    guessBtn: document.getElementById('guessBtn'),
    skipBtn: document.getElementById('skipBtn'),
    resultSection: document.getElementById('resultSection'),
    resultMessage: document.getElementById('resultMessage'),
    nextBtn: document.getElementById('nextBtn')
};

const home = {
    totalScore: document.getElementById('totalScore'),
    gamesPlayed: document.getElementById('gamesPlayed')
};

const scoreboard = {
    totalScore: document.getElementById('totalScoreDisplay'),
    totalGames: document.getElementById('totalGamesDisplay'),
    averageScore: document.getElementById('averageScoreDisplay'),
    currentModeStats: document.getElementById('currentModeStats'),
    newModeStats: document.getElementById('newModeStats'),
    legendsModeStats: document.getElementById('legendsModeStats'),
    resetBtn: document.getElementById('resetStatsBtn')
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadGameData();
    loadStatistics();
    setupEventListeners();
    updateHomeStats();
    updateScoreboardStats();
});

// Load player data from JSON files
async function loadGameData() {
    try {
        const [currentResponse, newResponse, legendsResponse] = await Promise.all([
            fetch('currentroster.json'),
            fetch('newplayers.json'),
            fetch('legends.json')
        ]);

        playersData.current = await currentResponse.json();
        playersData.new = await newResponse.json();
        playersData.legends = await legendsResponse.json();

        console.log('Loaded player data:', {
            current: playersData.current.length,
            new: playersData.new.length,
            legends: playersData.legends.length
        });
    } catch (error) {
        console.error('Error loading game data:', error);
        alert('Error loading game data. Please refresh the page.');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    nav.menuBtn.addEventListener('click', toggleMenu);
    nav.items.forEach(item => {
        item.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            closeMenu();
            navigateToScreen(mode);
        });
    });

    // Game mode buttons
    document.querySelectorAll('.game-mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.closest('.game-mode-btn').dataset.mode;
            startGame(mode);
        });
    });

    // Game controls
    game.exitBtn.addEventListener('click', () => navigateToScreen('home'));
    game.guessBtn.addEventListener('click', makeGuess);
    game.skipBtn.addEventListener('click', skipPlayer);
    game.nextBtn.addEventListener('click', nextPlayer);
    game.guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') makeGuess();
    });

    // Scoreboard
    scoreboard.resetBtn.addEventListener('click', resetStatistics);

    // Prevent zoom on double tap for iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// Navigation functions
function toggleMenu() {
    nav.menuBtn.classList.toggle('active');
    nav.menu.classList.toggle('active');
}

function closeMenu() {
    nav.menuBtn.classList.remove('active');
    nav.menu.classList.remove('active');
}

function navigateToScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    
    switch (screenName) {
        case 'home':
            screens.home.classList.add('active');
            updateHomeStats();
            break;
        case 'current':
        case 'new':
        case 'legends':
            startGame(screenName);
            break;
        case 'scoreboard':
            screens.scoreboard.classList.add('active');
            updateScoreboardStats();
            break;
    }
}

// Game functions
function startGame(mode) {
    if (!playersData[mode] || playersData[mode].length === 0) {
        alert('Player data not loaded yet. Please try again.');
        return;
    }

    currentGame.mode = mode;
    currentGame.players = shuffleArray([...playersData[mode]]);
    currentGame.currentPlayerIndex = 0;
    currentGame.score = 0;
    currentGame.streak = 0;
    currentGame.isPlaying = true;

    // Set mode title
    const modeTitles = {
        current: "This Year's Roster",
        new: "New Faces",
        legends: "Team Legends"
    };
    game.modeTitle.textContent = modeTitles[mode];

    screens.home.classList.remove('active');
    screens.game.classList.add('active');
    
    loadCurrentPlayer();
    updateGameUI();
}

function loadCurrentPlayer() {
    if (currentGame.currentPlayerIndex >= currentGame.players.length) {
        endGame();
        return;
    }

    currentGame.currentPlayer = currentGame.players[currentGame.currentPlayerIndex];
    
    // Update player info
    game.playerImage.src = currentGame.currentPlayer.player_image || '';
    game.playerImage.alt = 'Player photo';
    game.playerNumber.textContent = `#${currentGame.currentPlayer.number}`;
    game.playerPosition.textContent = currentGame.currentPlayer.position;
    game.playerHeight.textContent = currentGame.currentPlayer.height;
    game.playerWeight.textContent = currentGame.currentPlayer.weight;
    game.playerCollege.textContent = currentGame.currentPlayer.college;
    
    const experience = currentGame.currentPlayer.experience;
    game.playerExperience.textContent = experience === 'R' ? 'Rookie' : experience;
    
    game.playerTrivia.textContent = currentGame.currentPlayer.trivia || 'No trivia available';

    // Clear previous input and result
    game.guessInput.value = '';
    game.guessInput.focus();
    game.resultSection.classList.remove('show');
    
    updateGameUI();
}

function makeGuess() {
    if (!currentGame.isPlaying || !currentGame.currentPlayer) return;

    const guess = game.guessInput.value.trim();
    if (!guess) return;

    const isCorrect = checkGuess(guess, currentGame.currentPlayer.player_name);
    
    if (isCorrect) {
        currentGame.score += 10;
        currentGame.streak += 1;
        showResult('correct', `Correct! That's ${currentGame.currentPlayer.player_name}!`);
    } else {
        currentGame.streak = 0;
        showResult('incorrect', `Incorrect. That's ${currentGame.currentPlayer.player_name}.`);
    }
    
    updateGameUI();
}

function skipPlayer() {
    if (!currentGame.isPlaying || !currentGame.currentPlayer) return;
    
    currentGame.streak = 0;
    showResult('skipped', `That's ${currentGame.currentPlayer.player_name}.`);
    updateGameUI();
}

function checkGuess(guess, playerName) {
    const normalizeText = (text) => text.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    const normalizedGuess = normalizeText(guess);
    const normalizedName = normalizeText(playerName);
    
    // Check for exact match
    if (normalizedGuess === normalizedName) return true;
    
    // Check for partial matches (first name, last name, or both)
    const nameParts = normalizedName.split(/\s+/);
    const guessParts = normalizedGuess.split(/\s+/);
    
    // If guess contains all name parts
    if (nameParts.every(part => normalizedGuess.includes(part))) return true;
    
    // If all guess parts are in the name
    if (guessParts.every(part => normalizedName.includes(part)) && guessParts.length > 0) return true;
    
    return false;
}

function showResult(type, message) {
    game.resultMessage.textContent = message;
    game.resultMessage.className = `result-message ${type}`;
    game.resultSection.classList.add('show');
    
    // Disable input during result display
    game.guessInput.disabled = true;
    game.guessBtn.disabled = true;
    game.skipBtn.disabled = true;
}

function nextPlayer() {
    // Re-enable controls
    game.guessInput.disabled = false;
    game.guessBtn.disabled = false;
    game.skipBtn.disabled = false;
    
    currentGame.currentPlayerIndex += 1;
    loadCurrentPlayer();
}

function endGame() {
    currentGame.isPlaying = false;
    
    // Update statistics
    gameStats.totalScore += currentGame.score;
    gameStats.gamesPlayed += 1;
    gameStats.modeStats[currentGame.mode].score += currentGame.score;
    gameStats.modeStats[currentGame.mode].games += 1;
    
    saveStatistics();
    
    alert(`Game Over!\nYour Score: ${currentGame.score}\nPlayers: ${currentGame.players.length}`);
    navigateToScreen('home');
}

function updateGameUI() {
    game.currentScore.textContent = currentGame.score;
    game.currentStreak.textContent = currentGame.streak;
}

// Statistics functions
function loadStatistics() {
    const saved = localStorage.getItem('steelersQuizStats');
    if (saved) {
        gameStats = { ...gameStats, ...JSON.parse(saved) };
    }
}

function saveStatistics() {
    localStorage.setItem('steelersQuizStats', JSON.stringify(gameStats));
}

function resetStatistics() {
    if (confirm('Are you sure you want to reset all statistics?')) {
        gameStats = {
            totalScore: 0,
            gamesPlayed: 0,
            modeStats: {
                current: { score: 0, games: 0 },
                new: { score: 0, games: 0 },
                legends: { score: 0, games: 0 }
            }
        };
        saveStatistics();
        updateHomeStats();
        updateScoreboardStats();
    }
}

function updateHomeStats() {
    home.totalScore.textContent = gameStats.totalScore;
    home.gamesPlayed.textContent = gameStats.gamesPlayed;
}

function updateScoreboardStats() {
    scoreboard.totalScore.textContent = gameStats.totalScore;
    scoreboard.totalGames.textContent = gameStats.gamesPlayed;
    
    const averageScore = gameStats.gamesPlayed > 0 
        ? Math.round(gameStats.totalScore / gameStats.gamesPlayed) 
        : 0;
    scoreboard.averageScore.textContent = averageScore;
    
    // Update mode stats
    const modeElements = [
        { element: scoreboard.currentModeStats, data: gameStats.modeStats.current },
        { element: scoreboard.newModeStats, data: gameStats.modeStats.new },
        { element: scoreboard.legendsModeStats, data: gameStats.modeStats.legends }
    ];
    
    modeElements.forEach(({ element, data }) => {
        const scoreElement = element.querySelector('.mode-score');
        scoreElement.textContent = `${data.score} points`;
    });
}

// Utility functions
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Error handling for image loading
document.addEventListener('DOMContentLoaded', () => {
    const playerImage = document.getElementById('playerImage');
    if (playerImage) {
        playerImage.addEventListener('error', () => {
            // Simple placeholder SVG for missing player images
            playerImage.src = 'data:image/svg+xml;charset=utf-8,<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="%23333"/><circle cx="60" cy="45" r="15" fill="%23777"/><path d="M30 90C40 80 80 80 90 90V90C100 100 90 100 90 100 20 100 20 100 30 90Z" fill="%23777"/></svg>';
        });
    }
});

// Service worker registration for offline capability (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker registration failed, but app will still work
        });
    });
}