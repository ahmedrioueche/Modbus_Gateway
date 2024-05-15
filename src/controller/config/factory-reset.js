document.addEventListener("DOMContentLoaded", async ()=> {

    let deviceId = await getConfigDeviceId();
    let storedDevices = JSON.parse(localStorage.getItem('devices')) || [];
    let defaultDeviceConfig = JSON.parse(localStorage.getItem('defaultDeviceConfig')) || [];
    console.log("deviceId", deviceId)
    console.log("storedDevices", storedDevices)
    console.log("defaultDeviceConfig", defaultDeviceConfig)

    document.getElementById("factory-reset-button").addEventListener("click", () => {
        //send factory reset signal via usb
        window.serialAPI.sendFactoryResetSignal();
        //reaasign config data via localStorage
        resetStoredConfigData();
        console.log("storedDevices", storedDevices);
        //quit config window       
        window.mainAPI.closeConfigWindow();
        window.mainAPI.closeConfigDialogWindow();
    })

    function resetStoredConfigData(){
        const deviceIndex = storedDevices.findIndex(device => device.id === deviceId);
        const device = storedDevices[deviceIndex];
        for (const key in device) {
            if (device.hasOwnProperty(key) && key !== "id") {
                device[key] = defaultDeviceConfig[key];
            }
        }
        storedDevices[deviceIndex] = device;
        localStorage.setItem('devices', JSON.stringify(storedDevices));
    }

    async function getConfigDeviceId(){
        const configDevice = await window.serialAPI.getOpenedDevice();
        const deviceId = `${configDevice.vendorId}-${configDevice.productId}`;
        return deviceId;
    }

    document.getElementById("cancel-button").addEventListener("click", () => {
        window.mainAPI.closeWindow(2); //factory reset window index = 2
    })
})
 