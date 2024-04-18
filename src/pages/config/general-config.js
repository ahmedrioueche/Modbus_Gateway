document.addEventListener("DOMContentLoaded", async ()=> {
    
    let deviceId = await getConfigDeviceId();
    let storedDevices = JSON.parse(localStorage.getItem('devices')) || [];
    let defaultDeviceConfig = JSON.parse(localStorage.getItem('defaultDeviceConfig')) || [];
    console.log("storedDevices", storedDevices);

    let deviceMacAddress, deviceName;
    
    const existingDeviceIndex = storedDevices.findIndex(device => device.id === deviceId);
    if (existingDeviceIndex !== -1) {

        deviceMacAddress = storedDevices[existingDeviceIndex].macAddress;
        deviceName = storedDevices[existingDeviceIndex].name;
        document.getElementById("input2").value = deviceName;
    } 

    document.getElementById("input1").value = deviceId;

    function saveConfigDevice(){
        //save device's name and id in deviceList in local storage
        let deviceName = document.getElementById("input2").value;
        const existingDeviceIndex = storedDevices.findIndex(device => device.id === deviceId);

        if (existingDeviceIndex !== -1) {
            storedDevices[existingDeviceIndex].name = deviceName;
        } else {
            storedDevices.push({ 
                id: deviceId, 
                name: deviceName, 
                mode: "RTU Server Mode",
                baudrate: "9600",
                parity: "None",
                stopBits: "1",
                dataSize: "8",
                macAddress: deviceMacAddress,
                slaveID: defaultDeviceConfig.slaveID,
                networkIP: defaultDeviceConfig.networkIP,
                networkMask: defaultDeviceConfig.networkMask,
                networkGateway: defaultDeviceConfig.networkGateway,
                remoteIP: defaultDeviceConfig.remoteIP,
            });       
        }
        localStorage.setItem('devices', JSON.stringify(storedDevices));
    }

    async function getConfigDeviceId(){
        const configDevice = await window.serialAPI.getOpenedDevice();
        const deviceId = `${configDevice.deviceDescriptor.idVendor}-${configDevice.deviceDescriptor.idProduct}`;
        return deviceId;
    }

    document.getElementById("next-button").addEventListener("click", () => {
        //save device's name and id in deviceList in local storage
        saveConfigDevice();
        window.location.href = "mode-config.html"
    });
    
    document.getElementById("cancel-button").addEventListener("click", () => {
        window.mainAPI.closeConfigWindow();
    })
    
    document.getElementById("factory-reset-button").addEventListener("click", () => {
        //open factory reset dialog window
        window.mainAPI.createConfigDialogWindow();
    })
});
