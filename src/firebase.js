import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Senin kopyaladığın gerçek bilgiler:
const firebaseConfig = {
  apiKey: "AIzaSyDuTHFzSDw1bGR39-sUH05XYSjiMqjOrYw",
  authDomain: "lifetrack-os-db.firebaseapp.com",
  projectId: "lifetrack-os-db",
  storageBucket: "lifetrack-os-db.firebasestorage.app",
  messagingSenderId: "642395323092",
  appId: "1:642395323092:web:41ece9a936aa527f515941",
  measurementId: "G-NC5CNXJ4QB"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Uygulama içinde kullanacağımız servisleri dışarı aktar
export const auth = getAuth(app);

// Firestore'u çevrimdışı kalıcılık ile başlat
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export default app;