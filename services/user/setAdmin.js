const admin = require('firebase-admin');

const serviceAccount = require('./creds/serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = 'ge8G24MeEOR1zqAaJZUMU4zgVsn2';  // ← Your UID

admin.auth().getUser(uid)
  .then((user) => {
    // Get existing custom claims
    const existingClaims = user.customClaims || {};
    
    // Add admin role while keeping existing claims
    const newClaims = {
      ...existingClaims,
      role: 'admin'  // Add admin role
    };
    
    return admin.auth().setCustomUserClaims(uid, newClaims);
  })
  .then(() => {
    console.log('✅ Successfully set admin role!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });