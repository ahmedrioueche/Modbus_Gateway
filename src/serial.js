const SerialPort = require('serialport');
const VirtualSerialPort = require('virtual-serialport');
const { Readline } = require('@serialport/parser-readline');

const CONFIG_HEADER = [0xAA, 0xBB, 0xCC, 0xDD];
const configStartIndex = CONFIG_HEADER.length;
const configBuffToSend = [];

function getConfigData(configBuffer) {
    console.log("configBuffer", configBuffer );

    const CONFIG_SIZE = configBuffer.length;
    configBuffToSend.length = 0;
    
    for(let i = 0; i < CONFIG_HEADER.length; i++){
        configBuffToSend[i] = CONFIG_HEADER[i];
    }

    configBuffToSend[configStartIndex] = CONFIG_SIZE; 
    const selectedMode = configBuffer[0];
    const UartBaud = configBuffer[1];
    const UartParity = configBuffer[2];
    const UartStopBits= configBuffer[3];
    const UartDataSize = configBuffer[4];
    const slaveId    =  configBuffer[5];
    const networkIP = configBuffer[6];
    const networkMask = configBuffer[7];
    const networkGateway = configBuffer[8];
    const networkRemoteIP = configBuffer[9];

    configBuffToSend[configStartIndex + 1] = selectedMode === "RTU server mode"? 1 : 2;
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
    if(selectedMode == 'RTU server mode')
        insertIPIntoArray(networkRemoteIP, configBuffToSend, configStartIndex + 19);


    console.log("configBuffToSend", configBuffToSend );
    //sendOverSerial(configBuffToSend);
    //endOverSerialTest(configBuffToSend);
  }


  function sendOverSerialTest(data){

    // Create virtual serial ports
    const port1 = new VirtualSerialPort('COM1');
    const port2 = new VirtualSerialPort('COM2');
    
    // Create parsers for parsing incoming data as lines
    const parser1 = port1.pipe(new Readline());
    const parser2 = port2.pipe(new Readline());
    
    // Simulate communication between the ports
    port1.pipe(port2);
    port2.pipe(port1);
    
    // Add event listeners for data exchange
    parser1.on('data', data => {
      console.log('Data received on port 1:', data.toString());
    });
    
    parser2.on('data', data => {
      console.log('Data received on port 2:', data.toString());
    });
    
    // Write data to one of the ports
    port1.write('Hello from port 1!');
    
  }
  


// Function to send data over serial port
function sendOverSerial(data) {
    const portName = 'COM3'; 
    const baudRate = 9600; 

    const port = new SerialPort(portName, {
        baudRate: baudRate
    });

    port.open((err) => {
        if (err) {
            return console.error('Error opening port:', err.message);
        }

        const bufferData = Buffer.from(data);

        port.write(bufferData, (err) => {
            if (err) {
                return console.error('Error writing to port:', err.message);
            }
            console.log('Data sent over serial port:', bufferData);

            port.close((err) => {
                if (err) {
                    return console.error('Error closing port:', err.message);
                }
                console.log('Serial port closed');
            });
        });
    });
}

function insertIPIntoArray(ipAddress, array, startIndex) {
    let byteValues = ipAddress.split('.').map(part => parseInt(part));
    array.splice(startIndex, 0, ...byteValues);
}

module.exports.getConfigData = getConfigData;