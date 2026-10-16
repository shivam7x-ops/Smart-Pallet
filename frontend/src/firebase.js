import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB4aviZZq5ViphoHHwtOwakMptKrKBnVEY",
  authDomain: "smart-pallet-a6d21.firebaseapp.com",
  projectId: "smart-pallet-a6d21",
  storageBucket: "smart-pallet-a6d21.firebasestorage.app",
  messagingSenderId: "638392046827",
  appId: "1:638392046827:web:0457889c757dbf48c75aae",
  databaseURL: "https://smart-pallet-a6d21-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
export default app;

