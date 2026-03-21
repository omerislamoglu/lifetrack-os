import React, { useState } from 'react';
import { Mail, Lock, Loader, LogIn, UserPlus, User } from 'lucide-react';
import { auth, signInWithGoogle } from './firebase';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, OAuthProvider, signInWithCredential, updateProfile } from 'firebase/auth';
import './App.css'; 
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!username.trim()) {
          setError('Lütfen bir kullanıcı adı belirleyin.');
          setLoading(false);
          return;
        }
        localStorage.setItem('temp_username', username);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });
      }
      // Başarılı olursa App.js içindeki auth listener (onAuthStateChanged) durumu yakalayacaktır.
    } catch (err) {
      console.error("Auth Hatası:", err);
      let msg = err.message;
      if (msg.includes('auth/invalid-email')) msg = 'Geçersiz e-posta adresi.';
      else if (msg.includes('auth/user-not-found')) msg = 'Kullanıcı bulunamadı.';
      else if (msg.includes('auth/wrong-password')) msg = 'Hatalı şifre.';
      else if (msg.includes('auth/email-already-in-use')) msg = 'Bu e-posta zaten kullanımda.';
      else if (msg.includes('auth/weak-password')) msg = 'Şifre çok zayıf (en az 6 karakter).';
      else if (msg.includes('auth/api-key-not-valid')) msg = 'Firebase API anahtarı geçersiz. Lütfen firebase.js dosyasındaki yapılandırma ayarlarını kontrol edin.';
      else if (msg.includes('auth/network-request-failed')) msg = 'Bağlantı hatası. İnternet bağlantınızı veya Firebase yapılandırma ayarlarınızı (firebase.js) kontrol edin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      if (Capacitor.isNativePlatform()) {
        await signInWithGoogle();
      } else {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
    } catch (err) {
      console.error("Google Login Hatası:", err);
      let msg = err.message;
      if (msg.includes('canceled') || msg.includes('cancelled')) msg = 'Giriş işlemi iptal edildi.';
      else if (msg.includes('auth/api-key-not-valid')) msg = 'Firebase API anahtarı geçersiz.';
      else if (msg.includes('auth/network-request-failed')) msg = 'Bağlantı hatası. Lütfen internetinizi kontrol edin.';
      else msg = 'Giriş yapılamadı, lütfen tekrar deneyin.';
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // İŞTE SİHRİN GERÇEKLEŞTİĞİ YER BURASI!
  const handleAppleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Native ekrandan FaceID/Parola onayı alınır
      const result = await FirebaseAuthentication.signInWithApple();
      
      // 2. Gelen Apple biletini (token), uygulamanın ana kapısına (auth) teslim ediyoruz
      if (result.credential && result.credential.idToken) {
        const provider = new OAuthProvider('apple.com');
        const credential = provider.credential({
          idToken: result.credential.idToken,
          rawNonce: result.credential.nonce
        });
        
        // Bu komut App.js'e "Kapıyı aç!" mesajı gönderir
        await signInWithCredential(auth, credential); 
        
      } else {
        throw new Error('Apple kimlik bilgisi alınamadı.');
      }
    } catch (err) {
      console.error("Apple Giriş Hatası:", err);
      setError('Apple ile giriş işlemi tamamlanamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) { setError('Şifre sıfırlama bağlantısı için lütfen e-posta adresinizi girin.'); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-wrapper">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-card"
      >
        <div className="auth-header">
            <h1>LifeTrack OS</h1>
            <h2>{isLogin ? 'Hoş Geldiniz' : 'Hesap Oluştur'}</h2>
            <p style={{color: 'var(--text-dim)'}}>
                {isLogin ? 'Devam etmek için giriş yapın' : 'Kişisel analitik panelinize erişin'}
            </p>
        </div>

        {error && <div style={{background: 'rgba(239,68,68,0.2)', color:'#ef4444', padding:'10px', borderRadius:'12px', marginBottom:'20px', fontSize:'0.9rem', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'left'}}>{error}</div>}
        {resetSent && <div style={{background: 'rgba(16, 185, 129, 0.2)', color:'#10b981', padding:'10px', borderRadius:'12px', marginBottom:'20px', fontSize:'0.9rem', border: '1px solid rgba(16, 185, 129, 0.3)'}}>Şifre sıfırlama bağlantısı gönderildi!</div>}

        <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
                <div className="glass-input-group">
                    <User className="input-icon" size={20} />
                    <input 
                        type="text" placeholder="Kullanıcı Adı" className="glass-input"
                        value={username} onChange={(e) => setUsername(e.target.value)} required
                    />
                </div>
            )}
            <div className="glass-input-group">
                <Mail className="input-icon" size={20} />
                <input 
                    type="email" placeholder="E-posta Adresi" className="glass-input"
                    value={email} onChange={(e) => setEmail(e.target.value)} required
                />
            </div>

            <div className="glass-input-group">
                <Lock className="input-icon" size={20} />
                <input 
                    type="password" placeholder="Şifre" className="glass-input"
                    value={password} onChange={(e) => setPassword(e.target.value)} required
                />
            </div>

            {isLogin && (
              <div style={{textAlign: 'right', marginTop: '-10px'}}>
                <button type="button" onClick={handleResetPassword} style={{background:'none', border:'none', color:'var(--text-dim)', fontSize:'0.85rem', cursor:'pointer', textDecoration:'underline'}}>Şifremi Unuttum</button>
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <Loader className="spin" size={20} /> : (isLogin ? <><LogIn size={20}/> Giriş Yap</> : <><UserPlus size={20}/> Kayıt Ol</>)}
            </button>

            <div className="auth-separator"><span>veya</span></div>

            <button type="button" className="apple-btn" onClick={handleAppleLogin} disabled={loading}>
              <svg width="20" height="20" viewBox="0 0 384 512" fill="white">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
              </svg>
              Apple ile Devam Et
            </button>

            <button type="button" className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google ile Devam Et
            </button>
        </form>

        <div className="auth-switch">
            {isLogin ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
            <button onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Kayıt Ol' : 'Giriş Yap'}</button>
        </div>
      </motion.div>
    </div>
  );
}