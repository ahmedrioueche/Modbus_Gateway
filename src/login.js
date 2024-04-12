document.addEventListener('DOMContentLoaded', async () => {   
    const Status = {
        VALID: "valid",
        INVALID_USERNAME: "invalid username",
        INVALID_PASSWORD: "invalid password",
        VOID_USERNAME: "void username",
        VOID_PASSWORD: "void password",
    }

    const userInfo = await window.mainAPI.getUserData("getUserData");
    const form = document.querySelector(".login-form");
    const loginButton = document.getElementById('login-button');
    let dataValid;
 
    
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
        let status = await validateUserInfo(username, password, userInfo);
        if(status === Status.VALID)
            window.location.href = "pages/main/main.html";

        else if (status === Status.VOID_USERNAME){
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            newErrorDiv.textContent = "Please fill in this field";
            usernameCon.appendChild(newErrorDiv);
            dataValid = false;
        }

        else if (status === Status.INVALID_USERNAME){
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            newErrorDiv.textContent = "Invalid username";
            usernameCon.appendChild(newErrorDiv);
            dataValid = false;
        }
        
        else if (status === Status.VOID_PASSWORD){
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            newErrorDiv.textContent = "Please fill in this field";
            passwordCon.appendChild(newErrorDiv);
            dataValid = false;
        }   
        else if (status === Status.INVALID_PASSWORD){
            const newErrorDiv = document.createElement("div");
            newErrorDiv.classList.add("error");
            newErrorDiv.textContent = "Invalid password";
            passwordCon.appendChild(newErrorDiv);
            dataValid = false;
        }    
    }

    async function validateUserInfo(username, password, userInfo){

        if(userInfo){
            if(!username)
                return Status.VOID_USERNAME;

            if(username !== userInfo.username)
                return Status.INVALID_USERNAME;
            
            if(!password)
                return Status.VOID_PASSWORD;

            let result = await window.mainAPI.validatePassword(password);
            if (result !== true)
                return Status.INVALID_PASSWORD;
        }
        return Status.VALID;
    }

    async function validatePassword(password){
        let result = await window.mainAPI.validatePassword(password);
        console.log("result in validatePassword", result)
        if(result !== true)
          return Status.INVALID_OLD_PASSWORD;
 
         return Status.VALID;
     }
})


