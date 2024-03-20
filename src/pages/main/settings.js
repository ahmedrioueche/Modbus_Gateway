document.addEventListener('DOMContentLoaded', () => {

    document.getElementById("cancel-button").addEventListener('click', () => {
        window.mainAPI.closeSettingsWindow();
    });

    let isPasswordSet = localStorage.getItem("isPasswordSet");
   
    const oldPasswordElement = document.getElementById('old-password');
    const newPasswordElement = document.getElementById('password');
    const confirmPasswordElement = document.getElementById('confirm-password');
    const oldPasswordLabel = document.querySelector(".input-label")

    if (isPasswordSet) {
        oldPasswordElement.style.display = 'block';
        newPasswordElement.placeholder = 'Enter new password';
        confirmPasswordElement.style.display = 'none'
    } else {
        oldPasswordElement.style.display = 'none';
        oldPasswordLabel.style.display = 'none';
        newPasswordElement.placeholder = 'Set Password';
        confirmPasswordElement.placeholder = 'Confirm Password';
    }

    const languageSelect = document.getElementById('language');

    const saveButton = document.getElementById('save-button');
    saveButton.addEventListener('click', () => {
        const oldPassword = oldPasswordElement.value;
        const newPassword = newPasswordElement.value;
        const confirmPassword = confirmPasswordElement.value;
        const selectedLanguage = languageSelect.value;
        if (isPasswordSet) {
            if (setPassword(oldPassword, newPassword)) {
                localStorage.setItem("isPasswordSet", true);
                window.mainAPI.closeSettingsWindow();
            }
            else {
                //display error
            }
        }
        else {
            console.log("password not set")
            if (setPassword(newPassword, confirmPassword)) {
                console.log("set password returned true")
                window.settingsAPI.sendIsPasswordSet(true);
                localStorage.setItem("isPasswordSet", true);
                window.mainAPI.closeSettingsWindow();
            }
            else {
                //display error
            }
        }
    });

});


function setPassword(pass1, pass2) {
    console.log("set password")

    if (!pass1 || !pass2)
        return false;
    else if (pass1 === pass2) {
        return true;
    }
    return false;
}
