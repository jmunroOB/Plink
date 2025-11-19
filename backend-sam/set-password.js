// set-password.js

const admin = require('firebase-admin');
const serviceAccount = require('./disrupt-53691-firebase-adminsdk-fbsvc-7410fd769f.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = '3r5seh7smBa3iY0iqAZvPSPZZPh1'; 
const newPassword = 'Leigha2005!'; 

admin.auth().updateUser(uid, {
    password: newPassword
  })
  .then((userRecord) => {
    console.log(`Password for user ${userRecord.uid} updated successfully.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error updating password:', error);
    process.exit(1);
  });