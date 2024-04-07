const { usb } = require('usb');
const { findByIds } = require('usb');
usb.setDebugLevel(3)

const CONFIG_HEADER = [0xAA, 0xBB, 0xCC, 0xDD];
const START_SIGNAL = [0xFF, 0x33, 0xCC, 0x55];
const STOP_SIGNAL = [0x44, 0x55, 0x66, 0xBB];
const configStartIndex = CONFIG_HEADER.length;
const configBuffToSend = [];
const MIN_CONFIG_SIZE = 18;
const PACKET_IDENTIFIER_LENGTH = 3
const PACKET_IDENTIFIER = [0x61, 0x62, 0x63]

function getConfigData(configBuffer) {
    console.log("configBuffer", configBuffer);

    configBuffToSend.length = 0;
    
    for(let i = 0; i < CONFIG_HEADER.length; i++){
        configBuffToSend[i] = CONFIG_HEADER[i];
    }
    const deviceId = configBuffer[0];
    const selectedMode = configBuffer[1];
    console.log('selectedMode', selectedMode)
    const UartBaud = configBuffer[2];
    const UartParity = configBuffer[3];
    const UartStopBits= configBuffer[4];
    const UartDataSize = configBuffer[5];   
    const slaveId    =  configBuffer[6];
    const networkIP = configBuffer[7];
    const networkMask = configBuffer[8];
    const networkGateway = configBuffer[9];
    const networkRemoteIP = configBuffer[10];

    configBuffToSend[configStartIndex] = MIN_CONFIG_SIZE;
    configBuffToSend[configStartIndex + 1] = selectedMode === "RTU Server Mode"? 1 : 2;
    switch(UartBaud){
        case '2400':
            configBuffToSend[configStartIndex + 2] = 1;
            break;
        case '9600':
            configBuffToSend[configStartIndex + 2] = 2;
            break;
        case '19200':
            configBuffToSend[configStartIndex + 2] = 3;
            break;
        case '38400':
            configBuffToSend[configStartIndex + 2] = 4;
            break;
        case '115200':
            configBuffToSend[configStartIndex + 2] = 5;
            break;
    }
    switch(UartParity){
        case 'None':
            configBuffToSend[configStartIndex + 3] = 0;
            break;
        case 'Odd':
            configBuffToSend[configStartIndex + 3] = 1;
            break;
        case 'Even':
            configBuffToSend[configStartIndex + 3] = 2;
            break;
    }

    configBuffToSend[configStartIndex + 4] = parseInt(UartStopBits);
    configBuffToSend[configStartIndex + 5] = UartDataSize == '8'? 1 : 2;
    configBuffToSend[configStartIndex + 6] = slaveId;

    insertIPIntoArray(networkIP, configBuffToSend, configStartIndex + 7);
    insertIPIntoArray(networkMask, configBuffToSend, configStartIndex + 11);
    insertIPIntoArray(networkGateway, configBuffToSend, configStartIndex + 15);
    if(selectedMode == 'RTU Server Mode'){
        configBuffToSend[configStartIndex] += 4;
        insertIPIntoArray(networkRemoteIP, configBuffToSend, configStartIndex + 19);
    }

    usbSendConfigData(configBuffToSend, deviceId);
}

function usbSendConfigData(configBuffToSend, deviceId){

    const receiveBuffer = [];
    const [idVendor, idProduct] = deviceId.split('-');
    const device = findByIds(Number(idVendor), Number(idProduct));
    if (device) {
        usbSendData(device, configBuffToSend);
        //usbReceiveData(device, receiveBuffer);
    }
    else {
        console.log("Error: couldn't find device");
    }
}
let startSignal = false; let usbDevice;
function usbSendStartSignal(openedDevice){
    usbDevice = openedDevice;
    const receiveBuffer = [];
    const [idVendor, idProduct] = [openedDevice.deviceDescriptor.idVendor, openedDevice.deviceDescriptor.idProduct];
    const device = findByIds(Number(idVendor), Number(idProduct));

    if (device) {
        usbSendData(device, START_SIGNAL);
        usbReceiveData(device);
        console.log("receiveBuffer START", receiveBuffer);
    } else {
        console.log("Error: couldn't find device");
    }

    startSignal = true;

}

function usbSendStopSignal(openedDevice){

    const [idVendor, idProduct] = [openedDevice.deviceDescriptor.idVendor, openedDevice.deviceDescriptor.idProduct];
    const device = findByIds(Number(idVendor), Number(idProduct));

    if (device) {
        usbSendData(device, STOP_SIGNAL);
        startSignal = false;
    }
    else {
        console.log("Error: couldn't find device");
    }
 
}

const ENDPOINT_OUT = 0x01;
const ENDPOINT_IN = 0x81;

function usbSendData(device, data) {
    try {
        device.open();
        const interface = device.interfaces[0];
        interface.claim();

        const dataToSend = Buffer.from(data);

        interface.endpoint(ENDPOINT_OUT).transfer(dataToSend, (error) => {
            if (error) {
                console.error('Error sending data:', error);
            } else {
                console.log('Data sent successfully');
            }

        }); 
    } catch (error) {
        console.error('Error sending data:', error);
    }
}   

function usbReceiveData(device) {

    try {
        const interface = device.interfaces[0];
        interface.endpoint(ENDPOINT_IN).startPoll(3, 100);
        interface.endpoint(ENDPOINT_IN).on('data', data => {
            buffer = Array.from(data);
            console.log("receiveBuffer", buffer );
            usbHandleReceivedData(device, buffer);   
        });
        
    } catch (error) {
        console.error('Error receiving data:', error);
    }
}

function usbHandleReceivedData(device, buffer){
    const interface = device.interfaces[0];
    interface.endpoint(0x81).stopPoll();
    //device.close();
    const packetBuffer = []
    if(isDataPacket(buffer)){
        for(let i=0; i<buffer.length; i++){
            packetBuffer[i] = buffer[i];
        }
    }
    console.log("packetBuffer in .js", packetBuffer)
    process.emit("data", packetBuffer)
}

function isDataPacket(buffer){

    /*
    for(let i=0; i<PACKET_IDENTIFIER_LENGTH; i++){
        if(buffer[i] !== PACKET_IDENTIFIER[i])
            return false;
    }*/
    return true;
}


function insertIPIntoArray(ipAddress, array, startIndex) {
    let byteValues = ipAddress.split('.').map(part => parseInt(part));
    array.splice(startIndex, 0, ...byteValues);
}


module.exports.getConfigData = getConfigData;
module.exports.usbSendStartSignal = usbSendStartSignal;
module.exports.usbSendStopSignal = usbSendStopSignal;

//TODO
//send data from main to diagnose and display it
//fix FREERTOS issue!
//set password
//update settings window
//add help window
