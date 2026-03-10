import React, { useState } from 'react';
import { Mail, Lock, Loader, LogIn, UserPlus } from 'lucide-react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import './App.css'; // Stilleri App.css'den alıyoruz

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // Başarılı olursa App.js içindeki auth listener (onAuthStateChanged) durumu yakalayacaktır.
    } catch (err) {
      let msg = err.message;
      if (msg.includes('auth/invalid-email')) msg = 'Geçersiz e-posta adresi.';
      else if (msg.includes('auth/user-not-found')) msg = 'Kullanıcı bulunamadı.';
      else if (msg.includes('auth/wrong-password')) msg = 'Hatalı şifre.';
      else if (msg.includes('auth/email-already-in-use')) msg = 'Bu e-posta zaten kullanımda.';
      else if (msg.includes('auth/weak-password')) msg = 'Şifre çok zayıf (en az 6 karakter).';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
            <h1>LifeTrack OS</h1>
            <h2>{isLogin ? 'Hoş Geldiniz' : 'Hesap Oluştur'}</h2>
            <p style={{color: 'var(--text-dim)'}}>
                {isLogin ? 'Devam etmek için giriş yapın' : 'Kişisel analitik panelinize erişin'}
            </p>
        </div>

        {error && <div style={{background: 'rgba(239,68,68,0.2)', color:'#ef4444', padding:'10px', borderRadius:'12px', marginBottom:'20px', fontSize:'0.9rem', border: '1px solid rgba(239,68,68,0.3)'}}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
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

            <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <Loader className="spin" size={20} /> : (isLogin ? <><LogIn size={20}/> Giriş Yap</> : <><UserPlus size={20}/> Kayıt Ol</>)}
            </button>
        </form>

        <div className="auth-switch">
            {isLogin ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
            <button onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Kayıt Ol' : 'Giriş Yap'}</button>
        </div>
      </div>
    </div>
  );
}