document.addEventListener('DOMContentLoaded', () => {
    saveSelectedMode();
    window.onload = getSelectedMode;

    document.getElementById("next-button").addEventListener("click", () => {
        saveSelectedMode();
    })
    const sidebarLinks = document.querySelectorAll('.clickable');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            saveSelectedMode();
        });
    });
});


let selectedMode, selectedModeLabel;
const modeElements = document.getElementsByName("mode");

function getSelectedMode() {
    for (let i = 0; i < modeElements.length; i++) {
        let modeLabel = document.querySelector(`[for=${modeElements[i].id}]`).textContent;
        if (selectedMode === modeLabel) {
            console.log("match")
            modeElements[i].checked = true;
        }
    }
}

function saveSelectedMode() {
    selectedMode = localStorage.getItem("selectedMode");
    for (let i = 0; i < modeElements.length; i++) {
        if (modeElements[i].checked) {
            selectedMode = modeElements[i].value;
            selectedModeLabel = document.querySelector(`[for=${modeElements[i].id}]`);
            console.log("checked:", selectedModeLabel.textContent);
            localStorage.setItem("selectedMode", selectedModeLabel.textContent);
        }
    }
}


