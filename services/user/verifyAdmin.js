const admin = require('firebase-admin');

const serviceAccount = require('./creds/serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = 'ge8G24MeEOR1zqAaJZUMU4zgVsn2';  // ← Same UID you used in setAdmin.js

admin.auth().getUser(uid)
  .then((user) => {
    console.log('📋 User Info:');
    console.log('   Email:', user.email);
    console.log('   UID:', user.uid);
    console.log('   Custom Claims:', user.customClaims);
    
    if (user.customClaims?.role === 'admin') {
      console.log('\n✅ User IS an admin!');
    } else {
      console.log('\n❌ User is NOT an admin');
      console.log('   Current role:', user.customClaims?.role || 'none');
    }
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });