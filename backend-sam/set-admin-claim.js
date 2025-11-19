// set-admin-claim.js

const admin = require('firebase-admin');
const serviceAccount = require('./disrupt-53691-firebase-adminsdk-fbsvc-7410fd769f.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = '3r5seh7smBa3iY0iqAZvPSPZZPh1'; // REPLACE THIS WITH YOUR USER'S UID

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`Custom claim 'admin' set for user ${uid}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error setting custom claim:', error);
    process.exit(1);
  });