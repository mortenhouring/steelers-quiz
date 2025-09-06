// Game State
let gameState = {
    currentMode: null,
    players: [],
    currentPlayer: null,
    currentQuestionIndex: 0,
    score: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    gameStartTime: null,
    usedPlayers: new Set()
};

// Game Data Cache
let gameData = {
    currentroster: null,
    newplayers: null,
    legends: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadGameData();
}

function setupEventListeners() {
    // Mobile navigation
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Enter key support for jersey number input
    const jerseyInput = document.getElementById('jersey-number-input');
    if (jerseyInput) {
        jerseyInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitNumber();
            }
        });

        // Auto-focus when game starts
        jerseyInput.addEventListener('focus', function() {
            this.placeholder = 'Type jersey number...';
        });

        jerseyInput.addEventListener('blur', function() {
            this.placeholder = 'Enter jersey number...';
        });
    }
}

async function loadGameData() {
    try {
        // Load all JSON data files
        const [currentRoster, newPlayers, legends] = await Promise.all([
            fetch('./currentroster.json').then(res => res.json()),
            fetch('./newplayers.json').then(res => res.json()),
            fetch('./legends.json').then(res => res.json())
        ]);

        gameData.currentroster = currentRoster;
        gameData.newplayers = newPlayers;
        gameData.legends = legends;

        console.log('Game data loaded successfully');
        console.log(`Current roster: ${currentRoster.length} players`);
        console.log(`New players: ${newPlayers.length} players`);
        console.log(`Legends: ${legends.length} players`);

    } catch (error) {
        console.error('Error loading game data:', error);
        showError('Failed to load game data. Please refresh the page.');
    }
}

function startGame(mode) {
    if (!gameData[mode]) {
        showError('Game data not loaded yet. Please try again.');
        return;
    }

    // Initialize game state
    gameState.currentMode = mode;
    gameState.players = shuffleArray([...gameData[mode]]);
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    gameState.correctAnswers = 0;
    gameState.totalQuestions = gameState.players.length;
    gameState.gameStartTime = Date.now();
    gameState.usedPlayers = new Set();

    // Update UI
    document.getElementById('game-modes').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    document.getElementById('game-results').style.display = 'none';

    // Set mode title
    const modeNames = {
        currentroster: "This Year's Roster",
        newplayers: "New Faces",
        legends: "Team Legends"
    };
    document.getElementById('current-mode').textContent = modeNames[mode];

    // Update question counter
    document.getElementById('total-questions').textContent = gameState.totalQuestions;

    // Start first question
    nextQuestion();
}

function nextQuestion() {
    if (gameState.currentQuestionIndex >= gameState.totalQuestions) {
        endGame();
        return;
    }

    // Get current player
    gameState.currentPlayer = gameState.players[gameState.currentQuestionIndex];

    // Update UI to show game page 1
    showGamePage1();

    gameState.currentQuestionIndex++;
    document.getElementById('question-number').textContent = gameState.currentQuestionIndex;
}

function showGamePage1() {
    // Show page 1, hide page 2
    document.getElementById('game-page-1').style.display = 'block';
    document.getElementById('game-page-2').style.display = 'none';

    // Display player name
    const player = gameState.currentPlayer;
    document.getElementById('player-name-display').textContent = player.player_name;

    // Clear and focus input
    const jerseyInput = document.getElementById('jersey-number-input');
    jerseyInput.value = '';
    jerseyInput.disabled = false;
    document.getElementById('go-btn').disabled = false;

    // Focus on input
    setTimeout(() => {
        jerseyInput.focus();
    }, 100);
}

function submitNumber() {
    const jerseyInput = document.getElementById('jersey-number-input');
    const guessedNumber = parseInt(jerseyInput.value);
    
    if (!jerseyInput.value.trim() || isNaN(guessedNumber)) {
        alert('Please enter a valid jersey number.');
        return;
    }

    const player = gameState.currentPlayer;
    const correctNumber = player.number;
    const isCorrect = guessedNumber === correctNumber;

    // Disable input and button
    jerseyInput.disabled = true;
    document.getElementById('go-btn').disabled = true;

    // Show game page 2 with results
    showGamePage2(isCorrect, guessedNumber, correctNumber);
}

