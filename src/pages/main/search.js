document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("cancel-button").addEventListener('click', () => {
        window.mainAPI.closeSearchWindow();
    });

    const progressContainer = document.getElementById('progress-container');
    progressContainer.style.display = 'block';
    simulateSearch();
});

function simulateSearch() {
    
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');

    progressBar.style.width = '0';

    const animationDuration = 2000;

    setTimeout(() => {
        progressBar.style.width = '100%';
    }, 0);

    setTimeout(() => {
        progressContainer.style.display = 'none';
        window.mainAPI.closeSearchWindow();
    }, animationDuration);
}

