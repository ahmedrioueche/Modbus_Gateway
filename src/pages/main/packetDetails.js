document.addEventListener("DOMContentLoaded", async () => {

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
    console.log(packet.packetData)
    let counter = 0;
    for (const key in packet.packetData) {
      if (Object.hasOwnProperty.call(packet.packetData, key)) {
        if(counter > 1){
            const value = packet.packetData[key];
        
            // Create a table row for each key-value pair
            const row = document.createElement('tr');
            const labelCell = document.createElement('td');
            const valueCell = document.createElement('td');
      
            labelCell.innerHTML = `<strong>${key}</strong>`;
            valueCell.textContent = value;
      
            row.appendChild(labelCell);
            row.appendChild(valueCell);
      
            table.appendChild(row);
          }
          counter++;
        }
    }
    container.appendChild(table);
  


    document.getElementById("close-button").addEventListener("click", ()=> {
        window.mainAPI.closePacketDetailsWindow();
    })
})
