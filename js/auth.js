document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('.form:not(.signup-form)');
    const signupForm = document.querySelector('.signup-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');

    // Toggle between login and signup forms
    showSignup.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.style.display = 'none';
        signupForm.style.display = 'flex';
    });

    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        signupForm.style.display = 'none';
        loginForm.style.display = 'flex';
    });

    // Initialize users array in localStorage if it doesn't exist
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }

    // Login functionality
    loginBtn.addEventListener('click', function() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        // Validation
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users.find(u => u.email === email);
        
        if (!user) {
            showError('User not found. Please sign up first.');
            return;
        }
        
        if (user.password !== password) {
            showError('Incorrect password');
            return;
        }
        
        // Successful login
        localStorage.setItem('currentUser', JSON.stringify({
            email: user.email,
            username: user.username
        }));
        window.location.href = 'game.html';
    });

    // Signup functionality
    signupBtn.addEventListener('click', function() {
        const username = document.getElementById('signup-username').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        
        // Validation
        if (!username || !email || !password || !confirmPassword) {
            showError('Please fill in all fields');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }
        
        // Basic email validation
        if (!validateEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('users'));
        const emailExists = users.some(user => user.email === email);
        
        if (emailExists) {
            showError('Email already registered. Please login instead.');
            return;
        }
        
        // Username validation
        const usernameExists = users.some(user => user.username === username);
        if (usernameExists) {
            showError('Username already taken');
            return;
        }
        
        // Create new user
        const newUser = {
            username,
            email,
            password // In a real app, you would hash the password
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify({
            email: newUser.email,
            username: newUser.username
        }));
        
        window.location.href = 'game.html';
    });

    // Helper functions
    function showError(message) {
        alert(message); // In a real app, you'd show this in the UI
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
});