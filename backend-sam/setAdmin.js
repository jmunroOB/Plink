// setAdmin.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Ensure you've initialized the Firebase Admin SDK if not already done.
// We'll assume the SDK is initialized from your project's `app.py`.

exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Get the user's UID from the request data
  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'The user ID is required.');
  }

  // Set the custom claim on the user
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    return { success: true, message: `Custom claim 'admin' set for user ${uid}` };
  } catch (error) {
    throw new functions.https.HttpsError('internal', `Failed to set custom claim: ${error.message}`);
  }
});