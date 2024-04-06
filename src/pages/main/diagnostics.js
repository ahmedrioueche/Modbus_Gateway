document.addEventListener("DOMContentLoaded", async () => {

    const device = await window.serialAPI.getOpenedDevice();

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

    
    const packet1 = {
        number: 1,
        type: 1,
        time: "0.020000",
        source: "RTU client, ID = 2",
        destination: "RTU server, ID = 5",
        length: "24", 
        data: "11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84 11 01 0013 0025 0E84",
    }
    const packet2 = {
        number: 2,
        type: 2,
        time: "0.024000",
        source: "TCP client, IP = 192.168.2.1",
        destination: "TCP server,IP = 192.168.2.5",
        length: "20", 
        data: "Ok",
    }
    const packet3 = {
        number: 3,
        type: 3,
        time: "0.020000",
        source: "TCP server, IP = 192.168.2.5",
        destination: "TCP client, IP = 192.168.2.1",
        length: "23", 
        data: "Ok",
    }
    const packet4 = {
        number: 4,
        type: 4,
        time: "0.025000",
        source: "RTU server, ID = 5",
        destination: "RTU client, ID = 2",
        length: "20", 
        data: "Ok",
    }

    let packetsBuffer = []
    packetsBuffer.push(packet1);
    packetsBuffer.push(packet2);
    packetsBuffer.push(packet3);
    packetsBuffer.push(packet4);

    window.serialAPI.getPacketData((packet) => {
        console.log("packet", packet);
        //organize packet data
        //create packet ui
        //add packet to packetBuffer
        //packets.push(packet); 
    })

    document.getElementById("save").addEventListener("click", ()=> {
        window.serialAPI.sendPackets(packetsBuffer);
    })


    createPacketUI(packet1);
    createPacketUI(packet2);
    createPacketUI(packet3);
    createPacketUI(packet4);
    createPacketUI(packet1);
    createPacketUI(packet2);
    createPacketUI(packet3);
    createPacketUI(packet4);
    createPacketUI(packet1);
    createPacketUI(packet2);
    createPacketUI(packet3);
    createPacketUI(packet4);
    createPacketUI(packet1);
    createPacketUI(packet2);
    createPacketUI(packet3);
    createPacketUI(packet4);

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
            element.textContent = packet[propertyName]; // Access property value by name
            packetEl.appendChild(element);
        })
    }

    document.getElementById("trash").addEventListener("click", ()=> {
        cleanPacketsContainer();
        packetsBuffer.length = 0;
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
