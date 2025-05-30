document.addEventListener('DOMContentLoaded', function() {
    const localGameBtn = document.getElementById('local-game');
    const aiGameBtn = document.getElementById('ai-game');
    const createRoomBtn = document.getElementById('create-room');
    const joinRoomBtn = document.getElementById('join-room');
    const logoutBtn = document.getElementById('logout-btn');

    // Check if user is logged in
    if (!localStorage.getItem('currentUser')) {
        window.location.href = 'index.html';
    }

    // Game mode selection
    localGameBtn.addEventListener('click', function() {
        localStorage.setItem('gameMode', 'local');
        window.location.href = 'play.html';
    });

    aiGameBtn.addEventListener('click', function() {
        localStorage.setItem('gameMode', 'ai');
        window.location.href = 'play.html';
    });

    createRoomBtn.addEventListener('click', function() {
        localStorage.setItem('gameMode', 'online');
        // Generate a random room ID
        const roomId = Math.random().toString(36).substring(2, 8);
        localStorage.setItem('roomId', roomId);
        localStorage.setItem('isHost', 'true');
        window.location.href = 'play.html';
    });

    joinRoomBtn.addEventListener('click', function() {
        const roomId = prompt('Enter room ID:');
        if (roomId) {
            localStorage.setItem('gameMode', 'online');
            localStorage.setItem('roomId', roomId);
            localStorage.setItem('isHost', 'false');
            window.location.href = 'play.html';
        }
    });

    // Logout functionality
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
});