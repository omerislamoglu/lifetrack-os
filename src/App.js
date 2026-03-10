import React, { useState, useEffect } from 'react';
import { Book, Tv, Dumbbell, Footprints, Terminal, Droplets, ChevronLeft, ChevronRight, X, Activity, Sun, Moon, Flame, Play, Pause, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

const defaultActivities = [
  { id: 1, name: 'Ders (Saat)', iconName: 'Book', value: 0, goal: 6, color: '#3b82f6' },
  { id: 3, name: 'Spor (Dakika)', iconName: 'Dumbbell', value: 0, goal: 45, color: '#10b981' },
  { id: 5, name: 'Kod Yazma (Satır)', iconName: 'Terminal', value: 0, goal: 150, color: '#8b5cf6' },
];

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function App() {
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'dark');
  const [historyData, setHistoryData] = useState(() => JSON.parse(localStorage.getItem('saasLifeTrack')) || {});
  
  // Pomodoro State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  // Mood State
  const [moods, setMoods] = useState(() => JSON.parse(localStorage.getItem('moodTracker')) || {});

  useEffect(() => {
    localStorage.setItem('saasLifeTrack', JSON.stringify(historyData));
    localStorage.setItem('moodTracker', JSON.stringify(moods));
  }, [historyData, moods]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setTimeLeft(25 * 60); };
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getTodayActivities = () => historyData[currentDate] || defaultActivities.map(a => ({ ...a, value: 0 }));
  const currentActivities = getTodayActivities();

  const updateValue = (id, val) => {
    const updated = currentActivities.map(a => a.id === id ? { ...a, value: parseFloat(val) || 0 } : a);
    setHistoryData({ ...historyData, [currentDate]: updated });
  };

  const updateGoal = (id, val) => {
    const updated = currentActivities.map(a => a.id === id ? { ...a, goal: parseFloat(val) || 1 } : a);
    setHistoryData({ ...historyData, [currentDate]: updated });
  };

  const deleteActivity = (id) => {
    const updated = currentActivities.filter(a => a.id !== id);
    setHistoryData({ ...historyData, [currentDate]: updated });
  };

  const handleMood = (emoji) => {
    setMoods({ ...moods, [currentDate]: emoji });
  };

  return (
    <div className="app-container">
      <div className="header-top">
        <div className="streak-badge"><Flame color="#ef4444" /> <span>Haliç CE Mode On</span></div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="theme-toggle">
          {theme === 'dark' ? <Sun /> : <Moon />}
        </button>
      </div>

      <header style={{textAlign:'center', marginBottom: 30}}>
        <h1>LifeTrack OS <small style={{fontSize: '1rem', verticalAlign: 'middle'}}>v3.0</small></h1>
        <div className="date-navigator">
          <button onClick={() => {
            const d = new Date(currentDate); d.setDate(d.getDate()-1); setCurrentDate(formatDate(d));
          }}><ChevronLeft /> Dün</button>
          <span style={{fontWeight: 'bold', margin: '0 20px'}}>{currentDate}</span>
          <button onClick={() => {
            const d = new Date(currentDate); d.setDate(d.getDate()+1); setCurrentDate(formatDate(d));
          }}>Yarın <ChevronRight /></button>
        </div>
      </header>

      {/* POMODORO SECTION */}
      <div className="pomodoro-card">
        <h2 style={{margin:0}}>Focus Timer</h2>
        <div className="timer-display">{formatTime(timeLeft)}</div>
        <div className="timer-controls">
          <button className="timer-btn start" onClick={toggleTimer}>{isActive ? <Pause /> : <Play />}</button>
          <button className="timer-btn reset" onClick={resetTimer}><RotateCcw /></button>
        </div>
      </div>

      {/* MOOD TRACKER SECTION */}
      <div className="mood-section">
        <h3 style={{margin:0}}>Bugün Nasıl Hissediyorsun?</h3>
        <div className="mood-options">
          {['😔', '😐', '😊', '🔥', '🚀'].map(emoji => (
            <button 
              key={emoji} 
              className={`mood-btn ${moods[currentDate] === emoji ? 'active' : ''}`}
              onClick={() => handleMood(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="grid">
        {currentActivities.map(act => {
          const prog = Math.min((act.value / (act.goal || 1)) * 100, 100);
          return (
            <div key={act.id} className="card">
              <button className="delete-btn" onClick={() => deleteActivity(act.id)}><X size={18}/></button>
              <h3 style={{color: act.color, marginTop: 0}}>{act.name}</h3>
              <div className="input-group">
                <input type="number" className="value-input" value={act.value} onChange={(e) => updateValue(act.id, e.target.value)} />
                <span style={{fontSize: '1.5rem', fontWeight: 'bold'}}>/</span>
                <input type="number" className="goal-input" value={act.goal} onChange={(e) => updateGoal(act.id, e.target.value)} />
              </div>
              <div className="progress-container">
                <div className="progress-bar" style={{width: `${prog}%`, backgroundColor: act.color}}></div>
              </div>
              <p style={{textAlign:'right', fontSize: '0.8rem', color: 'var(--text-dim)'}}>%{Math.round(prog)} tamamlandı</p>
            </div>
          )
        })}
      </div>
    </div>
  );
}

export default App;