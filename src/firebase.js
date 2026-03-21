import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

const firebaseConfig = {
  apiKey: "AIzaSyAcxDGMkJ97NDqCbT501CorB9wKiak0Zf8",
  authDomain: "lifetrack-os.firebaseapp.com",
  projectId: "lifetrack-os",
  storageBucket: "lifetrack-os.appspot.com",
  messagingSenderId: "642395323092",
  appId: "1:642395323092:web:d8a1e2f3b4c5d6e7f8g9h0" // Tam appId ekle (Firebase Console'dan kopyala)
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Ağ bağlantısı ve Live Reload sorunlarını çözer
  useFetchStreams: false,
  ignoreUndefinedProperties: true // Tanımsız (undefined) state verilerinin Firestore'u çökertmesini engeller
});

export const signInWithGoogle = async () => {
  try {
    const result = await FirebaseAuthentication.signInWithGoogle();
    
    // 1. Native girişten dönen idToken'ı alıyoruz
    if (result.credential?.idToken) {
      // 2. idToken ile bir Google kimlik bilgisi (credential) oluşturuyoruz
      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      // 3. Oluşturduğumuz kimlik bilgisi ile Firebase Web SDK'sına giriş yapıyoruz
      return await signInWithCredential(auth, credential);
    }
  } catch (error) {
    console.error("Google login hatası:", error);
    throw error;
  }
};