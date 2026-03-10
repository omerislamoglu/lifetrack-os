import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Sun, Moon, Flame, Lock, Download, LogOut, Loader, LayoutDashboard, Target, BarChart3, Maximize, Minimize, ArrowUp, ArrowDown, Check, Trash2, Plus, Trophy } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import Auth from './Auth';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const defaultActivities = [
  { id: 1, name: 'Ders (Saat)', iconName: 'Book', value: 0, goal: 6, weeklyGoal: 42, color: '#3b82f6' },
  { id: 3, name: 'Spor (Dakika)', iconName: 'Dumbbell', value: 0, goal: 45, weeklyGoal: 315, color: '#10b981' },
  { id: 5, name: 'Kod (Satır)', iconName: 'Terminal', value: 0, goal: 150, weeklyGoal: 1050, color: '#8b5cf6' },
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
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'dark');
  const [historyData, setHistoryData] = useState({});
  const [moods, setMoods] = useState({});
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newWeeklyGoal, setNewWeeklyGoal] = useState('');

  // Pomodoro
  const [pomodoroDuration, setPomodoroDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const isEditable = currentDate === formatDate(new Date());

  // Firebase Auth Listener & Data Loading
  useEffect(() => {
    // Güvenlik Zaman Aşımı: 5 saniye içinde yanıt gelmezse yüklemeyi durdur
    const timeout = setTimeout(() => {
      console.warn("Firebase yanıt vermedi, zaman aşımı uygulandı.");
      setAuthLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth durumu kontrol ediliyor...");
      try {
        if (currentUser) {
          setUser(currentUser);
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setHistoryData(data.historyData || { [formatDate(new Date())]: defaultActivities });
            setMoods(data.moods || {});
            setTodos(data.todos || []);
          } else {
            // New user, initialize with default data for today
            setHistoryData({ [formatDate(new Date())]: defaultActivities });
            setMoods({});
            setTodos([]);
          }
        } else {
          setUser(null);
          setHistoryData({});
          setMoods({});
          setTodos([]);
        }
      } catch (error) {
        console.error("Firebase veri yükleme hatası:", error);
      } finally {
        clearTimeout(timeout);
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Data Saving to Firestore
  useEffect(() => {
    if (!user) return;

    const debounceSave = setTimeout(async () => {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { historyData, moods, todos }, { merge: true });
    }, 1500); // Debounce to avoid too many writes

    return () => clearTimeout(debounceSave);
  }, [historyData, moods, todos, user]);

  // Theme persistence
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(() => {});
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else { clearInterval(interval); }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Tarayıcı sekmesinde (Title) kalan süreyi göster
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const mins = Math.floor(timeLeft / 60);
      const secs = (timeLeft % 60).toString().padStart(2, '0');
      document.title = `(${mins}:${secs}) LifeTrack OS`;
    } else {
      document.title = 'Daily Flow | Productivity Dashboard';
    }
  }, [isActive, timeLeft]);

  // ESC tuşu ile tam ekrandan çıkma
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') setIsFullScreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // To-Do İşlemleri
  const addTodo = (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    // Yeni görevi her zaman listenin başına ekle
    setTodos([{ id: Date.now(), text: newTodo, completed: false }, ...todos]);
    setNewTodo('');
  };

  const toggleTodo = (id) => {
    const newTodos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    // Tamamlananları sona, tamamlanmayanları başa alacak şekilde sırala.
    // Modern JS motorlarındaki stabil sıralama, sürükle-bırak ile yapılan sıralamayı korur.
    newTodos.sort((a, b) => a.completed - b.completed);
    setTodos(newTodos);
  };

  const deleteTodo = (id) => setTodos(todos.filter(t => t.id !== id));

  const analysisData = useMemo(() => {
    const today = new Date();
    const allDates = Object.keys(historyData).sort((a, b) => new Date(b) - new Date(a));
    const weeklyScores = [];
    const weeklyActivityTotals = [];

    for (let i = 0; i < 4; i++) {
        const weekEndDate = new Date(today);
        weekEndDate.setDate(today.getDate() - (i * 7));
        const weekStartDate = new Date(weekEndDate);
        weekStartDate.setDate(weekEndDate.getDate() - 6);

        const weekDates = allDates.filter(dateStr => {
            const d = new Date(dateStr);
            return d >= weekStartDate && d <= weekEndDate;
        });

        let weekTotalProgress = 0;
        let daysWithData = 0;
        const activityTotals = {};
        defaultActivities.forEach(act => { activityTotals[act.name] = 0; });

        weekDates.forEach(dateStr => {
            const dayData = historyData[dateStr];
            if (dayData && dayData.length > 0) {
                let dayTotalProgress = 0;
                dayData.forEach(act => {
                    dayTotalProgress += Math.min((act.value / (act.goal || 1)) * 100, 100);
                    if (activityTotals[act.name] !== undefined) {
                        activityTotals[act.name] += act.value;
                    }
                });
                weekTotalProgress += (dayTotalProgress / dayData.length);
                daysWithData++;
            }
        });
        
        weeklyScores.push({
            name: i === 0 ? 'Bu Hafta' : `${i}H Önce`,
            Skor: daysWithData > 0 ? Math.round(weekTotalProgress / daysWithData) : 0,
        });
        weeklyActivityTotals.push(activityTotals);
    }

    const thisWeekTotals = weeklyActivityTotals[0];
    const lastWeekTotals = weeklyActivityTotals[1];
    const comparison = defaultActivities.map(act => {
        const thisWeek = thisWeekTotals[act.name] || 0;
        const lastWeek = lastWeekTotals[act.name] || 0;
        let change = 0;
        if (lastWeek > 0) {
            change = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
        } else if (thisWeek > 0) {
            change = 100;
        }
        return { name: act.name.split(' ')[0], color: act.color, change, thisWeek, lastWeek };
    });

    // En Verimli Gün Hesaplama
    const daysOfWeek = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const dayScores = Array(7).fill(0);
    const dayCounts = Array(7).fill(0);

    allDates.forEach(dateStr => {
        const d = new Date(dateStr);
        const dayIndex = d.getDay();
        const dayData = historyData[dateStr];
        if (dayData && dayData.length > 0) {
            let dayTotal = 0;
            dayData.forEach(act => { dayTotal += Math.min((act.value / (act.goal || 1)) * 100, 100); });
            dayScores[dayIndex] += (dayTotal / dayData.length);
            dayCounts[dayIndex]++;
        }
    });

    let bestDayIndex = -1, maxAvg = -1;
    for(let i=0; i<7; i++) { if(dayCounts[i]>0 && (dayScores[i]/dayCounts[i]) > maxAvg) { maxAvg = dayScores[i]/dayCounts[i]; bestDayIndex = i; } }
    const bestDay = bestDayIndex !== -1 ? daysOfWeek[bestDayIndex] : null;

    // En Uzun Seri (Longest Streak) Hesaplama
    let maxStreak = 0;
    let currentStreakCalc = 0;
    const sortedDatesAsc = [...allDates].reverse(); // Tarihleri eskiden yeniye sırala
    let prevDateObj = null;

    sortedDatesAsc.forEach(dateStr => {
        const dayData = historyData[dateStr];
        let isSuccess = false;
        if (dayData && dayData.length > 0) {
            let total = 0;
            dayData.forEach(act => total += Math.min((act.value / (act.goal || 1)) * 100, 100));
            if ((total / dayData.length) >= 50) isSuccess = true;
        }

        if (isSuccess) {
            const currentDateObj = new Date(dateStr);
            if (prevDateObj && Math.ceil(Math.abs(currentDateObj - prevDateObj) / (1000 * 60 * 60 * 24)) === 1) {
                currentStreakCalc++;
            } else { currentStreakCalc = 1; }
            prevDateObj = currentDateObj;
        } else { currentStreakCalc = 0; prevDateObj = null; }
        if (currentStreakCalc > maxStreak) maxStreak = currentStreakCalc;
    });

    return { chartData: weeklyScores.reverse(), comparisonData: comparison, bestDay, maxStreak };
  }, [historyData]);

  // Handle case where data for the current day might not exist yet
  // Eğer o gün için veri yoksa, varsayılan aktiviteleri 0 değerleriyle göster
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
      weeklyGoal: parseFloat(newWeeklyGoal) || (parseFloat(newGoal) * 7),
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
    setHistoryData({ ...historyData, [currentDate]: [...currentActivities, newAct] });
    setNewName(''); setNewGoal(''); setNewWeeklyGoal('');
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

  const exportData = () => {
    const dataStr = JSON.stringify({ historyData, moods }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lifetrack-backup-${formatDate(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--bg-main)' }}>
        <Loader size={48} className="spin" color="var(--brand-blue)" />
        <p style={{color: 'var(--text-dim)'}}>Yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div data-theme={theme}>
        <Auth />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="app-container"
    >
      
      <div className="header-top">
        <motion.div whileHover={{ scale: 1.05 }} className="streak-badge">
          <Flame size={24} color={streak > 0 ? "#ef4444" : "#64748b"} />
          <span style={{ color: streak > 0 ? "#ef4444" : "#64748b" }}>{streak} Günlük Seri</span>
        </motion.div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Kullanıcı Profili */}
          <div className="user-profile">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profil" className="user-avatar" />
            ) : (
              <div className="user-avatar-placeholder">{user.email?.charAt(0).toUpperCase()}</div>
            )}
            <span className="user-name">{user.displayName || user.email?.split('@')[0]}</span>
          </div>
          
          <button onClick={exportData} className="theme-toggle" title="Verileri İndir (JSON)">
            <Download size={24} color="#8b5cf6" />
          </button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="theme-toggle">
            {theme === 'dark' ? <Sun size={24} color="#f59e0b"/> : <Moon size={24} color="#3b82f6"/>}
          </button>
          <button onClick={handleSignOut} className="theme-toggle" title="Çıkış Yap">
            <LogOut size={24} color="#ef4444" />
          </button>
        </div>
      </div>

      <header>
        <motion.h1 initial={{ y: -20 }} animate={{ y: 0 }}>LifeTrack OS</motion.h1>
        <p className="subtitle"> Kişisel Analitik Panel</p>
      </header>

      {/* Tab Navigasyon */}
      <div className="tab-nav">
        <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <LayoutDashboard size={18} /> Dashboard
        </button>
        <button className={`tab-btn ${activeTab === 'focus' ? 'active' : ''}`} onClick={() => setActiveTab('focus')}>
          <Target size={18} /> Focus
        </button>
        <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <BarChart3 size={18} /> Haftalık Analiz
        </button>
      </div>

      <AnimatePresence mode='wait'>
        {activeTab === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div layout className="date-navigator">
              <button className="date-btn" onClick={() => {const d = new Date(currentDate); d.setDate(d.getDate()-1); setCurrentDate(formatDate(d));}}><ChevronLeft size={24}/> <span className="date-btn-text">Dün</span></button>
              <span className="date-display">{getDisplayDate(currentDate)}</span>
              <button className="date-btn" onClick={() => {const d = new Date(currentDate); d.setDate(d.getDate()+1); setCurrentDate(formatDate(d));}}><span className="date-btn-text">Yarın</span> <ChevronRight size={24}/></button>
              {!isEditable && (
                <div style={{marginLeft: '10px', display: 'flex', alignItems: 'center', color: 'var(--text-dim)'}} title="Geçmiş kilitli">
                  <Lock size={18} />
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mood-section">
              <h3 style={{margin:0}}>Bugün Nasıl Hissediyorsun?</h3>
              <div className="mood-options">
                {['😔', '😐', '😊', '🔥', '🚀'].map(e => (
                  <button key={e} disabled={!isEditable} className={`mood-btn ${moods[currentDate] === e ? 'active' : ''}`} onClick={() => isEditable && setMoods({...moods, [currentDate]: e})}>{e}</button>
                ))}
              </div>
            </motion.div>

            <div className="grid">
              <AnimatePresence mode='popLayout'>
              {currentActivities.map((act, index) => {
                const prog = Math.min((act.value / (act.goal || 1)) * 100, 100);
                return (
                  <motion.div 
                    key={act.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    className="card"
                    draggable={isEditable}
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!isEditable) return;
                      const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                      if (dragIndex === index) return;
                      const newArr = [...currentActivities];
                      const [moved] = newArr.splice(dragIndex, 1);
                      newArr.splice(index, 0, moved);
                      setHistoryData({ ...historyData, [currentDate]: newArr });
                    }}
                  >
                    {isEditable && <button className="delete-btn" onClick={() => deleteActivity(act.id)}><X size={16}/></button>}
                    <h3 style={{color: act.color, margin: '0 0 10px 0', fontSize: '1.1rem'}}>{act.name}</h3>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                      <div className="input-group" style={{margin: 0}}>
                        <input type="number" className="value-input" value={act.value || ''} onChange={(e) => updateData(act.id, 'value', e.target.value)} disabled={!isEditable} />
                        <span style={{color: 'var(--text-dim)', fontWeight: 'bold'}}>/</span>
                        <input type="number" className="goal-input" value={act.goal || ''} onChange={(e) => updateData(act.id, 'goal', e.target.value)} disabled={!isEditable} />
                      </div>
                      <span style={{fontSize: '0.9rem', fontWeight: '800', color: act.color}}>%{Math.round(prog)}</span>
                    </div>
                    <div className="progress-container"><div className="progress-bar" style={{width: `${prog}%`, backgroundColor: act.color}}></div></div>
                    <div style={{marginTop: '15px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)'}}>
                      <span>Haftalık Hedef:</span>
                      <input 
                        type="number" 
                        value={act.weeklyGoal || ''} 
                        onChange={(e) => updateData(act.id, 'weeklyGoal', e.target.value)}
                        disabled={!isEditable}
                        style={{width: '60px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-dim)', padding: '2px 5px', textAlign: 'center'}}
                        placeholder="-"
                      />
                    </div>
                  </motion.div>
                )
              })}
              </AnimatePresence>
            </div>

            {isEditable && <form className="add-form" onSubmit={addActivity}>
              <input type="text" placeholder="Örn: Kitap Okuma (Sayfa)" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              <input type="number" placeholder="Günlük Hedef (Örn: 50)" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} required min="1" />
              <input type="number" placeholder="Haftalık Hedef" value={newWeeklyGoal} onChange={(e) => setNewWeeklyGoal(e.target.value)} min="1" />
              <button type="submit" className="add-btn">Yeni Aktivite Ekle</button>
            </form>}

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
          </motion.div>
        )}

        {activeTab === 'focus' && (
          <motion.div 
            key="focus"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              whileHover={!isFullScreen ? { y: -5 } : {}} 
              className={`pomodoro-card ${isFullScreen ? 'fullscreen' : ''}`}
            >
              <button 
                className="fullscreen-btn"
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? "Küçült" : "Tam Ekran"}
              >
                {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
              <div style={{marginBottom: '15px'}}>
                <label style={{marginRight: '10px', fontWeight: 'bold', color: 'var(--text-main)'}}>Süre (dk):</label>
                <input 
                  type="number" 
                  value={pomodoroDuration} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setPomodoroDuration(val);
                    if (!isActive && val && parseInt(val) > 0) setTimeLeft(parseInt(val) * 60);
                  }}
                  style={{padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', width: '60px', textAlign: 'center', fontWeight: 'bold'}}
                  disabled={isActive}
                  min="1"
                />
              </div>
              <div className="timer-display">{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</div>
              <div className="timer-controls">
                <button className="timer-btn" style={{background:'#10b981'}} onClick={() => setIsActive(!isActive)}>{isActive ? 'DURDUR' : 'BAŞLAT'}</button>
                <button className="timer-btn" style={{background:'#ef4444'}} onClick={() => {setIsActive(false); setTimeLeft((parseInt(pomodoroDuration) || 25)*60);}}>SIFIRLA</button>
              </div>
            </motion.div>

            {/* To-Do Listesi */}
            {!isFullScreen && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="todo-card"
              >
                <h3 style={{margin: '0 0 20px 0', display:'flex', alignItems:'center', gap:'10px'}}><Check size={20} color="var(--brand-blue)"/> Günlük Görevler</h3>
                
                <form onSubmit={addTodo} className="todo-form">
                  <input 
                    type="text" 
                    placeholder="Yeni görev ekle..." 
                    value={newTodo} 
                    onChange={(e) => setNewTodo(e.target.value)}
                  />
                  <button type="submit"><Plus size={20}/></button>
                </form>

                <div className="todo-list">
                  {todos.map((todo, index) => (
                    <div 
                      key={todo.id} 
                      className={`todo-item ${todo.completed ? 'completed' : ''}`}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('todoIndex', index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const dragIndex = Number(e.dataTransfer.getData('todoIndex'));
                        if (isNaN(dragIndex) || dragIndex === index) return;
                        const newTodos = [...todos];
                        const [moved] = newTodos.splice(dragIndex, 1);
                        newTodos.splice(index, 0, moved);
                        setTodos(newTodos);
                      }}
                    >
                      <div className="todo-content" onClick={() => toggleTodo(todo.id)}>
                        <div className="custom-checkbox">{todo.completed && <Check size={14} color="white"/>}</div>
                        <span>{todo.text}</span>
                      </div>
                      <button onClick={() => deleteTodo(todo.id)} className="todo-delete"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  {todos.length === 0 && <p style={{textAlign:'center', color:'var(--text-dim)', fontStyle:'italic'}}>Henüz bir görev eklenmedi.</p>}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="chart-card" style={{marginBottom: '20px'}}>
              <h2 style={{marginTop:0, marginBottom:'30px'}}>Son 4 Haftalık Performans</h2>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <AreaChart data={analysisData.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="var(--text-dim)" />
                    <YAxis stroke="var(--text-dim)" domain={[0, 100]} />
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <Tooltip contentStyle={{backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)'}} />
                    <Area type="monotone" dataKey="Skor" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="stat-card-grid">
              {/* Rekor Seri Kartı */}
              <motion.div className="stat-card" whileHover={{ y: -5 }}>
                  <h4 style={{color: '#f59e0b', margin: '0 0 5px 0'}}>Rekor Seri</h4>
                  <div className="stat-card-change" style={{color: '#f59e0b'}}>
                    <Trophy size={24}/>
                    {analysisData.maxStreak} Gün
                  </div>
                  <p className="stat-card-note">En uzun zincir</p>
              </motion.div>

              {analysisData.comparisonData.map(item => (
                <motion.div key={item.name} className="stat-card" whileHover={{ y: -5 }}>
                  <h4 style={{color: item.color, margin: '0 0 5px 0'}}>{item.name}</h4>
                  <div className="stat-card-change" style={{color: item.change > 0 ? '#10b981' : item.change < 0 ? '#ef4444' : 'var(--text-dim)'}}>
                    {item.change > 0 ? <ArrowUp size={24}/> : item.change < 0 ? <ArrowDown size={24}/> : null}
                    {Math.abs(item.change)}%
                  </div>
                  <p className="stat-card-note">vs geçen hafta</p>
                </motion.div>
              ))}
            </div>

            <div className="ai-insight-card">
              <h3>Haftalık Analiz Raporu</h3>
              <ul>
                {analysisData.bestDay && <li>📅 İstatistiklere göre en verimli gününüz: <strong style={{color: 'var(--brand-blue)', marginLeft:'5px'}}>{analysisData.bestDay}</strong>. En zorlu işleri bu güne planlayabilirsiniz.</li>}
                {analysisData.comparisonData.map(item => {
                  if (item.change > 15) {
                    return <li key={item.name}>🚀 <strong style={{color: item.color}}>{item.name}</strong> alanında harika bir sıçrama! Geçen haftaya göre %{item.change} daha üretkensiniz.</li>;
                  } else if (item.change < -15) {
                    return <li key={item.name}>📉 <strong style={{color: item.color}}>{item.name}</strong> alanında bir düşüş var. Geçen haftaya göre %{Math.abs(item.change)} daha az. Odağınızı buraya çevirebilirsiniz.</li>;
                  } else if (item.change !== 0) {
                    return <li key={item.name}>✨ <strong style={{color: item.color}}>{item.name}</strong> alanında istikrarlı bir ilerleme kaydediyorsunuz.</li>;
                  } else {
                    return <li key={item.name}>🧘 <strong style={{color: item.color}}>{item.name}</strong> alanında geçen haftaki performansınızı koruyorsunuz.</li>;
                  }
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default App;