function showGamePage2(isCorrect, guessedNumber, correctNumber) {
    // Hide page 1, show page 2
    document.getElementById('game-page-1').style.display = 'none';
    document.getElementById('game-page-2').style.display = 'block';

    const player = gameState.currentPlayer;

    // Show result feedback
    const resultFeedback = document.getElementById('result-feedback');
    if (isCorrect) {
        resultFeedback.textContent = 'Correct!';
        resultFeedback.className = 'result-feedback correct';
        
        // Add points
        gameState.correctAnswers++;
        gameState.score += 10;
    } else {
        resultFeedback.textContent = `Incorrect! You guessed ${guessedNumber}, but the correct answer is ${correctNumber}.`;
        resultFeedback.className = 'result-feedback incorrect';
    }

    // Update score display
    updateScore();

    // Populate player details
    document.getElementById('player-name-result').textContent = player.player_name;
    document.getElementById('player-number-result').textContent = player.number;
    document.getElementById('player-position-result').textContent = player.position;
    document.getElementById('player-college-result').textContent = player.college;
    document.getElementById('player-height-result').textContent = player.height || 'N/A';
    document.getElementById('player-weight-result').textContent = player.weight ? `${player.weight} lbs` : 'N/A';
    document.getElementById('player-age-result').textContent = player.age || 'N/A';
    document.getElementById('player-trivia-result').textContent = player.trivia || 'No trivia available';

    // Show player image if available
    if (player.player_image) {
        const playerImage = document.getElementById('player-image');
        const imagePlaceholder = document.getElementById('image-placeholder-result');
        
        playerImage.src = player.player_image;
        playerImage.style.display = 'block';
        imagePlaceholder.style.display = 'none';
        
        // Handle image load error
        playerImage.onerror = function() {
            playerImage.style.display = 'none';
            imagePlaceholder.style.display = 'flex';
        };
    } else {
        document.getElementById('player-image').style.display = 'none';
        document.getElementById('image-placeholder-result').style.display = 'flex';
    }

    // Update next button text
    const nextBtn = document.getElementById('next-question-btn');
    if (gameState.currentQuestionIndex >= gameState.totalQuestions) {
        nextBtn.textContent = 'See Results';
    } else {
        nextBtn.textContent = 'Next Question';
    }
}

function updateScore() {
    document.getElementById('current-score').textContent = gameState.score;
}

function endGame() {
    // Calculate final statistics
    const accuracy = gameState.totalQuestions > 0 ? 
        Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100) : 0;
    
    // Update results UI
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('correct-answers').textContent = gameState.correctAnswers;
    document.getElementById('total-answered').textContent = gameState.totalQuestions;
    document.getElementById('accuracy-percent').textContent = `${accuracy}%`;

    // Show results screen
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('game-results').style.display = 'block';

    // Save score to local storage for scoreboard
    saveScore();
}

function saveScore() {
    const scoreData = {
        mode: gameState.currentMode,
        score: gameState.score,
        correct: gameState.correctAnswers,
        total: gameState.totalQuestions,
        accuracy: Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100),
        date: new Date().toISOString(),
        playTime: Date.now() - gameState.gameStartTime
    };

    // Get existing scores
    let scores = JSON.parse(localStorage.getItem('steelersQuizScores') || '[]');
    scores.push(scoreData);
    
    // Keep only top 10 scores per mode
    const modes = ['currentroster', 'newplayers', 'legends'];
    modes.forEach(mode => {
        const modeScores = scores.filter(s => s.mode === mode)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        scores = scores.filter(s => s.mode !== mode).concat(modeScores);
    });

    localStorage.setItem('steelersQuizScores', JSON.stringify(scores));
}

function playAgain() {
    startGame(gameState.currentMode);
}

function backToModes() {
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('game-results').style.display = 'none';
    document.getElementById('game-modes').style.display = 'block';
    
    // Reset game state
    gameState = {
        currentMode: null,
        players: [],
        currentPlayer: null,
        currentQuestionIndex: 0,
        score: 0,
        correctAnswers: 0,
        totalQuestions: 0,
        gameStartTime: null,
        usedPlayers: new Set()
    };
}

function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <div class="error-content">
            <span class="error-icon">!</span>
            <span class="error-message">${message}</span>
            <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add error styles
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--error-red);
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 1001;
        max-width: 400px;
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

// Utility Functions
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Performance monitoring
let performanceMetrics = {
    loadStartTime: Date.now(),
    gameDataLoaded: false
};

window.addEventListener('load', () => {
    performanceMetrics.loadEndTime = Date.now();
    const loadTime = performanceMetrics.loadEndTime - performanceMetrics.loadStartTime;
    console.log(`Page loaded in ${loadTime}ms`);
});

// Error handling
window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
    showError('An unexpected error occurred. Please refresh the page.');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showError('Failed to load game data. Please check your connection and refresh.');
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkAnswer,
        shuffleArray,
        formatTime
    };
}