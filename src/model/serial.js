const { SerialPort } = require('serialport');
const packetHandler = require('./packet.js')

const START_SIGNAL = [0xFF, 0x33, 0xCC, 0x55];
const STOP_SIGNAL = [0x44, 0x55, 0x66, 0xBB];
const FACTORY_RESET_SIGNAL = [0xF, 0xA, 0xC];
const MB_PACKET_IDENTIFIER_LENGTH = 3;

let isPollActive = false;
let port = null;
let lastPortList = [];
// Function to compare the current list of serial ports with the previous one
function comparePortLists(currentList) {
  
  const addedPorts = currentList.filter(port => !lastPortList.some(p => p.path === port.path));
  const removedPorts = lastPortList.filter(port => !currentList.some(p => p.path === port.path));
  
  if (addedPorts.length > 0 || removedPorts.length > 0) {
    const changedPorts = {
        addedPorts: addedPorts, 
        removedPorts: removedPorts,
    }
    process.emit("portChange", changedPorts);
  }
  
  lastPortList = currentList;
}


// Function to retrieve a list of serial ports
function getSerialPorts() {
    return SerialPort.list();
}

// Function to periodically check for changes in serial ports
function checkForPortChanges() {
    getSerialPorts()
        .then(comparePortLists)
        .catch(err => console.error('Error:', err))
        .finally(() => setTimeout(checkForPortChanges, 1000)); // Adjust the interval as needed
}


function usbSendConfigData(configBuffToSend, openedDevice){

    if (openedDevice && openedDevice.path) {
        if(!port){
            port = new SerialPort({
                path: openedDevice.path,
                baudRate: 9600,
            });
        }    
    }  
    usbSendData(port, configBuffToSend);
}


function usbSendStartSignal(openedDevice) {
    
    if (openedDevice && openedDevice.path) {
        if(!port || openedDevice.path !== port.settings.path ){
            console.log("open port in usbSendStartSignal", port)
            port = new SerialPort({
                path: openedDevice.path,
                baudRate: 9600,
            });
        }
    }  
    usbSendData(port, START_SIGNAL);
    if(!isPollActive)
       usbPoll(port);
}

function usbPoll(port){
    port.on("data", data =>{
        usbHandleReceivedData(Array.from(data));
    })
    isPollActive = true;
}

function usbSendStopSignal(openedDevice){

    if (openedDevice && openedDevice.path) {
        if(!port || openedDevice.path !== port.settings.path ){
            console.log("open port in usbSendStopSignal")
            port = new SerialPort({
                path: openedDevice.path,
                baudRate: 9600,
            });
        }    
    }  
    usbSendData(port, STOP_SIGNAL);
}

function usbSendAdminConfigData(openedDevice, configData) {

    if (openedDevice && openedDevice.path) {
        if(!port || openedDevice.path !== port.settings.path ){
            console.log("open port in usbSendAdminConfigData ")

            port = new SerialPort({
                path: openedDevice.path,
                baudRate: 9600,
            });
        }    
    }  
    let dataToSend = packetHandler.structureAdminConfigDataPacket(configData);
  
    if (port) {
        usbSendData(port, dataToSend);
    } else {
        console.log("Error: couldn't find device");
    }
}

function usbSendFactoryResetSignal(openedDevice){

    if (openedDevice && openedDevice.path) {
        if(!port || openedDevice.path !== port.settings.path ){
            port = new SerialPort({
                path: openedDevice.path,
                baudRate: 9600,
            });
        }    
    }  

    if (port) {
        usbSendData(port, FACTORY_RESET_SIGNAL);
    } else {
        console.log("Error: couldn't find device");
    }
}

function usbSendData(device, data) {
    try {
        device.write(data, err => {
            if (err) {
                console.error('Error writing to port:', err);
            } else {
                console.log('Data sent successfully.');
            }
        });
    } catch (error) {
        console.error('Error sending data:', error);
    }
}  

function usbStop(device) {
    console.log("stop")
    if(device.isOpen)
      device.close();
}

function usbHandleReceivedData(buffer){
    console.log("buffer", buffer);
    const packetBuffer = [];
    if(packetHandler.isDataMBPacket(buffer)){
        for(let i=0; i<buffer.length - MB_PACKET_IDENTIFIER_LENGTH; i++){
            packetBuffer[i] = buffer[MB_PACKET_IDENTIFIER_LENGTH + i];
        }
    }
    console.log("packetBuffer", packetBuffer)
    /*if(packetBuffer.length > 0)
      process.emit("data", packetBuffer);*/
      process.emit("data", buffer);

}

module.exports.checkForPortChanges = checkForPortChanges
module.exports.usbSendConfigData = usbSendConfigData
module.exports.usbSendStartSignal = usbSendStartSignal;
module.exports.usbSendStopSignal = usbSendStopSignal;
module.exports.usbStop = usbStop;
module.exports.usbSendAdminConfigData = usbSendAdminConfigData
module.exports.usbSendFactoryResetSignal = usbSendFactoryResetSignal
module.exports.usbStop = usbStop


