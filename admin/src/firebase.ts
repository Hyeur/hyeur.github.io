import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const app = initializeApp({ apiKey:"AIzaSyD7pX-CS_9tsiEJVhOJ-Hn57u1b_g_voTE", authDomain:"sounddesignportfolio.firebaseapp.com", projectId:"sounddesignportfolio", storageBucket:"sounddesignportfolio.firebasestorage.app", messagingSenderId:"635112754064", appId:"1:635112754064:web:10c9300d859ce1ae060115", measurementId:"G-7YL4QYFLTK" });
export const auth = getAuth(app);
export const db = getFirestore(app);
