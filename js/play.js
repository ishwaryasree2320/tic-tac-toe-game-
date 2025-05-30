document.addEventListener('DOMContentLoaded', function() {
    // Game state
    let board = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let gameActive = true;
    let round = 1;
    let scores = { player1: 0, player2: 0 };
    let gameMode = localStorage.getItem('gameMode') || 'local';
    let roomId = localStorage.getItem('roomId');
    let isHost = localStorage.getItem('isHost') === 'true';
    
    // DOM elements
    const cells = document.querySelectorAll('.cell');
    const statusDisplay = document.getElementById('game-status');
    const player1Score = document.getElementById('player1-score').querySelector('.score');
    const player2Score = document.getElementById('player2-score').querySelector('.score');
    const currentRoundDisplay = document.getElementById('current-round');
    const restartRoundBtn = document.getElementById('restart-round');
    const newGameBtn = document.getElementById('new-game');
    const exitGameBtn = document.getElementById('exit-game');
    const roomInfo = document.getElementById('room-info');
    const roomIdDisplay = document.getElementById('room-id');
    const roomLink = document.getElementById('room-link');
    const copyLinkBtn = document.getElementById('copy-link');
    
    // Initialize game
    initGame();
    
    function initGame() {
        // Set up UI based on game mode
        updatePlayerNames();
        updateStatus();
        
        // Set up room info if online game
        if (gameMode === 'online') {
            roomInfo.style.display = 'block';
            roomIdDisplay.textContent = roomId;
            roomLink.value = `${window.location.origin}/play.html?room=${roomId}`;
            
            // In a real app, you would connect to a WebSocket server here
        }
        
        // Set up event listeners
        cells.forEach(cell => cell.addEventListener('click', handleCellClick));
        restartRoundBtn.addEventListener('click', restartRound);
        newGameBtn.addEventListener('click', newGame);
        exitGameBtn.addEventListener('click', exitToMenu);
        copyLinkBtn.addEventListener('click', copyRoomLink);
    }
    
    function updatePlayerNames() {
        const player1Name = document.getElementById('player1-score').querySelector('.player-name');
        const player2Name = document.getElementById('player2-score').querySelector('.player-name');
        
        if (gameMode === 'local') {
            player1Name.textContent = 'Player 1 (X)';
            player2Name.textContent = 'Player 2 (O)';
        } else if (gameMode === 'ai') {
            player1Name.textContent = 'You (X)';
            player2Name.textContent = 'Computer (O)';
        } else if (gameMode === 'online') {
            player1Name.textContent = isHost ? 'You (X)' : 'Opponent (X)';
            player2Name.textContent = isHost ? 'Opponent (O)' : 'You (O)';
        }
    }
    
    function updateStatus() {
        currentRoundDisplay.textContent = round;
        player1Score.textContent = scores.player1;
        player2Score.textContent = scores.player2;
        
        if (gameActive) {
            let statusMessage = '';
            if (gameMode === 'local') {
                statusMessage = `Player ${currentPlayer === 'X' ? '1' : '2'}'s turn (${currentPlayer})`;
            } else if (gameMode === 'ai') {
                statusMessage = currentPlayer === 'X' ? 'Your turn (X)' : 'Computer thinking...';
            } else if (gameMode === 'online') {
                if ((isHost && currentPlayer === 'X') || (!isHost && currentPlayer === 'O')) {
                    statusMessage = 'Your turn';
                } else {
                    statusMessage = 'Waiting for opponent...';
                }
            }
            statusDisplay.textContent = statusMessage;
        }
    }
    
    function handleCellClick(e) {
        const clickedCell = e.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));
        
        // Check if cell is empty and game is active
        if (board[clickedCellIndex] !== '' || !gameActive) {
            return;
        }
        
        // For online games, check if it's the player's turn
        if (gameMode === 'online') {
            if ((isHost && currentPlayer !== 'X') || (!isHost && currentPlayer !== 'O')) {
                return;
            }
        }
        
        // For AI games, prevent O (AI) from being placed manually
        if (gameMode === 'ai' && currentPlayer !== 'X') {
            return;
        }
        
        // Update board and UI
        updateCell(clickedCell, clickedCellIndex);
        checkResult();
    }
    
    function updateCell(cell, index) {
        board[index] = currentPlayer;
        cell.textContent = currentPlayer;
        cell.classList.add(currentPlayer.toLowerCase());
    }
    
    function checkResult() {
        const winningConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        
        let roundWon = false;
        
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                roundWon = true;
                break;
            }
        }
        
        if (roundWon) {
            // Update scores
            if (currentPlayer === 'X') {
                scores.player1++;
            } else {
                scores.player2++;
            }
            
            statusDisplay.textContent = getWinMessage();
            gameActive = false;
            
            // Check if game is over (5 rounds)
            if (round >= 5) {
                endGame();
            } else {
                // Delay next round for better UX
                setTimeout(() => {
                    round++;
                    resetBoard();
                }, 2000);
            }
            return;
        }
        
        // Check for tie
        if (!board.includes('')) {
            statusDisplay.textContent = "Round tied!";
            gameActive = false;
            
            if (round >= 5) {
                endGame();
            } else {
                setTimeout(() => {
                    round++;
                    resetBoard();
                }, 2000);
            }
            return;
        }
        
        // Switch player
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateStatus();
        
        // If AI's turn, make a move
        if (gameMode === 'ai' && currentPlayer === 'O' && gameActive) {
            setTimeout(makeAIMove, 1000);
        }
        
        // In a real online game, you would send the move to the server here
    }
    
    function getWinMessage() {
        if (gameMode === 'local') {
            return `Player ${currentPlayer === 'X' ? '1' : '2'} wins the round!`;
        } else if (gameMode === 'ai') {
            return currentPlayer === 'X' ? 'You win the round!' : 'Computer wins the round!';
        } else if (gameMode === 'online') {
            if ((isHost && currentPlayer === 'X') || (!isHost && currentPlayer === 'O')) {
                return 'You win the round!';
            } else {
                return 'Opponent wins the round!';
            }
        }
    }
    
    function endGame() {
        let winnerMessage = '';
        
        if (scores.player1 > scores.player2) {
            if (gameMode === 'local') {
                winnerMessage = 'Player 1 wins the game!';
            } else if (gameMode === 'ai') {
                winnerMessage = 'You win the game!';
            } else if (gameMode === 'online') {
                winnerMessage = isHost ? 'You win the game!' : 'Opponent wins the game!';
            }
        } else if (scores.player2 > scores.player1) {
            if (gameMode === 'local') {
                winnerMessage = 'Player 2 wins the game!';
            } else if (gameMode === 'ai') {
                winnerMessage = 'Computer wins the game!';
            } else if (gameMode === 'online') {
                winnerMessage = isHost ? 'Opponent wins the game!' : 'You win the game!';
            }
        } else {
            winnerMessage = 'The game is a tie!';
        }
        
        statusDisplay.textContent = winnerMessage;
        
        // Disable further moves
        gameActive = false;
    }
    
    function resetBoard() {
        board = ['', '', '', '', '', '', '', '', ''];
        gameActive = true;
        currentPlayer = 'X';
        
        // Clear cell contents
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o');
        });
        
        updateStatus();
        
        // If AI starts in the next round
        if (gameMode === 'ai' && currentPlayer === 'O') {
            setTimeout(makeAIMove, 1000);
        }
    }
    
    function restartRound() {
        resetBoard();
    }
    
    function newGame() {
        round = 1;
        scores = { player1: 0, player2: 0 };
        resetBoard();
    }
    
    function exitToMenu() {
        window.location.href = 'game.html';
    }
    
    function copyRoomLink() {
        roomLink.select();
        document.execCommand('copy');
        copyLinkBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyLinkBtn.textContent = 'Copy Link';
        }, 2000);
    }
    
    // AI move logic (implemented in ai.js)
    function makeAIMove() {
        if (!gameActive || currentPlayer !== 'O') return;
        
        // Simple AI - first find winning move, then blocking move, then random
        let move = findWinningMove('O') || findWinningMove('X') || findRandomMove();
        
        if (move !== -1) {
            const cell = document.querySelector(`.cell[data-index="${move}"]`);
            updateCell(cell, move);
            checkResult();
        }
    }
    
    function findWinningMove(player) {
        const winningConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        
        for (let condition of winningConditions) {
            const [a, b, c] = condition;
            
            // Check if two cells are occupied by player and third is empty
            if (board[a] === player && board[b] === player && board[c] === '') return c;
            if (board[a] === player && board[c] === player && board[b] === '') return b;
            if (board[b] === player && board[c] === player && board[a] === '') return a;
        }
        
        return null;
    }
    
    function findRandomMove() {
        const emptyCells = board.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
        return emptyCells.length > 0 ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : -1;
    }
});