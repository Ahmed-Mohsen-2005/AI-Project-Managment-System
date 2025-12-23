document.addEventListener('DOMContentLoaded', () => {
    // NOTE: HOME_PAGE_URL is assumed to be defined globally in your HTML using Jinja:
    // const HOME_PAGE_URL = "{{ url_for('homepage') }}";

    // Define API Endpoints using a global object (assuming your 'auth_bp' prefix is /api/v1/auth)
    // NOTE: If you are using Jinja for the HTML, it's safer to define these URLs in the HTML too.
    const API_ENDPOINTS = {
        login: '/api/v1/auth/login',
        register: '/api/v1/auth/register'
    };

    // --- Element Selectors ---
    const loginToggle = document.getElementById('login-toggle');
    const signupToggle = document.getElementById('signup-toggle');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const errorMessage = document.getElementById('auth-error');

    // --- Core Functions ---

    /**
     * Toggles between the login and signup forms.
     * @param {string} formId The ID of the form to show ('login-form' or 'signup-form').
     */
    function toggleForms(formId) {
        // 1. Reset Error Message
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';

        // 2. Handle Form Visibility
        if (formId === 'login-form') {
            loginForm.classList.add('active');
            signupForm.classList.remove('active');
            loginToggle.classList.add('active');
            signupToggle.classList.remove('active');
        } else {
            loginForm.classList.remove('active');
            signupForm.classList.add('active');
            loginToggle.classList.remove('active');
            signupToggle.classList.add('active');
        }
    }

    /**
     * Displays a temporary error message in the dedicated block.
     * @param {string} message The error message to display.
     */
    function displayError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        // Optionally hide the error after a few seconds
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    // --- Event Listeners ---

    // Toggle button clicks
    loginToggle.addEventListener('click', () => toggleForms('login-form'));
    signupToggle.addEventListener('click', () => toggleForms('signup-form'));


    // Login Form Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-username').value; // Using username input for email
        const password = document.getElementById('login-password').value;

        // Client-side validation check
        if (!email || !password) {
             return displayError('Please enter both email/username and password.');
        }

        try {
            const response = await fetch(API_ENDPOINTS.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Successful Login (Status 200)
                // Store user data in localStorage for session management
                localStorage.setItem('currentUser', JSON.stringify(data.user));

                alert('Login successful! Welcome, ' + data.user.name + '!');

                // --- REDIRECTION LOGIC ---
                window.location.href = HOME_PAGE_URL;
            } else {
                // Failed Login (Status 401/400/etc)
                displayError(data.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login Fetch Error:', error);
            displayError('Could not connect to the server. Check your network.');
        }
    });

    // Signup Form Submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('signup-email').value;
        const name = document.getElementById('signup-username').value; // Mapped to name
        const password = document.getElementById('signup-password').value;

        // Client-side validation check
        if (password.length < 8) {
            displayError('Password must be at least 8 characters long.');
            return;
        }

        try {
            const response = await fetch(API_ENDPOINTS.register, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Successful Signup (Status 201 Created)
                // Store user data in localStorage for session management
                localStorage.setItem('currentUser', JSON.stringify(data.user));

                alert('Account created successfully! Welcome!');

                // --- REDIRECTION LOGIC ---
                window.location.href = HOME_PAGE_URL;
            } else {
                // Failed Signup (Status 409 Conflict, 400 Bad Request, etc.)
                displayError(data.message || 'Registration failed. Please check your inputs.');
            }
        } catch (error) {
            console.error('Signup Fetch Error:', error);
            displayError('Could not connect to the server. Check your network.');
        }
    });

    // OAuth button simulation (optional)
    document.querySelectorAll('.btn-oauth').forEach(button => {
        button.addEventListener('click', (e) => {
            const provider = e.currentTarget.textContent.trim();
            alert(`Redirecting to ${provider} for OAuth authentication...`);
            // **Add actual OAuth redirection logic here**
        });
    });

    // Ensure the correct form is active on page load
    toggleForms('login-form');
});
