// firebase-config.js
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    TwitterAuthProvider,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    serverTimestamp 
} from 'firebase/firestore';

// Cấu hình Firebase 
const firebaseConfig = {
    apiKey: "AIzaSyDhzhHAxpgXXZ5nmnksvNAqAFSU36a_Zxc",
    authDomain: "bluetv-de2ef.firebaseapp.com",
    projectId: "bluetv-de2ef",
    storageBucket: "bluetv-de2ef.firebasestorage.app",
    messagingSenderId: "529706820987",
    appId: "1:529706820987:web:48566d52549142fbf009de",
    measurementId: "G-9Z9W8Q055N"
  };

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Khởi tạo providers cho social login
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const twitterProvider = new TwitterAuthProvider();

// Cấu hình Google provider
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Cấu hình Facebook provider
facebookProvider.setCustomParameters({
    display: 'popup'
});

export default app;