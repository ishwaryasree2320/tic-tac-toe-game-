document.addEventListener('DOMContentLoaded', function () {
    const privateBtn = document.getElementById('privateGameBtn');
    const joinBtn = document.getElementById('joinRoomBtn');
    const roomLinkContainer = document.getElementById('roomLinkContainer');
    const roomLinkInput = document.getElementById('roomLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const joinRoomContainer = document.getElementById('joinRoomContainer');
    const joinRoomInput = document.getElementById('joinRoomInput');
    const joinNowBtn = document.getElementById('joinNowBtn');

    let roomId = null;
    let playerSymbol = null;
    let roomRef = null;
    let isGameActive = false;
    const MAX_ROUNDS = 5;

    // Create a private room
    privateBtn.addEventListener('click', () => {
        roomId = generateRoomId();
        const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
        roomLinkInput.value = url;
        roomLinkContainer.classList.remove('hidden');
        joinRoomContainer.classList.add('hidden');

        playerSymbol = 'X';
        localStorage.setItem("symbol", "X");

        // Initialize room data with scores
        firebase.database().ref(`rooms/${roomId}`).set({
            board: Array(9).fill(''),
            currentPlayer: 'X',
            winner: null,
            round: 1,
            scores: { X: 0, O: 0 },
            gameOver: false,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            listenToRoom(roomId);
            document.querySelector('.game-modes').classList.add('hidden');
            document.getElementById('gameArea').classList.remove('hidden');
            showNotification(`You created room ${roomId} as Player X`);
        });
    });

    // Join room button
    joinBtn.addEventListener('click', () => {
        joinRoomContainer.classList.remove('hidden');
        roomLinkContainer.classList.add('hidden');
    });

    // Copy room link
    copyLinkBtn.addEventListener('click', () => {
        roomLinkInput.select();
        document.execCommand('copy');
        showNotification('Room link copied!');
    });

    // Join existing room
    joinNowBtn.addEventListener('click', () => {
        const url = joinRoomInput.value.trim();
        const roomParam = url.match(/[?&]room=([^&]+)/);
        
        if (roomParam && roomParam[1]) {
            window.location.href = `${window.location.pathname}?room=${roomParam[1]}`;
        } else {
            showNotification('Invalid room link. Please check the URL.', true);
        }
    });

    // Auto-join room from URL
    const params = new URLSearchParams(window.location.search);
    if (params.has('room')) {
        roomId = params.get('room');
        playerSymbol = 'O';
        localStorage.setItem("symbol", "O");

        const checkRoomInterval = setInterval(() => {
            firebase.database().ref(`rooms/${roomId}`).once('value').then(snapshot => {
                if (snapshot.exists()) {
                    clearInterval(checkRoomInterval);
                    listenToRoom(roomId);
                    document.querySelector('.game-modes').classList.add('hidden');
                    document.getElementById('gameArea').classList.remove('hidden');
                    showNotification(`Joined room ${roomId} as Player O`);
                }
            });
        }, 1000);
    }

    function generateRoomId() {
        return Math.random().toString(36).substr(2, 8);
    }

    function listenToRoom(roomId) {
        roomRef = firebase.database().ref(`rooms/${roomId}`);
        const mySymbol = localStorage.getItem("symbol");

        roomRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                showNotification('Room no longer exists', true);
                window.location.href = window.location.pathname;
                return;
            }

            updateGame(data);
            isGameActive = !data.winner && !data.gameOver;

            // Handle game over state
            if (data.winner) {
                const statusMessage = data.winner === 'Tie' ? 
                    `Round ${data.round} tied!` : 
                    `Player ${data.winner} wins round ${data.round}!`;
                showNotification(statusMessage);

                // Prepare for next round after delay
                if (data.round < MAX_ROUNDS) {
                    setTimeout(() => {
                        roomRef.update({
                            board: Array(9).fill(''),
                            currentPlayer: 'X',
                            winner: null
                        });
                    }, 2000);
                } else {
                    // Game over - determine final winner
                    setTimeout(() => {
                        const finalWinner = determineFinalWinner(data.scores);
                        const gameOverMessage = finalWinner === 'Tie' ? 
                            'Game ended in a tie!' : 
                            `Player ${finalWinner} wins the game!`;
                        
                        showNotification(gameOverMessage);
                        roomRef.update({ gameOver: true });
                    }, 2000);
                }
            }
        });

        // Set up cell click handlers
        document.querySelectorAll('.cell').forEach((cell, i) => {
            cell.addEventListener('click', () => {
                if (!isGameActive) return;
                
                roomRef.once('value').then(snapshot => {
                    const data = snapshot.val();
                    if (!data) return;

                    // Validate move
                    if (data.board[i] !== '' || 
                        data.currentPlayer !== mySymbol || 
                        data.winner || 
                        data.gameOver) {
                        return;
                    }

                    // Make the move
                    const newBoard = [...data.board];
                    newBoard[i] = mySymbol;
                    
                    const winner = checkWinner(newBoard);
                    const isTie = newBoard.every(cell => cell !== '');
                    const nextPlayer = mySymbol === 'X' ? 'O' : 'X';
                    
                    // Update scores if there's a winner
                    const newScores = {...data.scores};
                    if (winner) {
                        newScores[winner] = (newScores[winner] || 0) + 1;
                    }

                    const updates = {
                        board: newBoard,
                        currentPlayer: winner || isTie ? '-' : nextPlayer,
                        scores: newScores
                    };

                    // Set winner if game ended
                    if (winner || isTie) {
                        updates.winner = winner || 'Tie';
                        if (data.round === MAX_ROUNDS) {
                            updates.gameOver = true;
                        }
                    }

                    roomRef.update(updates);
                });
            });
        });
    }

    function determineFinalWinner(scores) {
        if (scores.X === scores.O) return 'Tie';
        return scores.X > scores.O ? 'X' : 'O';
    }

    function updateGame(data) {
        // Update board
        document.querySelectorAll('.cell').forEach((cell, i) => {
            cell.textContent = data.board[i];
            cell.className = 'cell ' + (data.board[i] || '').toLowerCase();
            
            // Highlight winning cells
            if (data.winner && data.winner !== 'Tie') {
                const winningCombination = getWinningCombination(data.board, data.winner);
                if (winningCombination.includes(i)) {
                    cell.classList.add('winner');
                }
            }
        });

        // Update game status
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            if (data.gameOver) {
                const finalWinner = determineFinalWinner(data.scores);
                statusElement.textContent = finalWinner === 'Tie' ? 
                    'Game ended in a tie!' : 
                    `Player ${finalWinner} wins the game!`;
            } else if (data.winner) {
                statusElement.textContent = data.winner === 'Tie' ? 
                    `Round ${data.round} tied!` : 
                    `Player ${data.winner} wins round ${data.round}!`;
            } else {
                statusElement.textContent = `Player ${data.currentPlayer}'s turn (Round ${data.round})`;
            }
        }

        // Update scores
        document.getElementById('playerXScore').textContent = data.scores?.X || 0;
        document.getElementById('playerOScore').textContent = data.scores?.O || 0;
        document.getElementById('roundNumber').textContent = `${data.round}/${MAX_ROUNDS}`;
    }

    function checkWinner(board) {
        const winPatterns = [
            [0,1,2],[3,4,5],[6,7,8], // rows
            [0,3,6],[1,4,7],[2,5,8], // columns
            [0,4,8],[2,4,6]          // diagonals
        ];
        
        for (let pattern of winPatterns) {
            const [a,b,c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    function getWinningCombination(board, winner) {
        const winPatterns = [
            [0,1,2],[3,4,5],[6,7,8], // rows
            [0,3,6],[1,4,7],[2,5,8], // columns
            [0,4,8],[2,4,6]          // diagonals
        ];
        
        for (let pattern of winPatterns) {
            const [a,b,c] = pattern;
            if (board[a] === winner && board[b] === winner && board[c] === winner) {
                return pattern;
            }
        }
        return [];
    }

    function showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : ''}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    // Clean up when leaving the page
    window.addEventListener('beforeunload', () => {
        if (roomRef) {
            roomRef.off();
        }
    });
});
