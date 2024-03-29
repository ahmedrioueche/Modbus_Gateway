document.addEventListener('DOMContentLoaded', () => {

    const UartConfigData = JSON.parse(localStorage.getItem("UartConfigData")) || {};
    const slaveId = localStorage.getItem("slaveId") || {};
    const selectedMode = localStorage.getItem("selectedMode");
    let labelText = selectedMode === "RTU server mode"? "Slave ID" : "Remote Slave ID";

    const slaveIdInputItem = document.querySelector('.slave-item');
    const slaveIdInputLabel = document.getElementById('slave-id-span')
    const slaveIdInputField = document.getElementById("slave-id");
    slaveIdInputLabel.textContent = labelText;

    if(isValidInput(slaveId)){
        console.log("slaveId", slaveId)
        slaveIdInputField.value = slaveId;
    }

    const selectElements = document.querySelectorAll("select");
    selectElements.forEach(select => {
        const selectId = select.id;
        if (UartConfigData[selectId]) {
            select.value = UartConfigData[selectId];
        }
    });
    let errorDiv = null;
    document.getElementById("next-button").addEventListener('click', () => {
        if(checkData(slaveIdInputField.value)){
            console.log("slaveIdInputField.VALUE", slaveIdInputField.value)
            window.location.href = "network-config.html"

        }
       
    })


   // Save input data to localStorage when leaving the page
    window.addEventListener('beforeunload', () => {
        const UartValues = {}; let slaveId = null;
        const selectElements = document.querySelectorAll("select");

        selectElements.forEach(select => {
            UartValues[select.id] = select.value;
        });
        localStorage.setItem("UartConfigData", JSON.stringify(UartValues));

        if(slaveIdInputField.value){
            slaveId = slaveIdInputField.value;
            localStorage.setItem("slaveId", slaveId);
        }
    });

    function checkData(data){
        let dataValid = true;
        const errorDiv = slaveIdInputItem.querySelector(".error");
        if (errorDiv) {
            errorDiv.remove();
        }

        if (!data) {
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            newErrorDiv.textContent = "Please fill in this field";
            slaveIdInputItem.appendChild(newErrorDiv);
            dataValid = false;
        } else if (!isValidInput(data)) {
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            newErrorDiv.textContent = "Please check the integrity of the data";
            slaveIdInputItem.appendChild(newErrorDiv);
            dataValid = false;
        }
        return dataValid;
    }

    function isValidInput(input){
        if(input == "undefined" || input == '[object Object]')
            return false;

        const numValue = Number(input);
        return typeof numValue === 'number' && Number.isInteger(numValue);
    }
});

