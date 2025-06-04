document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const privateBtn = document.getElementById('privateGameBtn');
    const joinBtn = document.getElementById('joinRoomBtn');
    const roomLinkContainer = document.getElementById('roomLinkContainer');
    const roomLinkInput = document.getElementById('roomLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const joinRoomContainer = document.getElementById('joinRoomContainer');
    const joinRoomInput = document.getElementById('joinRoomInput');
    const joinNowBtn = document.getElementById('joinNowBtn');

    // Game State Variables
    let roomId = null;
    let playerSymbol = null;
    let roomRef = null;
    let isGameActive = false;
    const MAX_ROUNDS = 5;

    // Event Listeners
    privateBtn.addEventListener('click', createPrivateRoom);
    joinBtn.addEventListener('click', showJoinRoomInput);
    copyLinkBtn.addEventListener('click', copyRoomLink);
    joinNowBtn.addEventListener('click', joinExistingRoom);

    // Auto-join room from URL
    const params = new URLSearchParams(window.location.search);
    if (params.has('room')) {
        joinRoomFromUrl(params.get('room'));
    }

    function createPrivateRoom() {
        roomId = generateRoomId();
        const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
        roomLinkInput.value = url;
        toggleUIElements(true);

        playerSymbol = 'X';
        localStorage.setItem("symbol", "X");

        // Initialize room with starting values
        firebase.database().ref(`rooms/${roomId}`).set({
            board: Array(9).fill(''),
            currentPlayer: 'X',
            winner: null,
            round: 1,
            scores: { X: 0, O: 0 },
            gameOver: false,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            setupGame();
            showNotification(`Room created! You're Player X`);
        });
    }

    function joinRoomFromUrl(roomId) {
        playerSymbol = 'O';
        localStorage.setItem("symbol", "O");

        const checkRoomInterval = setInterval(() => {
            firebase.database().ref(`rooms/${roomId}`).once('value').then(snapshot => {
                if (snapshot.exists()) {
                    clearInterval(checkRoomInterval);
                    roomId = roomId; // Set the global roomId
                    setupGame();
                    showNotification(`Joined as Player O`);
                }
            });
        }, 1000);
    }

    function setupGame() {
        listenToRoom();
        document.querySelector('.game-modes').classList.add('hidden');
        document.getElementById('gameArea').classList.remove('hidden');
    }

    function listenToRoom() {
        roomRef = firebase.database().ref(`rooms/${roomId}`);
        const mySymbol = localStorage.getItem("symbol");

        roomRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                showNotification('Room closed', true);
                returnToLobby();
                return;
            }

            updateGameUI(data);
            isGameActive = !data.winner && !data.gameOver;

            if (data.winner && !data.gameOver) {
                handleRoundCompletion(data, mySymbol);
            }
        });

        setupCellClickHandlers(mySymbol);
    }

    function handleRoundCompletion(data, mySymbol) {
        const roundResult = data.winner === 'Tie' ? 
            `Round ${data.round} tied!` : 
            `Player ${data.winner} wins round ${data.round}!`;
        showNotification(roundResult);

        setTimeout(() => {
            if (data.round < MAX_ROUNDS) {
                startNextRound(data);
            } else {
                endGame(data);
            }
        }, 2000);
    }

    function startNextRound(data) {
        const nextRound = data.round + 1;
        roomRef.update({
            board: Array(9).fill(''),
            currentPlayer: 'X',
            winner: null,
            round: nextRound
        });
        showNotification(`Round ${nextRound} started!`);
    }

    function endGame(data) {
        const finalWinner = determineFinalWinner(data.scores);
        const message = finalWinner === 'Tie' ? 
            'Game ended in a tie!' : 
            `Player ${finalWinner} wins the game!`;
        
        showNotification(message);
        roomRef.update({ 
            gameOver: true,
            currentPlayer: '-'
        });

        setTimeout(() => {
            returnToLobby();
        }, 3000);
    }

    function setupCellClickHandlers(mySymbol) {
        document.querySelectorAll('.cell').forEach((cell, index) => {
            cell.addEventListener('click', () => {
                if (!isGameActive) return;
                
                roomRef.once('value').then(snapshot => {
                    const data = snapshot.val();
                    if (!data || data.currentPlayer !== mySymbol || data.winner) return;

                    makeMove(data, index, mySymbol);
                });
            });
        });
    }

    function makeMove(data, index, mySymbol) {
        const newBoard = [...data.board];
        newBoard[index] = mySymbol;
        
        const winner = checkWinner(newBoard);
        const isTie = newBoard.every(cell => cell !== '');
        const nextPlayer = mySymbol === 'X' ? 'O' : 'X';
        
        const newScores = {...data.scores};
        if (winner) {
            newScores[winner] = (newScores[winner] || 0) + 1;
        }

        roomRef.update({
            board: newBoard,
            currentPlayer: winner || isTie ? '-' : nextPlayer,
            scores: newScores,
            winner: winner || (isTie ? 'Tie' : null)
        });
    }

    function updateGameUI(data) {
        // Update board cells
        document.querySelectorAll('.cell').forEach((cell, index) => {
            cell.textContent = data.board[index];
            cell.className = 'cell ' + (data.board[index] || '').toLowerCase();
            
            if (data.winner && data.winner !== 'Tie') {
                const winningCombo = getWinningCombination(data.board, data.winner);
                if (winningCombo.includes(index)) {
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
                    `Player ${finalWinner} wins!`;
            } else if (data.winner) {
                statusElement.textContent = data.winner === 'Tie' ?
                    `Round ${data.round} tied!` :
                    `Player ${data.winner} wins round ${data.round}!`;
            } else {
                statusElement.textContent = `Player ${data.currentPlayer}'s turn (Round ${data.round})`;
            }
        }

        // Update scores and round display
        document.getElementById('playerXScore').textContent = data.scores.X;
        document.getElementById('playerOScore').textContent = data.scores.O;
        document.getElementById('roundNumber').textContent = `${data.round}/${MAX_ROUNDS}`;
    }

    // Helper Functions
    function toggleUIElements(isCreatingRoom) {
        roomLinkContainer.classList.toggle('hidden', !isCreatingRoom);
        joinRoomContainer.classList.toggle('hidden', isCreatingRoom);
    }

    function showJoinRoomInput() {
        toggleUIElements(false);
    }

    function copyRoomLink() {
        roomLinkInput.select();
        document.execCommand('copy');
        showNotification('Room link copied!');
    }

    function joinExistingRoom() {
        const url = joinRoomInput.value.trim();
        const roomParam = url.match(/[?&]room=([^&]+)/);
        
        if (roomParam && roomParam[1]) {
            window.location.href = `${window.location.pathname}?room=${roomParam[1]}`;
        } else {
            showNotification('Invalid room link', true);
        }
    }

    function returnToLobby() {
        window.location.href = window.location.pathname;
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
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];
        
        for (let pattern of winPatterns) {
            const [a,b,c] = pattern;
            if (board[a] === winner && board[b] === winner && board[c] === winner) {
                return pattern;
            }
        }
        return [];
    }

    function determineFinalWinner(scores) {
        if (scores.X === scores.O) return 'Tie';
        return scores.X > scores.O ? 'X' : 'O';
    }

    function showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : ''}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    function generateRoomId() {
        return Math.random().toString(36).substr(2, 8);
    }

    // Clean up when leaving the page
    window.addEventListener('beforeunload', () => {
        if (roomRef) roomRef.off();
    });
});
