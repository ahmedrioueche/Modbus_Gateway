const serial = require('./serial.js')

const CONFIG_HEADER = [0xAA, 0xBB, 0xCC, 0xDD];
const configStartIndex = CONFIG_HEADER.length;
const configBuffToSend = [];
const MIN_CONFIG_SIZE = 18;
const MB_PACKET_IDENTIFIER = [0x61, 0x62, 0x63];
const ADMIN_CONFIG_HEADER = [0xA, 0xD, 0xE];
const ADMIN_CONFIG_HEADER_LENGTH = 3;
const MB_PACKET_IDENTIFIER_LENGTH = 3;

function sendConfigData(configBuffer, configDevice) {
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

    serial.usbSendConfigData(configBuffToSend, configDevice);
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


module.exports.sendConfigData = sendConfigData;
module.exports.isDataMBPacket = isDataMBPacket;
module.exports.structureAdminConfigDataPacket = structureAdminConfigDataPacket;
