const API_BASE_URL = 'http://localhost:8080/api/v1';

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

const formatErrorMessage = (errorData) => {
    let message = errorData.title || 'An error occurred';

    if (errorData.detail) {
        message = errorData.detail;
    }

    // Handle validation errors
    if (errorData.validation_errors && Array.isArray(errorData.validation_errors)) {
        const validationMessages = [];
        errorData.validation_errors.forEach(errorObj => {
            Object.keys(errorObj).forEach(field => {
                const fieldError = errorObj[field];
                if (fieldError.translation) {
                    validationMessages.push(`${field}: ${fieldError.translation}`);
                }
            });
        });

        if (validationMessages.length > 0) {
            message = validationMessages.join('\n');
        }
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
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

// Login functionality
document.getElementById('loginButton').addEventListener('click', async function() {
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
        showError(error.message || 'Login failed. Please try again.');
    } finally {
        showLoading(false);
    }
});

// Register functionality
document.getElementById('registerButton').addEventListener('click', function() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
});

document.getElementById('backToLogin').addEventListener('click', function() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});

document.getElementById('submitRegister').addEventListener('click', async function() {
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
        showError(error.message || 'Registration failed. Please try again.');
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
