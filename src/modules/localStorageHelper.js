function getDeviceData() {
    const storedDeviceData = JSON.parse(localStorage.getItem('deviceData'));
    return storedDeviceData || {}; // Return an empty object if data doesn't exist
}

// Set device data in local storage
function setDeviceData(deviceData) {
    localStorage.setItem('deviceData', JSON.stringify(deviceData));
}


export { getDeviceData, setDeviceData };