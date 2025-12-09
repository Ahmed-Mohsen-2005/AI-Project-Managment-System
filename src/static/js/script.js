document.addEventListener('DOMContentLoaded', () => {
    // NOTE: HOME_PAGE_URL is now set as a global variable in the HTML using Jinja:
    // const HOME_PAGE_URL = "{{ url_for('homepage') }}"; 

    // --- Element Selectors ---
    const loginToggle = document.getElementById('login-toggle');
    const signupToggle = document.getElementById('signup-toggle');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const errorMessage = document.getElementById('auth-error');

    // ... (toggleForms and displayError functions remain the same) ...

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


    // Login Form Submission 🚀
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        // Simple validation/simulation
        if (username.length < 3 || password.length < 6) {
            displayError('Invalid credentials. Please check your username/email and password.');
        } else {
            // Success Simulation:
            alert('Login successful! Redirecting to home page...');
            
            // --- REDIRECTION LOGIC USING GLOBAL JINJA VARIABLE ---
            window.location.href = HOME_PAGE_URL;
            // -----------------------------------------------------
        }
    });

    // Signup Form Submission 🚀
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        // Simple validation/simulation
        if (password.length < 8) {
            displayError('Password must be at least 8 characters long.');
            return;
        }

        // Success Simulation:
        alert('Account created successfully! Redirecting to home page...');
        
        // --- REDIRECTION LOGIC USING GLOBAL JINJA VARIABLE ---
        window.location.href = HOME_PAGE_URL;
        // -----------------------------------------------------
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