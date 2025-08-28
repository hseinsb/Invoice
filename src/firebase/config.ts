import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBzs2yAJGHT9YgOAMT4pq_LkMmUNZSd-GA",
  authDomain: "invoice-c762f.firebaseapp.com",
  projectId: "invoice-c762f",
  storageBucket: "invoice-c762f.firebasestorage.app",
  messagingSenderId: "622330020660",
  appId: "1:622330020660:web:f18591ef9fdfc37fee1b61",
  measurementId: "G-VJ6LE0ZJ46"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Connect to emulators in development (commented out for production use)
// if (process.env.NODE_ENV === 'development') {
//   try {
//     connectAuthEmulator(auth, 'http://localhost:9099');
//     connectFirestoreEmulator(db, 'localhost', 8080);
//     connectFunctionsEmulator(functions, 'localhost', 5001);
//   } catch (error) {
//     console.log('Emulators already connected or not available');
//   }
// }

export { app };
