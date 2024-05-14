document.addEventListener('DOMContentLoaded', async () => {
    
    let storedDevices = JSON.parse(localStorage.getItem('devices')) || [];
    let deviceId = await getConfigDeviceId();
    const modeElements = document.getElementsByName("mode");
    const existingDeviceIndex = storedDevices.findIndex(device => device.id === deviceId);
    if (existingDeviceIndex !== -1) {
        getSelectedMode(storedDevices[existingDeviceIndex].mode);
    } 

    function getSelectedMode(selectedMode) {
        for (let i = 0; i < modeElements.length; i++) {
            let modeLabel = document.querySelector(`[for=${modeElements[i].id}]`).textContent;
            if (selectedMode === modeLabel) {
                console.log("match")
                modeElements[i].checked = true;
            }
        }
    }
    
    function saveSelectedMode() {
        let selectedMode; let selectedModeLabel;
        for (let i = 0; i < modeElements.length; i++) {
            if (modeElements[i].checked) {
                selectedMode = modeElements[i].value;
                selectedModeLabel = document.querySelector(`[for=${modeElements[i].id}]`);
                console.log("checked:", selectedModeLabel.textContent);
                storedDevices[existingDeviceIndex].mode = selectedModeLabel.textContent;
            }
        }
        localStorage.setItem('devices', JSON.stringify(storedDevices));
    }

    document.getElementById("next-button").addEventListener("click", () => {
        saveSelectedMode();
        window.location.href = "serial-config.html";
    })
    document.getElementById("previous-button").addEventListener("click", () => {
        saveSelectedMode();
        window.location.href = "general-config.html";
    })
});


async function getConfigDeviceId(){
    const configDevice = await window.serialAPI.getOpenedDevice();
    const deviceId = `${configDevice.vendorId}-${configDevice.productId}`;
    return deviceId;
}

