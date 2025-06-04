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
    let playerSymbol = 'X';

    privateBtn.addEventListener('click', () => {
        roomId = generateRoomId();
        const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
        roomLinkInput.value = url;
        roomLinkContainer.classList.remove('hidden');
        joinRoomContainer.classList.add('hidden');
        playerSymbol = 'X';

        firebase.database().ref(`rooms/${roomId}`).set({
            board: ['', '', '', '', '', '', '', '', ''],
            currentPlayer: 'X'
        });

        listenToRoom(roomId);
    });

    joinBtn.addEventListener('click', () => {
        joinRoomContainer.classList.remove('hidden');
        roomLinkContainer.classList.add('hidden');
    });

    copyLinkBtn.addEventListener('click', () => {
        roomLinkInput.select();
        document.execCommand('copy');
        alert('Room link copied!');
    });

    joinNowBtn.addEventListener('click', () => {
        const url = joinRoomInput.value.trim();
        if (url.includes('?room=')) {
            window.location.href = url;
        }
    });

    const params = new URLSearchParams(window.location.search);
    if (params.has('room')) {
        roomId = params.get('room');
        playerSymbol = 'O';
        document.getElementById('gameStatus').textContent = `Joined Room: ${roomId} as Player O`;
        listenToRoom(roomId);
    }

    function generateRoomId() {
        return Math.random().toString(36).substr(2, 8);
    }

    function listenToRoom(roomId) {
        const roomRef = firebase.database().ref(`rooms/${roomId}`);

        roomRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            updateFromFirebase(data);
        });

        document.querySelectorAll('.cell').forEach((cell, i) => {
            cell.addEventListener('click', () => {
                firebase.database().ref(`rooms/${roomId}`).once('value').then(snapshot => {
                    const data = snapshot.val();
                    if (!data) return;

                    const board = data.board;
                    const currentPlayer = data.currentPlayer;

                    if (board[i] !== '' || currentPlayer !== playerSymbol) return;

                    board[i] = playerSymbol;
                    const nextPlayer = playerSymbol === 'X' ? 'O' : 'X';

                    firebase.database().ref(`rooms/${roomId}`).set({
                        board: board,
                        currentPlayer: nextPlayer
                    });
                });
            });
        });
    }

    function updateFromFirebase(data) {
        const board = data.board;
        const currentPlayer = data.currentPlayer;

        document.querySelectorAll('.cell').forEach((cell, i) => {
            cell.textContent = board[i];
            cell.className = 'cell ' + (board[i] || '').toLowerCase();
        });

        document.getElementById('gameStatus').textContent = `Player ${currentPlayer}'s turn`;

        // Optional: check for win/tie here
    }
});
