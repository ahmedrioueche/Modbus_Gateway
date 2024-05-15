document.addEventListener("DOMContentLoaded", async () => {
  const modbusFunctionCodes = {
    1: "Read Coils",
    2: "Read Discrete Inputs",
    3: "Read Holding Registers",
    4: "Read Input Registers",
    5: "Write Single Coil",
    6: "Write Single Holding Register",
    15: "Write Multiple Coils",
    16: "Write Multiple Holding Registers"
  };

  const modbusExceptionCodes = {
    1: "Illegal Function",
    2: "Illegal Data Address",
    3: "Illegal Data Value",
    4: "Server Device Failure",
    5: "Acknowledge",
    6: "Server Device Busy",
    10: "Gateway Path Unavailable",
    11: "Gateway Target Device Failed to Respond"
  };

    //get clicked packet data
    let packet = await window.serialAPI.getOpenedPacketData();

    const container = document.querySelector(".packet-details");
    document.getElementById("number").textContent = `${packet.number}`
    document.getElementById("time").textContent = `${packet.time}`
    document.getElementById("source").textContent = `${packet.source}`
    document.getElementById("destination").textContent = `${packet.destination.split(" ID = ")[0]}`
    document.getElementById("length").textContent = `${packet.length}`
    document.getElementById("data").textContent = ` ${packet.rawData}`
    const table = document.createElement('table');
    
    let counter = 0;
    for (const key in packet.packetData) {
      if (Object.hasOwnProperty.call(packet.packetData, key)) {
        if(counter > 1){
            let normalValue, exceptionText = "";
            const value = packet.packetData[key];
            if(value && key !== "CRC"){
              const row = document.createElement('tr');
              const labelCell = document.createElement('td');
              const valueCell = document.createElement('td');
              valueCell.textContent = value;

              labelCell.innerHTML = `<strong>${key}</strong>`;
        
              row.appendChild(labelCell);
              row.appendChild(valueCell);
              table.appendChild(row);
              //check for an exception
              if(key === "Function Code" ){
                if(value > 80){
                  normalValue = value - 80; 
                  exceptionText = " Exception: Couldn't"
                }
                else
                  normalValue = parseInt(value.toString(), 10); 
                valueCell.textContent += exceptionText + " " + modbusFunctionCodes[normalValue];
              }
              if(key === "Exception Code"){
                normalValue = parseInt(value.toString(), 10); 
                valueCell.textContent += " " + modbusExceptionCodes[normalValue];            
              }
            }
          }
          counter++;
        }
    }
    //Let CRC be last
    if (packet.packetData.hasOwnProperty("CRC")) {
      const crcValue = packet.packetData["CRC"];
      if (crcValue) {
          const crcRow = document.createElement('tr');
          const crcLabelCell = document.createElement('td');
          const crcValueCell = document.createElement('td');
  
          crcLabelCell.innerHTML = `<strong>CRC</strong>`;
          crcValueCell.textContent = crcValue;
  
          crcRow.appendChild(crcLabelCell);
          crcRow.appendChild(crcValueCell);
  
          table.appendChild(crcRow);
      }
    }
    container.appendChild(table);
  


    document.getElementById("close-button").addEventListener("click", ()=> {
        window.mainAPI.closeWindow(4); //window index = 4
    })
})
