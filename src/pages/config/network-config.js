document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.input-item').forEach(inputItem => {
        const errorDiv = inputItem.querySelector(".error");
        if(errorDiv)
        errorDiv.remove();
    })

    const selectedMode = localStorage.getItem("selectedMode");
    if (selectedMode == "RTU server mode") {
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

            inputItem.appendChild(inputlabel);
            inputItem.appendChild(inputBox);
            inputList.appendChild(inputItem);
        }
    }
    
    const networkData = JSON.parse(localStorage.getItem("networkData")) || [];

    networkData.forEach(item => {
        const inputField = document.getElementById(item.id);
        if (inputField) {
            inputField.value = item.value;
        }
    });   

    document.getElementById("save-button").addEventListener("click", () => {

        if(checkNetworkData()){
            saveNetworkData();
            sendConfigData();
            window.mainAPI.closeConfigWindow();
        }
    });
});


function sendConfigData(){
    const selectedMode = localStorage.getItem("selectedMode");
    const UartConfigData = JSON.parse(localStorage.getItem("UartConfigData"));
    const slaveId = JSON.parse(localStorage.getItem("slaveId"));
    const networkData = JSON.parse(localStorage.getItem("networkData"));

    const configBuffer = []
    configBuffer.push(selectedMode);

    const selectElementIds = ["select-baud", "select-parity", "select-stopbit", "select-databits"]; 
    selectElementIds.forEach(id => {
        if (UartConfigData[id]) {
            configBuffer.push(UartConfigData[id]);
        }
    });
    configBuffer.push(slaveId);

    networkData.forEach(item => {
        configBuffer.push(item.value);
    });

    window.serialAPI.getConfigData(configBuffer);
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
            dataValid = false;
        } else if (!isValidInput(value)) {
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            newErrorDiv.textContent = "Please check the integrity of the data";
            inputItem.appendChild(newErrorDiv);
            dataValid = false;
        }
    });

    return dataValid;
}


function saveNetworkData(){
    const inputData = [];
    document.querySelectorAll('.input-item').forEach(inputItem => {
        const id = inputItem.querySelector('.input-field').id;
        const value = inputItem.querySelector('.input-field').value;
        inputData.push({ id, value });
    });
    localStorage.setItem("networkData", JSON.stringify(inputData));
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