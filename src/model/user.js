const fs = require('fs');
const bcrypt = require('bcrypt');

let adminDefaultPassword;
let manufacturerDefaultPassword;
let loggedinUsername;

async function validateUserData(username, password){
    console.log("validateUserData")
  loggedinUsername = username;
  userData = await loadUserData(username);
  if(userData){
    try {
      if(userData.username !== username)
        return -1;

      const result = await bcrypt.compare(password, userData.password);
      if (!result) {
        console.log("Password is invalid");
        return -2;

      } else {  
          console.log("Password is valid");
          if(username === process.env.manufacturerDefaultUsername)
            return 0xCF;

          return 0;
      }
    } catch (error) {
      console.error("Error comparing passwords:", error);
    }  
  }
  else return -1;
}


async function hashDefaultPass() {
  adminDefaultPassword = await hashPassword("admin");
  manufacturerDefaultPassword = await hashPassword(process.env.manufacturerDefaultPassword);
}

hashDefaultPass().then(() => {
}).catch(error => {
  console.error("Error hashing password:", error);
});

async function loadUserData(username) {
  try {
    const data = fs.readFileSync('userData.json');
    const userData = JSON.parse(data);
    console.log("username", username)
    console.log("manifacturerDefaultUsername", process.env.manufacturerDefaultUsername)
    if (username === process.env.manufacturerDefaultUsername) {
      return userData.manufacturer || {
        username: process.env.manifacturerDefaultUsername,
        password: manufacturerDefaultPassword // Use manufacturer password 
      };
    } else {
      return userData.admin || {
        username: 'admin',
        password: adminDefaultPassword // Use defaultPassword 
      };  
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    // If an error occurs while loading user data, return default admin credentials
    return {
      username: null,
      password: null 
    };
  }
}

function saveUserData(adminData) {
  try {
      // Read existing data from userData.json file
      let existingData = {};
      try {
          existingData = JSON.parse(fs.readFileSync('userData.json'));
      } catch (error) {
          // If userData.json doesn't exist or is invalid JSON, just use an empty object
      }

      // Update the admin part with the new adminData
      existingData.admin = adminData;

      // Write the updated data back to userData.json file
      fs.writeFileSync('userData.json', JSON.stringify(existingData));
      console.log("Admin data saved successfully.");
  } catch (error) {
      console.error("Error saving admin data:", error);
  }
}

async function hashPassword(password) {
  const saltRounds = 10; // Number of salt rounds for bcrypt
  return await bcrypt.hash(password, saltRounds);
}


// Function to create the userData.json file with default values
async function createDefaultUserDataFile() {
  const userDataFilePath = 'userData.json';
  try {
      // Await the hashing of default passwords
      await hashDefaultPass();
      
      // Create default user data
      const defaultUserData = {
          manufacturer: {
              username: process.env.manufacturerDefaultUsername,
              password: manufacturerDefaultPassword
          },
          admin: {
              username: 'admin',
              password: adminDefaultPassword
          }
      };
      
      // Write default user data to userData.json file
      fs.writeFileSync(userDataFilePath, JSON.stringify(defaultUserData));
      console.log("userData.json created with default values.");
  } catch (error) {
      console.error("Error creating userData.json:", error);
  }
}

module.exports.validateUserData = validateUserData;
module.exports.loadUserData = loadUserData;
module.exports.hashPassword = hashPassword;
module.exports.saveUserData = saveUserData;
module.exports.createDefaultUserDataFile = createDefaultUserDataFile;