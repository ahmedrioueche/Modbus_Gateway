let dialogOpened = false; 
function exportData(packets){
        
    if(packets.length == 0 || dialogOpened){
        return;
    }
    dialogOpened = true;
    const currentDateTime = new Date();
    const formattedDateTime = currentDateTime.toISOString().replace(/[-T:]/g, '-').split('.')[0]; // Format: YYYYMMDDHHmmSS
    const saveDialog = dialog.showSaveDialog({
        title: 'Save Packets',
        defaultPath: `mb_packets_${formattedDateTime}`, 
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'Excel Files', extensions: ['xlsx'] }
        ],
        properties: ['createDirectory']
    });

    // Focus on the dialog window
    if (saveDialog && saveDialog.browserWindow) {
        saveDialog.browserWindow.focus();
    }
    
    saveDialog.then(result => {
        dialogOpened = false;
        if (!result.canceled) {
            const filePath = result.filePath;
            const fileExtension = result.filePath.split('.').pop().toLowerCase();
            
            // Check the file extension to determine the file format
            if (fileExtension === 'json') {
                // Save packets as JSON
                writePacketsToJson(packets, filePath)
                    .then(() => {
                        console.log('Packets saved as JSON:', filePath);
                    })
                    .catch(err => {
                        console.error('Error saving packets as JSON:', err);
                    });
            } else if (fileExtension === 'xlsx') {
                // Save packets as Excel
                writePacketsToExcel(packets, filePath)
                    .then(() => {
                        console.log('Packets saved as Excel:', filePath);
                    })
                    .catch(err => {
                        console.error('Error saving packets as Excel:', err);
                    });
            } else {
                console.error('Unsupported file format:', fileExtension);
            }
        }
    }).catch(err => {
        console.error('Error showing save dialog:', err);
    });
}

async function writePacketsToJson(packets, filePath) {
    await fs.promises.writeFile(filePath, JSON.stringify(packets, null, 2));
}

async function writePacketsToExcel(packets, filePath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Packets');

    // Add headers
    worksheet.addRow(['Number', 'Time', 'Source', 'Destination', 'Length', 'Info']);

    // Add packet data
    packets.forEach(packet => {
        worksheet.addRow([
            packet.number,
            packet.time,
            packet.source,
            packet.destination,
            packet.length,
            packet.info
        ]);
    });

    await workbook.xlsx.writeFile(filePath);
}

module.exports.exportData = exportData;