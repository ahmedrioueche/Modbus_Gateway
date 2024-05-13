document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("cancel-button").addEventListener('click', () => {
        window.mainAPI.closeSearchWindow();
    });
    document.getElementById("search-button").addEventListener('click', () => {
        window.mainAPI.resizeWindow();
        window.location.href = "search.html";
    });

    const radioBroadcast = document.getElementById('radio1');
    const radioSpecificIP = document.getElementById('radio2');
    const ipInput = document.querySelector('.input-box');

    radioBroadcast.addEventListener('change', function () {
        console.log("disable");
        ipInput.disabled = true;
    });

    radioSpecificIP.addEventListener('change', function () {
        console.log("enable");
        ipInput.disabled = false;
    });
});
