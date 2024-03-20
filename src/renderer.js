const loginButton = document.getElementById('login-button');

if (loginButton) {
    loginButton.addEventListener('click', () => {
        // Open the second window/page
        window.location.href = "C:/dev/electron/test/my-app/src/pages/main/main.html";
    });
}
