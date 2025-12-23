document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgot_password-form');
    const errorMessage = document.getElementById('auth-error');
    const successMessage = document.getElementById('auth-success');

    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('reset-email').value;
        
        // Reset displays
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');

        try {
            const response = await fetch('/api/v1/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email:email })
            });

            const data = await response.json();

if (response.ok) {
    forgotForm.classList.add('hidden'); // Use existing CSS class
    successMessage.textContent = data.message;
    successMessage.classList.remove('hidden');
} else {
    // This will now show the actual error message from Flask
    errorMessage.textContent = data.message; 
    errorMessage.classList.remove('hidden');
}
        } catch (error) {
            errorMessage.textContent = 'Connection error. Please try again later.';
            errorMessage.classList.remove('hidden');
        }
    });
});