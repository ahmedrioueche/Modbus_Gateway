document.addEventListener('DOMContentLoaded', async () => {

    const status =  {
        VALID: "no error",
        INVALID: "invalid",
        VOID: "void",
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

    const container = document.querySelector(".input-list");
    const networkIpEl = document.getElementById("input1");
    const networkMaskEl = document.getElementById("input2");
    const networkGatewayEl = document.getElementById("input3");

    //get opened device id
    const deviceId = await getConfigDeviceId();
    //get stored devices
    let storedDevices = JSON.parse(localStorage.getItem('devices')) || [];
    const existingDeviceIndex = storedDevices.findIndex(device => device.id === deviceId);

    if (existingDeviceIndex !== -1) {
        networkIpEl.value = storedDevices[existingDeviceIndex].networkIP;
        networkMaskEl.value = storedDevices[existingDeviceIndex].networkMask; 
        networkGatewayEl.value = storedDevices[existingDeviceIndex].networkGateway; 
    } 

    document.getElementById("save-button").addEventListener("click", () => {
        const configData = {
            networkIP: networkIpEl.value,
            networkMask: networkMaskEl.value,
            networkGateway: networkGatewayEl.value,
        }

        let result = checkUserData(configData);
        console.log("result", result)
        if(result === status.VALID){
            saveAdminData(configData);
            sendAdminData(configData); //send admin config data via usb
            window.mainAPI.closeWindow(1); //config window index = 1
        }
    });


    function checkUserData(){
        
        let result = status.VALID;
        document.querySelectorAll('.input-item').forEach(inputItem => {
            const value = inputItem.querySelector('.input-field').value;            
            const errorDiv = inputItem.querySelector(".error");
            if (errorDiv) {
                errorDiv.remove();
            }

            if (!value) {
                const newErrorDiv = document.createElement("div");
                newErrorDiv.classList.add("error");
                newErrorDiv.textContent = "Please fill in this field";
                inputItem.appendChild(newErrorDiv);
                newErrorDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
                result = status.VOID;
                return;                
            } else if (!isValidInput(value)) {
                const newErrorDiv = document.createElement("div");
                newErrorDiv.classList.add("error");
                newErrorDiv.textContent = "Please check the integrity of the data";
                inputItem.appendChild(newErrorDiv);
                result = status.INVALID
                return;                
            }
        });

        return result;
    }

    function sendAdminData(configData){
        const index = storedDevices.findIndex(device => device.id === deviceId)
        const device = storedDevices[index];
        configData.macAddress = device.macAddress;
        console.log("configData", configData);
        window.serialAPI.sendAdminConfigData(configData);
        // window.serialAPI.sendDeviceName(deviceName);
    }

    function saveAdminData(networkData){
        
        if (existingDeviceIndex !== -1) {
            storedDevices[existingDeviceIndex].networkIP = networkData.networkIP;
            storedDevices[existingDeviceIndex].networkMask = networkData.networkMask;
            storedDevices[existingDeviceIndex].networkGateway = networkData.networkGateway;
        }
          
        localStorage.setItem('devices', JSON.stringify(storedDevices));
    }
    
    async function getConfigDeviceId(){
        const configDevice = await window.serialAPI.getOpenedDevice();
        const deviceId = `${configDevice.vendorId}-${configDevice.productId}`;
        return deviceId;
    }

    function formatAddress(address){
       return address.map(byte => byte.toString(16)).join(':').toUpperCase();
    }

    function isValidInput(input){
        if(input === undefined || input === '[object Object]')
            return false;

        const IpSegments = input.split('.');
        if (IpSegments.length !== 4) {
            return false;
        }

        for (const segment of IpSegments) {
            const numSegment = Number(segment);
            if (segment === "" || isNaN(numSegment) || !Number.isInteger(numSegment) || numSegment < 0 || numSegment > 255) {
                return false;
            }
        }
        return true;
    }
    
    document.getElementById("previous-button").addEventListener("click", () => {
        window.location.href = "admin-config.html"
    })
})