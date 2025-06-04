// Initialize Firebase Auth
const auth = firebase.auth();

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    
    // Check auth status for all pages except auth pages
    if (!window.location.pathname.endsWith('login.html') && 
        !window.location.pathname.endsWith('signup.html') &&
        window.location.pathname !== '/') {
        checkAuth();
    }

    // Theme toggle functionality
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        console.log('Theme toggle button found');
        themeToggle.addEventListener('click', toggleTheme);
        // Initialize theme from localStorage
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-mode');
        }
    } else {
        console.log('Theme toggle button not found');
    }

    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('Login form found');
        loginForm.addEventListener('submit', handleFirebaseLogin);
    }

    // Signup form handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        console.log('Signup form found');
        signupForm.addEventListener('submit', handleFirebaseSignup);
    }

    // Logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        console.log('Logout button found');
        logoutBtn.addEventListener('click', handleLogout);
    } else {
        console.log('Logout button not found');
    }

    // Forgot password link
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
});

// Handle Firebase login
function handleFirebaseLogin(e) {
    e.preventDefault();
    console.log('Login form submitted');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Set user in localStorage
            localStorage.setItem('currentUser', userCredential.user.email);
            console.log('User logged in:', userCredential.user.email);
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Login error:', error);
            showError(getFirebaseAuthError(error));
        });
}

// Handle Firebase signup
function handleFirebaseSignup(e) {
    e.preventDefault();
    console.log('Signup form submitted');
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!name || !email || !password) {
        showError('Please fill all fields');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Set user in localStorage
            localStorage.setItem('currentUser', userCredential.user.email);
            console.log('User created:', userCredential.user.email);
            
            // Update user profile with display name
            return userCredential.user.updateProfile({
                displayName: name
            });
        })
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Signup error:', error);
            showError(getFirebaseAuthError(error));
        });
}

// Handle password reset
function handleForgotPassword(e) {
    e.preventDefault();
    const email = prompt("Enter your registered email:");
    
    if (email) {
        auth.sendPasswordResetEmail(email)
            .then(() => {
                alert("Password reset email sent. Check your inbox.");
            })
            .catch(error => {
                console.error('Password reset error:', error);
                alert("Error: " + getFirebaseAuthError(error));
            });
    }
}

// Check authentication status
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser') || auth.currentUser?.email;
    const isAuthPage = window.location.pathname.endsWith('login.html') || 
                      window.location.pathname.endsWith('signup.html');

    console.log('Checking auth status. Current user:', currentUser);

    // If no user and not on auth page, redirect to login
    if (!currentUser && !isAuthPage) {
        console.log('No user logged in, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    // If user is logged in
    if (currentUser) {
        console.log('User is logged in:', currentUser);
        // Update UI elements if they exist
        if (document.getElementById('usernameDisplay')) {
            document.getElementById('usernameDisplay').textContent = currentUser;
        }
        if (document.getElementById('userAvatar')) {
            document.getElementById('userAvatar').textContent = currentUser.charAt(0).toUpperCase();
        }
        
        // Redirect away from auth pages if already logged in
        if (isAuthPage) {
            console.log('User already logged in, redirecting to index');
            window.location.href = 'index.html';
        }
    }
}

// Handle logout
function handleLogout() {
    console.log('Logout initiated');
    auth.signOut()
        .then(() => {
            console.log('User logged out');
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.error('Logout error:', error);
            showError('Logout failed: ' + error.message);
        });
}

// Toggle theme
function toggleTheme() {
    console.log('Theme toggle clicked');
    document.body.classList.toggle('light-mode');
    const isLightMode = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
    console.log('Theme set to:', isLightMode ? 'light' : 'dark');
}

// Show error message
function showError(message) {
    console.error('Showing error:', message);
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
    if (form) {
        form.appendChild(errorElement);
    }
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        errorElement.remove();
    }, 3000);
}

// Convert Firebase auth errors to user-friendly messages
function getFirebaseAuthError(error) {
    console.log('Firebase error code:', error.code);
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/user-disabled':
            return 'This account has been disabled';
        case 'auth/user-not-found':
            return 'No account found with this email';
        case 'auth/wrong-password':
            return 'Incorrect password';
        case 'auth/email-already-in-use':
            return 'Email already in use';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters';
        case 'auth/operation-not-allowed':
            return 'This operation is not allowed';
        case 'auth/too-many-requests':
            return 'Too many requests. Try again later';
        default:
            return error.message;
    }
}
