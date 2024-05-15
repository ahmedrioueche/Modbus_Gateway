const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

let db;

// Function to open the SQLite database
async function openDatabase() {
    return new Promise((resolve, reject) => {
        const dbPath = path.resolve(__dirname, '../../userCreds.db');
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Function to close the SQLite database
async function closeDatabase() {
  return new Promise((resolve, reject) => {
      if (db && db.open) {
          db.close((err) => {
              if (err) {
                  reject(err);
              } else {
                  resolve();
              }
          });
      } else {
          resolve(); // Resolve if database is already closed
      }
  });
}

// Function to create the users table if it doesn't exist
async function createUsersTable() {
    await openDatabase();
    return new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT
        )`, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    }).finally(closeDatabase);
}

// Function to insert user credentials into the database
async function insertUser(username, password) {
    await openDatabase();
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    }).finally(closeDatabase);
}

// Function to load user data from the database
async function loadUserData(username) {
    let adminDefaultPassword = 'admin'
    await openDatabase();
    try {
        const userData = await getUser(username);

        if (userData) {
            return {
                username: userData.username,
                password: userData.password
            };
        } else if (username === process.env.manufacturerDefaultUsername) {
            return {
                username: process.env.manufacturerDefaultUsername,
                password: manufacturerDefaultPassword // Use manufacturer password
            };
        } else {
            return {
                username: 'admin',
                password: adminDefaultPassword // Use defaultPassword
            };
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        return {
            username: null,
            password: null
        };
    } finally {
        await closeDatabase();
    }
}

// Function to validate user credentials
async function validateUserData(username, password) {
  await openDatabase();
  try {
      const adminData = await getUser('admin');
      const manufacturerData = await getUser(process.env.manufacturerDefaultUsername);
      
      if (username === 'admin' && adminData) {
          const result = await bcrypt.compare(password, adminData.password);
          if (result) {
              return 0; // Successful login for admin
          } else {
              return -2; // Invalid password for admin
          }
      } else if (username === process.env.manufacturerDefaultUsername && manufacturerData) {
          const result = await bcrypt.compare(password, manufacturerData.password);
          if (result) {
              return 0xCF; // Successful login for manufacturer
          } else {
              return -2; // Invalid password for manufacturer
          }
      } else {
          return -1; // User not found
      }
  } catch (error) {
      console.error('Error validating user data:', error);
      return { type: 'unknown', code: -1 }; // Generic error
  } finally {
      await closeDatabase();
  }
}

// Function to retrieve user credentials from the database
async function getUser(username) {
    await openDatabase();
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    }).finally(closeDatabase);
}

// Function to hash a password
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

// Function to create the default users in the database
async function createDefaultUserData() {
  await openDatabase();
  try {
      await createUsersTable();
      
      // Check if the users already exist before inserting them
      const adminExists = await getUser('admin');
      const manufacturerExists = await getUser(process.env.manufacturerDefaultUsername);

      if (!adminExists) {
          // Hash passwords before inserting into the database
          const hashedAdminPassword = await hashPassword('admin');
          await insertUser('admin', hashedAdminPassword);
      }

      if (!manufacturerExists) {
          // Hash manufacturer password before inserting into the database
          const hashedManufacturerPassword = await hashPassword(process.env.manufacturerDefaultPassword);
          await insertUser(process.env.manufacturerDefaultUsername, hashedManufacturerPassword);
      }
      
      console.log('Default user data created successfully.');
  } catch (error) {
      console.error('Error creating default user data:', error);
  } finally {
      await closeDatabase();
  }
}


// Export all functions
module.exports = {
    loadUserData,
    createUsersTable,
    insertUser,
    getUser,
    hashPassword,
    validateUserData,
    createDefaultUserData
};
