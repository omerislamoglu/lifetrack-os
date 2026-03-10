import React, { useState, useEffect } from 'react';
import { Book, Dumbbell, Terminal, ChevronLeft, ChevronRight, X, Sun, Moon, Play, Pause, RotateCcw, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

const defaultActivities = [
  { id: 1, name: 'Ders (Saat)', iconName: 'Book', value: 0, goal: 6, color: '#3b82f6' },
  { id: 3, name: 'Spor (Dakika)', iconName: 'Dumbbell', value: 0, goal: 45, color: '#10b981' },
  { id: 5, name: 'Kod (Satır)', iconName: 'Terminal', value: 0, goal: 150, color: '#8b5cf6' },
];

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// UI için Gün isimli tarih gösterimi (Örn: 10 Mart Salı)
const getDisplayDate = (dateString) => {
  const dateObj = new Date(dateString);
  return dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
};

function App() {
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'dark');
  const [historyData, setHistoryData] = useState(() => JSON.parse(localStorage.getItem('saasLifeTrack')) || { [formatDate(new Date())]: defaultActivities });
  const [moods, setMoods] = useState(() => JSON.parse(localStorage.getItem('moodTracker')) || {});
  
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');

  // Pomodoro
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    localStorage.setItem('saasLifeTrack', JSON.stringify(historyData));
    localStorage.setItem('moodTracker', JSON.stringify(moods));
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('appTheme', theme);
  }, [historyData, moods, theme]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else { clearInterval(interval); }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const currentActivities = historyData[currentDate] || defaultActivities.map(a => ({ ...a, value: 0 }));

  const updateData = (id, field, val) => {
    const updated = currentActivities.map(a => a.id === id ? { ...a, [field]: parseFloat(val) || 0 } : a);
    setHistoryData({ ...historyData, [currentDate]: updated });
  };

  const deleteActivity = (id) => {
    const updated = currentActivities.filter(a => a.id !== id);
    setHistoryData({ ...historyData, [currentDate]: updated });
  };

  const addActivity = (e) => {
    e.preventDefault();
    if (!newName || !newGoal) return;
    const newAct = {
      id: Date.now(), name: newName, iconName: 'Terminal', value: 0, goal: parseFloat(newGoal),
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
    setHistoryData({ ...historyData, [currentDate]: [...currentActivities, newAct] });
    setNewName(''); setNewGoal('');
  };

  // Streak (Seri) Hesaplama
  const calculateStreak = () => {
    let currentStreak = 0;
    const today = new Date();

    const checkDayAverage = (dateObj) => {
      const dayData = historyData[formatDate(dateObj)];
      if (!dayData || dayData.length === 0) return 0;
      let totalProgress = 0;
      dayData.forEach(act => { totalProgress += Math.min((act.value / (act.goal || 1)) * 100, 100); });
      return totalProgress / dayData.length;
    };

    let checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
      if (checkDayAverage(checkDate) >= 50) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else { break; }
    }
    if (checkDayAverage(today) >= 50) currentStreak++;
    return currentStreak;
  };

  const streak = calculateStreak();

  const generateChartData = () => {
    return [6,5,4,3,2,1,0].map(i => {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dStr = formatDate(d);
      const dayData = historyData[dStr] || [];
      let total = 0;
      dayData.forEach(act => total += Math.min((act.value / (act.goal || 1)) * 100, 100));
      return { 
        name: d.toLocaleDateString('tr-TR', { weekday: 'short' }), 
        Skor: dayData.length ? Math.round(total / dayData.length) : 0 
      };
    });
  };

  return (
    <div className="app-container">
      
      <div className="header-top">
        <div className="streak-badge">
          <Flame size={24} color={streak > 0 ? "#ef4444" : "#64748b"} />
          <span style={{ color: streak > 0 ? "#ef4444" : "#64748b" }}>{streak} Günlük Seri</span>
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="theme-toggle">
          {theme === 'dark' ? <Sun size={24} color="#f59e0b"/> : <Moon size={24} color="#3b82f6"/>}
        </button>
      </div>

      <header>
        <h1>LifeTrack OS</h1>
        <p className="subtitle">Ömer'in Kişisel Analitik Paneli</p>
      </header>

      <div className="date-navigator">
        <button className="date-btn" onClick={() => {const d = new Date(currentDate); d.setDate(d.getDate()-1); setCurrentDate(formatDate(d));}}><ChevronLeft size={24}/> Dün</button>
        <span className="date-display">{getDisplayDate(currentDate)}</span>
        <button className="date-btn" onClick={() => {const d = new Date(currentDate); d.setDate(d.getDate()+1); setCurrentDate(formatDate(d));}}>Yarın <ChevronRight size={24}/></button>
      </div>

      <div className="pomodoro-card">
        <div className="timer-display">{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</div>
        <div className="timer-controls">
          <button className="timer-btn" style={{background:'#10b981'}} onClick={() => setIsActive(!isActive)}>{isActive ? 'DURDUR' : 'BAŞLAT'}</button>
          <button className="timer-btn" style={{background:'#ef4444'}} onClick={() => {setIsActive(false); setTimeLeft(25*60);}}>SIFIRLA</button>
        </div>
      </div>

      <div className="mood-section">
        <h3 style={{margin:0}}>Bugün Nasıl Hissediyorsun?</h3>
        <div className="mood-options">
          {['😔', '😐', '😊', '🔥', '🚀'].map(e => (
            <button key={e} className={`mood-btn ${moods[currentDate] === e ? 'active' : ''}`} onClick={() => setMoods({...moods, [currentDate]: e})}>{e}</button>
          ))}
        </div>
      </div>

      <div className="grid">
        {currentActivities.map(act => {
          const prog = Math.min((act.value / (act.goal || 1)) * 100, 100);
          return (
            <div key={act.id} className="card">
              <button className="delete-btn" onClick={() => deleteActivity(act.id)}><X size={16}/></button>
              <h3 style={{color: act.color, margin: '0 0 15px 0'}}>{act.name}</h3>
              <div className="input-group">
                <input type="number" className="value-input" value={act.value} onChange={(e) => updateData(act.id, 'value', e.target.value)} />
                <span style={{fontWeight:'bold', fontSize:'1.2rem'}}>/</span>
                <input type="number" className="goal-input" value={act.goal} onChange={(e) => updateData(act.id, 'goal', e.target.value)} />
              </div>
              <div className="progress-container"><div className="progress-bar" style={{width: `${prog}%`, backgroundColor: act.color}}></div></div>
              <p style={{textAlign:'right', fontSize: '0.85rem', color: 'var(--text-dim)', margin:'8px 0 0 0', fontWeight:'bold'}}>%{Math.round(prog)} tamamlandı</p>
            </div>
          )
        })}
      </div>

      <form className="add-form" onSubmit={addActivity}>
        <input type="text" placeholder="Örn: Kitap Okuma (Sayfa)" value={newName} onChange={(e) => setNewName(e.target.value)} required />
        <input type="number" placeholder="Günlük Hedef (Örn: 50)" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} required min="1" />
        <button type="submit" className="add-btn">Yeni Aktivite Ekle</button>
      </form>

      <div className="chart-card">
        <h2 style={{marginTop:0, marginBottom:'30px'}}>Haftalık Verimlilik (%)</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={generateChartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis dataKey="name" stroke="var(--text-dim)" />
              <YAxis stroke="var(--text-dim)" domain={[0, 100]} />
              <Tooltip contentStyle={{backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)'}} />
              <Line type="monotone" dataKey="Skor" stroke="#3b82f6" strokeWidth={4} activeDot={{r: 8}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default App;