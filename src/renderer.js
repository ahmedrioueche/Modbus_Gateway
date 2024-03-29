const loginButton = document.getElementById('login-button');

if (loginButton) {
    loginButton.addEventListener('click', () => {
        // Open the second window/page
        window.location.href = "pages/main/main.html";
    });
}
