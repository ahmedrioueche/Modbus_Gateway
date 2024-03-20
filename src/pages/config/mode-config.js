document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("save-button").addEventListener("click", () => {
        console.log("close");
        saveSelectedMode();
        window.mainAPI.closeConfigWindow();
    })

    document.getElementById("next-button").addEventListener("click", () => {
        saveSelectedMode();
    })

    window.onload = getSelectedMode;
});


let selectedMode, selectedModeLabel;
const modeElements = document.getElementsByName("mode");

function getSelectedMode() {
    let selectedMode = localStorage.getItem("selectedMode");
    console.log("selectedMode:", selectedMode);
    console.log("modeElements:", modeElements);
    for (let i = 0; i < modeElements.length; i++) {
        let modeLabel = document.querySelector(`[for=${modeElements[i].id}]`).textContent;
        if (selectedMode === modeLabel) {
            console.log("match")
            modeElements[i].checked = true;
        }
    }
}

function saveSelectedMode() {

    for (let i = 0; i < modeElements.length; i++) {
        if (modeElements[i].checked) {
            selectedMode = modeElements[i].value;
            selectedModeLabel = document.querySelector(`[for=${modeElements[i].id}]`);
            console.log("checked:", selectedModeLabel.textContent);
            localStorage.setItem("selectedMode", selectedModeLabel.textContent);
        }
    }
}


