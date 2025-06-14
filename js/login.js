const API_BASE_URL = 'https://paw.nathakusuma.com/api/v1';

// Utility functions
const showError = (message) => {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
};

const showLoading = (show = true) => {
    const loadingDiv = document.getElementById('loadingMessage');
    loadingDiv.style.display = show ? 'block' : 'none';
};

// Clear field validation errors
const clearFieldErrors = () => {
    // Clear login form errors
    const loginInputs = document.querySelectorAll('#loginForm input');
    loginInputs.forEach(input => {
        input.style.borderColor = '';
        const errorElement = input.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    });

    // Clear register form errors
    const registerInputs = document.querySelectorAll('#registerForm input');
    registerInputs.forEach(input => {
        input.style.borderColor = '';
        const errorElement = input.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    });
};

// Show field-specific validation errors
const showFieldErrors = (validationErrors, formType = 'login') => {
    clearFieldErrors();

    if (!validationErrors || !Array.isArray(validationErrors)) {
        return;
    }

    validationErrors.forEach(errorObj => {
        Object.keys(errorObj).forEach(fieldName => {
            const fieldError = errorObj[fieldName];
            let inputElement;

            if (formType === 'register') {
                // Map field names for register form
                if (fieldName === 'email') {
                    inputElement = document.getElementById('regEmail');
                } else if (fieldName === 'password') {
                    inputElement = document.getElementById('regPassword');
                } else if (fieldName === 'name') {
                    inputElement = document.getElementById('regName');
                }
            } else {
                // Login form
                inputElement = document.getElementById(fieldName);
            }

            if (inputElement && fieldError.translation) {
                // Highlight the input field
                inputElement.style.borderColor = 'red';

                // Create and display error message
                const errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                errorElement.textContent = fieldError.translation;
                errorElement.style.color = 'red';
                errorElement.style.fontSize = '12px';
                errorElement.style.marginTop = '5px';
                errorElement.style.marginBottom = '10px';

                // Insert error message after the input
                inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
            }
        });
    });
};

const formatErrorMessage = (errorData) => {
    let message = errorData.title || 'An error occurred';

    if (errorData.detail) {
        message = errorData.detail;
    }

    // Don't show individual validation errors in alert if we have validation_errors array
    // The field errors will be shown below each field instead
    if (errorData.validation_errors && Array.isArray(errorData.validation_errors)) {
        return 'Please check the form for validation errors';
    }

    return message;
};

const makeApiCall = async (endpoint, method = 'GET', body = null, includeAuth = false) => {
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (includeAuth) {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
    }

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Handle 201 Created with empty body
        if (response.status === 201) {
            const text = await response.text();
            if (!text || text.trim() === '') {
                return {}; // Return empty object for successful creation
            } else {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    return {}; // Return empty object if JSON parsing fails
                }
            }
        }

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = formatErrorMessage(data);
            const error = new Error(errorMessage);
            error.validationErrors = data.validation_errors;
            throw error;
        }

        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

// Login functionality
document.getElementById('loginButton').addEventListener('click', async function() {
    clearFieldErrors();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }

    showLoading(true);

    try {
        const response = await makeApiCall('/auth/login', 'POST', {
            email,
            password
        });

        // Store authentication token and user info
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userInfo', JSON.stringify(response.user));

        // Redirect based on user role
        if (response.user.role === 'admin') {
            window.location.href = 'admin_dashboard.html';
        } else {
            window.location.href = 'user_dashboard.html';
        }
    } catch (error) {
        if (error.validationErrors) {
            showFieldErrors(error.validationErrors, 'login');
        } else {
            showError(error.message || 'Login failed. Please try again.');
        }
    } finally {
        showLoading(false);
    }
});

// Register functionality
document.getElementById('registerButton').addEventListener('click', function() {
    clearFieldErrors();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
});

document.getElementById('backToLogin').addEventListener('click', function() {
    clearFieldErrors();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});

document.getElementById('submitRegister').addEventListener('click', async function() {
    clearFieldErrors();

    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !password) {
        showError('Please fill in all fields');
        return;
    }

    if (password.length < 8) {
        showError('Password must be at least 8 characters long');
        return;
    }

    showLoading(true);

    try {
        const response = await makeApiCall('/auth/register', 'POST', {
            name,
            email,
            password
        });

        // Store authentication token and user info
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userInfo', JSON.stringify(response.user));

        // Redirect to user dashboard (new registrations are students by default)
        window.location.href = 'user_dashboard.html';
    } catch (error) {
        if (error.validationErrors) {
            showFieldErrors(error.validationErrors, 'register');
        } else {
            showError(error.message || 'Registration failed. Please try again.');
        }
    } finally {
        showLoading(false);
    }
});

// Check if user is already logged in
window.addEventListener('load', function() {
    const token = localStorage.getItem('authToken');
    const userInfo = localStorage.getItem('userInfo');

    if (token && userInfo) {
        try {
            const user = JSON.parse(userInfo);
            if (user.role === 'admin') {
                window.location.href = 'admin_dashboard.html';
            } else {
                window.location.href = 'user_dashboard.html';
            }
        } catch (error) {
            // Clear invalid data
            localStorage.removeItem('authToken');
            localStorage.removeItem('userInfo');
        }
    }
});
