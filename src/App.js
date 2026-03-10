import React, { useState, useEffect } from 'react';
import { Book, Tv, Dumbbell, Footprints, Terminal, Droplets, ChevronLeft, ChevronRight, X, Activity, Sun, Moon, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

const defaultActivities = [
  { id: 1, name: 'Ders (Saat)', iconName: 'Book', value: 0, goal: 6, color: '#3b82f6' },
  { id: 2, name: 'Dizi/Film (Saat)', iconName: 'Tv', value: 0, goal: 2, color: '#ef4444' },
  { id: 3, name: 'Spor (Dakika)', iconName: 'Dumbbell', value: 0, goal: 45, color: '#10b981' },
  { id: 4, name: 'Yürüyüş (Adım)', iconName: 'Footprints', value: 0, goal: 10000, color: '#f59e0b' },
  { id: 5, name: 'Kod Yazma (Satır)', iconName: 'Terminal', value: 0, goal: 150, color: '#8b5cf6' },
  { id: 6, name: 'Su (Litre)', iconName: 'Droplets', value: 0, goal: 3, color: '#06b6d4' },
];

const getIcon = (name, color) => {
  const props = { size: 32, color: color };
  switch (name) {
    case 'Book': return <Book {...props} />;
    case 'Tv': return <Tv {...props} />;
    case 'Dumbbell': return <Dumbbell {...props} />;
    case 'Footprints': return <Footprints {...props} />;
    case 'Terminal': return <Terminal {...props} />;
    case 'Droplets': return <Droplets {...props} />;
    default: return <Activity {...props} />;
  }
};

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function App() {
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'dark');

  const [historyData, setHistoryData] = useState(() => {
    const saved = localStorage.getItem('saasLifeTrack');
    if (saved) return JSON.parse(saved);
    return { [formatDate(new Date())]: defaultActivities };
  });

  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    localStorage.setItem('saasLifeTrack', JSON.stringify(historyData));
  }, [historyData]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const getTodayActivities = () => {
    if (historyData[currentDate]) return historyData[currentDate];
    const allDates = Object.keys(historyData).sort();
    const lastDate = allDates[allDates.length - 1];
    const template = lastDate ? historyData[lastDate] : defaultActivities;
    return template.map(a => ({ ...a, value: 0 }));
  };

  const currentActivities = getTodayActivities();

  // Değer Güncelleme
  const updateValue = (id, newValue) => {
    const val = newValue === '' ? 0 : parseFloat(newValue);
    const updated = currentActivities.map(a => a.id === id ? { ...a, value: val } : a);
    setHistoryData({ ...historyData, [currentDate]: updated });
  };

  // HEDEF (Goal) Güncelleme Fonksiyonu
  const updateGoal = (id, newGoalValue) => {
    // Hedef sıfır olmasın diye en az 1 yapıyoruz (bölme hatası vermemesi için)
    const val = newGoalValue === '' ? 1 : parseFloat(newGoalValue);
    const updated = currentActivities.map(a => a.id === id ? { ...a, goal: val } : a);
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
      id: Date.now(), name: newName, iconName: 'Activity', value: 0, goal: parseFloat(newGoal),
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
    setHistoryData({ ...historyData, [currentDate]: [...currentActivities, newAct] });
    setNewName(''); setNewGoal('');
  };

  const changeDate = (days) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + days);
    setCurrentDate(formatDate(date));
  };

  const isToday = currentDate === formatDate(new Date());

  const calculateStreak = () => {
    let currentStreak = 0;
    const today = new Date();

    const checkDayAverage = (dateObj) => {
      const dateStr = formatDate(dateObj);
      const dayData = historyData[dateStr];
      if (!dayData || dayData.length === 0) return 0;
      let totalProgress = 0;
      dayData.forEach(act => { totalProgress += Math.min((act.value / (act.goal || 1)) * 100, 100); });
      return totalProgress / dayData.length;
    };

    let checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
      const avg = checkDayAverage(checkDate);
      if (avg >= 50) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const todayAvg = checkDayAverage(today);
    if (todayAvg >= 50) currentStreak++;

    return currentStreak;
  };

  const streak = calculateStreak();

  const generateChartData = () => {
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayData = historyData[formatDate(d)] || [];
      let totalProgress = 0;
      dayData.forEach(act => { totalProgress += Math.min((act.value / (act.goal || 1)) * 100, 100); });
      const avgProgress = dayData.length ? Math.round(totalProgress / dayData.length) : 0;
      chartData.push({ name: d.toLocaleDateString('tr-TR', { weekday: 'short' }), Basari: avgProgress });
    }
    return chartData;
  };

  const chartColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const chartGridColor = theme === 'dark' ? '#334155' : '#e2e8f0';

  return (
    <div className="app-container">
      
      <div className="header-top">
        <div className="streak-badge" title="Günlük hedeflerinin ortalama %50'sini tamamla, seriyi büyüt!">
          <Flame size={24} color={streak > 0 ? "#ef4444" : "#64748b"} />
          <span style={{ color: streak > 0 ? "#ef4444" : "#64748b", fontWeight: 'bold' }}>
            {streak} Günlük Seri
          </span>
        </div>
        
        <button className="theme-toggle" onClick={toggleTheme} title="Temayı Değiştir">
          {theme === 'dark' ? <Sun size={24} color="#f59e0b" /> : <Moon size={24} color="#3b82f6" />}
        </button>
      </div>

      <header>
        <h1>LifeTrack OS</h1>
        <p>Kişisel Analitik Panel</p>
      </header>

      <div className="date-navigator">
        <button className="date-btn" onClick={() => changeDate(-1)}><ChevronLeft size={24} /> Dün</button>
        <span className="date-display">{isToday ? 'Bugün' : currentDate}</span>
        <button className="date-btn" onClick={() => changeDate(1)} disabled={isToday}>Yarın <ChevronRight size={24} /></button>
      </div>
      
      <div className="grid">
        {currentActivities.map(activity => {
          const progress = Math.min((activity.value / (activity.goal || 1)) * 100, 100);
          const isCompleted = progress === 100;

          return (
            <div key={activity.id} className={`card ${isCompleted ? 'completed' : ''}`} style={{ '--brand-color': activity.color }}>
              <button className="delete-btn" onClick={() => deleteActivity(activity.id)}><X size={16} /></button>
              <div className="icon-box" style={{ backgroundColor: `${activity.color}22` }}>
                {getIcon(activity.iconName, activity.color)}
              </div>
              <h3>{activity.name}</h3>
              
              <div className="input-group">
                {/* Sol Taraf: Senin Girdiğin Değer */}
                <input 
                  type="number" 
                  className="value-input"
                  value={activity.value} 
                  onChange={(e) => updateValue(activity.id, e.target.value)} 
                  min="0" 
                />
                
                <span className="divider">/</span>
                
                {/* Sağ Taraf: Değiştirilebilir Hedef */}
                <input 
                  type="number" 
                  className="goal-input"
                  value={activity.goal} 
                  onChange={(e) => updateGoal(activity.id, e.target.value)} 
                  min="1" 
                  title="Hedefi Değiştir"
                />
              </div>

              <div className="progress-section">
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${progress}%`, backgroundColor: activity.color, boxShadow: isCompleted ? `0 0 10px ${activity.color}` : 'none' }}></div>
                </div>
                <p className="progress-label">%{Math.round(progress)} Tamamlandı</p>
              </div>
            </div>
          );
        })}
      </div>

      <form className="add-form" onSubmit={addActivity}>
        <input type="text" placeholder="Örn: Kitap Okuma (Sayfa)" value={newName} onChange={(e) => setNewName(e.target.value)} required />
        <input type="number" placeholder="Günlük Hedef (Örn: 50)" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} required min="1" />
        <button type="submit" className="add-btn">Yeni Aktivite Ekle</button>
      </form>

      <div className="chart-section">
        <h2>Son 7 Günlük Performans Eğilimi (%)</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={generateChartData()} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis dataKey="name" stroke={chartColor} />
              <YAxis stroke={chartColor} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', border: `1px solid ${chartGridColor}`, borderRadius: '10px', color: theme === 'dark' ? '#fff' : '#000' }} />
              <Line type="monotone" dataKey="Basari" stroke="#3b82f6" strokeWidth={4} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

export default App;