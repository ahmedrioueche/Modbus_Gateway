const { usb } = require('usb');
const { findByIds } = require('usb');
usb.setDebugLevel(3)
const ENDPOINT_OUT = 0x01;
const ENDPOINT_IN = 0x81;

const CONFIG_HEADER = [0xAA, 0xBB, 0xCC, 0xDD];
const START_SIGNAL = [0xFF, 0x33, 0xCC, 0x55];
const STOP_SIGNAL = [0x44, 0x55, 0x66, 0xBB];
const FACTORY_RESET_SIGNAL = [0xF, 0xA, 0xC];
const configStartIndex = CONFIG_HEADER.length;
const configBuffToSend = [];
const MIN_CONFIG_SIZE = 18;
const MB_PACKET_IDENTIFIER_LENGTH = 3;
const MB_PACKET_IDENTIFIER = [0x61, 0x62, 0x63];
const ADMIN_CONFIG_HEADER = [0xA, 0xD, 0xE];
const ADMIN_CONFIG_HEADER_LENGTH = 3;
let isPollActive = false;

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
        usbStop(device);
    }
    else {
        console.log("Error: couldn't find device");
    }
}

function usbSendStartSignal(openedDevice){

    const [idVendor, idProduct] = [openedDevice.deviceDescriptor.idVendor, openedDevice.deviceDescriptor.idProduct];
    const device = findByIds(Number(idVendor), Number(idProduct));

    if (device) {
        usbStart(device, START_SIGNAL);
    } else {
        console.log("Error: couldn't find device");
    }
}

function usbSendStopSignal(openedDevice){

    const [idVendor, idProduct] = [openedDevice.deviceDescriptor.idVendor, openedDevice.deviceDescriptor.idProduct];
    const device = findByIds(Number(idVendor), Number(idProduct));

    if (device) {
        usbSendData(device, STOP_SIGNAL);
        usbStop(device);
    }
    else {
        console.log("Error: couldn't find device");
    }
}

function usbSendAdminConfigData(openedDevice, configData) {

    let dataToSend = structureAdminConfigDataPacket(configData);
  
    const [idVendor, idProduct] = [openedDevice.deviceDescriptor.idVendor, openedDevice.deviceDescriptor.idProduct];
    const device = findByIds(Number(idVendor), Number(idProduct));

    if (device) {
        usbSendData(device, dataToSend);
        usbStop(device);
    } else {
        console.log("Error: couldn't find device");
    }
}

function structureAdminConfigDataPacket(configData){
    console.log("configData", configData)

    let dataToSend = [];
    //append an identifier
    for(let i = 0; i < ADMIN_CONFIG_HEADER_LENGTH; i++){
        dataToSend[i] = ADMIN_CONFIG_HEADER[i];
    }

    const configSize = 18;
    const networkIP = configData.networkIP;
    const networkMask = configData.networkMask;
    const networkGateway = configData.networkGateway;
    const macAddress = configData.macAddress;

    dataToSend[ADMIN_CONFIG_HEADER_LENGTH] = configSize;
    insertIPIntoArray(networkIP, dataToSend, ADMIN_CONFIG_HEADER_LENGTH + 1);
    insertIPIntoArray(networkMask, dataToSend, ADMIN_CONFIG_HEADER_LENGTH + 5);
    insertIPIntoArray(networkGateway, dataToSend, ADMIN_CONFIG_HEADER_LENGTH + 9);

    for(let i = ADMIN_CONFIG_HEADER_LENGTH + 13; i < ADMIN_CONFIG_HEADER_LENGTH + 19; i++){
        dataToSend[i] = macAddress[i];
    }

    return dataToSend;
}


function usbSendFactoryResetSignal(openedDevice){

    const [idVendor, idProduct] = [openedDevice.deviceDescriptor.idVendor, openedDevice.deviceDescriptor.idProduct];
    const device = findByIds(Number(idVendor), Number(idProduct));

    if (device) {
        usbSendData(device, FACTORY_RESET_SIGNAL);
    } else {
        console.log("Error: couldn't find device");
    }
}

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

let interface;
function usbStart(device, START_SIGNAL) {
    if (!device) {
        console.error("WTF IS DEVICE");
        return;
    }

    try {
        device.open();
        interface = device.interfaces[0];
        interface.claim();

        const dataToSend = Buffer.from(START_SIGNAL);
        interface.endpoint(ENDPOINT_OUT).transfer(dataToSend, error => {
            if (error) {
                console.error('Error sending data:', error);
            } else {
                console.log('Data sent successfully');
            }
        });

        interface.endpoint(ENDPOINT_IN).startPoll(3, 100);
        isPollActive = true;

        interface.endpoint(ENDPOINT_IN).on('data', data => {
            const buffer = Array.from(data);
            console.log("receiveBuffer", buffer);
            usbHandleReceivedData(buffer);
        });
    } catch (err) {
        console.error("USB communication failed", err);
    }
}


function usbStop(device) {
    console.log("stop")
    if(device && interface){
        if(isPollActive){
            interface.endpoint(ENDPOINT_IN).stopPoll();
            isPollActive = false;
        }
        interface.release();
    }
}

function usbHandleReceivedData(buffer){
 
    const packetBuffer = []
    if(isDataMBPacket(buffer)){
        for(let i=0; i<buffer.length - MB_PACKET_IDENTIFIER_LENGTH; i++){
            packetBuffer[i] = buffer[MB_PACKET_IDENTIFIER_LENGTH + i];
        }
    }
    process.emit("data", packetBuffer);
}

function isDataMBPacket(buffer){

    for(let i=0; i<MB_PACKET_IDENTIFIER_LENGTH; i++){
        if(buffer[i] !== MB_PACKET_IDENTIFIER[i])
            return false;
    }
    return true;
}

function insertIPIntoArray(ipAddress, array, startIndex) {
    let byteValues = ipAddress.split('.').map(part => parseInt(part));
    array.splice(startIndex, 0, ...byteValues);
}


module.exports.getConfigData = getConfigData;
module.exports.usbSendStartSignal = usbSendStartSignal;
module.exports.usbSendStopSignal = usbSendStopSignal;
module.exports.usbStop = usbStop;
module.exports.usbSendAdminConfigData = usbSendAdminConfigData
module.exports.usbSendFactoryResetSignal = usbSendFactoryResetSignal
module.exports.usbStop = usbStop


