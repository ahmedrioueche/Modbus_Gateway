document.addEventListener('DOMContentLoaded', async () => {
    let configDevice;

    document.querySelectorAll('.input-item').forEach(inputItem => {
        const errorDiv = inputItem.querySelector(".error");
        if(errorDiv)
          errorDiv.remove();
    })

    let selectedMode, networkIP, networkMask, networkGateway, remoteIP;
    let storedDevices = JSON.parse(localStorage.getItem('devices')) || [];
    let deviceId = await getConfigDeviceId();
    const deviceIndex = storedDevices.findIndex(device => device.id === deviceId);
    if (deviceIndex !== -1) {
        selectedMode = storedDevices[deviceIndex].mode;
        getNetworkData();
    } 


    if (selectedMode == "RTU Server Mode") {
        const inputList = document.querySelector(".input-list");
        const remoteIpItem = inputList.querySelector('.input-item#input4');

        if (!remoteIpItem) {
            const inputItem = document.createElement("div");
            inputItem.classList.add("input-item");
        
            const inputlabel = document.createElement("label");
            inputlabel.textContent = "Remote IP address";
            inputlabel.classList.add("input-label");
            inputlabel.setAttribute("for", "input4"); 
    
            const inputBox = document.createElement("input");
            inputBox.classList.add("input-field");
            inputBox.setAttribute("id", "input4");
            inputBox.setAttribute("placeholder", "example:192.168.1.5");
            inputBox.value = remoteIP;
            inputItem.appendChild(inputlabel);
            inputItem.appendChild(inputBox);
            inputList.appendChild(inputItem);
        }
    }

    document.getElementById("input1").value = networkIP;
    document.getElementById("input2").value = networkMask;
    document.getElementById("input3").value = networkGateway;

    document.getElementById("save-button").addEventListener("click", () => {

        if(checkNetworkData()){
            saveNetworkData();
            sendConfigData();
            window.mainAPI.closeWindow(1); //config window index = 1
        }
    });

    document.getElementById("previous-button").addEventListener('click', () => {
        window.location.href = "serial-config.html"
    })

    async function sendConfigData(){
        
        let configBuffer = []
        configBuffer.push(storedDevices[deviceIndex].id);
        configBuffer.push(storedDevices[deviceIndex].mode);
        configBuffer.push(storedDevices[deviceIndex].baudrate);
        configBuffer.push(storedDevices[deviceIndex].parity);
        configBuffer.push(storedDevices[deviceIndex].stopBits);
        configBuffer.push(storedDevices[deviceIndex].dataSize);
        configBuffer.push(storedDevices[deviceIndex].slaveID);
        configBuffer.push(storedDevices[deviceIndex].networkIP);
        configBuffer.push(storedDevices[deviceIndex].networkMask);
        configBuffer.push(storedDevices[deviceIndex].networkGateway);
        if (selectedMode == "RTU Server Mode") 
          configBuffer.push(storedDevices[deviceIndex].remoteIP);

        window.serialAPI.sendConfigData(configBuffer, configDevice);
    }

    function saveNetworkData(){
        storedDevices[deviceIndex].networkIP = document.getElementById("input1").value;
        storedDevices[deviceIndex].networkMask =  document.getElementById("input2").value;
        storedDevices[deviceIndex].networkGateway =  document.getElementById("input3").value;
        if (selectedMode == "RTU Server Mode") 
            storedDevices[deviceIndex].remoteIP =  document.getElementById("input4").value;

        localStorage.setItem('devices', JSON.stringify(storedDevices));
    }

    function getNetworkData(){
        networkIP = storedDevices[deviceIndex].networkIP;
        networkMask = storedDevices[deviceIndex].networkMask;
        networkGateway = storedDevices[deviceIndex].networkGateway;
        remoteIP = storedDevices[deviceIndex].remoteIP;
    }

    function checkNetworkData() {
        let dataValid = true;
        
        document.querySelectorAll('.input-item').forEach(inputItem => {
            const value = inputItem.querySelector('.input-field').value;
            const id = inputItem.querySelector('.input-field').id;
            console.log("value", value)
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
                dataValid = false;
            } else if (!isValidInput(value)) {
                const newErrorDiv = document.createElement("div");
                newErrorDiv.classList.add("error");
                newErrorDiv.textContent = "Please check the integrity of the data";
                inputItem.appendChild(newErrorDiv);
                newErrorDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
                dataValid = false;
            }
        });

        return dataValid;
    }
    async function getConfigDeviceId(){
        configDevice = await window.serialAPI.getOpenedDevice();
        const deviceId = `${configDevice.vendorId}-${configDevice.productId}`;
        return deviceId;
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

});

