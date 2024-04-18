document.addEventListener('DOMContentLoaded', async () => {
    const status =  {
        VALID: "no error",
        VOID_MAC_ADDRESS: "void MAC address",
        INVALID_MAC_ADDRESS: "invalid MAC address"
    }

    let defaultMacAddress = [0x00, 0x80, 0xE1, 0x00, 0x00, 0x55];
    let defaultDeviceConfig = {
        name:"MODBUS Gateway",
        mode: "RTU Server Mode",
        baudrate: "9600",
        parity: "None",
        stopBits: "1",
        dataSize: "8",
        macAddress: defaultMacAddress,
        slaveID: 5,
        networkIP: "192.168.5.10",
        networkMask: "255.255.255.0",
        networkGateway: "192.168.5.1",
        remoteIP: "192.168.5.20",
    }

    localStorage.setItem('defaultDeviceConfig', JSON.stringify(defaultDeviceConfig));

    const container = document.querySelector(".config-content");
    const macAddressInput = document.getElementById("macAddressInput");
    const deviceNameEl = document.getElementById("deviceName");

    //get opened device id
    const deviceId = await getConfigDeviceId();
    //get stored devices
    let storedDevices = JSON.parse(localStorage.getItem('devices')) || [];
    const existingDeviceIndex = storedDevices.findIndex(device => device.id === deviceId);
    if (existingDeviceIndex !== -1) {
        console.log("storedDevices[existingDeviceIndex].macAddress", storedDevices[existingDeviceIndex].macAddress)

        macAddressInput.value = formatAddress(storedDevices[existingDeviceIndex].macAddress);
        deviceNameEl.value = storedDevices[existingDeviceIndex].name; 
    } 
    else {
        macAddressInput.value = formatAddress(defaultMacAddress);
        deviceNameEl.value = defaultDeviceConfig.name;
    }

    document.getElementById("next-button").addEventListener("click", () => {
        const macAddressString = macAddressInput.value.trim();
        const macAddress = macAddressString.trim().split(/[:-]/);
        const deviceName = deviceNameEl.value.trim();
        
        console.log("macAddress", macAddress)
        let result = checkUserData(macAddressString, deviceName)
        if(result === status.VALID){
            saveUserData(macAddress, deviceName);
            window.location.href = "admin-network-config.html"
        }
        else {
            const macAddressDiv = document.getElementById("macAddress");
            const errorDivs = container.querySelectorAll(".error");
            if (errorDivs) {
                errorDivs.forEach(errorDiv => {
                    errorDiv.remove();
                })  
            }
    
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            if(result === status.VOID_MAC_ADDRESS){
                newErrorDiv.textContent = "Please fill in this field";
                macAddressDiv.appendChild(newErrorDiv);
            }
            else if(result === status.INVALID_MAC_ADDRESS){
                newErrorDiv.textContent = "Please check the integrity of the data";
                macAddressDiv.appendChild(newErrorDiv);
            }
        } 
    });


    function checkUserData(macAddress, deviceName){

        var macAddressRegex = /^(([0-9A-Fa-f]{2}|[0-9A-Fa-f]{1})[:-]){5}([0-9A-Fa-f]{2}|[0-9A-Fa-f]{1})$/;
        console.log("macAddress", macAddress)
        if(!macAddress)
            return status.VOID_MAC_ADDRESS;

        if (!macAddressRegex.test(macAddress)) {
            return status.INVALID_MAC_ADDRESS;
        }

        return status.VALID;
    }

    function saveUserData(macAddress, deviceName){
        
        if (existingDeviceIndex !== -1) {
            storedDevices[existingDeviceIndex].name = deviceName;
            storedDevices[existingDeviceIndex].macAddress = macAddress;
        }
        else {
            storedDevices.push({ 
                id: deviceId, 
                name: deviceName, 
                mode: "RTU Server Mode",
                baudrate: "9600",
                parity: "None",
                stopBits: "1",
                dataSize: "8",
                macAddress: macAddress,
                slaveID: 5,
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

    function formatAddress(address){
       return address.map(byte => byte.toString(16)).join(':').toUpperCase();
    }
    
    document.getElementById("cancel-button").addEventListener("click", () => {
        window.mainAPI.closeConfigWindow();
    })
})