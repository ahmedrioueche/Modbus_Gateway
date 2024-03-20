document.addEventListener('DOMContentLoaded', () => {
    //open search window
    document.getElementById("search-button").addEventListener("click", () => {
        console.log("search");
        window.mainAPI.createSearchWindow();
    })

    //select a device from search result
    let selectedRow;
    let configureButton = document.getElementById("configure-button");
    const deviceRows = document.querySelectorAll('.table-row');

    deviceRows.forEach(row => {
        row.addEventListener('click', () => {
            if (selectedRow) {
                selectedRow.classList.remove('selected-row');
                configureButton.setAttribute("disabled", "true");
                selectedRow = null;
            }
            else {
                selectedRow = row;
                selectedRow.classList.add('selected-row');
                configureButton.removeAttribute("disabled");
            }

            const deviceId = row.id;
            const deviceName = row.querySelector('#column-2').textContent;
            const deviceModel = row.querySelector('#column-3').textContent;
            const deviceMac = row.querySelector('#column-4').textContent;
            const deviceIp = row.querySelector('#column-5').textContent;
            const deviceStatus = row.querySelector('#column-6').textContent;

        });
    });
    configureButton.addEventListener("click", () => {
        console.log("config");
        if (selectedRow && !configureButton.disabled) {
            window.mainAPI.createConfigWindow();
        }
    });

    document.getElementById("exit-button").addEventListener("click", () => {
        //Todo: save data
        window.mainAPI.closeMainWindow();
    })

    document.getElementById("settings-button").addEventListener("click", () => {
        window.mainAPI.createSettingsWindow();
    })
});