import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase yapılandırma bilgileriniz
// Bu bilgileri Firebase projenizin ayarlarından alabilirsiniz.
const firebaseConfig = {
  apiKey: "BURAYA_API_KEY_GİRİN",
  authDomain: "BURAYA_AUTH_DOMAIN_GİRİN",
  projectId: "BURAYA_PROJECT_ID_GİRİN",
  storageBucket: "BURAYA_STORAGE_BUCKET_GİRİN",
  messagingSenderId: "BURAYA_MESSAGING_SENDER_ID_GİRİN",
  appId: "BURAYA_APP_ID_GİRİN"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firebase Authentication servisini başlat ve uygulamanın diğer yerlerinde kullanmak için dışa aktar
export const auth = getAuth(app);

// Firestore veritabanı servisini başlat ve dışa aktar
export const db = getFirestore(app);