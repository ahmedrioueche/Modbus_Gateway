document.addEventListener('DOMContentLoaded', () => {
    const GATEWAY_ID = 1155; //USB VENDOR ID

    window.onload = getListConnectedDevices();
    let storedDevices = JSON.parse(localStorage.getItem('devices')) || [];

    
    window.serialAPI.serialPortsUpdate((addedDevices, removedDevices) => {

        removedDevices.forEach(device => {
            const deviceId = `${device.vendorId}-${device.productId}`;
            removeUsbDeviceUI(deviceId);
        });
        getListConnectedDevices(addedDevices);
    })

    function listConnectedDevices(connectedDevices){
        console.log("connectedDevices", connectedDevices)
        connectedDevices.forEach(usbDevice => {
            const deviceId = `${usbDevice.vendorId}-${usbDevice.productId}`;
            if(isDeviceMyDevice(usbDevice) && !isDeviceListed(deviceId)){   
                createUsbDeviceUI(usbDevice);
            }
        });
    }

    async function getListConnectedDevices(){
        const connectedDevices = await window.serialAPI.getConnectedDevices();
        listConnectedDevices(connectedDevices);
    }
    
    function isDeviceMyDevice(usbDevice){
            return true;
        //return usbDevice.vendorId === GATEWAY_ID;
    }

    function isDeviceListed(deviceId){
        return document.getElementById(deviceId) !== null;
    }

    
    const configureButton = document.getElementById("configure-button");
    const diagnoseButton = document.getElementById("diagnose-button");

    let selectedDevice;
    function createUsbDeviceUI(usbDevice){
       const deviceId = `${usbDevice.vendorId}-${usbDevice.productId}`;

        const deviceDetailsContainer = document.getElementById('device-container');
        const deviceDetails = document.createElement("div");
        deviceDetails.setAttribute("class", "device-row");
        deviceDetails.setAttribute("id", deviceId);
        deviceDetailsContainer.appendChild(deviceDetails);
        const col1 = document.createElement("div");
        const col2 = document.createElement("div");
        const col3 = document.createElement("div");
        col1.setAttribute("class", "column");
        col2.setAttribute("class", "column");
        col3.setAttribute("class", "column");

        col1.setAttribute("id", "column-1");
        col2.setAttribute("id", "column-2");
        col3.setAttribute("id", "column-3");

        deviceDetails.appendChild(col1);
        deviceDetails.appendChild(col2);
        deviceDetails.appendChild(col3);

        col1.textContent = deviceId;
        col2.textContent = "Unknown";
        const existingDeviceIndex = storedDevices.findIndex(device => device.id === deviceId);
        if(storedDevices && storedDevices !== undefined && storedDevices !== "[object Object]")
        if (existingDeviceIndex !== -1) {
            if(storedDevices[existingDeviceIndex].name !== "")
                col2.textContent = storedDevices[existingDeviceIndex].name;
        } 
        col3.textContent = "Ready"

        deviceDetails.addEventListener('click', () => {
            const devices = document.querySelectorAll(".device-row");
            devices.forEach(device => {
                if(device.id === deviceId){
                    device.classList.add('selected-row');
                    configureButton.disabled = false;  
                    diagnoseButton.disabled = false;
                    selectedDevice = usbDevice;
                }
                else {
                    device.classList.remove('selected-row');
                }
            })
        });
    }

    function removeUsbDeviceUI(deviceId){
        const deviceDetails = document.getElementById(deviceId);
        if(deviceDetails)
           deviceDetails.remove();
    }

    configureButton.addEventListener("click", () => {
        window.mainAPI.createConfigWindow(true); // admin config 
        console.log("selectedDevice in main_admin", selectedDevice)
        window.serialAPI.saveOpenedDevice(selectedDevice); //save the device thats being configured
    });

    diagnoseButton.addEventListener("click", () => {
        window.mainAPI.createDiagnosticsWindow();
        console.log("selectedDevice", selectedDevice)
        window.serialAPI.saveOpenedDevice(selectedDevice); //save the device thats being diagnosed
    })
    
    document.getElementById("refresh-button").addEventListener("click", async () => {
        const connectedDevices = await window.serialAPI.getConnectedDevices();
        listConnectedDevices(connectedDevices); 
        window.location.reload();
    })

    document.getElementById("settings-button").addEventListener("click", () => {
        window.mainAPI.createSettingsWindow();
    })

    document.getElementById("exit-button").addEventListener("click", () => {
        window.mainAPI.closeMainWindow();
    })


})
