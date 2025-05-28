document.getElementById('loginButton').addEventListener('click', function() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Placeholder for authentication logic
    if (username && password) {
        // Simulate authentication (in a real app, you would verify credentials with a server)
        if (username === 'admin' && password === 'admin123') {
            // Store user role in local storage
            localStorage.setItem('userRole', 'admin');
            window.location.href = 'admin_dashboard.html';
	} else if (username === 'user' && password === 'user123') {
            // Store user role in local storage
            localStorage.setItem('userRole', 'user');
	    window.location.href = 'user_dashboard.html';
        } else {
            alert('Invalid username or password');
        }
    } else {
        alert('Please enter both username and password');
    }
});
