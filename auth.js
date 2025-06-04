if (!localStorage.getItem('ticTacToeUsers')) {
    localStorage.setItem('ticTacToeUsers', JSON.stringify([]));
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.endsWith('index.html') || 
        window.location.pathname === '/') {
        checkAuth();
    }
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-mode');
        }
    }
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!username || !password) {
        showError('Please enter both username and password');
        return;
    }

    const users = JSON.parse(localStorage.getItem('ticTacToeUsers'));
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        localStorage.setItem('currentUser', username);
        window.location.href = 'index.html';
    } else {
        showError('Invalid username or password');
    }
}

// Handle signup form submission
function handleSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    
    if (!username || !password || !confirmPassword) {
        showError('Please fill all fields');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    const users = JSON.parse(localStorage.getItem('ticTacToeUsers'));
    
    if (users.some(u => u.username === username)) {
        showError('Username already exists');
        return;
    }

    // Add new user
    users.push({ username, password });
    localStorage.setItem('ticTacToeUsers', JSON.stringify(users));
    localStorage.setItem('currentUser', username);
    window.location.href = 'index.html';
}

// Check authentication status
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    const allowedPages = ['login.html', 'signup.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!currentUser && !allowedPages.includes(currentPage)) {
        window.location.href = 'login.html';
        return;
    }
    
    if (currentUser) {
        // Update UI if on game page
        if (document.getElementById('usernameDisplay')) {
            document.getElementById('usernameDisplay').textContent = currentUser;
        }
        if (document.getElementById('userAvatar')) {
            document.getElementById('userAvatar').textContent = currentUser.charAt(0).toUpperCase();
        }
        
        // Redirect away from auth pages if already logged in
        if (allowedPages.includes(currentPage)) {
            window.location.href = 'index.html';
        }
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Toggle theme
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

// Show error message
function showError(message) {
    // Remove existing error if any
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    errorElement.style.color = '#ff4545';
    errorElement.style.marginTop = '10px';
    errorElement.style.textAlign = 'center';
    errorElement.style.fontSize = '0.9rem';
    
    // Insert after form
    const form = document.querySelector('form');
    form.appendChild(errorElement);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        errorElement.remove();
    }, 3000);
}