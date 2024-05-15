document.addEventListener('DOMContentLoaded', async () => {
    const Status = {
        VALID: "valid",
        INVALID_NEW_USERNAME: "invalid username",
        INVALID_OLD_PASSWORD: "invalid old password",
        INVALID_NEW_PASSWORD: "invalid new passord",
        INVALID_CON_PASSWORD: "invalid confirm passord",
        VOID_USERNAME: "void username",
        VOID_OLD_PASSWORD: "void old password",
        VOID_NEW_PASSWORD: "void new password",
        VOID_CON_PASSWORD: "void confirm password"
    }
    const userData = await window.mainAPI.getUserData();
    const container = document.querySelector(".settings-window")
    const saveButton = document.getElementById('save-button');
    const usernameCon = document.getElementById("username-container");
    const oldPasswordCon = document.getElementById("old-password-container");
    const newPasswordCon = document.getElementById("new-container");
    const confirmPassWordCon = document.getElementById("confirm-container");
    document.getElementById('username').value = userData.username;

    saveButton.addEventListener('click', async () => {
        const errorDivs = container.querySelectorAll(".error");
        if (errorDivs) {
            errorDivs.forEach(errorDiv => {
                errorDiv.remove();
            })  
        }

        const newErrorDiv = document.createElement("div");
        newErrorDiv.classList.add("error");
        const username = document.getElementById('username').value
        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        let result = await handleUserData(username, oldPassword, newPassword, confirmPassword, userData);

        switch(result){
            case Status.VALID:
                saveUserData(username, newPassword);
                break;
            case Status.VOID_USERNAME:
                newErrorDiv.textContent = "Please fill in this field";
                usernameCon.appendChild(newErrorDiv);
                break;
            case Status.VOID_OLD_PASSWORD:
                newErrorDiv.textContent = "Please fill in this field";
                oldPasswordCon.appendChild(newErrorDiv);
                break;
            case Status.VOID_NEW_PASSWORD:
                newErrorDiv.textContent = "Please fill in this field";
                newPasswordCon.appendChild(newErrorDiv);
                break;
            case Status.VOID_CON_PASSWORD:
                newErrorDiv.textContent = "Please fill in this field";
                confirmPassWordCon.appendChild(newErrorDiv);
                break;
            case Status.INVALID_NEW_USERNAME:
                newErrorDiv.textContent = "Invalid username";
                usernameCon.appendChild(newErrorDiv);
                break
            case Status.INVALID_OLD_PASSWORD:
                newErrorDiv.textContent = "Invalid password";
                oldPasswordCon.appendChild(newErrorDiv);
                break
            case Status.INVALID_NEW_PASSWORD:
                newErrorDiv.textContent = "Invalid password";
                newPasswordCon.appendChild(newErrorDiv);
                break
            case Status.INVALID_CON_PASSWORD:
                newErrorDiv.textContent = "Passwords don't match";
                confirmPassWordCon.appendChild(newErrorDiv);
                break
            
        }
        const selectedLanguage = document.getElementById('language').value;


    });

    async function handleUserData(username, oldPassword, newPassword, confirmPassword){
        console.log("username", username)
        if(!username)
            return Status.VOID_USERNAME;

        if(!oldPassword)
            return Status.VOID_OLD_PASSWORD;

        if(!newPassword)
             return Status.VOID_NEW_PASSWORD;

        if(!confirmPassword)
            return Status.VOID_CON_PASSWORD;

        let result = checkUsername(username);
        if(result !== Status.VALID){
            return result;
        }

        result = await validateUserData(username, oldPassword);
        if(result !== Status.VALID)
            return result;

        result = checkPassword(newPassword);
        if(result !== Status.VALID){
            return result;
        }

        if(newPassword !== confirmPassword){
            console.log("wtf")
            return Status.INVALID_CON_PASSWORD;
        }

        return Status.VALID;
    }

    function saveUserData(username, newPassword){
        let userData = {
            admin: {
                username: username,
                password: newPassword,
            }
        }
        
        window.mainAPI.saveUserData(userData);
        window.mainAPI.closeSettingsWindow();
    }

    async function validateUserData(username, oldPassword){
       let result = await window.mainAPI.validateUserData(username, oldPassword);
       console.log("result in validatePassword", result)
       if(result !== true)
         return Status.INVALID_OLD_PASSWORD;

        return Status.VALID;
    }

    function checkUsername(username) {
        if (typeof username !== 'string' || username.trim() === '') {
            return Status.INVALID_NEW_USERNAME;
        }
        return Status.VALID;
    }
    
    function checkPassword(password){
        if(password.length < 6)
            return Status.INVALID_NEW_PASSWORD;

        return Status.VALID
    }

    document.getElementById("cancel-button").addEventListener('click', () => {
        window.mainAPI.closeWindow(5); //settings window index = 5
    });
});


