document.addEventListener("DOMContentLoaded", async () => {

    const device = await window.serialAPI.getOpenedDevice();
    let storedDevices = JSON.parse(localStorage.getItem('devices')) || [];
    let networkIP, remoteIP, mbMode;
    storedDevices.forEach(storedDevice => {
        const deviceId = `${device.deviceDescriptor.idVendor}-${device.deviceDescriptor.idProduct}`;
        if(storedDevice.id === deviceId){
            networkIP = storedDevice.networkIP;
            remoteIP = storedDevice.remoteIP;
            mbMode = storedDevice.mode;
        }
    })      

    
    const startButtonEl = document.getElementById("start");
    const stopButtonEl = document.getElementById("stop");

    function startButtonClickHandler() {
        window.serialAPI.sendStartSignal(device);
    
        startButtonEl.classList.add("play-button-disabled");
        startButtonEl.removeEventListener("click", startButtonClickHandler);
    
        stopButtonEl.classList.remove("stop-button-disabled");
        stopButtonEl.addEventListener("click", stopButtonClickHandler);
    }
    
    function stopButtonClickHandler() {
        window.serialAPI.sendStopSignal(device);
    
        stopButtonEl.classList.add("stop-button-disabled");
        stopButtonEl.removeEventListener("click", stopButtonClickHandler);
    
        startButtonEl.classList.remove("play-button-disabled");
        startButtonEl.addEventListener("click", startButtonClickHandler);
    }

    startButtonEl.addEventListener("click", startButtonClickHandler);

    let packetsBuffer = []; let startTime; 
    window.serialAPI.getPacketData(recPacket => {
        if(!startTime){
            startTime = Date.now();
        }
        const relativeArrivalTime = ((Date.now() - startTime)/1000).toFixed(6);

        let packetDataObj = {};
        console.log( recPacket.length);
        let recPacketLength = recPacket.length; 
        const type = recPacket[0];

        switch (type) {
            case 1: // SOURCE = RTU CLIENT
                packetDataObj = {
                    "packetSource": "RTU Client",
                    "packetDestination": "RTU Server",
                    "Slave ID": `${(recPacket[1] < 16 ? '0' : '')}${recPacket[1].toString(16).toUpperCase()} (${recPacket[1]})`,
                    "Function Code": `${(recPacket[2] < 16 ? '0' : '')}${recPacket[2].toString(16).toUpperCase()} (${recPacket[2]})`,
                    "Starting Address": `${(recPacket[3] < 16 ? '0' : '')}${recPacket[3].toString(16).toUpperCase()} ${(recPacket[4] < 16 ? '0' : '')}${recPacket[4].toString(16).toUpperCase()} (${recPacket[3]} ${recPacket[4]})`,
                    "Quantity": `${(recPacket[5] < 16 ? '0' : '')}${recPacket[5].toString(16).toUpperCase()} ${(recPacket[6] < 16 ? '0' : '')}${recPacket[6].toString(16).toUpperCase()} (${recPacket[5]} ${recPacket[6]})`,
                    "CRC": `${(recPacket[recPacketLength - 2] < 16 ? '0' : '')}${recPacket[recPacketLength - 2].toString(16).toUpperCase()} ${(recPacket[recPacketLength - 1] < 16 ? '0' : '')}${recPacket[recPacketLength - 1].toString(16).toUpperCase()} (${recPacket[recPacketLength - 2]} ${recPacket[recPacketLength - 1]})`
                };
                break;
        
            case 2: // SOURCE = RTU SERVER
                packetDataObj = {
                    "packetSource": "RTU Server",
                    "packetDestination": "RTU Client",
                    "Slave ID": `${(recPacket[1] < 16 ? '0' : '')}${recPacket[1].toString(16).toUpperCase()} (${recPacket[1]})`,
                    "Function Code": `${(recPacket[2] < 16 ? '0' : '')}${recPacket[2].toString(16).toUpperCase()} (${recPacket[2]})`,
                    "Bytes To Follow": `${(recPacket[3] < 16 ? '0' : '')}${recPacket[3].toString(16).toUpperCase()} (${recPacket[3]})`,
                    "Data": `${recPacket.slice(4, recPacketLength - 2).map(byte => (byte < 16 ? '0' : '') + byte.toString(16).toUpperCase()).join(' ')} (${recPacket.slice(4, recPacketLength - 2).join(' ')})`, // Convert each byte to hexadecimal
                    "CRC": `${(recPacket[recPacketLength - 2] < 16 ? '0' : '')}${recPacket[recPacketLength - 2].toString(16).toUpperCase()} ${(recPacket[recPacketLength - 1] < 16 ? '0' : '')}${recPacket[recPacketLength - 1].toString(16).toUpperCase()} (${recPacket[recPacketLength - 2]} ${recPacket[recPacketLength - 1]})`
                };
                break;
        
            case 3: // SOURCE TCP CLIENT
                packetDataObj = {
                    "packetSource": "TCP Client",
                    "packetDestination": "TCP Server",
                    "Transaction ID": `${(recPacket[1] < 16 ? '0' : '')}${recPacket[1].toString(16).toUpperCase()} ${(recPacket[2] < 16 ? '0' : '')}${recPacket[2].toString(16).toUpperCase()} (${recPacket[1]} ${recPacket[2]})`,
                    "Protocol ID": `${(recPacket[3] < 16 ? '0' : '')}${recPacket[3].toString(16).toUpperCase()} ${(recPacket[4] < 16 ? '0' : '')}${recPacket[4].toString(16).toUpperCase()} (${recPacket[3]} ${recPacket[4]})`,
                    "Message Length": `${(recPacket[5] < 16 ? '0' : '')}${recPacket[5].toString(16).toUpperCase()} ${(recPacket[6] < 16 ? '0' : '')}${recPacket[6].toString(16).toUpperCase()} (${recPacket[5]} ${recPacket[6]})`,
                    "Unit ID": `${(recPacket[7] < 16 ? '0' : '')}${recPacket[7].toString(16).toUpperCase()} (${recPacket[7]})`,
                    "Function Code": `${(recPacket[8] < 16 ? '0' : '')}${recPacket[8].toString(16).toUpperCase()} (${recPacket[8]})`,
                    "Starting Address": `${(recPacket[9] < 16 ? '0' : '')}${recPacket[9].toString(16).toUpperCase()} ${(recPacket[10] < 16 ? '0' : '')}${recPacket[10].toString(16).toUpperCase()} (${recPacket[9]} ${recPacket[10]})`,
                    "Quantity": `${(recPacket[11] < 16 ? '0' : '')}${recPacket[11].toString(16).toUpperCase()} (${recPacket[11]})`
                };
                break;
        
            case 4: // SOURCE TCP SERVER
                packetDataObj = {
                    "packetSource": "TCP Server",
                    "packetDestination": "TCP Client",
                    "Transaction ID": `${(recPacket[1] < 16 ? '0' : '')}${recPacket[1].toString(16).toUpperCase()} ${(recPacket[2] < 16 ? '0' : '')}${recPacket[2].toString(16).toUpperCase()} (${recPacket[1]} ${recPacket[2]})`,
                    "Protocol ID": `${(recPacket[3] < 16 ? '0' : '')}${recPacket[3].toString(16).toUpperCase()} ${(recPacket[4] < 16 ? '0' : '')}${recPacket[4].toString(16).toUpperCase()} (${recPacket[3]} ${recPacket[4]})`,
                    "Message Length": `${(recPacket[5] < 16 ? '0' : '')}${recPacket[5].toString(16).toUpperCase()} ${(recPacket[6] < 16 ? '0' : '')}${recPacket[6].toString(16).toUpperCase()} (${recPacket[5]} ${recPacket[6]})`,
                    "Unit ID": `${(recPacket[7] < 16 ? '0' : '')}${recPacket[7].toString(16).toUpperCase()} (${recPacket[7]})`,
                    "Function Code": `${(recPacket[8] < 16 ? '0' : '')}${recPacket[8].toString(16).toUpperCase()} (${recPacket[8]})`,
                    "Data": `${recPacket.slice(9, recPacketLength).map(byte => byte.toString(16).toUpperCase()).join(' ')} (${recPacket.slice(9, recPacketLength).join(' ')})` // Convert each byte to hexadecimal and uppercase
                }
            }
        
        //organize packet data
        const packetDestination = (type === 1 || type === 2) ? `${packetDataObj["packetDestination"]} ID = ${packetDataObj["Slave ID"]}` :
                          (type === 3 && mbMode === "RTU Server Mode") ? `${packetDataObj["packetDestination"]} IP = ${remoteIP}` :
                          (type === 3 || type === 4) ? `${packetDataObj["packetDestination"]} IP = ${networkIP}` :
                          packetDataObj["packetDestination"];

        const packetSource = (type === 3 && mbMode === "RTU Server Mode") ? `${packetDataObj["packetSource"]} IP = ${networkIP}` :
                            (type === 4 && mbMode === "RTU Server Mode") ? `${packetDataObj["packetSource"]} IP = ${remoteIP}` :
                            packetDataObj["packetSource"];

        
        const packet = {
            type: type,
            number: packetsBuffer.length + 1,
            time: relativeArrivalTime,
            source: packetSource,
            destination: packetDestination,
            length: recPacketLength - 1, 
            rawData: recPacket.slice(1).map(byte => (byte < 16 ? '0' : '') + byte.toString(16).toUpperCase()).join(' '),
            packetData: packetDataObj,
        }

        //add packet to packetBuffer
        packetsBuffer.push(packet);
        //create packet ui
        createPacketUI(packet);
        
    })

    document.getElementById("save").addEventListener("click", ()=> {
        window.serialAPI.sendPackets(packetsBuffer);
    })

    function createPacketUI(packet){
        const packetContainer = document.getElementById("packet-container");
        const packetEl = document.createElement("div");
        const numberEl = document.createElement("div");
        const timeEl = document.createElement("div");
        const sourceEl = document.createElement("div");
        const destinationEl = document.createElement("div");
        const lengthEl = document.createElement("div");
        const dataEl = document.createElement("div");
    
        packetEl.setAttribute("class", "packet-row");
        packetEl.setAttribute("id", "packet");
        colorPacketRow(packet, packetEl);
        packetEl.addEventListener("click", ()=>{
            window.serialAPI.savePacketData(packet);
            window.mainAPI.createPacketDetailsWindow();
        })
    
        const packetElements = [numberEl, timeEl, sourceEl, destinationEl, lengthEl, dataEl];
        packetElements.forEach((element, index) => {
            element.setAttribute("class", "column");
            element.setAttribute("id", `column-${index+1}`);
        });
        packetContainer.appendChild(packetEl); 
        packetElements.forEach((element, index) => {
            const propertyName = Object.keys(packet)[index+1]; // Get property name from object
            let propertyValue = packet[propertyName]; // Access property value by name
            if (propertyName === "source" || propertyName === "destination") {
                const lines = propertyValue.split("IP = ");
                propertyValue = lines.join("<br>IP = ");
            }
            element.innerHTML = propertyValue; // Set innerHTML to allow line breaks
            packetEl.appendChild(element);
        })
        const columns = document.querySelectorAll(".column");
        columns.forEach(column => {
            column.style.fontSize = "0.8rem"; // Adjust the font size as needed
        });
    }
    
    document.getElementById("trash").addEventListener("click", ()=> {
        cleanPacketsContainer();
        packetsBuffer.length = 0;
        startTime = null;
    })
  
    const searchIcon = document.querySelector(".search img");
    const searchBarForm = document.querySelector(".diag-filter");
    const searchBar = document.getElementById("input");
    let isFilterOn = false;

    searchIcon.addEventListener("click", () => {
        searchBarForm.classList.toggle("show-search");
        if(isFilterOn){
            cleanPacketsContainer();
            packetsBuffer.forEach(packet => {
                createPacketUI(packet);
            })
            isFilterOn = false;
        }
        searchBar.value = "";
    });

    searchBarForm.addEventListener("submit", (e) => {
        e.preventDefault();
    });
    
    let searchQuery;
    let filteredPacketBuffer;
    
    searchBar.addEventListener("input", (e) => {
        e.preventDefault();
        filteredPacketBuffer = [];
        isFilterOn = true;
        searchQuery = searchBar.value.toLowerCase().trim();    
        filteredPacketBuffer = packetsBuffer.filter(packet => {
            return Object.values(packet).some(prop => {
                return String(prop).toLowerCase().includes(searchQuery);
            });
        });
        
        cleanPacketsContainer();
        filteredPacketBuffer.forEach(packet => {
            createPacketUI(packet);
        })
    })
    

    function colorPacketRow(packet, packetEl){
        switch(packet.type){
            case 1:
                packetEl.classList.add('type-1');
                break;
            case 2:
                packetEl.classList.add('type-2');
                break;
            case 3:
                packetEl.classList.add('type-3');
                break;
            case 4:
                packetEl.classList.add('type-4');
                break;
            default:
                packetEl.classList.add('default');
        }
    }

    function cleanPacketsContainer(){
        const packets = document.querySelectorAll(".packet-row");
        packets.forEach(packet => {
            packet.remove();
        })
    }

    document.getElementById("close-button").addEventListener("click", ()=> {
        window.mainAPI.closeDiagnosticsWindow();
    })

});

//TODO:
    //fix controls ui
    //fix packet details ui
    //send and receive data via usb
