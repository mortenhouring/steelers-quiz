// Game State
let gameState = {
    currentMode: null,
    players: [],
    currentPlayer: null,
    currentQuestionIndex: 0,
    score: 0,
    correctAnswers: 0,
    totalQuestions: 10,
    hintsRevealed: 0,
    maxHints: 4,
    questionStartTime: null,
    gameStartTime: null
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

    // Enter key support for guess input
    const guessInput = document.getElementById('player-guess');
    if (guessInput) {
        guessInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitGuess();
            }
        });

        // Auto-focus when game starts
        guessInput.addEventListener('focus', function() {
            this.placeholder = 'Type player name...';
        });

        guessInput.addEventListener('blur', function() {
            this.placeholder = 'Enter player name...';
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
    gameState.gameStartTime = Date.now();

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
    gameState.hintsRevealed = 0;
    gameState.questionStartTime = Date.now();

    // Update UI
    updateQuestionUI();
    resetQuestionState();

    gameState.currentQuestionIndex++;
    document.getElementById('question-number').textContent = gameState.currentQuestionIndex;
}

function updateQuestionUI() {
    const player = gameState.currentPlayer;
    
    // Hide player image initially
    document.getElementById('player-image').style.display = 'none';
    document.getElementById('image-placeholder').style.display = 'flex';

    // Reset all clues to hidden
    const clues = document.querySelectorAll('.clue');
    clues.forEach(clue => {
        clue.classList.remove('revealed');
        const clueText = clue.querySelector('.clue-text');
        clueText.textContent = '???';
    });

    // Enable hint button
    const hintBtn = document.getElementById('hint-btn');
    hintBtn.disabled = false;
    hintBtn.textContent = 'Reveal Hint (Cost: 5 points)';

    // Update hints counter
    document.getElementById('hints-count').textContent = '0';

    // Clear input and feedback
    document.getElementById('player-guess').value = '';
    document.getElementById('guess-feedback').textContent = '';
    document.getElementById('guess-feedback').className = 'guess-feedback';
    document.getElementById('answer-controls').style.display = 'none';

    // Enable submit button
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Guess';

    // Focus on input
    setTimeout(() => {
        document.getElementById('player-guess').focus();
    }, 100);
}

function resetQuestionState() {
    // Reset game state for new question
    document.getElementById('player-guess').disabled = false;
    document.getElementById('submit-btn').disabled = false;
}

function revealHint() {
    if (gameState.hintsRevealed >= gameState.maxHints) {
        return;
    }

    const player = gameState.currentPlayer;
    const hintOrder = ['clue-position', 'clue-number', 'clue-college', 'clue-trivia'];
    const currentHintId = hintOrder[gameState.hintsRevealed];
    const clueElement = document.getElementById(currentHintId);
    
    if (clueElement) {
        clueElement.classList.add('revealed');
        const clueText = clueElement.querySelector('.clue-text');
        
        switch (currentHintId) {
            case 'clue-position':
                clueText.textContent = player.position;
                break;
            case 'clue-number':
                clueText.textContent = player.number || 'N/A';
                break;
            case 'clue-college':
                clueText.textContent = player.college;
                break;
            case 'clue-trivia':
                clueText.textContent = player.trivia;
                break;
        }
    }

    // Deduct points for hint
    gameState.score = Math.max(0, gameState.score - 5);
    updateScore();

    gameState.hintsRevealed++;
    document.getElementById('hints-count').textContent = gameState.hintsRevealed;

    // Disable hint button if all hints revealed
    if (gameState.hintsRevealed >= gameState.maxHints) {
        const hintBtn = document.getElementById('hint-btn');
        hintBtn.disabled = true;
        hintBtn.textContent = 'All hints revealed';
    }

    // Show player image on last hint
    if (gameState.hintsRevealed === gameState.maxHints && player.player_image) {
        document.getElementById('player-image').src = player.player_image;
        document.getElementById('player-image').style.display = 'block';
        document.getElementById('image-placeholder').style.display = 'none';
    }
}

function submitGuess() {
    const guessInput = document.getElementById('player-guess');
    const guess = guessInput.value.trim();
    
    if (!guess) {
        showFeedback('Please enter a player name.', 'incorrect');
        return;
    }

    const isCorrect = checkAnswer(guess, gameState.currentPlayer.player_name);
    
    if (isCorrect) {
        handleCorrectAnswer();
    } else {
        handleIncorrectAnswer();
    }

    // Disable input and submit button
    guessInput.disabled = true;
    document.getElementById('submit-btn').disabled = true;
    document.getElementById('hint-btn').disabled = true;

    // Show next button
    document.getElementById('answer-controls').style.display = 'block';

    // Reveal player image if not already shown
    const player = gameState.currentPlayer;
    if (player.player_image) {
        document.getElementById('player-image').src = player.player_image;
        document.getElementById('player-image').style.display = 'block';
        document.getElementById('image-placeholder').style.display = 'none';
    }

    // Reveal all remaining clues
    revealAllClues();
}

function checkAnswer(guess, correctName) {
    // Normalize strings for comparison
    const normalizeString = (str) => {
        return str.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .trim();
    };

    const normalizedGuess = normalizeString(guess);
    const normalizedCorrect = normalizeString(correctName);

    // Direct match
    if (normalizedGuess === normalizedCorrect) {
        return true;
    }

    // Check if guess matches first and last name
    const guessParts = normalizedGuess.split(' ');
    const correctParts = normalizedCorrect.split(' ');

    // If guess is just last name, check if it matches
    if (guessParts.length === 1 && correctParts.length > 1) {
        return guessParts[0] === correctParts[correctParts.length - 1];
    }

    // Check for partial matches (first name + last name)
    if (guessParts.length >= 2 && correctParts.length >= 2) {
        const guessFirst = guessParts[0];
        const guessLast = guessParts[guessParts.length - 1];
        const correctFirst = correctParts[0];
        const correctLast = correctParts[correctParts.length - 1];

        return guessFirst === correctFirst && guessLast === correctLast;
    }

    return false;
}

function handleCorrectAnswer() {
    gameState.correctAnswers++;
    
    // Calculate points based on time and hints used
    const timeBonus = Math.max(0, 30 - Math.floor((Date.now() - gameState.questionStartTime) / 1000));
    const hintPenalty = gameState.hintsRevealed * 5;
    const basePoints = 50;
    const questionPoints = Math.max(10, basePoints + timeBonus - hintPenalty);
    
    gameState.score += questionPoints;
    updateScore();

    showFeedback(`Correct! +${questionPoints} points (${gameState.currentPlayer.player_name})`, 'correct');
}

function handleIncorrectAnswer() {
    showFeedback(`Incorrect. The answer was: ${gameState.currentPlayer.player_name}`, 'incorrect');
}

function revealAllClues() {
    const player = gameState.currentPlayer;
    const clues = [
        { id: 'clue-position', value: player.position },
        { id: 'clue-number', value: player.number || 'N/A' },
        { id: 'clue-college', value: player.college },
        { id: 'clue-trivia', value: player.trivia }
    ];

    clues.forEach(clue => {
        const element = document.getElementById(clue.id);
        if (element && !element.classList.contains('revealed')) {
            element.classList.add('revealed');
            element.querySelector('.clue-text').textContent = clue.value;
        }
    });
}

function showFeedback(message, type) {
    const feedback = document.getElementById('guess-feedback');
    feedback.textContent = message;
    feedback.className = `guess-feedback ${type}`;
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
        totalQuestions: 10,
        hintsRevealed: 0,
        maxHints: 4,
        questionStartTime: null,
        gameStartTime: null
    };
}

function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
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