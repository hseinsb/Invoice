// Simple Firebase connection test
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBzs2yAJGHT9YgOAMT4pq_LkMmUNZSd-GA",
  authDomain: "invoice-c762f.firebaseapp.com",
  projectId: "invoice-c762f",
  storageBucket: "invoice-c762f.firebasestorage.app",
  messagingSenderId: "622330020660",
  appId: "1:622330020660:web:f18591ef9fdfc37fee1b61"
};

console.log('Testing Firebase connection...');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Auth Domain:', firebaseConfig.authDomain);

try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  console.log('✅ Firebase initialized successfully');
  console.log('Auth instance:', !!auth);
  console.log('Firestore instance:', !!db);
  
  // Test user UID
  console.log('Expected user UID: bViZRRdAP5QupU5UYH59dxsVFr42');
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
}
