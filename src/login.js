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

        let result = await validateUserInfo(username, password);
        console.log("result", result)
        if(result.status === Status.VALID)
            if(result.result === 0xCF){
                window.location.href = "pages/main/main_admin.html"; 
            }
            else if(result.result === 0){
                window.location.href = "pages/main/main.html";
            }

        else if (result.status === Status.VOID_USERNAME){
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            newErrorDiv.textContent = "Please fill in this field";
            usernameCon.appendChild(newErrorDiv);
        }

        else if (result.status === Status.INVALID_USERNAME){
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            newErrorDiv.textContent = "Invalid username";
            usernameCon.appendChild(newErrorDiv);
        }
        
        else if (result.status === Status.VOID_PASSWORD){
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            newErrorDiv.textContent = "Please fill in this field";
            passwordCon.appendChild(newErrorDiv);
        }   
        else if (result.status === Status.INVALID_PASSWORD){
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            newErrorDiv.textContent = "Invalid password";
            passwordCon.appendChild(newErrorDiv);
        }    
    }

    async function validateUserInfo(username, password){

            if(!username)
                return Status.VOID_USERNAME;

            if(!password)
                return Status.VOID_PASSWORD;

            let result = await window.mainAPI.validateUserData(username, password);
            console.log("result", result);
            if (result === -1)
                return Status.INVALID_USERNAME;

            if(result === -2)
                return Status.INVALID_PASSWORD;

        return {status: Status.VALID, result: result};
    }

    async function validatePassword(password){
        let result = await window.mainAPI.validatePassword(password);
        console.log("result in validatePassword", result)
        if(result !== true)
          return Status.INVALID_OLD_PASSWORD;
 
         return Status.VALID;
     }
})


