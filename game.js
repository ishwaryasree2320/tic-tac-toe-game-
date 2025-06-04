const gameState = {
    currentPlayer: 'X',
    board: ['', '', '', '', '', '', '', '', ''],
    active: true,
    mode: null,
    scores: { X: 0, O: 0 },
    round: 1,
    MAX_ROUNDS: 5
};

document.addEventListener('DOMContentLoaded', function () {
    initGame();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('singlePlayerBtn').addEventListener('click', () => setGameMode('single'));
    document.getElementById('multiPlayerBtn').addEventListener('click', () => setGameMode('multi'));
    document.getElementById('privateGameBtn').addEventListener('click', () => setGameMode('private'));

    document.querySelectorAll('.cell').forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    document.getElementById('resetGameBtn').addEventListener('click', resetGame);
    document.getElementById('newRoundBtn').addEventListener('click', startNewRound);
}

function setGameMode(mode) {
    gameState.mode = mode;
    document.querySelector('.game-modes').classList.add('hidden');
    document.getElementById('gameArea').classList.remove('hidden');
    initGame();

    if (mode === 'single' && gameState.currentPlayer === 'O') {
        setTimeout(computerMove, 500);
    }
}

function initGame() {
    gameState.board = ['', '', '', '', '', '', '', '', ''];
    gameState.active = true;
    gameState.currentPlayer = 'X';
    updateGameUI();
}

function updateGameUI() {
    document.querySelectorAll('.cell').forEach((cell, index) => {
        cell.textContent = gameState.board[index];
        cell.className = 'cell ' + gameState.board[index].toLowerCase();
    });

    document.getElementById('gameStatus').textContent = `Player ${gameState.currentPlayer}'s turn`;
    document.getElementById('roundNumber').textContent = `${gameState.round}/${gameState.MAX_ROUNDS}`;
    document.getElementById('playerXScore').textContent = gameState.scores.X;
    document.getElementById('playerOScore').textContent = gameState.scores.O;
    document.getElementById('newRoundBtn').classList.add('hidden');
}

function handleCellClick(e) {
    const cellIndex = parseInt(e.target.getAttribute('data-index'));
    if (gameState.board[cellIndex] !== '' || !gameState.active) return;

    makeMove(cellIndex, gameState.currentPlayer);
    checkGameStatus();

    if (gameState.mode === 'single' && gameState.active && gameState.currentPlayer === 'O') {
        setTimeout(computerMove, 500);
    }
}

function makeMove(cellIndex, player) {
    gameState.board[cellIndex] = player;
    updateGameUI();
}

function computerMove() {
    if (!gameState.active) return;

    const bestMove = findBestMove();
    if (bestMove !== -1) {
        makeMove(bestMove, 'O');
        checkGameStatus();
    }
}

function findBestMove() {
    const opponent = 'X';
    const board = gameState.board;

    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            if (checkWin('O')) {
                board[i] = '';
                return i;
            }
            board[i] = '';
        }
    }

    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = opponent;
            if (checkWin(opponent)) {
                board[i] = '';
                return i;
            }
            board[i] = '';
        }
    }

    if (board[4] === '') return 4;

    const corners = [0, 2, 6, 8];
    const openCorners = corners.filter(i => board[i] === '');
    if (openCorners.length > 0) {
        return openCorners[Math.floor(Math.random() * openCorners.length)];
    }

    const sides = [1, 3, 5, 7];
    const openSides = sides.filter(i => board[i] === '');
    if (openSides.length > 0) {
        return openSides[Math.floor(Math.random() * openSides.length)];
    }

    return -1;
}

function checkGameStatus() {
    if (checkWin(gameState.currentPlayer)) {
        endGame(false);
        return;
    }

    if (checkTie()) {
        endGame(true);
        return;
    }

    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    document.getElementById('gameStatus').textContent = `Player ${gameState.currentPlayer}'s turn`;
}

function checkWin(player) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    return winPatterns.some(pattern => pattern.every(index => gameState.board[index] === player));
}

function checkTie() {
    return gameState.board.every(cell => cell !== '');
}

function endGame(isTie) {
    gameState.active = false;
    if (isTie) {
        document.getElementById('gameStatus').textContent = 'Game ended in a tie!';
    } else {
        gameState.scores[gameState.currentPlayer]++;
        updateGameUI();
        document.querySelectorAll(`.cell.${gameState.currentPlayer.toLowerCase()}`).forEach(cell => {
            cell.classList.add('winner');
        });
    }

    if (gameState.round < gameState.MAX_ROUNDS) {
        document.getElementById('newRoundBtn').classList.remove('hidden');
    } else {
        setTimeout(showFinalResults, 1000);
    }
}

function showFinalResults() {
    let message;
    if (gameState.scores.X > gameState.scores.O) {
        message = `Game Over! Player X wins with ${gameState.scores.X} points!`;
    } else if (gameState.scores.O > gameState.scores.X) {
        message = `Game Over! Player O wins with ${gameState.scores.O} points!`;
    } else {
        message = `Game Over! It's a tie with ${gameState.scores.X} points each!`;
    }
    alert(message);
    resetGame();
}

function resetGame() {
    gameState.scores = { X: 0, O: 0 };
    gameState.round = 1;
    document.getElementById('gameArea').classList.add('hidden');
    document.querySelector('.game-modes').classList.remove('hidden');
    initGame();
}

function startNewRound() {
    gameState.round++;
    initGame();
}
