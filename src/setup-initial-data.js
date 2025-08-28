// Setup initial company settings and user data
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBzs2yAJGHT9YgOAMT4pq_LkMmUNZSd-GA",
  authDomain: "invoice-c762f.firebaseapp.com",
  projectId: "invoice-c762f",
  storageBucket: "invoice-c762f.firebasestorage.app",
  messagingSenderId: "622330020660",
  appId: "1:622330020660:web:f18591ef9fdfc37fee1b61"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupInitialData() {
  try {
    console.log('Setting up initial company settings...');
    
    // Create company settings document
    await setDoc(doc(db, 'settings', 'company'), {
      legalName: 'Whittico Collision',
      address: {
        street: '123 Main Street',
        city: 'Anytown',
        state: 'MI',
        zipCode: '48000'
      },
      phone: '(555) 123-4567',
      email: 'info@whitticocollision.co',
      invoicePrefix: 'WC',
      nextInvoiceSeq: 1,
      defaultTaxRateParts: 0.06,
      terms: 'Payment is due upon receipt. Thank you for your business!',
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Company settings created');
    
    // Create user profile for the UID you provided
    await setDoc(doc(db, 'users', 'bViZRRdAP5QupU5UYH59dxsVFr42'), {
      role: 'owner',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ User profile created for UID: bViZRRdAP5QupU5UYH59dxsVFr42');
    console.log('🎉 Initial setup complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupInitialData();
