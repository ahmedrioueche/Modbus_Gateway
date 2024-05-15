document.addEventListener('DOMContentLoaded', async () => {   
    const Status = {
        VALID: "valid",
        INVALID_USERNAME: "invalid username",
        INVALID_PASSWORD: "invalid password",
        VOID_USERNAME: "void username",
        VOID_PASSWORD: "void password",
    }
    
    const form = document.querySelector(".login-form");
    const loginButton = document.getElementById('login-button');
    
    loginButton.addEventListener('click', (e) => {
        e.preventDefault();
        loginHandler();
    });

    async function loginHandler(){
        const usernameCon = document.getElementById("username");
        const passwordCon = document.getElementById("password");
        const username = document.getElementById("username-input-box").value;
        const password = document.getElementById("password-input-box").value;
        const errorDivs = form.querySelectorAll(".error");
        if (errorDivs) {
            errorDivs.forEach(errorDiv => {
                errorDiv.remove();
            })
        }

        let validationResult = await validateUserInfo(username, password);

        if(validationResult.status === Status.VALID){
            console.log("validationResult", validationResult)
            if(validationResult.result === 0xCF){
                window.location.href = "../../views/main/main_admin.html"; 
            }
            else if(validationResult.result === 0){
                window.location.href = "../../views/main/main.html";
            }
        }

        else if (validationResult.status === Status.VOID_USERNAME){
            console.log("result.status", validationResult.status);
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            newErrorDiv.textContent = "Please fill in this field";
            usernameCon.appendChild(newErrorDiv);
        }

        else if (validationResult.status === Status.INVALID_USERNAME){
            console.log("result.status", validationResult.status);
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            newErrorDiv.textContent = "Invalid username";
            usernameCon.appendChild(newErrorDiv);
        }
        
        else if (validationResult.status === Status.VOID_PASSWORD){
            console.log("result.status", validationResult.status);
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            newErrorDiv.textContent = "Please fill in this field";
            passwordCon.appendChild(newErrorDiv);
        }   

        else if (validationResult.status === Status.INVALID_PASSWORD){
            console.log("result.status", validationResult.status);
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            newErrorDiv.textContent = "Invalid password";
            passwordCon.appendChild(newErrorDiv);
        }    
    }
    

    async function validateUserInfo(username, password){

        const validationResult = { status: Status.VALID, result: 0 }

        if(!username){
            validationResult.status = Status.VOID_USERNAME;
            return validationResult;
        }

        if(!password){
            validationResult.status = Status.VOID_PASSWORD;
            return validationResult;
        }

        let result = await window.mainAPI.validateUserData(username, password);

        console.log("result", result);

        if (result === -1){
            validationResult.status = Status.INVALID_USERNAME;
            validationResult.result = result;
            return validationResult;
        }

        if(result === -2){
            validationResult.status = Status.INVALID_PASSWORD;
            validationResult.result = result;
            return validationResult;
        }
        
        if(result === 0xCF){
            validationResult.result = result;
            return validationResult;
        }
        return validationResult;
    }

    async function validatePassword(password){
        let result = await window.mainAPI.validatePassword(password);
        console.log("result in validatePassword", result)
        if(result !== true)
          return Status.INVALID_OLD_PASSWORD;
 
         return Status.VALID;
     }
})



