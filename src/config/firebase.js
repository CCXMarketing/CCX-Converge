import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB3xB4TXjbf9UvxH-mWpKbTeLafXza1B3E",
  authDomain: "ccx-converge.firebaseapp.com",
  projectId: "ccx-converge",
  storageBucket: "ccx-converge.firebasestorage.app",
  messagingSenderId: "170445087938",
  appId: "1:170445087938:web:19473c7fd658c41472475b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
