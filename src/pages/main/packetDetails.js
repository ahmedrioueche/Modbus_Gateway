document.addEventListener("DOMContentLoaded", async () => {

    //get clicked packet data
    let packet = await window.serialAPI.getOpenedPacketData();

    const container = document.getElementById("diagnostics-details");
    document.getElementById("number").textContent = `${packet.number}`
    document.getElementById("time").textContent = `${packet.time}`
    document.getElementById("source").textContent = `${packet.source}`
    document.getElementById("destination").textContent = `${packet.destination}`
    document.getElementById("length").textContent = `${packet.length}`
    document.getElementById("data").textContent = ` ${packet.data}`

    document.getElementById("close-button").addEventListener("click", ()=> {
        window.mainAPI.closePacketDetailsWindow();
    })
})
