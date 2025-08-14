const { getAuth } = require('firebase-admin/auth');
const { initializeApp, cert } = require('firebase-admin/app');

// Initialize Firebase Admin
const serviceAccount = require('../vaultify-demo-firebase-adminsdk-fbsvc-eccdece0e5.json');
initializeApp({
  credential: cert(serviceAccount)
});

async function createDemoAccounts() {
  const auth = getAuth();
  
  console.log('Creating demo accounts...');
  
  for (let i = 1; i <= 15; i++) {
    try {
      const user = await auth.createUser({
        email: `demo${i}@snapmyassets.com`,
        password: `DemoAccount${i}!`,
        displayName: `Demo User ${i}`,
        emailVerified: true
      });
      console.log(`✅ Created user: demo${i}@snapmyassets.com`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  User demo${i}@snapmyassets.com already exists`);
      } else {
        console.error(`❌ Error creating demo${i}:`, error.message);
      }
    }
  }
  
  console.log('Demo account creation complete!');
  process.exit(0);
}

createDemoAccounts().catch(console.error);
