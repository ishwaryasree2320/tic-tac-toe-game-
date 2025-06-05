document.addEventListener('DOMContentLoaded', function () {
  const MAX_ROUNDS = 5;
  let roomId = null;
  let playerSymbol = null;
  let roomRef = null;
  let isGameActive = false;

  // Get UI elements
  const privateBtn = document.getElementById('privateGameBtn');
  const joinBtn = document.getElementById('joinRoomBtn');
  const roomLinkInput = document.getElementById('roomLink');
  const roomLinkContainer = document.getElementById('roomLinkContainer');
  const joinRoomContainer = document.getElementById('joinRoomContainer');
  const joinRoomInput = document.getElementById('joinRoomInput');
  const joinNowBtn = document.getElementById('joinNowBtn');
  const copyLinkBtn = document.getElementById('copyLinkBtn');

  // Check URL for room join
  const params = new URLSearchParams(window.location.search);
  if (params.has('room')) {
    roomId = params.get('room');
    playerSymbol = 'O';
    localStorage.setItem("symbol", "O");
    joinExistingRoom(roomId);
  }

  // Create private room
  privateBtn?.addEventListener('click', () => {
    roomId = generateRoomId();
    playerSymbol = 'X';
    localStorage.setItem("symbol", "X");

    const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    roomLinkInput.value = link;
    roomLinkContainer.classList.remove('hidden');
    joinRoomContainer.classList.add('hidden');

    firebase.database().ref(`rooms/${roomId}`).set({
      board: Array(9).fill(''),
      currentPlayer: 'X',
      winner: null,
      round: 1,
      scores: { X: 0, O: 0 },
      gameOver: false
    });

    initRoom(roomId);
  });

  // Join room
  joinBtn?.addEventListener('click', () => {
    joinRoomContainer.classList.remove('hidden');
    roomLinkContainer.classList.add('hidden');
  });

  copyLinkBtn?.addEventListener('click', () => {
    roomLinkInput.select();
    document.execCommand('copy');
    alert("Room link copied!");
  });

  joinNowBtn?.addEventListener('click', () => {
    const url = joinRoomInput.value.trim();
    const match = url.match(/[?&]room=([^&]+)/);
    if (match) {
      window.location.href = `${window.location.pathname}?room=${match[1]}`;
    } else {
      alert("Invalid room link!");
    }
  });

  function joinExistingRoom(id) {
    const ref = firebase.database().ref(`rooms/${id}`);
    ref.once('value').then(snapshot => {
      if (snapshot.exists()) {
        ref.update({
          // Optional: You could log player name/email here
        });
        initRoom(id);
      } else {
        alert("Room not found");
        window.location.href = "index.html";
      }
    });
  }

  function initRoom(id) {
    roomRef = firebase.database().ref(`rooms/${id}`);
    document.querySelector('.game-modes')?.classList.add('hidden');
    document.getElementById('gameArea')?.classList.remove('hidden');

    const mySymbol = localStorage.getItem("symbol");

    // Listen to room updates
    roomRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      updateUI(data);
      isGameActive = data.currentPlayer === mySymbol && !data.winner && !data.gameOver;

      if (data.winner && !data.gameOver) {
        handleRoundEnd(data);
      }
    });

    // Handle cell clicks
    document.querySelectorAll('.cell').forEach((cell, index) => {
      cell.addEventListener('click', () => {
        if (!isGameActive) return;

        roomRef.once('value').then(snapshot => {
          const data = snapshot.val();
          if (!data || data.board[index] !== '' || data.winner || data.currentPlayer !== mySymbol) return;

          const newBoard = [...data.board];
          newBoard[index] = mySymbol;

          const winner = checkWinner(newBoard);
          const isTie = newBoard.every(cell => cell !== '');
          const nextPlayer = mySymbol === 'X' ? 'O' : 'X';

          const newScores = { ...data.scores };
          if (winner) {
            newScores[mySymbol] += 1;
          }

          roomRef.update({
            board: newBoard,
            currentPlayer: winner || isTie ? '-' : nextPlayer,
            winner: winner || (isTie ? 'Tie' : null),
            scores: newScores
          });
        });
      });
    });
  }

  function handleRoundEnd(data) {
    setTimeout(() => {
      if (data.round < MAX_ROUNDS) {
        // Start next round
        roomRef.update({
          board: Array(9).fill(''),
          currentPlayer: 'X',
          winner: null,
          round: data.round + 1
        });
      } else {
        // End game
        const final = data.scores.X === data.scores.O ? "Tie" : (data.scores.X > data.scores.O ? "X" : "O");
        alert(final === "Tie" ? "Game ended in a tie!" : `Player ${final} wins the game!`);
        roomRef.update({ gameOver: true });
      }
    }, 2000);
  }

  function updateUI(data) {
    const board = data.board;
    document.querySelectorAll('.cell').forEach((cell, i) => {
      cell.textContent = board[i];
      cell.className = 'cell ' + (board[i] || '').toLowerCase();
    });

    document.getElementById('playerXScore').textContent = data.scores.X;
    document.getElementById('playerOScore').textContent = data.scores.O;
    document.getElementById('roundNumber').textContent = `${data.round}/${MAX_ROUNDS}`;

    if (data.gameOver) {
      document.getElementById('gameStatus').textContent = 'Game Over';
    } else if (data.winner) {
      document.getElementById('gameStatus').textContent =
        data.winner === 'Tie' ? 'Round Tied!' : `Player ${data.winner} wins the round!`;
    } else {
      document.getElementById('gameStatus').textContent = `Player ${data.currentPlayer}'s turn`;
    }
  }

  function checkWinner(board) {
    const wins = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let combo of wins) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[b] === board[c]) {
        return board[a];
      }
    }
    return null;
  }

  function generateRoomId() {
    return Math.random().toString(36).substr(2, 8);
  }
});
