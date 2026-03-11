import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { ChevronLeft, ChevronRight, X, Sun, Moon, Flame, Lock, Download, LogOut, Loader, LayoutDashboard, Target, BarChart3, Maximize, Minimize, ArrowUp, ArrowDown, Check, Trash2, Plus, Trophy, Settings, Bell, BellOff, Languages, Sparkles, Calendar, Clock, Activity, CheckCircle, StickyNote, Edit, Eye, BellRing, Vibrate, Volume2, VolumeX, Trash, Mail, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import './App.css';
import Auth from './Auth';
import Icon from './Icon'; // Yeni Icon bileşenini import et
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const defaultActivities = [
  { id: 1, name: 'Ders (Saat)', iconName: 'Book', value: 0, goal: 6, weeklyGoal: 42, color: '#3b82f6' },
  { id: 3, name: 'Spor (Dakika)', iconName: 'Dumbbell', value: 0, goal: 45, weeklyGoal: 315, color: '#10b981' },
  { id: 5, name: 'Kod (Satır)', iconName: 'Terminal', value: 0, goal: 150, weeklyGoal: 1050, color: '#8b5cf6' },
];

const DashboardChart = React.lazy(() => import('./DashboardChart'));
const AnalyticsChart = React.lazy(() => import('./AnalyticsChart'));
const ReactMarkdown = React.lazy(() => import('react-markdown'));

const availableIcons = ['BookOpen', 'Dumbbell', 'Terminal', 'Code', 'Brain', 'Target', 'Bike', 'Coffee', 'Film', 'Music', 'PenTool', 'Heart', 'TrendingUp', 'Zap', 'BarChart', 'Briefcase', 'DollarSign', 'Globe', 'Home', 'Mic', 'Camera'];


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

const translations = {
  tr: {
    dashboard: 'Dashboard',
    focus: 'Odak',
    analytics: 'Analiz',
    settings: 'Ayarlar',
    logout: 'Çıkış Yap',
    streak: 'Gün',
    dailyFocus: 'Günün Odağı...',
    yesterday: 'Dün',
    tomorrow: 'Yarın',
    howAreYou: 'Bugün Nasıl Hissediyorsun?',
    newActivity: 'Yeni Aktivite Ekle',
    weeklyEfficiency: 'Haftalık Verimlilik (%)',
    duration: 'Süre (dk):',
    start: 'BAŞLAT',
    stop: 'DURDUR',
    reset: 'SIFIRLA',
    dailyTasks: 'Günlük Görevler',
    newTask: 'Yeni görev ekle...',
    noTasks: 'Henüz bir görev eklenmedi.',
    performance4Weeks: 'Son 4 Haftalık Performans',
    recordStreak: 'Rekor Seri',
    longestChain: 'En uzun zincir',
    vsLastWeek: 'vs geçen hafta',
    weeklyReport: 'Haftalık Analiz Raporu',
    appSettings: 'Uygulama Ayarları',
    changeTheme: 'Tema Değiştir',
    downloadData: 'Verileri İndir',
    notifications: 'Bildirimler',
    language: 'Dil',
    editProfile: 'Profili Düzenle',
    username: 'Kullanıcı Adı',
    photoUrl: 'Profil Fotoğrafı (URL)',
    save: 'Kaydet',
    editActivity: 'Aktivite Düzenle',
    activityName: 'Aktivite Adı',
    dailyGoal: 'Günlük Hedef',
    weeklyGoal: 'Haftalık Hedef',
    icon: 'İkon',
    colorTheme: 'Renk Teması',
    bestDay: 'İstatistiklere göre en verimli gününüz:',
    bestDaySuffix: '. En zorlu işleri bu güne planlayabilirsiniz.',
    loading: 'Yükleniyor...',
    thisWeek: 'Bu Hafta',
    weeksAgo: 'H Önce',
    locked: 'Geçmiş kilitli',
    completed: 'tamamlandı',
    aiMentor: 'AI Mentor',
    quickNotes: 'Hızlı Notlar',
    typeHere: 'Buraya not al...',
    systemStats: 'Sistem İstatistikleri',
    memberSince: 'Üyelik Tarihi',
    totalFocus: 'Toplam Odaklanma',
    mostActive: 'En Aktif Gün',
    totalTasks: 'Tamamlanan Görevler',
    hours: 'Saat',
    askMentor: 'Mentoruna Sor',
    analyzing: 'Veriler inceleniyor...',
    reportJump: 'alanında harika bir sıçrama! Geçen haftaya göre %{change} daha üretkensiniz.',
    reportDrop: 'alanında bir düşüş var. Geçen haftaya göre %{change} daha az. Odağınızı buraya çevirebilirsiniz.',
    reportStable: 'alanında istikrarlı bir ilerleme kaydediyorsunuz.',
    reportMaintain: 'alanında geçen haftaki performansınızı koruyorsunuz.',
    preview: 'Önizle',
    edit: 'Düzenle',
    expand: 'Genişlet',
    alarmSound: 'Alarm Sesi',
    beepSound: 'Bip Sesi',
    chimeSound: 'Çan Sesi',
    vibrateOnly: 'Sadece Titreşim',
    changePassword: 'Şifre Değiştir',
    silent: 'Sessiz',
    currentPassword: 'Mevcut Şifre',
    newPassword: 'Yeni Şifre',
    passwordUpdated: 'Şifreniz başarıyla güncellendi.',
    clearData: 'Verileri Temizle',
    confirmClear: 'Tüm verileriniz silinecek. Emin misiniz?',
    deleteAccount: 'Hesabı Sil',
    confirmDeleteAccount: 'Hesabınız ve tüm verileriniz kalıcı olarak silinecektir. Bu işlem geri alınamaz. Emin misiniz?'
  },
  en: {
    dashboard: 'Dashboard',
    focus: 'Focus',
    analytics: 'Analytics',
    settings: 'Settings',
    logout: 'Log Out',
    streak: 'Day',
    dailyFocus: 'Daily Focus...',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    howAreYou: 'How are you feeling today?',
    newActivity: 'Add New Activity',
    weeklyEfficiency: 'Weekly Efficiency (%)',
    duration: 'Duration (min):',
    start: 'START',
    stop: 'STOP',
    reset: 'RESET',
    dailyTasks: 'Daily Tasks',
    newTask: 'Add new task...',
    noTasks: 'No tasks added yet.',
    performance4Weeks: 'Last 4 Weeks Performance',
    recordStreak: 'Record Streak',
    longestChain: 'Longest chain',
    vsLastWeek: 'vs last week',
    weeklyReport: 'Weekly Analysis Report',
    appSettings: 'App Settings',
    changeTheme: 'Change Theme',
    downloadData: 'Download Data',
    notifications: 'Notifications',
    language: 'Language',
    editProfile: 'Edit Profile',
    username: 'Username',
    photoUrl: 'Profile Picture (URL)',
    save: 'Save',
    editActivity: 'Edit Activity',
    activityName: 'Activity Name',
    dailyGoal: 'Daily Goal',
    weeklyGoal: 'Weekly Goal',
    icon: 'Icon',
    colorTheme: 'Color Theme',
    bestDay: 'According to stats, your most productive day is:',
    bestDaySuffix: '. You can plan your hardest tasks for this day.',
    loading: 'Loading...',
    thisWeek: 'This Week',
    weeksAgo: 'W Ago',
    locked: 'History locked',
    completed: 'completed',
    aiMentor: 'AI Mentor',
    quickNotes: 'Quick Notes',
    typeHere: 'Type here...',
    systemStats: 'System Statistics',
    memberSince: 'Member Since',
    totalFocus: 'Total Focus Time',
    mostActive: 'Most Active Day',
    totalTasks: 'Completed Tasks',
    hours: 'Hours',
    askMentor: 'Ask Mentor',
    analyzing: 'Analyzing data...',
    reportJump: 'area saw a great jump! {change}% more productive than last week.',
    reportDrop: 'area saw a drop. {change}% less than last week. You might want to focus here.',
    reportStable: 'area shows steady progress.',
    reportMaintain: 'area performance is maintained from last week.',
    preview: 'Preview',
    edit: 'Edit',
    expand: 'Expand',
    alarmSound: 'Alarm Sound',
    beepSound: 'Beep Sound',
    chimeSound: 'Chime Sound',
    vibrateOnly: 'Vibrate Only',
    changePassword: 'Change Password',
    silent: 'Silent',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    passwordUpdated: 'Password updated successfully.',
    clearData: 'Clear Data',
    confirmClear: 'All your data will be deleted. Are you sure?',
    deleteAccount: 'Delete Account',
    confirmDeleteAccount: 'Your account and all your data will be permanently deleted. This action cannot be undone. Are you sure?'
  }
};

const accentColors = [
  { value: '#3b82f6', label: 'Mavi' },
  { value: '#10b981', label: 'Yeşil' },
  { value: '#8b5cf6', label: 'Mor' },
  { value: '#f59e0b', label: 'Turuncu' },
  { value: '#ec4899', label: 'Pembe' },
  { value: '#ef4444', label: 'Kırmızı' },
];

const alarmSounds = {
  beep: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
  chime: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg',
};

const pageVariants = {
  initial: { opacity: 0, x: 20, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -20, scale: 0.98 }
};

const pageTransition = {
  type: "spring",
  stiffness: 500,
  damping: 40
};

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'dark');
  const [historyData, setHistoryData] = useState({});
  const [moods, setMoods] = useState({});
  const [todos, setTodos] = useState([]);
  const [dailyGoals, setDailyGoals] = useState({});
  const [newTodo, setNewTodo] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newWeeklyGoal, setNewWeeklyGoal] = useState('');
  const [newIcon, setNewIcon] = useState('Activity');

  // Pomodoro
  const [pomodoroDuration, setPomodoroDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [notifications, setNotifications] = useState(() => JSON.parse(localStorage.getItem('appNotifications')) ?? true);
  const [language, setLanguage] = useState(() => localStorage.getItem('appLanguage') || 'tr');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('appAccentColor') || '#3b82f6');
  const [alarmSetting, setAlarmSetting] = useState(() => localStorage.getItem('appAlarmSetting') || 'beep');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTimerCompleted, setIsTimerCompleted] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [aiAdvice, setAiAdvice] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [scratchpadContent, setScratchpadContent] = useState('');
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isScratchpadExpanded, setIsScratchpadExpanded] = useState(false);
  const [isScratchpadPreview, setIsScratchpadPreview] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const gridRef = useRef(null);
  const scrollTimeout = useRef(null);

  const isEditable = currentDate === formatDate(new Date());
  const t = translations[language];

  // Handle case where data for the current day might not exist yet
  // Eğer o gün için veri yoksa, varsayılan aktiviteleri 0 değerleriyle göster
  const currentActivities = historyData[currentDate] || defaultActivities.map(a => ({ ...a, value: 0 }));

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
            setDailyGoals(data.dailyGoals || {});
            setScratchpadContent(data.scratchpadContent || '');
          } else {
            // New user, initialize with default data for today
            setHistoryData({ [formatDate(new Date())]: defaultActivities });
            setMoods({});
            setTodos([]);
            setDailyGoals({});
            setScratchpadContent('');
          }
        } else {
          setUser(null);
          setHistoryData({});
          setMoods({});
          setTodos([]);
          setDailyGoals({});
          setScratchpadContent('');
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
      await setDoc(userDocRef, { historyData, moods, todos, dailyGoals, scratchpadContent }, { merge: true });
    }, 1500); // Debounce to avoid too many writes

    return () => clearTimeout(debounceSave);
  }, [historyData, moods, todos, dailyGoals, scratchpadContent, user]);

  // Theme persistence
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  // Language persistence
  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  // Accent Color persistence
  useEffect(() => {
    document.documentElement.style.setProperty('--brand-blue', accentColor);
    localStorage.setItem('appAccentColor', accentColor);
  }, [accentColor]);

  // Alarm Sesi Ayarı
  useEffect(() => {
    localStorage.setItem('appAlarmSetting', alarmSetting);
  }, [alarmSetting]);

  // Mobil cihaz algılama
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to top button logic
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // AI Mentor text generation based on analysis result and language
  useEffect(() => {
    if (!aiAnalysisResult) {
      return;
    }

    const { totalCode, totalStudy, totalSport, sportRatio, totalProductiveActivity } = aiAnalysisResult;
    const userName = user?.displayName || (language === 'tr' ? 'Ömer' : 'User');
    let advice = '';

    if (language === 'tr') {
      advice = `Merhaba ${userName}! Bu haftaki verilerini senin için analiz ettim. `;
      if (totalProductiveActivity === 0 && totalSport === 0) {
        advice += `Bu hafta pek aktif olmamışsın gibi görünüyor. Unutma, her büyük yolculuk küçük bir adımla başlar. Bugün hedeflerinden birine sadece 10 dakika ayırmaya ne dersin? Başlangıç yapmak en zorudur, sonrası gelecektir! 💪`;
      } else {
        if (totalCode > 0 && totalStudy > 0) {
          if (totalCode > (totalStudy * 50) * 1.5) { 
            advice += `Kodlama tutkun harika (${totalCode} satır)! Pratik becerilerini geliştirdiğini gösteriyor. Ancak akademik sorumluluklarını (Ders: ${totalStudy} saat) biraz gölgede bırakmış olabilirsin. İyi bir mühendis, teorik temelleri de sağlam tutmalıdır. `;
          } else if (totalStudy * 50 > totalCode * 1.5) { 
            advice += `Akademik çalışmalarına verdiğin önem (${totalStudy} saat) takdire şayan. Teorik bilgin seni ileri taşıyacaktır. Pratik kodlama (${totalCode} satır) tarafını da ihmal etmediğinden emin ol, ikisi bir bütün. `;
          } else {
            advice += `Ders ve pratik çalışmaların arasında güzel bir denge kurmuşsun. Bu harika bir strateji! `;
          }
        } else if (totalCode > 0) {
          advice += `Bu hafta kodlamaya odaklanmışsın (${totalCode} satır). Pratik yapmak çok değerli! Akademik derslerini de programına ekleyerek teorik altyapını güçlendirebilirsin. `;
        } else if (totalStudy > 0) {
          advice += `Bu hafta derslerine odaklanmışsın (${totalStudy} saat). Teorik bilgini sağlamlaştırmak harika! Şimdi bu bilgiyi kodlama pratiğiyle pekiştirme zamanı. `;
        }

        if (totalSport === 0) {
          advice += `Bu hafta hiç spor yapmamışsın. Uzun saatler bilgisayar başında kalan biri olarak, zihinsel berraklığın ve sağlığın için sporu hayatına dahil etmen kritik önem taşıyor. `;
        } else if (sportRatio < 0.5) {
          advice += `Ancak dikkatimi çeken bir nokta var: Fiziksel aktivite hedeflerinin oldukça altındasın (%${Math.round(sportRatio * 100)}). Unutma, zihin ve beden bir bütündür. Kısa bir yürüyüş bile zihinsel berraklığını artırabilir. `;
        } else if (sportRatio > 1.2) {
          advice += `Fiziksel sağlığına verdiğin önem etkileyici! Bu enerji, masanın başına oturduğunda sana büyük avantaj sağlayacaktır. `;
        } else {
          advice += `Fiziksel aktivite hedeflerini de dengeli bir şekilde sürdürüyorsun. Harika! `;
        }
        advice += `Genel olarak doğru yoldasın. Bu verileri kullanarak bir sonraki haftanı daha da verimli planlayabilirsin. Başarılar! 🚀`;
      }
    } else {
      // English
      advice = `Hello ${userName}! I've analyzed your data for this week. `;
      if (totalProductiveActivity === 0 && totalSport === 0) {
        advice += `It seems you haven't been very active this week. Remember, every great journey begins with a small step. How about dedicating just 10 minutes to one of your goals today? Starting is the hardest part, the rest will follow! 💪`;
      } else {
        if (totalCode > 0 && totalStudy > 0) {
          if (totalCode > (totalStudy * 50) * 1.5) { 
            advice += `Your passion for coding is great (${totalCode} lines)! It shows you're developing your practical skills. However, you might be overshadowing your academic responsibilities (Study: ${totalStudy} hours) a bit. A good engineer must also keep their theoretical foundations strong. `;
          } else if (totalStudy * 50 > totalCode * 1.5) { 
            advice += `Your dedication to academic studies (${totalStudy} hours) is admirable. Theoretical knowledge will carry you forward. Make sure not to neglect the practical coding side (${totalCode} lines), they go hand in hand. `;
          } else {
            advice += `You have established a nice balance between study and practical work. This is a great strategy! `;
          }
        } else if (totalCode > 0) {
          advice += `You focused on coding this week (${totalCode} lines). Practice is invaluable! You can strengthen your theoretical background by adding academic studies to your schedule. `;
        } else if (totalStudy > 0) {
          advice += `You focused on your studies this week (${totalStudy} hours). Solidifying your theoretical knowledge is great! Now it's time to reinforce this knowledge with coding practice. `;
        }
        if (totalSport === 0) {
          advice += `You haven't done any sports this week. As someone who spends long hours in front of a computer, incorporating sports into your life is critical for your mental clarity and health. `;
        } else if (sportRatio < 0.5) {
          advice += `However, one point caught my attention: You are well below your physical activity goals (%${Math.round(sportRatio * 100)}). Remember, mind and body are one. Even a short walk can increase your mental clarity. `;
        } else if (sportRatio > 1.2) {
          advice += `The importance you place on your physical health is impressive! This energy will give you a great advantage when you sit at your desk. `;
        } else {
          advice += `You are also maintaining your physical activity goals in a balanced way. Great! `;
        }
        advice += `Overall, you are on the right track. You can use this data to plan your next week even more efficiently. Good luck! 🚀`;
      }
    }
    setAiAdvice(advice);
    setIsAiLoading(false);
  }, [aiAnalysisResult, language, user]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (alarmSetting !== 'silent') {
              if (alarmSetting === 'vibrate_only') {
                  if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
              } else if (alarmSounds[alarmSetting]) {
                  const audio = new Audio(alarmSounds[alarmSetting]);
                  audio.volume = 0.5;
                  audio.play().catch(() => {});
              }
            }
            
            if (notifications && "Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification("LifeTrack OS", { body: t.completed });
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                  if (permission === "granted") {
                    new Notification("LifeTrack OS", { body: t.completed });
                  }
                });
              }
            }

            setIsActive(false);
            setIsTimerCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else { clearInterval(interval); }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, notifications, t, currentActivities, pomodoroDuration, user, alarmSetting]);

  // Tarayıcı sekmesinde (Title) kalan süreyi göster
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const mins = Math.floor(timeLeft / 60);
      const secs = (timeLeft % 60).toString().padStart(2, '0');
      document.title = `(${mins}:${secs}) LifeTrack OS`;
    } else if (isTimerCompleted) {
      const titleText = t.completed.charAt(0).toUpperCase() + t.completed.slice(1);
      document.title = `${titleText}! 🎉`;
    } else {
      document.title = 'Daily Flow | Productivity Dashboard';
    }
  }, [isActive, timeLeft, isTimerCompleted, t]);

  // ESC tuşu ile tam ekrandan çıkma
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') setIsFullScreen(false);
      if (event.key === 'Escape') setIsScratchpadExpanded(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Günün Hedefi İşlemleri (Object yapısına geçiş ve Confetti)
  const getDailyGoal = (date) => {
    const goal = dailyGoals[date];
    // Eski string verileri desteklemek için kontrol
    if (typeof goal === 'string') return { text: goal, completed: false };
    return goal || { text: '', completed: false };
  };

  const currentGoal = getDailyGoal(currentDate);

  const handleGoalChange = (val) => {
    setDailyGoals({
      ...dailyGoals,
      [currentDate]: { ...currentGoal, text: val }
    });
  };

  const toggleGoalCompletion = () => {
    if (!isEditable) return;
    const newCompleted = !currentGoal.completed;
    setDailyGoals({
      ...dailyGoals,
      [currentDate]: { ...currentGoal, completed: newCompleted }
    });
    
    if (newCompleted) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (user && newPassword && currentPassword) {
      try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        await updatePassword(user, newPassword);
        alert(t.passwordUpdated);
        setIsPasswordModalOpen(false);
        setNewPassword('');
        setCurrentPassword('');
      } catch (error) {
        console.error("Error updating password: ", error);
        alert(error.message);
      }
    }
  };

  const handleClearData = async () => {
    if (window.confirm(t.confirmClear)) {
      // Varsayılan verilere dön
      setHistoryData({ [formatDate(new Date())]: defaultActivities });
      setMoods({});
      setTodos([]);
      setDailyGoals({});
      setScratchpadContent('');
      // Firebase'e kaydetme işlemi useEffect ile tetiklenecek
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm(t.confirmDeleteAccount)) {
        if (!user) return;
        try {
            // First, delete user data from Firestore
            const userDocRef = doc(db, 'users', user.uid);
            await deleteDoc(userDocRef);

            // Then, delete the user from Auth
            await deleteUser(user);
            // onAuthStateChanged will handle the rest
        } catch (error) {
            console.error("Error deleting account: ", error);
            if (error.code === 'auth/requires-recent-login') {
                alert('Bu işlem için yeniden giriş yapmanız gerekmektedir. Lütfen çıkış yapıp tekrar giriş yaptıktan sonra deneyin.');
            } else {
                alert(`Hesap silinirken bir hata oluştu: ${error.message}`);
            }
        }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const chartColor = accentColor;

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
            name: i === 0 ? t.thisWeek : `${i}${t.weeksAgo}`,
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
    const daysOfWeek = language === 'tr' ? ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
  }, [historyData, language, t]);

  const generateAiAdvice = async () => {
    setIsAiLoading(true);
    setAiAdvice('');
    setAiAnalysisResult(null);

    // 1. Veri Toplama (Son 7 Gün)
    const today = new Date();
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      last7Days.push(formatDate(d));
    }

    let totalCode = 0;
    let totalStudy = 0;
    let totalSport = 0;
    let sportGoalTotal = 0;

    last7Days.forEach(dateStr => {
      const dayData = historyData[dateStr] || [];
      dayData.forEach(act => {
        if (act.name.toLowerCase().includes('kod')) totalCode += act.value;
        if (act.name.toLowerCase().includes('ders')) totalStudy += act.value;
        if (act.name.toLowerCase().includes('spor')) {
            totalSport += act.value;
            sportGoalTotal += (act.goal || 1);
        }
      });
    });

    // Simüle edilmiş API gecikmesi
    await new Promise(resolve => setTimeout(resolve, 2500));

    // 2. Prompt Engineering & Otomasyon Mantığı
    // Gerçek bir API'ye gönderilecek prompt şuna benzerdi:
    // `Benim adım Ömer. Bu haftaki verilerim şunlar: Kod: ${totalCode}, Ders: ${totalStudy}, Spor: ${totalSport}. Bir bilgisayar mühendisliği öğrencisi olarak bana üretkenlik, sağlık ve ders dengesi konusunda samimi ve profesyonel bir tavsiye ver.`

    const sportRatio = sportGoalTotal > 0 ? (totalSport / sportGoalTotal) : 0;
    const totalProductiveActivity = totalCode + totalStudy;
    
    setAiAnalysisResult({
      totalCode,
      totalStudy,
      totalSport,
      sportRatio,
      totalProductiveActivity,
    });
  };

  // Sistem İstatistikleri Hesaplama
  const systemStats = useMemo(() => {
    if (!user) return { memberSince: '-', totalHours: 0 };
    
    const joinDate = new Date(user.metadata.creationTime);
    const memberSince = joinDate.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' });

    let totalMinutes = 0;
    Object.values(historyData).forEach(dayData => {
      if (Array.isArray(dayData)) {
        dayData.forEach(act => {
           const lowerName = act.name.toLowerCase();
           if (lowerName.includes('saat') || lowerName.includes('hour')) {
             totalMinutes += (parseFloat(act.value) || 0) * 60;
           } else if (lowerName.includes('dakika') || lowerName.includes('minute') || lowerName.includes('min')) {
             totalMinutes += (parseFloat(act.value) || 0);
           }
        });
      }
    });
    
    const totalHours = Math.floor(totalMinutes / 60);
    const completedTasks = todos.filter(t => t.completed).length;
    
    return { memberSince, totalHours, completedTasks };
  }, [user, historyData, language, todos]);

  const handleScroll = () => {
    if (gridRef.current) {
        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
            const cardWidth = gridRef.current.querySelector('.card')?.offsetWidth;
            if (cardWidth) {
                const gap = 15; // from css
                const scrollLeft = gridRef.current.scrollLeft;
                const index = Math.round(scrollLeft / (cardWidth + gap));
                setActiveCardIndex(index);
            }
        }, 150);
    }
  };

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
      id: Date.now(), name: newName, iconName: newIcon, value: 0, goal: parseFloat(newGoal), 
      weeklyGoal: parseFloat(newWeeklyGoal) || (parseFloat(newGoal) * 7),
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
    setHistoryData({ ...historyData, [currentDate]: [...currentActivities, newAct] });
    setNewName(''); setNewGoal(''); setNewWeeklyGoal('');
    setNewIcon('Activity');
  };

  const handleSaveActivity = (e) => {
    e.preventDefault();
    if (!editingActivity) return;
    const updated = currentActivities.map(a => a.id === editingActivity.id ? editingActivity : a);
    setHistoryData({ ...historyData, [currentDate]: updated });
    setEditingActivity(null);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (user) {
      try {
        await updateProfile(user, { displayName: newDisplayName });
        setUser({ ...user, displayName: newDisplayName });
        setIsProfileModalOpen(false);
      } catch (error) {
        console.error("Error updating profile: ", error);
      }
    }
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
        <p style={{color: 'var(--text-dim)'}}>{t.loading}</p>
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
    <div className="dashboard-layout">
      {/* Odak modundan çıkmak için tıklanabilir arkaplan */}
      <AnimatePresence>
        {isActive && isImmersive && activeTab === 'focus' && !isFullScreen && (
            <motion.div
                className="focus-exit-overlay"
                onClick={() => setIsImmersive(false)}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
            />
        )}
      </AnimatePresence>
      {/* Sidebar (Kenar Çubuğu) */}
      <motion.nav 
        className="sidebar"
        animate={{ opacity: (isActive && isImmersive && activeTab === 'focus' && !isFullScreen) ? 0.1 : 1, pointerEvents: (isActive && isImmersive && activeTab === 'focus' && !isFullScreen) ? 'none' : 'auto' }}
        transition={{ duration: 0.5 }}
      >
        <div className="sidebar-header" onClick={() => !isActive && setActiveTab('dashboard')}>
          <h1>LifeTrack</h1>
          <p>OS</p>
        </div>
        
        <div className="sidebar-menu">
          <button className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={22} /> <span>{t.dashboard}</span>
          </button>
          <button className={`sidebar-btn ${activeTab === 'focus' ? 'active' : ''}`} onClick={() => setActiveTab('focus')}>
            <Target size={22} /> <span>{t.focus}</span>
          </button>
          <button className={`sidebar-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <BarChart3 size={22} /> <span>{t.analytics}</span>
          </button>
        </div>

        {/* Hızlı Notlar (Scratchpad) */}
        <div className="sidebar-scratchpad">
          <button className={`sidebar-btn ${isScratchpadOpen ? 'active' : ''}`} onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}>
            <StickyNote size={22} /> <span>{t.quickNotes}</span>
          </button>
          <AnimatePresence>
            {isScratchpadOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 10 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                style={{ overflow: 'hidden', position: 'relative' }}
              >
                <div className="scratchpad-controls">
                  <button 
                    className="scratchpad-control-btn" 
                    onClick={() => setIsScratchpadPreview(!isScratchpadPreview)}
                    title={isScratchpadPreview ? t.edit : t.preview}
                  >
                    {isScratchpadPreview ? <Edit size={14} /> : <Eye size={14} />}
                  </button>
                  <button 
                    className="scratchpad-control-btn"
                    onClick={() => setIsScratchpadExpanded(true)}
                    title={t.expand}
                  >
                    <Maximize size={14} />
                  </button>
                </div>
                {isScratchpadPreview ? (
                  <div className="scratchpad-preview markdown-body">
                    {scratchpadContent ? (
                      <Suspense fallback={<div className="loading-text">{t.loading}</div>}>
                        <ReactMarkdown>{scratchpadContent}</ReactMarkdown>
                      </Suspense>
                    ) : (
                      <div className="scratchpad-empty-preview">Markdown formatında metin yazarak önizlemeyi görün.</div>
                    )}
                   </div>
                ) : (
                  <textarea
                    className="scratchpad-textarea"
                    value={scratchpadContent}
                    onChange={(e) => setScratchpadContent(e.target.value)}
                    placeholder={t.typeHere}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className={`sidebar-btn sidebar-settings-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={22} /> <span>{t.settings}</span>
        </button>

        <div className="sidebar-spacer"></div>

        {(isActive || isTimerCompleted) && (
          <div className={`sidebar-timer ${isTimerCompleted ? 'completed' : ''}`} onClick={() => setActiveTab('focus')}>
            <div className="sidebar-timer-dot"></div>
            <span>{isTimerCompleted ? t.completed : `${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2,'0')}`}</span>
          </div>
        )}

        <div className="sidebar-footer">
          <button className="sidebar-btn" onClick={handleSignOut} style={{ color: '#ef4444' }}>
            <LogOut size={22} /> <span>{t.logout}</span>
          </button>
        </div>
      </motion.nav>

      <main className="main-content">
        <motion.div 
          className="header-top"
          animate={{ opacity: (isActive && isImmersive && activeTab === 'focus' && !isFullScreen) ? 0.1 : 1, pointerEvents: (isActive && isImmersive && activeTab === 'focus' && !isFullScreen) ? 'none' : 'auto' }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 className="header-title">LifeTrack OS</h2>
            <motion.div whileHover={{ scale: 1.05 }} className="streak-badge">
              <Flame size={20} color={streak > 0 ? "#ef4444" : "#64748b"} />
              <span style={{ color: streak > 0 ? "#ef4444" : "#64748b", fontSize: '0.9rem' }}>{streak} {t.streak}</span>
            </motion.div>
          </div>
          {/* Kullanıcı Profili */}
          <div className="user-profile" onClick={() => { setNewDisplayName(user.displayName || ''); setIsProfileModalOpen(true); }} style={{cursor: 'pointer'}} title={t.editProfile}>
            <span className="user-name">{user.displayName || user.email?.split('@')[0]}</span>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profil" className="user-avatar" />
            ) : (
              <div className="user-avatar-placeholder">{user.email?.charAt(0).toUpperCase()}</div>
            )}
          </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="app-container">

      <AnimatePresence mode='wait'>
        {activeTab === 'dashboard' && (
          <motion.div 
            key="dashboard"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            {/* Günün Öncelikli Hedefi */}
            <motion.div className="daily-goal-wrapper">
              <div className={`daily-goal-container ${currentGoal.completed ? 'completed' : ''}`}>
                <button 
                  className={`daily-goal-checkbox ${currentGoal.completed ? 'active' : ''}`}
                  onClick={toggleGoalCompletion}
                  disabled={!isEditable}
                >
                  {currentGoal.completed && <Check size={20} color="white" strokeWidth={3} />}
                </button>
                <input 
                  type="text" 
                  className="daily-goal-input" 
                  placeholder={`✨ ${t.dailyFocus}`}
                  value={currentGoal.text} 
                  onChange={(e) => handleGoalChange(e.target.value)}
                  disabled={!isEditable}
                />
              </div>
            </motion.div>

            <motion.div layout className="date-navigator">
              <button className="date-btn" onClick={() => {const d = new Date(currentDate); d.setDate(d.getDate()-1); setCurrentDate(formatDate(d));}}><ChevronLeft size={24}/> <span className="date-btn-text">{t.yesterday}</span></button>
              <span className="date-display">{getDisplayDate(currentDate)}</span>
              <button className="date-btn" onClick={() => {const d = new Date(currentDate); d.setDate(d.getDate()+1); setCurrentDate(formatDate(d));}}><span className="date-btn-text">{t.tomorrow}</span> <ChevronRight size={24}/></button>
              {!isEditable && (
                <div style={{marginLeft: '10px', display: 'flex', alignItems: 'center', color: 'var(--text-dim)'}} title={t.locked}>
                  <Lock size={18} />
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mood-section">
              <h3 style={{margin:0}}>{t.howAreYou}</h3>
              <div className="mood-options">
                {['😔', '😐', '😊', '🔥', '🚀'].map(e => (
                  <button key={e} disabled={!isEditable} className={`mood-btn ${moods[currentDate] === e ? 'active' : ''}`} onClick={() => isEditable && setMoods({...moods, [currentDate]: e})}>{e}</button>
                ))}
              </div>
            </motion.div>

            <div className="grid" ref={gridRef} onScroll={handleScroll}>
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
                    drag={isMobile ? "y" : false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.7}
                    onDragEnd={(e, { offset }) => {
                      // Mobilde yukarı kaydırınca sil (Yatay kaydırma navigasyon için kullanılıyor)
                      if (offset.y < -100 && isEditable) deleteActivity(act.id);
                    }}
                    onClick={() => isEditable && setEditingActivity(act)}
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
                    {isEditable && <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteActivity(act.id); }}><X size={16}/></button>}
                    <div className="card-header">
                      <Icon name={act.iconName} size={20} style={{ color: accentColor }} />
                      <h3 style={{color: accentColor, margin: 0, fontSize: '1.1rem'}}>{act.name}</h3>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                      <div className="input-group" style={{margin: 0}}>
                        <input type="number" className="value-input" value={act.value || ''} onClick={(e) => e.stopPropagation()} onChange={(e) => updateData(act.id, 'value', e.target.value)} disabled={!isEditable} />
                        <span style={{color: 'var(--text-dim)', fontWeight: 'bold'}}>/</span>
                        <input type="number" className="goal-input" value={act.goal || ''} onClick={(e) => e.stopPropagation()} onChange={(e) => updateData(act.id, 'goal', e.target.value)} disabled={!isEditable} />
                      </div>
                      <span style={{fontSize: '0.9rem', fontWeight: '800', color: accentColor}}>%{Math.round(prog)}</span>
                    </div>
                    <div className="progress-container"><div className="progress-bar" style={{width: `${prog}%`, backgroundColor: accentColor}}></div></div>
                    <div style={{marginTop: '15px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)'}}>
                      <span>Haftalık Hedef:</span>
                      <input 
                        type="number" 
                        value={act.weeklyGoal || ''} 
                        onClick={(e) => e.stopPropagation()}
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

            <div className="pagination-dots">
              {currentActivities.map((_, index) => (
                  <div
                      key={index}
                      className={`dot ${index === activeCardIndex ? 'active' : ''}`}
                      onClick={() => {
                          if (gridRef.current) {
                              const cardWidth = gridRef.current.querySelector('.card')?.offsetWidth;
                              const gap = 15;
                              gridRef.current.scrollTo({
                                  left: index * (cardWidth + gap),
                                  behavior: 'smooth'
                              });
                          }
                      }}
                  />
              ))}
            </div>

            {isEditable && <form className="add-form" onSubmit={addActivity}>
              <input type="text" placeholder="Örn: Kitap Okuma" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              <input type="number" placeholder={t.dailyGoal} value={newGoal} onChange={(e) => setNewGoal(e.target.value)} required min="1" />
              <input type="number" placeholder={t.weeklyGoal} value={newWeeklyGoal} onChange={(e) => setNewWeeklyGoal(e.target.value)} min="1" />
              <div className="form-group" style={{width: '100%'}}>
                <label style={{marginLeft: 0, marginBottom: 5}}>{t.icon}</label>
                <div className="icon-picker-grid">
                  {availableIcons.map(iconName => (
                      <button
                          type="button"
                          key={iconName}
                          className={`icon-picker-btn ${newIcon === iconName ? 'active' : ''}`}
                          onClick={() => setNewIcon(iconName)}
                          title={iconName}
                      >
                          <Icon name={iconName} size={24} />
                      </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="add-btn">{t.newActivity}</button>
            </form>}

            <div className="chart-card">
              <h2 style={{marginTop:0, marginBottom:'30px'}}>{t.weeklyEfficiency}</h2>
              <Suspense fallback={<div style={{display:'flex', justifyContent:'center', padding:'50px'}}><Loader className="spin" size={32} color={accentColor}/></div>}>
                <DashboardChart data={generateChartData()} chartColor={chartColor} />
              </Suspense>
            </div>
          </motion.div>
        )}

        {activeTab === 'focus' && (
          <motion.div 
            key="focus"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <motion.div 
              whileHover={!isFullScreen ? { y: -5 } : {}} 
              className={`pomodoro-card ${isFullScreen ? 'fullscreen' : ''} ${isActive ? 'focus-active' : ''}`}
            >
              {isActive && <div className="focus-background"></div>}
              <button 
                className="fullscreen-btn"
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? "Küçült" : "Tam Ekran"}
              >
                {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
              <div style={{marginBottom: '15px'}}>
                <label style={{marginRight: '10px', fontWeight: 'bold', color: 'var(--text-main)'}}>{t.duration}</label>
                <input 
                  type="number" 
                  value={pomodoroDuration} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setPomodoroDuration(val);
                    if (!isActive && val && parseInt(val) > 0) {
                      setTimeLeft(parseInt(val) * 60);
                      setIsTimerCompleted(false);
                    }
                  }}
                  style={{padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', width: '60px', textAlign: 'center', fontWeight: 'bold'}}
                  disabled={isActive}
                  min="1"
                />
              </div>
              <div className="timer-display">
                {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}
              </div>
              {isActive && <div style={{ fontSize: '1.2rem', color: 'var(--text-dim)', marginTop: '-10px', marginBottom: '20px', fontWeight: 500 }}>{currentGoal.text || t.dailyFocus}</div>}
              <div className="timer-controls">
                <button className="timer-btn" style={{background:'#10b981'}} onClick={() => setIsActive(!isActive)}>{isActive ? t.stop : t.start}</button>
                <button className="timer-btn" style={{background:'#ef4444'}} onClick={() => {setIsActive(false); setTimeLeft((parseInt(pomodoroDuration) || 25)*60); setIsTimerCompleted(false);}}>{t.reset}</button>
              </div>
            </motion.div>

            {/* To-Do Listesi */}
            {!isFullScreen && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="todo-card"
              >
                <h3 style={{margin: '0 0 20px 0', display:'flex', alignItems:'center', gap:'10px'}}><Check size={20} color="var(--brand-blue)"/> {t.dailyTasks}</h3>
                
                <form onSubmit={addTodo} className="todo-form">
                  <input 
                    type="text" 
                    placeholder={t.newTask}
                    value={newTodo} 
                    onChange={(e) => setNewTodo(e.target.value)}
                  />
                  <button type="submit"><Plus size={20}/></button>
                </form>

                <div className="todo-list">
                  <AnimatePresence mode='popLayout'>
                  {todos.map((todo, index) => (
                    <motion.div 
                      key={todo.id} 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                      className={`todo-item ${todo.completed ? 'completed' : ''}`}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.5}
                      onDragEnd={(e, { offset }) => {
                        if (Math.abs(offset.x) > 100) deleteTodo(todo.id);
                      }}
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
                    </motion.div>
                  ))}
                  </AnimatePresence>
                  {todos.length === 0 && <p style={{textAlign:'center', color:'var(--text-dim)', fontStyle:'italic'}}>{t.noTasks}</p>}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div 
            key="analytics"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <div className="chart-card" style={{marginBottom: '20px'}}>
              <h2 style={{marginTop:0, marginBottom:'30px'}}>{t.performance4Weeks}</h2>
              <Suspense fallback={<div style={{display:'flex', justifyContent:'center', padding:'50px'}}><Loader className="spin" size={32} color={accentColor}/></div>}>
                <AnalyticsChart data={analysisData.chartData} chartColor={chartColor} />
              </Suspense>
            </div>

            <div className="stat-card-grid">
              {/* Rekor Seri Kartı */}
              <motion.div className="stat-card" whileHover={{ y: -5 }}>
                  <h4 style={{color: '#f59e0b', margin: '0 0 5px 0'}}>{t.recordStreak}</h4>
                  <div className="stat-card-change" style={{color: '#f59e0b'}}>
                    <Trophy size={24}/>
                    {analysisData.maxStreak} {t.streak}
                  </div>
                  <p className="stat-card-note">{t.longestChain}</p>
              </motion.div>

              {analysisData.comparisonData.map(item => (
                <motion.div key={item.name} className="stat-card" whileHover={{ y: -5 }}>
                  <h4 style={{color: item.color, margin: '0 0 5px 0'}}>{item.name}</h4>
                  <div className="stat-card-change" style={{color: item.change > 0 ? '#10b981' : item.change < 0 ? '#ef4444' : 'var(--text-dim)'}}>
                    {item.change > 0 ? <ArrowUp size={24}/> : item.change < 0 ? <ArrowDown size={24}/> : null}
                    {Math.abs(item.change)}%
                  </div>
                  <p className="stat-card-note">{t.vsLastWeek}</p>
                </motion.div>
              ))}
            </div>

            {/* AI Mentor Bölümü */}
            <div className="ai-mentor-card">
              <div className="ai-header">
                <Sparkles size={24} color={accentColor} />
                <h3>{t.aiMentor}</h3>
              </div>
              
              {!aiAdvice && !isAiLoading && (
                <button className="ai-btn" onClick={generateAiAdvice} style={{backgroundColor: accentColor}}>
                  {t.askMentor}
                </button>
              )}

              {isAiLoading && (
                <div className="ai-loading">
                  <Loader size={24} className="spin" color={accentColor} />
                  <span>{t.analyzing}</span>
                </div>
              )}

              {aiAdvice && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ai-response">
                  <p>{aiAdvice}</p>
                </motion.div>
              )}
            </div>

            <div className="ai-insight-card">
              <h3>{t.weeklyReport}</h3>
              <ul>
                {analysisData.bestDay && <li>📅 {t.bestDay} <strong style={{color: 'var(--brand-blue)', marginLeft:'5px'}}>{analysisData.bestDay}</strong>{t.bestDaySuffix}</li>}
                {analysisData.comparisonData.map(item => {
                  if (item.change > 15) {
                    return <li key={item.name}>🚀 <strong style={{color: item.color}}>{item.name}</strong> {t.reportJump.replace('{change}', item.change)}</li>;
                  } else if (item.change < -15) {
                    return <li key={item.name}>📉 <strong style={{color: item.color}}>{item.name}</strong> {t.reportDrop.replace('{change}', Math.abs(item.change))}</li>;
                  } else if (item.change !== 0) {
                    return <li key={item.name}>✨ <strong style={{color: item.color}}>{item.name}</strong> {t.reportStable}</li>;
                  } else {
                    return <li key={item.name}>🧘 <strong style={{color: item.color}}>{item.name}</strong> {t.reportMaintain}</li>;
                  }
                })}
              </ul>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div 
            key="settings"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <div className="card">
              <h2 className="stats-title">{t.appSettings}</h2>
              <div className="settings-grid">
                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="settings-btn">
                  {theme === 'dark' ? <Sun size={24} color="#f59e0b"/> : <Moon size={24} color="#3b82f6"/>}
                  <span>{t.changeTheme}</span>
                </button>
                <button onClick={exportData} className="settings-btn">
                  <Download size={24} color="#8b5cf6" />
                  <span>{t.downloadData}</span>
                </button>
                <button onClick={() => {
                  const newState = !notifications;
                  if (newState && "Notification" in window) {
                    Notification.requestPermission();
                  }
                  setNotifications(newState);
                  localStorage.setItem('appNotifications', JSON.stringify(newState));
                }} className="settings-btn">
                  {notifications ? <Bell size={24} color="#10b981"/> : <BellOff size={24} color="#ef4444"/>}
                  <span>{t.notifications}</span>
                </button>
                <button onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')} className="settings-btn">
                  <Languages size={24} color="#f59e0b"/>
                  <span>{t.language}: {language.toUpperCase()}</span>
                </button>
                <button onClick={() => setIsPasswordModalOpen(true)} className="settings-btn">
                  <Lock size={24} color="#8b5cf6" />
                  <span>{t.changePassword}</span>
                </button>
                <button onClick={handleClearData} className="settings-btn" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                  <Trash size={24} />
                  <span>{t.clearData}</span>
                </button>
                <button onClick={handleDeleteAccount} className="settings-btn" style={{ gridColumn: '1 / -1', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                  <ShieldAlert size={24} />
                  <span>{t.deleteAccount}</span>
                </button>
              </div>

              <div style={{marginTop: '30px'}}>
                <h3 className="stats-title">{t.colorTheme}</h3>
                <div className="accent-color-grid">
                  {accentColors.map(c => (
                    <button
                      key={c.value}
                      className={`accent-color-btn ${accentColor === c.value ? 'active' : ''}`}
                      style={{backgroundColor: c.value}}
                      onClick={() => setAccentColor(c.value)}
                      title={c.label}
                    >
                      {accentColor === c.value && <Check size={20} color="white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{marginTop: '30px'}}>
                <h3 className="stats-title">{t.alarmSound}</h3>
                <div className="settings-grid">
                  <button onClick={() => setAlarmSetting('beep')} className={`settings-btn ${alarmSetting === 'beep' ? 'active' : ''}`}>
                      <Volume2 size={24} />
                      <span>{t.beepSound}</span>
                  </button>
                  <button onClick={() => setAlarmSetting('chime')} className={`settings-btn ${alarmSetting === 'chime' ? 'active' : ''}`}>
                      <BellRing size={24} />
                      <span>{t.chimeSound}</span>
                  </button>
                  <button onClick={() => setAlarmSetting('vibrate_only')} className={`settings-btn ${alarmSetting === 'vibrate_only' ? 'active' : ''}`}>
                      <Vibrate size={24} />
                      <span>{t.vibrateOnly}</span>
                  </button>
                  <button onClick={() => setAlarmSetting('silent')} className={`settings-btn ${alarmSetting === 'silent' ? 'active' : ''}`}>
                      <VolumeX size={24} />
                      <span>{t.silent}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profil Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsProfileModalOpen(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setIsProfileModalOpen(false)}><X size={24}/></button>
              <div style={{textAlign: 'center', marginBottom: '20px'}}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profil" className="modal-avatar" />
                ) : (
                  <div className="modal-avatar-placeholder">{user.email?.charAt(0).toUpperCase()}</div>
                )}
                <h2 style={{margin: '10px 0 5px 0'}}>{user.displayName || 'Kullanıcı'}</h2>
                <p style={{color: 'var(--text-dim)', margin: 0}}>{user.email}</p>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="edit-form">
                <div className="form-group">
                    <label>{t.username}</label>
                    <input type="text" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} placeholder={t.username} />
                </div>
                <button type="submit" className="add-btn" style={{width: '100%', marginTop: '10px'}}>{t.save}</button>
              </form>

            {/* Sistem İstatistikleri Paneli */}
            <div style={{marginTop: '25px'}}>
              <h3 className="stats-title">{t.systemStats}</h3>
              
              <div className="profile-stats-grid">
                <div className="profile-stat-card">
                  <Calendar size={24} color="var(--brand-blue)" />
                  <div className="stat-value">{systemStats?.memberSince}</div>
                  <div className="stat-label">{t.memberSince}</div>
                </div>

                <div className="profile-stat-card">
                  <Clock size={24} color="#10b981" />
                  <div className="stat-value">{systemStats?.totalHours} {t.hours}</div>
                  <div className="stat-label">{t.totalFocus}</div>
                </div>

                <div className="profile-stat-card">
                  <Activity size={24} color="#f59e0b" />
                  <div className="stat-value">{analysisData.bestDay || '-'}</div>
                  <div className="stat-label">{t.mostActive}</div>
                </div>

                <div className="profile-stat-card">
                  <CheckCircle size={24} color="#8b5cf6" />
                  <div className="stat-value">{systemStats?.completedTasks}</div>
                  <div className="stat-label">{t.totalTasks}</div>
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aktivite Düzenleme Modalı */}
      <AnimatePresence>
        {editingActivity && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingActivity(null)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setEditingActivity(null)}><X size={24}/></button>
              <h2 style={{marginTop: 0, marginBottom: '20px'}}>{t.editActivity}</h2>
              
              <form onSubmit={handleSaveActivity} className="edit-form">
                <div className="form-group">
                    <label>{t.activityName}</label>
                    <input type="text" value={editingActivity.name} onChange={(e) => setEditingActivity({...editingActivity, name: e.target.value})} required />
                </div>
                <div style={{display:'flex', gap:'15px'}}>
                  <div className="form-group" style={{flex:1}}>
                      <label>{t.dailyGoal}</label>
                      <input type="number" value={editingActivity.goal} onChange={(e) => setEditingActivity({...editingActivity, goal: parseFloat(e.target.value)})} required />
                  </div>
                  <div className="form-group" style={{flex:1}}>
                      <label>{t.weeklyGoal}</label>
                      <input type="number" value={editingActivity.weeklyGoal} onChange={(e) => setEditingActivity({...editingActivity, weeklyGoal: parseFloat(e.target.value)})} />
                  </div>
                </div>
                <div className="form-group">
                    <label>{t.icon}</label>
                    <div className="icon-picker-grid">
                      {availableIcons.map(iconName => (
                          <button
                              type="button"
                              key={iconName}
                              className={`icon-picker-btn ${editingActivity.iconName === iconName ? 'active' : ''}`}
                              onClick={() => setEditingActivity({...editingActivity, iconName: iconName})}
                          >
                              <Icon name={iconName} size={24} />
                          </button>
                      ))}
                    </div>
                </div>
                <div className="form-group">
                    <label>{t.colorTheme}</label>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <input type="color" value={editingActivity.color} onChange={(e) => setEditingActivity({...editingActivity, color: e.target.value})} className="color-picker" />
                      <span style={{color:'var(--text-dim)', fontSize:'0.9rem'}}>{editingActivity.color}</span>
                    </div>
                </div>
                <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                  <button 
                    type="button" 
                    onClick={() => { deleteActivity(editingActivity.id); setEditingActivity(null); }}
                    style={{background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                  >
                    <Trash2 size={20}/>
                  </button>
                  <button type="submit" className="add-btn" style={{flex: 1, display:'flex', justifyContent:'center', gap:'10px'}}><Check size={20}/> {t.save}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Scratchpad */}
      <AnimatePresence>
        {isScratchpadExpanded && (
          <motion.div 
            className="scratchpad-fullscreen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="scratchpad-fullscreen-header">
              <div style={{display: 'flex', gap: '10px'}}>
                <button className="settings-btn" style={{minHeight: 'auto', padding: '10px'}} onClick={() => setIsScratchpadPreview(!isScratchpadPreview)}>
                  {isScratchpadPreview ? <><Edit size={20}/> {t.edit}</> : <><Eye size={20}/> {t.preview}</>}
                </button>
              </div>
              <button className="scratchpad-close-btn" onClick={() => setIsScratchpadExpanded(false)}>
                <Minimize size={24} />
              </button>
            </div>
            
            {isScratchpadPreview ? (
              <div className="scratchpad-fullscreen-preview markdown-body">
                 {scratchpadContent ? (
                    <Suspense fallback={<div className="loading-text">{t.loading}</div>}>
                      <ReactMarkdown>{scratchpadContent}</ReactMarkdown>
                    </Suspense>
                  ) : (
                    <div className="scratchpad-empty-preview">Markdown formatında metin yazarak önizlemeyi görün.</div>
                  )}
               </div>
            ) : (
              <textarea
                className="scratchpad-fullscreen-textarea"
                value={scratchpadContent}
                onChange={(e) => setScratchpadContent(e.target.value)}
                placeholder={t.typeHere}
                autoFocus
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Şifre Değiştirme Modalı */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPasswordModalOpen(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setIsPasswordModalOpen(false)}><X size={24}/></button>
              <h2 style={{marginTop: 0, marginBottom: '20px'}}>{t.changePassword}</h2>
              
              {user.providerData[0]?.providerId === 'google.com' ? (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '20px' }}>
                  Google ile giriş yaptığınız için şifre değiştirme işlemi kullanılamaz.
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} className="edit-form">
                  <div className="form-group">
                      <label>{t.currentPassword}</label>
                      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                  </div>
                  <div className="form-group">
                      <label>{t.newPassword}</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength="6" />
                  </div>
                  <button type="submit" className="add-btn" style={{width: '100%', marginTop: '10px'}}>{t.save}</button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll To Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            className="scroll-to-top-btn"
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}

export default App;