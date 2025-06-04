document.addEventListener('DOMContentLoaded', function () {
    const privateBtn = document.getElementById('privateGameBtn');
    const joinBtn = document.getElementById('joinRoomBtn');
    const roomLinkContainer = document.getElementById('roomLinkContainer');
    const roomLinkInput = document.getElementById('roomLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const joinRoomContainer = document.getElementById('joinRoomContainer');
    const joinRoomInput = document.getElementById('joinRoomInput');
    const joinNowBtn = document.getElementById('joinNowBtn');
    const newRoundBtn = document.getElementById('newRoundBtn');

    let roomId = null;
    let playerSymbol = null;
    const gameState = {
        scores: { X: 0, O: 0 },
        round: 1,
        MAX_ROUNDS: 5
    };

    // 🎮 Create a private game
    privateBtn.addEventListener('click', () => {
        roomId = generateRoomId();
        const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
        roomLinkInput.value = url;
        roomLinkContainer.classList.remove('hidden');
        joinRoomContainer.classList.add('hidden');

        playerSymbol = 'X';
        localStorage.setItem("symbol", "X");

        // Initialize game state in Firebase
        firebase.database().ref(`rooms/${roomId}`).set({
            board: ['', '', '', '', '', '', '', '', ''],
            currentPlayer: 'X',
            scores: { X: 0, O: 0 },
            round: 1,
            MAX_ROUNDS: 5,
            createdAt: Date.now()
        });

        listenToRoom(roomId);
        document.querySelector('.game-modes').classList.add('hidden');
        document.getElementById('gameArea').classList.remove('hidden');
    });

    // 🔓 Show join room input
    joinBtn.addEventListener('click', () => {
        joinRoomContainer.classList.remove('hidden');
        roomLinkContainer.classList.add('hidden');
    });

    // 📋 Copy room link
    copyLinkBtn.addEventListener('click', () => {
        roomLinkInput.select();
        document.execCommand('copy');
        alert('Room link copied!');
    });

    // 🚪 Join room via pasted link
    joinNowBtn.addEventListener('click', () => {
        const url = joinRoomInput.value.trim();
        if (url.includes('?room=')) {
            window.location.href = url;
        } else {
            alert('Please enter a valid room link');
        }
    });

    // 🔁 Auto-join if ?room= is in URL
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
                    document.getElementById('gameStatus').textContent = `Joined Room: ${roomId} as Player O`;
                }
            });
        }, 1000);
    }

    // 👂 Listen for room data and handle game logic
    function listenToRoom(roomId) {
        const roomRef = firebase.database().ref(`rooms/${roomId}`);
        const symbol = localStorage.getItem("symbol");

        roomRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            // Update local game state
            gameState.board = data.board;
            gameState.currentPlayer = data.currentPlayer;
            gameState.scores = data.scores || { X: 0, O: 0 };
            gameState.round = data.round || 1;
            gameState.MAX_ROUNDS = data.MAX_ROUNDS || 5;

            // Update UI
            updateFromFirebase(data);
        });

        // Handle cell clicks
        document.querySelectorAll('.cell').forEach((cell, i) => {
            cell.addEventListener('click', () => {
                roomRef.once('value').then(snapshot => {
                    const data = snapshot.val();
                    if (!data) return;

                    const board = data.board;
                    const currentPlayer = data.currentPlayer;

                    // Validate turn
                    if (board[i] !== '' || currentPlayer !== symbol) return;

                    // Make move
                    board[i] = symbol;
                    const nextPlayer = symbol === 'X' ? 'O' : 'X';

                    // Check game status
                    const gameOver = checkWin(board, symbol) || checkTie(board);

                    // Update Firebase
                    roomRef.set({
                        board: board,
                        currentPlayer: nextPlayer,
                        scores: data.scores,
                        round: data.round,
                        MAX_ROUNDS: data.MAX_ROUNDS,
                        createdAt: data.createdAt
                    });

                    // Handle win/tie
                    if (gameOver) {
                        handleGameEnd(roomRef, data, symbol);
                    }
                });
            });
        });

        // Handle new round button
        newRoundBtn.addEventListener('click', () => {
            startNewRound(roomRef);
        });
    }

    function updateFromFirebase(data) {
        // Update board UI
        document.querySelectorAll('.cell').forEach((cell, i) => {
            cell.textContent = data.board[i];
            cell.className = 'cell ' + (data.board[i] || '').toLowerCase();
            cell.classList.remove('winner');
        });

        // Update scores and round
        document.getElementById('playerXScore').textContent = data.scores?.X || 0;
        document.getElementById('playerOScore').textContent = data.scores?.O || 0;
        document.getElementById('roundNumber').textContent = `${data.round || 1}/${data.MAX_ROUNDS || 5}`;
        document.getElementById('gameStatus').textContent = `Player ${data.currentPlayer}'s turn`;
    }

    function checkWin(board, player) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        return winPatterns.some(pattern => pattern.every(index => board[index] === player));
    }

    function checkTie(board) {
        return board.every(cell => cell !== '');
    }

    function handleGameEnd(roomRef, roomData, symbol) {
        const board = roomData.board;
        const isTie = checkTie(board);
        let winner = null;

        if (!isTie) {
            winner = symbol; // Current player just won
            roomData.scores[winner] = (roomData.scores[winner] || 0) + 1;
        }

        // Update UI
        if (isTie) {
            document.getElementById('gameStatus').textContent = 'Game ended in a tie!';
        } else {
            document.getElementById('gameStatus').textContent = `Player ${winner} wins!`;
            document.querySelectorAll(`.cell.${winner.toLowerCase()}`).forEach(cell => {
                cell.classList.add('winner');
            });
        }

        // Update scores in Firebase
        roomRef.update({
            scores: roomData.scores
        });

        // Show next round button if not final round
        if (roomData.round < roomData.MAX_ROUNDS) {
            document.getElementById('newRoundBtn').classList.remove('hidden');
        } else {
            setTimeout(() => {
                showFinalResults(roomData.scores);
            }, 1000);
        }
    }

    function startNewRound(roomRef) {
        roomRef.once('value').then(snapshot => {
            const data = snapshot.val();
            if (!data) return;

            const nextRound = data.round + 1;
            const startingPlayer = nextRound % 2 === 1 ? 'X' : 'O'; // Alternate starting player

            roomRef.set({
                board: ['', '', '', '', '', '', '', '', ''],
                currentPlayer: startingPlayer,
                scores: data.scores,
                round: nextRound,
                MAX_ROUNDS: data.MAX_ROUNDS,
                createdAt: data.createdAt
            });

            document.getElementById('newRoundBtn').classList.add('hidden');
        });
    }

    function showFinalResults(scores) {
        let message;
        if (scores.X > scores.O) {
            message = `Game Over! Player X wins with ${scores.X} points!`;
        } else if (scores.O > scores.X) {
            message = `Game Over! Player O wins with ${scores.O} points!`;
        } else {
            message = `Game Over! It's a tie with ${scores.X} points each!`;
        }
        alert(message);
        
        // Reset the game
        document.getElementById('gameArea').classList.add('hidden');
        document.querySelector('.game-modes').classList.remove('hidden');
    }

    // 🆔 Generate random 8-character room ID
    function generateRoomId() {
        return Math.random().toString(36).substr(2, 8);
    }
});