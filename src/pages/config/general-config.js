document.addEventListener("DOMContentLoaded", async ()=> {

   //retreive deviceList from local storage
   let storedDevices = JSON.parse(localStorage.getItem('devices')) || [];
    //get device from serialAPI
    let deviceId = await getConfigDevice();
    document.getElementById("input1").value = deviceId;
    //if device is in deviceList
    const existingDeviceIndex = storedDevices.findIndex(device => device.id === deviceId);
    if (existingDeviceIndex !== -1) {
        document.getElementById("input2").value = storedDevices[existingDeviceIndex].name;
    } 
    
    document.getElementById("next-button").addEventListener("click", () => {
        //save device's name and id in deviceList in local storage
        saveConfigDevice();
        window.location.href = "mode-config.html"
    });
    
    document.getElementById("cancel-button").addEventListener("click", () => {
        window.mainAPI.closeConfigWindow();
    })
    

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
                slaveID: null,
                networkIP: null,
                networkMask: null,
                networkGateway: null,
                remoteIP: null,
            });       
        }
        localStorage.setItem('devices', JSON.stringify(storedDevices));
    }

    async function getConfigDevice(){
        const configDevice = await window.serialAPI.getOpenedDevice();
        const deviceId = `${configDevice.deviceDescriptor.idVendor}-${configDevice.deviceDescriptor.idProduct}`;
        return deviceId;
    }
});
