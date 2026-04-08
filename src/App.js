import React, { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import ambientPlayer from './audioService';
import notificationService from './notificationService';
import { ChevronLeft, ChevronRight, X, Sun, Moon, Flame, Lock, Download, Loader, LayoutDashboard, Target, BarChart3, Maximize, Minimize, ArrowUp, ArrowDown, Check, Trash2, Plus, Trophy, Settings, Bell, BellOff, Languages, Sparkles, Calendar, Clock, Activity, CheckCircle, StickyNote, Edit, Eye, VolumeX, Trash, ShieldAlert, CloudRain, Coffee, TreePine, ListTodo, Music, BookOpen, Brain, Wind, Crown, AlertCircle, LogOut, TrendingUp, Smile, Meh, Frown, Rocket } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Tooltip as RechartsTooltip, CartesianGrid, XAxis, YAxis } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';
import Auth from './Auth';
import Icon from './Icon';
import { auth, db } from './firebase';
import { onAuthStateChanged, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { updateAllWidgets } from './widgetService';
import { hasActivePremiumEntitlement, hasRevenueCatKey, initializePremiumSession, isPremiumPlatformSupported, purchasePremiumPackage, restorePremiumPurchases } from './premiumService';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { NativeAudio } from '@capacitor-community/native-audio';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

const defaultActivities = [
  { id: 1, name: 'Ders (Saat)', iconName: 'Book', value: 0, goal: 6, weeklyGoal: 42, color: '#3b82f6' },
  { id: 3, name: 'Spor (Dakika)', iconName: 'Dumbbell', value: 0, goal: 45, weeklyGoal: 315, color: '#10b981' },
  { id: 5, name: 'Kod (Satır)', iconName: 'Terminal', value: 0, goal: 150, weeklyGoal: 1050, color: '#8b5cf6' },
];

const DashboardChart = React.lazy(() => import('./DashboardChart'));
const AnalyticsChart = React.lazy(() => import('./AnalyticsChart'));
const ReactMarkdown = React.lazy(() => import('react-markdown'));
const AIMentorChat = React.lazy(() => import('./components/AIMentor/AIMentorChat'));


const availableIcons = ['Book', 'Dumbbell', 'Terminal', 'Code', 'Brain', 'Target', 'Bike', 'Coffee', 'Film', 'Music', 'PenTool', 'Heart', 'TrendingUp', 'Zap', 'BarChart', 'Briefcase', 'DollarSign', 'Globe', 'Home', 'Mic', 'Camera'];

const avatarOptionsList = [
  'https://cdn-icons-png.flaticon.com/512/1326/1326405.png', // Girl 1
  'https://cdn-icons-png.flaticon.com/512/1326/1326377.png', // Boy 1
  'https://cdn-icons-png.flaticon.com/512/1326/1326390.png', // Girl 2
  'https://cdn-icons-png.flaticon.com/512/1326/1326415.png', // Boy 2
];
const generateAvatars = () => avatarOptionsList;

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDisplayDate = (dateString) => {
  const dateObj = new Date(dateString);
  return dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
};

// Helper function to lighten color
const lightenColor = (color, percent) => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + (R < 255 ? R : 255) * 0x10000 +
    (G < 255 ? G : 255) * 0x100 + (B < 255 ? B : 255))
    .toString(16).slice(1);
};

const SafeChartContainer = ({ height = 200, minHeight = 1, children, debounce = 0 }) => {
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const updateReadyState = () => {
      const element = containerRef.current;
      const hasValidSize = Boolean(element && element.clientWidth > 10 && element.clientHeight > 10);
      setIsReady(prev => prev !== hasValidSize ? hasValidSize : prev);
    };

    updateReadyState();

    let observer;
    let frameId;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => {
        if (frameId) cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(updateReadyState);
      });
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', updateReadyState, { passive: true });

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateReadyState);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: `${height}px`, minHeight: `${minHeight}px`, display: 'block' }}>
      {isReady ? (
        <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={Math.max(1, minHeight)} debounce={debounce}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
};

// Mini Trend Chart Component
const MiniTrendChart = React.memo(({ data, color }) => (
  <SafeChartContainer height={40} minHeight={40} debounce={60}>
    <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
      <defs>
        <linearGradient id={`miniGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={lightenColor(color, 20)} stopOpacity={0.3} />
          <stop offset="95%" stopColor={lightenColor(color, 20)} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="value" stroke={lightenColor(color, 10)} strokeWidth={3} fill={`url(#miniGrad-${color})`} isAnimationActive={false} />
    </AreaChart>
  </SafeChartContainer>
));

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
    monthlyReport: 'Aylık Analiz Raporu',
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
    deleteAccount: 'Hesabı Sil',
    downloadReport: 'Raporu İndir (PDF)',
    chooseAvatar: 'Avatar Seç',
    uploadPhoto: 'Fotoğraf Yükle',
    welcome: 'Merhaba',
    generatedAt: 'Oluşturulma Tarihi:',
    confirmDeleteAccount: 'Hesabınız ve tüm verileriniz kalıcı olarak silinecektir. Bu işlem geri alınamaz. Emin misiniz?',
    idleMessage: 'Devam etmek için dokunun',
    ambientSound: 'Arka Plan Sesi',
    none: 'Yok',
    natureRain: 'Yağmur',
    cafe: 'Kafe Ortamı',
    fireplace: 'Şömine',
    forest: 'Orman',
    library: 'Kütüphane',
    lofi: 'LoFi Müzik',
    meditation: 'Meditasyon',
    whiteNoise: 'Beyaz Gürültü',
    proFeature: 'PRO Özelliği',
    proUpgrade: "PRO'ya Geç",
    proLockedMessage: 'Aylık Detaylı Analiz Raporu ve PDF Çıktısı PRO üyelerimize özeldir. Performansınızı zirveye taşımak için yükseltin!',
    ambientProMessage: 'Arka plan sesleri PRO üyelerimize özeldir. Rahat çalışma ortamı için yükseltin!',
    mentorTab: 'Mentor',
    openMentor: 'Mentor Sekmesini Aç',
    mentorFocus: 'Bu haftanin odak ozeti',
    threeDayReport: '3 Gunluk Rapor',
    premiumTitle: 'LifeTrack PRO',
    premiumSubtitle: 'AI Mentor, 7 gunluk analiz, detayli raporlar ve premium odak araclarini ac.',
    restorePurchases: 'Satin Alimlari Geri Yukle',
    premiumUnavailable: 'PRO satin alma ekrani sadece iOS uygulamasinda aktif.',
    premiumStoreUnavailable: 'Su anda magaza paketleri yuklenemedi. Tekrar deneyin.',
    goalBuilderTitle: 'Hedeflerini olustur',
    goalBuilderDescription: 'Dashboard kartlarini gunluk ve haftalik hedeflerle aninda sekillendir.',
    backToToday: 'Bugune Don',
    confirmLogout: 'Çıkış yapmak istediğinize emin misiniz?'
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
    monthlyReport: 'Monthly Analysis Report',
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
    reportJump: 'is doing great! %{change} more productive than last week.',
    reportDrop: 'has seen a dip. %{change} less than last week. You can refocus here.',
    reportStable: 'is making steady progress.',
    reportMaintain: 'maintaining your performance from last week.',
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
    deleteAccount: 'Delete Account',
    downloadReport: 'Download Report (PDF)',
    chooseAvatar: 'Choose Avatar',
    uploadPhoto: 'Upload Photo',
    welcome: 'Welcome',
    generatedAt: 'Generated:',
    confirmDeleteAccount: 'Your account and all data will be permanently deleted. This cannot be undone. Are you sure?',
    idleMessage: 'Touch to continue',
    ambientSound: 'Ambient Sound',
    none: 'None',
    natureRain: 'Rain',
    cafe: 'Cafe',
    fireplace: 'Fireplace',
    forest: 'Forest',
    library: 'Library',
    lofi: 'LoFi Music',
    meditation: 'Meditation',
    whiteNoise: 'White Noise',
    proFeature: 'PRO Feature',
    proUpgrade: 'Go PRO',
    proLockedMessage: 'Detailed Monthly Analytics Report and PDF Export are exclusive to our PRO members. Upgrade to take your performance to the next level!',
    ambientProMessage: 'Ambient sounds are exclusive to PRO members. Upgrade for a comfortable study environment!',
    mentorTab: 'Mentor',
    openMentor: 'Open Mentor Tab',
    mentorFocus: 'This week focus summary',
    threeDayReport: '3 Day Report',
    premiumTitle: 'LifeTrack PRO',
    premiumSubtitle: 'Unlock AI Mentor, 7 day analysis, detailed reports, and premium focus tools.',
    restorePurchases: 'Restore Purchases',
    premiumUnavailable: 'The PRO purchase screen is only active in the iOS app.',
    premiumStoreUnavailable: 'Store packages could not be loaded right now. Please try again.',
    goalBuilderTitle: 'Build your goals',
    goalBuilderDescription: 'Shape your dashboard cards instantly with daily and weekly targets.',
    backToToday: 'Back To Today',
    confirmLogout: 'Are you sure you want to log out?'
  }
};

const ambientSounds = {
  none: null,
  // Nature
  natureRain: '/sounds/natureRain.mp3',
  forest: '/sounds/forest.mp3',
  fireplace: '/sounds/fireplace.mp3',
  // Social
  cafe: '/sounds/cafe.mp3',
  library: '/sounds/library.mp3',
  // Music
  lofi: '/sounds/lofi.mp3',
  meditation: '/sounds/meditation.mp3',
  // Generated (Web Audio API)
  whiteNoise: null,
};

const alarmSounds = {
  beep: '/sounds/beep.mp3',
  chime: '/sounds/chime_short.mp3',
};

// Chime URL: always played at timer end regardless of alarmSetting
const POMODORO_CHIME_URL = alarmSounds.chime;

const accentColors = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#f59e0b', label: 'Amber' },
];

const pageVariants = {
  initial: { opacity: 0, x: 20, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -20, scale: 0.98 }
};

const pageTransition = {
  type: "spring",
  stiffness: 700,
  damping: 30
};

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme) return savedTheme;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [historyData, setHistoryData] = useState({});
  const [moods, setMoods] = useState({});
  const [todos, setTodos] = useState([]);
  const [dailyGoals, setDailyGoals] = useState({});
  const [newTodo, setNewTodo] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newWeeklyGoal, setNewWeeklyGoal] = useState('');
  const [newIcon, setNewIcon] = useState('Book');

  // PRO Kilidi State'leri
  // FORCE PRO - Premium state'i herzaman true
  const [isPremiumUser, setIsPremiumUser] = useState(false); // Default to false
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [premiumPackages, setPremiumPackages] = useState([]);
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);
  const [isPremiumCtaLoading, setIsPremiumCtaLoading] = useState(false);
  const [premiumError, setPremiumError] = useState('');
  const [activePurchaseId, setActivePurchaseId] = useState('');
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);
  const [isCloudSyncEnabled, setIsCloudSyncEnabled] = useState(true);
  const hasShownCloudSyncWarningRef = useRef(false);

  // Pomodoro
  const [pomodoroDuration, setPomodoroDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [targetTimestamp, setTargetTimestamp] = useState(() => {
    const saved = localStorage.getItem('pomodoroTargetTime');
    return saved ? parseInt(saved, 10) : null;
  });
  const [isActive, setIsActive] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [notifications, setNotifications] = useState(() => JSON.parse(localStorage.getItem('appNotifications')) ?? true);
  const [language, setLanguage] = useState(() => localStorage.getItem('appLanguage') || 'tr');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('appAccentColor') || '#3b82f6');
  const [alarmSetting, setAlarmSetting] = useState(() => localStorage.getItem('appAlarmSetting') || 'beep');
  const [ambientSound, setAmbientSound] = useState(() => localStorage.getItem('appAmbientSound') || 'none');
  const [ambientVolume, setAmbientVolume] = useState(() => parseFloat(localStorage.getItem('appAmbientVolume')) || 0.5);

  // Doğrudan NativeAudio tetikleyen yeni ses yöneticisi
  const handleAmbientSound = async (soundKey) => {
    try {
      console.log(`[APP] handleAmbientSound tetiklendi: ${soundKey}`);

      // Eski sesi durdur (Eğer varsa)
      if (ambientSound !== 'none' && Capacitor.isNativePlatform()) {
        try { await NativeAudio.stop({ assetId: ambientSound }); } catch (e) { }
      }

      setAmbientSound(soundKey);

      if (soundKey !== 'none' && Capacitor.isNativePlatform()) {
        await NativeAudio.setVolume({ assetId: soundKey, volume: ambientVolume || 1.0 });
        await NativeAudio.loop({ assetId: soundKey });
        console.log(`[APP] NativeAudio.loop basariyla tetiklendi: ${soundKey}`);
      }
    } catch (e) {
      console.error('[NATIVE ERROR]:', e);
    }
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTimerCompleted, setIsTimerCompleted] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [scratchpadContent, setScratchpadContent] = useState('');

  // iOS Keyboard Avoidance State
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener('keyboardWillShow', info => {
        setKeyboardHeight(info.keyboardHeight);
      });
      Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0);
      });
      return () => {
        Keyboard.removeAllListeners();
      };
    }
  }, []);

  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isScratchpadExpanded, setIsScratchpadExpanded] = useState(false);
  const [isScratchpadPreview, setIsScratchpadPreview] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showWave, setShowWave] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [avatarOptions, setAvatarOptions] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimer = useRef(null);
  const gridRef = useRef(null);
  const lastScrollY = useRef(0);
  const fileInputRef = useRef(null);
  const reportCardRef = useRef(null);
  // ambientAudioRef kept as placeholder; actual playback managed by audioService
  const ambientAudioRef = useRef(null);
  const scrollTimeout = useRef(null);

  const isEditable = currentDate === formatDate(new Date());
  const t = translations[language];
  const displayUsername = user?.displayName || localStorage.getItem('temp_username') || 'Kullanıcı';

  const currentActivities = Array.isArray(historyData[currentDate])
    ? historyData[currentDate]
    : defaultActivities.map(a => ({ ...a, value: 0 }));
  const isPremiumSupported = isPremiumPlatformSupported();
  const isPremiumPaywallReady = isPremiumSupported && hasRevenueCatKey();
  const isGoogleProvider = Array.isArray(user?.providerData)
    && user.providerData.some((provider) => provider?.providerId === 'google.com');
  const isAppleProvider = Array.isArray(user?.providerData)
    && user.providerData.some((provider) => provider?.providerId === 'apple.com');

  useEffect(() => {
    if (!user) {
      setIsCloudSyncEnabled(true);
      hasShownCloudSyncWarningRef.current = false;
      return;
    }

    setIsCloudSyncEnabled(true);
    hasShownCloudSyncWarningRef.current = false;
  }, [user]);

  const getPackageLabel = (pkg) => {
    const packageType = pkg?.packageType;
    if (packageType === 'ANNUAL') return language === 'tr' ? 'Yillik PRO' : 'Annual PRO';
    if (packageType === 'MONTHLY') return language === 'tr' ? 'Aylik PRO' : 'Monthly PRO';
    if (packageType === 'WEEKLY') return language === 'tr' ? 'Haftalik PRO' : 'Weekly PRO';
    if (packageType === 'LIFETIME') return language === 'tr' ? 'Omur Boyu PRO' : 'Lifetime PRO';
    return pkg?.product?.title || t.premiumTitle;
  };

  const getPackageDescription = (pkg) => {
    const pricePerMonth = pkg?.product?.pricePerMonthString;
    if (pkg?.packageType === 'ANNUAL' && pricePerMonth) {
      return language === 'tr'
        ? `${pricePerMonth}/ay • AI Mentor • 1 Aylik Detayli Analiz • Customize Edilmis Raporlar`
        : `${pricePerMonth}/month • AI Mentor • 1-Month Detailed Analysis • Customized Reports`;
    }
    if (pkg?.packageType === 'MONTHLY') {
      return language === 'tr'
        ? 'AI Mentor • Gunluk Goruluyor • Ozel Detayli Raporlar • Tum Ozelliklere Erisim'
        : 'AI Mentor • Daily Insights • Detailed Reports • Full Feature Access';
    }
    return pkg?.product?.description || (language === 'tr' ? 'AI Mentor • Analiz • Raporlar' : 'AI Mentor • Analytics • Reports');
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const updateData = (id, field, val) => {
    const updated = currentActivities.map(a => a.id === id ? { ...a, [field]: parseFloat(val) || 0 } : a);
    setHistoryData({ ...historyData, [currentDate]: updated });
  };

  // Firebase Auth Listener & Data Loading
  useEffect(() => {
    let isUnmounted = false;
    const timeout = setTimeout(() => {
      if (!isUnmounted) {
        console.warn("Firebase yanıt vermedi, zaman aşımı uygulandı.");
        setAuthLoading(false);
      }
    }, 10000); // 10 saniyeye çıkardık

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (isUnmounted) return;

      try {
        if (currentUser) {
          setUser(currentUser);
          setIsCloudSyncEnabled(true);
          hasShownCloudSyncWarningRef.current = false; // Reset warning flag on new login

          const userDocRef = doc(db, 'users', currentUser.uid);
          try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setHistoryData(data.historyData || { [formatDate(new Date())]: defaultActivities });
              setMoods(data.moods || {});
              setTodos(data.todos || []);
              setDailyGoals(data.dailyGoals || {});
              setScratchpadContent(data.scratchpadContent || '');
              // Initialize isPremiumUser from Firestore first
              setIsPremiumUser(data.isPremiumUser === true);
              console.log('✅ Firestore\'dan isPremiumUser durumu yüklendi:', data.isPremiumUser);
            } else {
              console.log("Firestore'da kaydı bulunamadı, default veriler yükleniyor...");
              setHistoryData({ [formatDate(new Date())]: defaultActivities });
              setMoods({});
              setTodos([]);
              setDailyGoals({});
              setScratchpadContent('');
              setIsPremiumUser(false); // Default to false if no Firestore data
            }
          } catch (firestoreError) {
            if (firestoreError?.code === 'permission-denied') {
              setIsCloudSyncEnabled(false);
              if (!hasShownCloudSyncWarningRef.current) {
                console.debug('Firestore write izni yok. Uygulama local modda devam edecek.', firestoreError);
                hasShownCloudSyncWarningRef.current = true;
              }
            } else {
              console.warn('Firestore bağlantı hatası, offline mod:', firestoreError);
            }
            // Offline mode - local defaults
            setHistoryData({ [formatDate(new Date())]: defaultActivities });
            setMoods({});
            setTodos([]);
            setDailyGoals({});
            setScratchpadContent('');
          }

          // RevenueCat Premium Sync
          try {
            const configStatus = await Purchases.isConfigured();
            if (!configStatus.isConfigured) {
              await Purchases.configure({ apiKey: 'appl_LSMObGgWoJiskSarRbWUkBbNJOw' });
            }
            await Purchases.logIn({ appUserID: currentUser.uid });
            const { customerInfo } = await Purchases.getCustomerInfo();
            const isPro = customerInfo?.entitlements?.active['Premium']?.isActive === true ||
              customerInfo?.entitlements?.active['pro_features']?.isActive === true;

            if (isPro) {
              setIsPremiumUser(true);
              localStorage.setItem('isPremiumUser', 'true');
            }
          } catch (rcError) {
            console.error("RevenueCat sync error:", rcError);
          }
        } else {
          setUser(null);
          setHistoryData({});
          setMoods({});
          setTodos([]);
          setDailyGoals({});
          setIsPremiumUser(false);
          localStorage.removeItem('isPremiumUser');
          try {
            await Purchases.logOut();
          } catch (rcError) {
            console.error("RevenueCat logout error:", rcError);
          }
        }
      } catch (error) {
        console.error("Auth listener hatası:", error);
        setUser(null);
        setHistoryData({});
      } finally {
        clearTimeout(timeout);
        if (!isUnmounted) {
          setAuthLoading(false);
        }
      }
    });

    return () => {
      isUnmounted = true;
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []); // Removed isPremiumUser from dependencies to avoid infinite loop

  // Deep Link Handler - Widget Taps
  useEffect(() => {
    const isNativePlatform = window.Capacitor?.isNativePlatform?.();
    const appPlugin = window.Capacitor?.Plugins?.App;
    if (!isNativePlatform || !appPlugin?.addListener) return undefined;

    let listenerHandle;

    appPlugin.addListener('appUrlOpen', (data) => {
      const slug = data.url.split('.app').pop();

      if (slug?.includes('widgetlaunch')) {
        setActiveTab('dashboard');
        window.scrollTo(0, 0);
      }
    })
      .then((handle) => {
        listenerHandle = handle;
      })
      .catch(err => console.debug('Deep link listener error:', err));

    return () => {
      try {
        listenerHandle?.remove?.();
      } catch (error) {
        console.debug('Deep link cleanup skipped:', error);
      }
    };
  }, []);

  // Data Saving to Firestore
  useEffect(() => {
    if (!user || !isCloudSyncEnabled) return;

    const debounceSave = setTimeout(async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { historyData, moods, todos, dailyGoals, scratchpadContent, isPremiumUser }, { merge: true });
      } catch (error) {
        if (error?.code === 'permission-denied') {
          setIsCloudSyncEnabled(false);
          if (!hasShownCloudSyncWarningRef.current) {
            console.debug('Firestore write izni yok. Otomatik kaydetme local moda alındı.', error);
            hasShownCloudSyncWarningRef.current = true;
          }
          return;
        }
        console.error('Otomatik kaydetme hatası:', error);
      }
    }, 1500);

    return () => clearTimeout(debounceSave);
  }, [user, isCloudSyncEnabled]);

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

  // Arka Plan Sesi – kalıcılık
  useEffect(() => {
    localStorage.setItem('appAmbientSound', ambientSound);
  }, [ambientSound]);

  useEffect(() => {
    localStorage.setItem('appAmbientVolume', ambientVolume);
  }, [ambientVolume]);

  // Arka Plan Sesi kontrolü `useEffect`'i tamamen silindi.
  // NativeAudio oynatma işlemi artık handleAmbientSound içinde, direkt butona basıldığında tetikleniyor.

  // Bileşen kaldırıldığında sesi temizle
  useEffect(() => {
    return () => {
      try { ambientPlayer.stop(); } catch (e) { }
    };
  }, []);

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

  // Avatar seçeneklerini oluştur
  useEffect(() => {
    if (isProfileModalOpen) {
      setAvatarOptions(generateAvatars());
    }
  }, [isProfileModalOpen]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Alt menünün (bottom nav) görünürlüğü
  useEffect(() => {
    if (!isMobile) {
      setIsBottomNavVisible(true);
      return;
    }

    const controlNavbar = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsBottomNavVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setIsBottomNavVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsBottomNavVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', controlNavbar);
    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [isMobile]);


  // Bileşen silindiğinde/kullanıcı çıkış yaptığında sesi temizle
  useEffect(() => {
    return () => {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
      }
    };
  }, []);

  // Idle detection for screen saver
  useEffect(() => {
    let throttleTimer;
    const handleActivity = () => {
      if (isIdle) setIsIdle(false);

      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
          clearTimeout(idleTimer.current);
          idleTimer.current = setTimeout(() => {
            if (!isActive) setIsIdle(true);
          }, 180000);
        }, 1000);
      }
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (!isActive) setIsIdle(true);
    }, 180000);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimeout(idleTimer.current);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isIdle, isActive]);




  // Sync timer when app returns from background
  useEffect(() => {
    const handler = CapacitorApp.addListener('appStateChange', ({ isActive: isAppActive }) => {
      if (isAppActive && targetTimestamp) {
        const remaining = Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000));

        if (remaining <= 0) {
          // If timer already finished while in background, cleanup silently
          // The user already got a notification in the background
          setIsActive(false);
          setIsTimerCompleted(true);
          setTargetTimestamp(null);
          localStorage.removeItem('pomodoroTargetTime');
          setTimeLeft(0);
        } else {
          setTimeLeft(remaining);
        }
      }
    });
    return () => { handler.then(h => h.remove()); };
  }, [targetTimestamp]);

  useEffect(() => {
    let interval = null;
    if (isActive && targetTimestamp) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          setIsActive(false);
          setIsTimerCompleted(true);
          const finalTarget = targetTimestamp;
          // Logic: Clean up state. Sound and notification are handled by LocalNotifications.
          setTargetTimestamp(null);
          localStorage.removeItem('pomodoroTargetTime');

          // The notification is already handled by Capacitor LocalNotifications (future scheduling)
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, targetTimestamp, language]);

  // Request notification permission when Settings tab is opened (once per session)
  const hasRequestedNotifPermRef = useRef(false);
  useEffect(() => {
    if (activeTab === 'settings' && !hasRequestedNotifPermRef.current) {
      hasRequestedNotifPermRef.current = true;
      notificationService.requestPermission().then(result => {
        console.debug('[Notifications] Permission:', result);
      });
    }
  }, [activeTab]);

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

  // Pomodoro çalışırken sekmeyi kapatmayı önle
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isActive) {
        e.preventDefault();
        e.returnValue = 'Çalışan bir Pomodoro sayacınız var. Sayfadan ayrılmak istediğinize emin misiniz?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isActive]);

  // ESC tuşu ile tam ekrandan çıkma
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') setIsFullScreen(false);
      if (event.key === 'Escape') setIsScratchpadExpanded(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Günün Hedefi İşlemleri
  const getDailyGoal = (date) => {
    const goal = dailyGoals[date];
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
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 10001
      });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (auth.currentUser && newPassword && currentPassword) {
      try {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);

        await updatePassword(auth.currentUser, newPassword);
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

  const handleDeleteAccount = async () => {
    if (window.confirm(t.confirmDeleteAccount)) {
      if (!auth.currentUser) return;
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await deleteDoc(userDocRef);

        await deleteUser(auth.currentUser);
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
    setTodos([{ id: Date.now(), text: newTodo, completed: false }, ...todos]);
    setNewTodo('');
  };

  const toggleTodo = (id) => {
    const newTodos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
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

      let weekName;
      if (i === 0) {
        weekName = 'Bu Hafta'; // Default Turkish
      } else {
        weekName = `${i} H Önce`; // Default Turkish
      }

      weeklyScores.push({
        name: weekName,
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

      const trend = [];
      for (let j = 6; j >= 0; j--) {
        const d = new Date();
        d.setDate(d.getDate() - j);
        const dateStr = formatDate(d);
        const dayData = historyData[dateStr] || [];
        const actData = dayData.find(a => a.name === act.name);
        const val = actData ? Math.min((actData.value / (actData.goal || 1)) * 100, 100) : 0;
        trend.push({ day: j, value: val });
      }

      return { name: act.name.split(' ')[0], color: act.color, change, thisWeek, lastWeek, trend };
    });

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
    for (let i = 0; i < 7; i++) { if (dayCounts[i] > 0 && (dayScores[i] / dayCounts[i]) > maxAvg) { maxAvg = dayScores[i] / dayCounts[i]; bestDayIndex = i; } }
    const bestDay = bestDayIndex !== -1 ? daysOfWeek[bestDayIndex] : null;

    let maxStreak = 0;
    let currentStreakCalc = 0;
    const sortedDatesAsc = [...allDates].reverse();
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

    const daysOfWeekShort = language === 'tr' ? ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyTrend = [];
    for (let j = 6; j >= 0; j--) {
      const d = new Date();
      d.setDate(d.getDate() - j);
      const dateStr = formatDate(d);
      const dayData = historyData[dateStr] || [];
      let activeGoals = 0;
      dayData.forEach(act => {
        if ((act.value || 0) >= (act.goal || 1)) {
          activeGoals += 1;
        }
      });
      const totalGoals = dayData.length;
      const score = totalGoals > 0 ? Math.round((activeGoals / totalGoals) * 100) : 0;
      weeklyTrend.push({
        day: daysOfWeekShort[d.getDay()],
        score,
        completedGoals: activeGoals,
        totalGoals
      });
    }

    const monthlyTrend = [];
    for (let j = 29; j >= 0; j--) {
      const d = new Date();
      d.setDate(d.getDate() - j);
      const dateStr = formatDate(d);
      const dayData = historyData[dateStr] || [];
      let activeGoals = 0;
      dayData.forEach(act => {
        if ((act.value || 0) >= (act.goal || 1)) {
          activeGoals += 1;
        }
      });
      const totalGoals = dayData.length;
      const score = totalGoals > 0 ? Math.round((activeGoals / totalGoals) * 100) : 0;
      monthlyTrend.push({
        day: `${d.getDate()}`,
        score,
        completedGoals: activeGoals,
        totalGoals,
      });
    }

    let thisWeekMinutes = 0;
    defaultActivities.forEach(act => {
      const lowerName = (act.name || '').toLowerCase();
      const val = thisWeekTotals[act.name] || 0;
      if (lowerName.includes('saat') || lowerName.includes('hour')) {
        thisWeekMinutes += val * 60;
      } else {
        thisWeekMinutes += val;
      }
    });
    const thisWeekHours = Math.floor(thisWeekMinutes / 60);

    return { chartData: weeklyScores.reverse(), comparisonData: comparison, bestDay, maxStreak, weeklyTrend, monthlyTrend, thisWeekHours };
  }, [historyData, language]);

  const syncPremiumState = async (showLoader = true) => {
    if (!user || !isPremiumPaywallReady) {
      setPremiumPackages([]);
      return [];
    }

    if (showLoader) {
      setIsPremiumLoading(true);
    }

    setPremiumError('');

    const resolvePremiumErrorMessage = (error) => {
      const rawMessage = (error?.message || '').toLowerCase();
      if (rawMessage.includes('premium_timeout') || rawMessage.includes('timeout')) {
        return language === 'tr'
          ? 'PRO bağlantısı zaman aşımına uğradı. İnternetini kontrol edip tekrar dene.'
          : 'PRO connection timed out. Check your internet and try again.';
      }
      if (rawMessage.includes('network')) {
        return language === 'tr'
          ? 'Ag baglantisi sorunu. Internetini kontrol edip tekrar dene.'
          : 'Network issue detected. Please check your internet and try again.';
      }
      return error?.message || (language === 'tr'
        ? 'PRO bilgileri yuklenirken bir hata olustu.'
        : 'An error occurred while loading PRO details.');
    };

    try {
      const premiumSession = await initializePremiumSession(user.uid);
      const nextPackages = premiumSession.packages || [];
      setPremiumPackages(nextPackages);
      if (premiumSession.customerInfo) {
        setIsPremiumUser(hasActivePremiumEntitlement(premiumSession.customerInfo));
      }
      return nextPackages;
    } catch (error) {
      console.error('Premium sync failed:', error);
      setPremiumError(resolvePremiumErrorMessage(error));
      return [];
    } finally {
      if (showLoader) {
        setTimeout(() => { setIsPremiumLoading(false); }, 1500);
      }
    }
  };

  const openPremiumModal = () => {
    setIsPremiumModalOpen(true);
    setPremiumError('');

    if (isPremiumPaywallReady && user) {
      syncPremiumState(true);
    }
  };

  const handlePremiumPurchase = async () => {
    setPremiumError('');
    setActivePurchaseId('$rc_monthly');

    try {
      // 1. Motor Kontrolü ve Zorla Ateşleme
      const configStatus = await Purchases.isConfigured();
      // Dikkat: Capacitor plugin'i objenin içinde boolean döner
      if (!configStatus.isConfigured) {
        await Purchases.configure({ apiKey: 'appl_LSMObGgWoJiskSarRbWUkBbNJOw' });
      }

      // 2. Artık motor %100 çalışıyor, paketleri çek
      const offerings = await Purchases.getOfferings();
      const packageToBuy = offerings.current?.availablePackages.find(p => p.identifier === '$rc_monthly') || offerings.current?.availablePackages[0];

      if (!packageToBuy) throw new Error('Aylık paket bulunamadı ($rc_monthly)');

      // 3. Satın almayı başlat
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: packageToBuy });

      // Logda bulunan veri yapısına göre kontrol
      const isPro = customerInfo.entitlements.active['Premium']?.isActive === true ||
        customerInfo.entitlements.active['pro_features']?.isActive === true;

      if (isPro) {
        alert('✅ SATINALMA BAŞARILI - PREMIUM AKTIF!');
        setIsPremiumUser(true);

        // Firestore'a isPremiumUser'ı kaydet
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, { isPremiumUser: true }, { merge: true });
        } catch (firestoreError) {
          console.error('⚠️ Firestore kayıt hatası:', firestoreError?.message);
        }

        setIsPremiumModalOpen(false);
        await syncPremiumState(false);
      } else {
        console.warn('❌ Entitlement bulunamadı:', customerInfo.entitlements);
        alert('❌ Satın alma tamamlandı ancak Premium erişimi alınamadı');
      }
    } catch (error) {
      if (!error?.userCancelled) {
        alert('Apple Satın Alma Hatası: ' + error.message);
        console.error('Premium purchase failed:', error);
        setPremiumError(error?.message || (language === 'tr'
          ? 'Satın alma tamamlanamadı.'
          : 'Purchase could not be completed.'));
      }
    } finally {
      setActivePurchaseId('');
    }
  };

  const handlePremiumCtaClick = async () => {
    if (activePurchaseId || isRestoringPurchases || isPremiumCtaLoading) return;

    setIsPremiumCtaLoading(true);
    setPremiumError('');

    try {
      if (!user) {
        setPremiumError(language === 'tr' ? 'Devam etmek için giriş yapman gerekiyor.' : 'Please sign in to continue.');
        return;
      }

      if (!isPremiumPaywallReady) {
        setPremiumError(language === 'tr'
          ? 'Ödeme sistemi şu an hazır değil. Lütfen daha sonra tekrar dene.'
          : 'Payment system is not ready yet. Please try again shortly.');
        return;
      }

      await handlePremiumPurchase();
    } catch (error) {
      console.error('Premium CTA flow failed:', error);
      setPremiumError(error?.message || (language === 'tr'
        ? 'Satın alma akışı başlatılamadı. Lütfen tekrar dene.'
        : 'Purchase flow could not be started. Please try again.'));
    } finally {
      setIsPremiumCtaLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setPremiumError('');
    setIsRestoringPurchases(true);

    try {
      const { customerInfo } = await restorePremiumPurchases();
      const restoredPremium = hasActivePremiumEntitlement(customerInfo);
      setIsPremiumUser(restoredPremium);
      if (!restoredPremium) {
        setPremiumError(language === 'tr'
          ? 'Geri yüklenecek aktif bir PRO satın alımı bulunamadı.'
          : 'No active PRO purchase was found to restore.');
      } else {
        setIsPremiumModalOpen(false);
      }
      await syncPremiumState(false);
    } catch (error) {
      console.error('Restore purchases failed:', error);
      setPremiumError(error?.message || (language === 'tr'
        ? 'Satın alımlar geri yüklenemedi.'
        : 'Purchases could not be restored.'));
    } finally {
      setIsRestoringPurchases(false);
    }
  };

  useEffect(() => {
    if (!user || !isPremiumPaywallReady) return undefined;

    let isCancelled = false;
    let timeoutHandle = null;

    const loadPremiumState = async () => {
      setIsPremiumLoading(true);
      setPremiumError('');

      try {
        const premiumSession = await initializePremiumSession(user.uid);
        if (isCancelled) return;
        setPremiumPackages(premiumSession.packages || []);
        if (premiumSession.customerInfo) {
          setIsPremiumUser(hasActivePremiumEntitlement(premiumSession.customerInfo));
        }
      } catch (error) {
        if (isCancelled) return;
        console.error('Premium sync failed:', error);
        const rawMessage = (error?.message || '').toLowerCase();
        if (rawMessage.includes('premium_timeout') || rawMessage.includes('timeout')) {
          setPremiumError(language === 'tr'
            ? 'PRO bağlantısı zaman aşımına uğradı. İnternetini kontrol edip tekrar dene.'
            : 'PRO connection timed out. Check your internet and try again.');
        } else if (rawMessage.includes('network')) {
          setPremiumError(language === 'tr'
            ? 'Ağ bağlantısı sorunu. İnternetini kontrol edip tekrar dene.'
            : 'Network issue detected. Please check your internet and try again.');
        } else {
          setPremiumError(error?.message || (language === 'tr'
            ? 'PRO bilgileri yüklenirken bir hata oluştu.'
            : 'An error occurred while loading PRO details.'));
        }
      } finally {
        if (!isCancelled) {
          setIsPremiumLoading(false);
        }
      }
    };

    // 8 saniye sonunda hala yükleniyorsa timeout hatası göster
    timeoutHandle = setTimeout(() => {
      if (!isCancelled && isPremiumLoading) {
        setPremiumError(language === 'tr'
          ? 'Paketler yüklenemedi. Lütfen daha sonra tekrar deneyin.'
          : 'Could not load packages. Please try again later.');
        setIsPremiumLoading(false);
      }
    }, 8000);

    loadPremiumState();

    return () => {
      isCancelled = true;
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };
  }, [user, isPremiumPaywallReady, language]);




  // Sistem İstatistikleri Hesaplama
  const systemStats = useMemo(() => {
    if (!user) return { memberSince: '-', totalHours: 0, completedTasks: 0, totalCompletedGoals: 0 };

    const joinDate = new Date(user.metadata.creationTime);
    const memberSince = joinDate.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' });

    let totalMinutes = 0;
    let totalCompletedGoals = 0;
    Object.values(historyData).forEach(dayData => {
      if (Array.isArray(dayData)) {
        dayData.forEach(act => {
          const lowerName = (act.name || '').toLowerCase();
          if (lowerName.includes('saat') || lowerName.includes('hour')) {
            totalMinutes += (parseFloat(act.value) || 0) * 60;
          } else if (lowerName.includes('dakika') || lowerName.includes('minute') || lowerName.includes('min')) {
            totalMinutes += (parseFloat(act.value) || 0);
          }

          if ((act.value || 0) >= (act.goal || 1) && (act.value || 0) > 0) {
            totalCompletedGoals += 1;
          }
        });
      }
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const completedTasks = todos.filter(t => t.completed).length;

    return { memberSince, totalHours, completedTasks, totalCompletedGoals };
  }, [user, historyData, language, todos]);

  const handleGridScroll = () => {
    if (gridRef.current) {
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        const cardWidth = gridRef.current.querySelector('.card')?.offsetWidth;
        if (cardWidth) {
          const gap = 15;
          const scrollLeft = gridRef.current.scrollLeft;
          const index = Math.round(scrollLeft / (cardWidth + gap));
          if (activeCardIndex !== index) {
            setActiveCardIndex(index);
          }
        }
      }, 100);
    }
  };

  const streak = useMemo(() => {
    if (!historyData) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; ; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      if (!historyData[dateStr]) break;
      const dayData = historyData[dateStr];
      if (!dayData || dayData.length === 0) break;
      let dayTotal = 0;
      dayData.forEach(act => { dayTotal += Math.min((act.value / (act.goal || 1)) * 100, 100); });
      if ((dayTotal / dayData.length) >= 50) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [historyData]);

  const generateChartData = () => {
    const today = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last7Days.push({ date: formatDate(d), day: d.toLocaleDateString('tr-TR', { weekday: 'short' }) });
    }

    return last7Days.map(dayObj => {
      const dayData = historyData[dayObj.date] || [];
      let completedGoals = 0;
      if (dayData.length > 0) {
        dayData.forEach(act => {
          if ((act.value || 0) > 0) {
            completedGoals += 1;
          }
        });
      }
      return { name: dayObj.day, Skor: completedGoals };
    });
  };

  const addActivity = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newGoal) return;
    const newId = Math.max(...currentActivities.map(a => a.id), 0) + 1;
    const updated = [...currentActivities, {
      id: newId,
      name: newName,
      value: 0,
      goal: parseFloat(newGoal) || 0,
      weeklyGoal: parseFloat(newWeeklyGoal) || 0,
      iconName: newIcon,
      color: accentColor
    }];
    setHistoryData({ ...historyData, [currentDate]: updated });
    setNewName('');
    setNewGoal('');
    setNewWeeklyGoal('');
    setNewIcon('Book');
  };

  const deleteActivity = (id) => {
    const updated = currentActivities.filter(a => a.id !== id);
    setHistoryData({ ...historyData, [currentDate]: updated });
    setEditingActivity(null);
  };

  const handleSaveActivity = (e) => {
    e.preventDefault();
    if (!editingActivity) return;
    const updated = currentActivities.map(a => a.id === editingActivity.id ? editingActivity : a);
    setHistoryData({ ...historyData, [currentDate]: updated });
    setEditingActivity(null);
  };

  const exportData = () => {
    const dataToExport = {
      historyData,
      moods,
      todos,
      dailyGoals,
      scratchpadContent,
      isPremiumUser,
      exportedAt: new Date().toISOString()
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LifeTrack-Data-${formatDate(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const photoURL = selectedAvatar || user.photoURL || '';
      await updateProfile(user, {
        displayName: newDisplayName || displayUsername,
        photoURL: photoURL,
      });
      setUser(prev => ({ ...prev, displayName: newDisplayName || displayUsername, photoURL }));
      setIsProfileModalOpen(false);
      setSelectedAvatar('');
    } catch (error) {
      console.error("Profile update error:", error);
      alert(error.message);
    }
  };

  const renderPremiumSpotlight = (title, message, isOverlay = false) => (
    <motion.div
      className="pro-feature-card premium-glow-frame"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginBottom: isOverlay ? '0' : '20px',
        padding: '40px 24px',
        borderRadius: '24px',
        background: isOverlay
          ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.85) 100%)'
          : 'linear-gradient(145deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.95) 100%)',
        backdropFilter: isOverlay ? 'blur(10px)' : 'none',
        WebkitBackdropFilter: isOverlay ? 'blur(10px)' : 'none',
        border: '1px solid rgba(251, 191, 36, 0.3)',
        boxShadow: '0 10px 40px -10px rgba(251, 191, 36, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Arka plan parlama efekti */}
      <div style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        background: 'rgba(251, 191, 36, 0.1)',
        border: '1px solid rgba(251, 191, 36, 0.4)',
        borderRadius: '20px',
        color: '#fbbf24',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        marginBottom: '20px',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        <Lock size={14} /> {t.proFeature}
      </div>

      <div style={{
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(249, 115, 22, 0.1))',
        border: '2px solid rgba(251, 191, 36, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        boxShadow: '0 0 20px rgba(251, 191, 36, 0.2)'
      }}>
        <Crown size={36} color="#fbbf24" />
      </div>

      <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '1.4rem',
        fontWeight: 700,
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {title}
      </h3>
      <p style={{ margin: '0 0 28px 0', maxWidth: '420px', color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6 }}>
        {message}
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsPremiumModalOpen(true)}
        style={{
          padding: '14px 32px',
          background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
          color: '#fff',
          border: 'none',
          borderRadius: '14px',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(234, 88, 12, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease'
        }}
      >
        <Sparkles size={18} />
        {t.proUpgrade}
      </motion.button>
    </motion.div>
  );

  // Analytics tab'ındaki ağır bileşenlerin saniye başı render olmaması için memoize ediyoruz
  const memoizedWeeklyBarChart = useMemo(() => (
    <SafeChartContainer height="100%" minHeight={300} debounce={80}>
      <BarChart
        data={analysisData.weeklyTrend.map((item) => ({
          day: item.day,
          completedGoals: item.completedGoals,
        }))}
        margin={{ top: 25, right: 10, left: -20, bottom: 20 }}
      >
        <defs>
          <linearGradient id="colorUvWeekly" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff8000" stopOpacity={1} />
            <stop offset="100%" stopColor="#ffd000" stopOpacity={1} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="transparent" />
        <XAxis dataKey="day" stroke="var(--text-dim)" style={{ fontSize: '0.85rem' }} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--text-dim)" style={{ fontSize: '0.85rem' }} allowDecimals={false} tickLine={false} axisLine={false} />
        <Bar dataKey="completedGoals" name={language === 'tr' ? 'Tamamlanan Hedef' : 'Completed Goals'} fill="url(#colorUvWeekly)" radius={[12, 12, 0, 0]} isAnimationActive={true} minPointSize={5} label={{ position: 'top', fill: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600, dy: -5 }} />
        <RechartsTooltip
          cursor={{ fill: 'var(--text-dim)', opacity: 0.1 }}
          contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)', padding: '12px' }}
          itemStyle={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.95rem' }}
          labelStyle={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '4px' }}
        />
      </BarChart>
    </SafeChartContainer>
  ), [analysisData.weeklyTrend, language]);

  const memoizedBarChart = useMemo(() => (
    <SafeChartContainer height="100%" minHeight={300} debounce={80}>
      <BarChart
        data={analysisData.weeklyTrend.slice(-3).map((item) => ({
          day: item.day,
          completedGoals: item.completedGoals,
        }))}
        margin={{ top: 25, right: 10, left: -20, bottom: 20 }}
      >
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity={1} />
            <stop offset="100%" stopColor={lightenColor(accentColor, 30)} stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="transparent" />
        <XAxis dataKey="day" stroke="var(--text-dim)" style={{ fontSize: '0.85rem' }} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--text-dim)" style={{ fontSize: '0.85rem' }} allowDecimals={false} tickLine={false} axisLine={false} />
        <Bar dataKey="completedGoals" name={language === 'tr' ? 'Tamamlanan Hedef' : 'Completed Goals'} fill="url(#colorUv)" radius={[12, 12, 0, 0]} isAnimationActive={true} minPointSize={5} label={{ position: 'top', fill: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600, dy: -5 }} />
        <RechartsTooltip
          cursor={{ fill: 'var(--text-dim)', opacity: 0.1 }}
          contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)', padding: '12px' }}
          itemStyle={{ color: accentColor, fontWeight: 600, fontSize: '0.95rem' }}
          labelStyle={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '4px' }}
        />
      </BarChart>
    </SafeChartContainer>
  ), [analysisData.weeklyTrend, language, accentColor]);



  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 0.2 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, var(--brand-blue), #8b5cf6)', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)', marginBottom: '20px' }}
        >
          <Sparkles size={40} color="#fff" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '1px' }}
        >
          LifeTrack OS
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.4, repeat: Infinity, duration: 1.5, repeatType: 'reverse' }}
          style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '10px' }}
        >
          {t.loading}
        </motion.p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="app">
      <motion.nav
        className="sidebar"
        initial={isMobile ? { y: 0, x: 0 } : { x: -250, y: 0 }}
        animate={isMobile ? { y: isBottomNavVisible ? 0 : '100%', x: 0 } : { x: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 45 }}
        style={{
          zIndex: 1000,
          ...(isMobile ? {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            width: '100%',
            margin: 0,
            gap: 0
          } : {})
        }}
      >
        {!isMobile && (
          <div className="sidebar-header">
            <h1>LifeTrack OS</h1>
          </div>
        )}

        <button
          className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabClick('dashboard')}
          style={isMobile ? { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 0, padding: '8px 0', gap: '4px' } : {}}
        >
          <LayoutDashboard size={22} />
          <span style={isMobile ? { fontSize: '0.65rem', margin: 0 } : {}}>{t.dashboard}</span>
        </button>

        <button
          className={`sidebar-btn ${activeTab === 'focus' ? 'active' : ''}`}
          onClick={() => handleTabClick('focus')}
          style={isMobile ? { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 0, padding: '8px 0', gap: '4px' } : {}}
        >
          <Target size={22} />
          <span style={isMobile ? { fontSize: '0.65rem', margin: 0 } : {}}>{t.focus}</span>
        </button>

        <button
          className={`sidebar-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => handleTabClick('analytics')}
          style={isMobile ? { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 0, padding: '8px 0', gap: '4px' } : {}}
        >
          <BarChart3 size={22} />
          <span style={isMobile ? { fontSize: '0.65rem', margin: 0 } : {}}>{t.analytics}</span>
        </button>

        <button
          className={`sidebar-btn ${activeTab === 'mentor' ? 'active' : ''}`}
          onClick={() => handleTabClick('mentor')}
          style={isMobile ? { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 0, padding: '8px 0', gap: '4px' } : {}}
        >
          <Sparkles size={22} />
          <span style={isMobile ? { fontSize: '0.65rem', margin: 0 } : {}}>{t.mentorTab}</span>
        </button>

        {!isMobile && (
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
        )}

        <button
          className={`sidebar-btn ${!isMobile ? 'sidebar-settings-btn' : ''} ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => handleTabClick('settings')}
          style={isMobile ? { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 0, padding: '8px 0', gap: '4px' } : {}}
        >
          <Settings size={22} />
          <span style={isMobile ? { fontSize: '0.65rem', margin: 0 } : {}}>{t.settings}</span>
        </button>

        {!isMobile && <div className="sidebar-spacer"></div>}

        {!isMobile && (isActive || isTimerCompleted) && (
          <div className={`sidebar-timer ${isTimerCompleted ? 'completed' : ''}`} onClick={() => setActiveTab('focus')}>
            <div className="sidebar-timer-dot"></div>
            <span>{isTimerCompleted ? t.completed : `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}</span>
          </div>
        )}
      </motion.nav>

      <main className="main-content">
        <motion.div
          className="header-top"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: (isActive && isImmersive && activeTab === 'focus' && !isFullScreen) ? 0.1 : 1, pointerEvents: (isActive && isImmersive && activeTab === 'focus' && !isFullScreen) ? 'none' : 'auto' }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2
                  className={isPremiumUser ? 'header-title header-title-premium' : 'header-title'}
                  style={{
                    marginBottom: '2px',
                    color: isPremiumUser ? '#FF8C00' : undefined,
                    textShadow: isPremiumUser ? '0 0 20px rgba(255, 140, 0, 0.9), 0 0 30px rgba(255, 140, 0, 0.6)' : 'none',
                    fontWeight: isPremiumUser ? 'bold' : undefined,
                    WebkitTextFillColor: isPremiumUser ? '#FF8C00' : undefined,
                    background: isPremiumUser ? 'none' : undefined
                  }}
                >
                  LifeTrack OS
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
                  {t.welcome}, {displayUsername}
                  <AnimatePresence>
                    {showWave && (
                      <motion.span
                        initial={{ rotate: 0, scale: 0 }}
                        animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0], scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 2.5 }}
                        style={{ display: 'inline-block', originX: 0.7, originY: 0.7 }}
                      >
                        👋
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isMobile && (isActive || isTimerCompleted) && (
                <div className={`sidebar-timer ${isTimerCompleted ? 'completed' : ''}`} onClick={() => setActiveTab('focus')} style={{ margin: 0, padding: '6px 10px', minHeight: 'auto', fontSize: '0.85rem' }}>
                  <div className="sidebar-timer-dot" style={{ width: '6px', height: '6px' }}></div>
                  <span>{isTimerCompleted ? t.completed : `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}</span>
                </div>
              )}
              <motion.div whileHover={{ scale: 1.05 }} className="streak-badge">
                <Flame size={20} color={streak > 0 ? "#ef4444" : "#64748b"} />
                <span style={{ color: streak > 0 ? "#ef4444" : "#64748b", fontSize: '0.9rem' }}>{streak} {t.streak}</span>
              </motion.div>
              {/* Kullanıcı Profili */}
              <div className="user-profile" onClick={() => { setNewDisplayName(displayUsername !== 'Kullanıcı' ? displayUsername : ''); setIsProfileModalOpen(true); }} style={{ cursor: 'pointer' }} title={t.editProfile}>
                <span className="user-name">{displayUsername}</span>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profil" className="user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder">{displayUsername.charAt(0).toUpperCase()}</div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="app-container" style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : undefined, transition: 'padding-bottom 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)' }}>

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
                      placeholder={t.dailyFocus}
                      value={currentGoal.text}
                      onChange={(e) => handleGoalChange(e.target.value)}
                      disabled={!isEditable}
                    />
                  </div>
                </motion.div>

                <motion.div layout className="date-navigator">
                  <button className="date-btn" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(formatDate(d)); }}><ChevronLeft size={24} /> <span className="date-btn-text">{t.yesterday}</span></button>
                  <span className="date-display">{getDisplayDate(currentDate)}</span>
                  <button className="date-btn" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(formatDate(d)); }}><span className="date-btn-text">{t.tomorrow}</span> <ChevronRight size={24} /></button>
                  {!isEditable && (
                    <div style={{ marginLeft: '10px', display: 'flex', alignItems: 'center', color: 'var(--text-dim)' }} title={t.locked}>
                      <Lock size={18} />
                    </div>
                  )}
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mood-section">
                  <h3 style={{ margin: 0 }}>{t.howAreYou}</h3>
                  <div className="mood-options">
                    {[
                      { id: '😔', icon: <Frown size={28} /> },
                      { id: '😐', icon: <Meh size={28} /> },
                      { id: '😊', icon: <Smile size={28} /> },
                      { id: '🔥', icon: <Flame size={28} /> },
                      { id: '🚀', icon: <Rocket size={28} /> }
                    ].map(mood => (
                      <button
                        key={mood.id}
                        disabled={!isEditable}
                        className={`mood-btn ${moods[currentDate] === mood.id ? 'active' : ''}`}
                        onClick={() => isEditable && setMoods({ ...moods, [currentDate]: mood.id })}
                        style={{
                          color: moods[currentDate] === mood.id ? accentColor : 'var(--text-dim)',
                          filter: moods[currentDate] === mood.id ? 'none' : 'grayscale(1)'
                        }}
                      >
                        {mood.icon}
                      </button>
                    ))}
                  </div>
                </motion.div>

                <div className="grid" ref={gridRef} onScroll={handleGridScroll}>
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
                            if (offset.y < -100 && isEditable) deleteActivity(act.id);
                          }}
                          onClick={() => isEditable && setEditingActivity(act)}
                          onDragStart={(e) => {
                            if (e.dataTransfer) e.dataTransfer.setData('text/plain', index);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (!isEditable || !e.dataTransfer) return;
                            const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                            if (dragIndex === index) return;
                            const newArr = [...currentActivities];
                            const [moved] = newArr.splice(dragIndex, 1);
                            newArr.splice(index, 0, moved);
                            setHistoryData({ ...historyData, [currentDate]: newArr });
                          }}
                        >
                          {isEditable && <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteActivity(act.id); }}><X size={16} /></button>}
                          <div className="card-header">
                            <Icon name={act.iconName} size={20} style={{ color: accentColor }} />
                            <h3 style={{ color: accentColor, margin: 0, fontSize: '1.1rem' }}>{act.name}</h3>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                              <input type="number" className="value-input" value={act.value || ''} onClick={(e) => e.stopPropagation()} onChange={(e) => updateData(act.id, 'value', e.target.value)} disabled={!isEditable} />
                              <span style={{ color: 'var(--text-dim)', fontWeight: 'bold' }}>/</span>
                              <input type="number" className="goal-input" value={act.goal || ''} onClick={(e) => e.stopPropagation()} onChange={(e) => updateData(act.id, 'goal', e.target.value)} disabled={!isEditable} />
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: accentColor }}>%{Math.round(prog)}</span>
                          </div>
                          <div className="progress-container"><div className="progress-bar" style={{ width: `${prog}%`, backgroundColor: accentColor }}></div></div>
                          <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            <span>Haftalık Hedef:</span>
                            <input
                              type="number"
                              value={act.weeklyGoal || ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateData(act.id, 'weeklyGoal', e.target.value)}
                              disabled={!isEditable}
                              style={{ width: '60px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-dim)', padding: '2px 5px', textAlign: 'center' }}
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

                {isEditable && (
                  <div className="activity-builder-card">
                    <div className="activity-builder-header">
                      <div>
                        <h3>{t.newActivity}</h3>
                        <p>{t.goalBuilderDescription}</p>
                      </div>
                    </div>

                    <form className="activity-builder-form" onSubmit={addActivity}>
                      <input
                        type="text"
                        className="activity-builder-name-input"
                        placeholder={language === 'tr' ? 'Örn: Kitap Okuma, Spor...' : 'e.g. Reading, Exercise...'}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                      />
                      <div className="activity-builder-inputs-row">
                        <input
                          type="number"
                          placeholder={t.dailyGoal}
                          value={newGoal}
                          onChange={(e) => setNewGoal(e.target.value)}
                          required
                          min="1"
                        />
                        <input
                          type="number"
                          placeholder={t.weeklyGoal}
                          value={newWeeklyGoal}
                          onChange={(e) => setNewWeeklyGoal(e.target.value)}
                          min="1"
                        />
                      </div>
                      <div>
                        <p className="activity-builder-icon-label">
                          {language === 'tr' ? 'İkon Seç' : 'Choose Icon'}
                        </p>
                        <div className="icon-picker-grid">
                          {availableIcons.map((iconName) => (
                            <button
                              type="button"
                              key={iconName}
                              className={`icon-picker-btn ${newIcon === iconName ? 'active' : ''}`}
                              onClick={() => setNewIcon(iconName)}
                              title={iconName}
                            >
                              <Icon name={iconName} size={22} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <button type="submit" className="add-btn">{t.newActivity}</button>
                    </form>
                  </div>
                )}
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
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ marginRight: '10px', fontWeight: 'bold', color: 'var(--text-main)' }}>{t.duration}</label>
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
                      style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', width: '60px', textAlign: 'center', fontWeight: 'bold' }}
                      disabled={isActive}
                      min="1"
                    />
                  </div>
                  <div className="timer-display">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                  {isActive && <div style={{ fontSize: '1.2rem', color: 'var(--text-dim)', marginTop: '-10px', marginBottom: '20px', fontWeight: 500 }}>{currentGoal.text || t.dailyFocus}</div>}
                  <div className="timer-controls">
                    <button className="timer-btn" style={{ background: '#10b981' }} onClick={async () => {
                      try {
                        if (!isActive) {
                          if (timeLeft <= 0) return;

                          // Simple, robust permission check with 3s timeout
                          const checkPerm = async () => {
                            try {
                              const p = await notificationService.requestPermission();
                              return p === 'granted';
                            } catch { return false; }
                          };

                          const timeout = new Promise(r => setTimeout(() => r(true), 3000)); // Default to true on timeout for UX
                          const isAllowed = await Promise.race([checkPerm(), timeout]);

                          if (!isAllowed) {
                            alert(language === 'tr' ? 'Bildirim izni kapalı!' : 'Notification permission is off!');
                            // We continue anyway if it's just a timeout/error to not block the user
                          }

                          setIsImmersive(true);
                          const end = Date.now() + timeLeft * 1000;
                          setTargetTimestamp(end);
                          localStorage.setItem('pomodoroTargetTime', end.toString());

                          notificationService.scheduleFuture('LifeTrack ⏱',
                            language === 'tr' ? 'Süre Doldu! 🏁' : 'Time is up! 🏁',
                            new Date(end));
                        } else {
                          setTargetTimestamp(null);
                          localStorage.removeItem('pomodoroTargetTime');
                          notificationService.cancelAll().catch(() => { });
                        }
                        setIsActive(!isActive);
                      } catch (err) {
                        setIsActive(!isActive);
                      }
                    }}>{isActive ? t.stop : t.start}</button>
                    <button className="timer-btn" style={{ background: '#ef4444' }} onClick={() => {
                      setIsActive(false);
                      setTargetTimestamp(null);
                      localStorage.removeItem('pomodoroTargetTime');
                      notificationService.cancelAll();
                      setTimeLeft((parseInt(pomodoroDuration) || 25) * 60);
                      setIsTimerCompleted(false);
                    }}>{t.reset}</button>
                  </div>

                  {/* Arka Plan Ses Seçici */}
                  <div className="ambient-sound-selector" style={{ position: 'relative', zIndex: 10, marginTop: '30px', textAlign: 'center' }}>
                    <label style={{ color: 'var(--text-dim)', fontSize: '0.95rem', display: 'block', marginBottom: '15px', fontWeight: 600 }}>
                      <Music size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                      {t.ambientSound}
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 10 }}>
                      {[
                        { value: 'none', label: t.none, icon: <VolumeX size={22} pointerEvents="none" /> },
                        { value: 'natureRain', label: t.natureRain, icon: <CloudRain size={22} pointerEvents="none" />, premium: true },
                        { value: 'cafe', label: t.cafe, icon: <Coffee size={22} pointerEvents="none" />, premium: true },
                        { value: 'fireplace', label: t.fireplace, icon: <Flame size={22} pointerEvents="none" />, premium: true },
                        { value: 'lofi', label: t.lofi, icon: <Music size={22} pointerEvents="none" />, premium: true }
                      ].map((sound) => {
                        const isLocked = !!sound.premium && !isPremiumUser;
                        const isCurrent = ambientSound === sound.value;
                        return (
                          <div key={sound.value} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', position: 'relative', zIndex: 10 }}>
                            <button
                              type="button"
                              className={`ambient-sound-btn ${isCurrent ? 'active ambient-pulse' : ''} ${isLocked ? 'locked' : ''}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (isLocked) { openPremiumModal(); return; }
                                handleAmbientSound(sound.value);
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '56px', height: '56px', padding: 0,
                                position: 'relative', overflow: 'hidden', borderRadius: '50%',
                                border: isCurrent ? `2px solid ${accentColor}` : '2px solid var(--border-color)',
                                background: isCurrent ? `${accentColor}20` : 'var(--card-bg)',
                                cursor: 'pointer', transition: 'all 0.25s ease',
                                boxShadow: isCurrent ? `0 0 12px ${accentColor}55` : 'none',
                                zIndex: 20
                              }}
                            >
                              <span style={{ pointerEvents: 'none', color: isCurrent ? accentColor : 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isLocked ? 0.25 : 1 }}>{sound.icon}</span>
                              {isLocked && (
                                <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)', borderRadius: '50%' }}>
                                  <Lock size={16} color="#fbbf24" style={{ pointerEvents: 'none' }} />
                                </div>
                              )}
                            </button>
                            <span style={{ pointerEvents: 'none', fontSize: '0.65rem', color: isCurrent ? accentColor : 'var(--text-dim)', fontWeight: isCurrent ? 600 : 400, maxWidth: '56px', textAlign: 'center', lineHeight: 1.2 }}>{sound.label}</span>
                          </div>

                        );
                      })}
                    </div>

                    {/* Ses Seviyesi Kaydırıcı – sadece ses seçili iken */}
                    {ambientSound !== 'none' && (
                      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <VolumeX size={14} color="var(--text-dim)" />
                        <input
                          type="range"
                          min={0} max={1} step={0.05}
                          value={ambientVolume}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setAmbientVolume(v);
                            ambientPlayer.setVolume(v);
                          }}
                          style={{
                            width: '140px', accentColor,
                            cursor: 'pointer', height: '4px',
                          }}
                        />
                        <Music size={14} color={accentColor} />
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* To-Do Listesi */}
                {!isFullScreen && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="todo-card"
                  >
                    <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={20} color="var(--brand-blue)" /> {t.dailyTasks}</h3>

                    <form onSubmit={addTodo} className="todo-form">
                      <input
                        type="text"
                        placeholder={t.newTask}
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                      />
                      <button type="submit" className="todo-submit-btn" disabled={!newTodo.trim()} title="Görev Ekle"><Plus size={24} /></button>
                    </form>

                    <div className="todo-list">
                      <AnimatePresence mode='popLayout'>
                        {todos.map((todo, index) => (
                          <motion.div
                            key={todo.id}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -50, scale: 0.9, transition: { duration: 0.2 } }}
                            className={`todo-item ${todo.completed ? 'completed' : ''}`}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.5}
                            onDragEnd={(e, { offset }) => {
                              if (Math.abs(offset.x) > 100) deleteTodo(todo.id);
                            }}
                            draggable
                            onDragStart={(e) => {
                              if (e.dataTransfer) e.dataTransfer.setData('todoIndex', index);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (!e.dataTransfer) return;
                              const dragIndex = Number(e.dataTransfer.getData('todoIndex'));
                              if (isNaN(dragIndex) || dragIndex === index) return;
                              const newTodos = [...todos];
                              const [moved] = newTodos.splice(dragIndex, 1);
                              newTodos.splice(index, 0, moved);
                              setTodos(newTodos);
                            }}
                          >
                            <div className="todo-content" onClick={() => toggleTodo(todo.id)}>
                              <div className="custom-checkbox">
                                <AnimatePresence>
                                  {todo.completed && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                      <Check size={16} color="white" strokeWidth={3} />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                              <span>{todo.text}</span>
                            </div>
                            <button onClick={() => deleteTodo(todo.id)} className="todo-delete" title="Sil"><Trash2 size={18} /></button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {todos.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '30px 10px' }}
                        >
                          <ListTodo size={48} style={{ opacity: 0.2, marginBottom: '15px' }} />
                          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>{t.noTasks}</p>
                          <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
                            {language === 'tr' ? 'Günün ilk hedefini ekleyerek başla!' : 'Start by adding your first goal for today!'}
                          </p>
                        </motion.div>
                      )}
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
                {isPremiumUser ? (
                  <div className="premium-report-card" ref={reportCardRef} style={{ marginBottom: '20px', padding: '20px', borderRadius: '16px', background: 'linear-gradient(145deg, rgba(251, 191, 36, 0.14) 0%, rgba(249, 115, 22, 0.08) 42%, rgba(30, 41, 59, 0.18) 100%)', border: '1px solid rgba(251, 191, 36, 0.42)', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(251, 191, 36, 0.22)' }}>
                    <div className="insight-card-header" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#fbbf24', fontSize: '1.1rem' }}><Crown size={20} color="#fbbf24" /> {t.monthlyReport}</h3>
                    </div>

                    <div style={{ height: 300, marginBottom: '16px' }}>
                      {memoizedWeeklyBarChart}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '12px', borderTop: '1px solid rgba(251, 191, 36, 0.2)' }}>
                      <div style={{ padding: '12px', borderRadius: '16px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.26)' }}>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)', margin: '0 0 6px 0' }}><Calendar size={14} color="#fbbf24" />{language === 'tr' ? 'En İyi Gün' : 'Best Day'}</p>
                        <p style={{ fontSize: '0.95rem', color: '#fbbf24', margin: 0, fontWeight: '600' }}>{analysisData.bestDay || '—'}</p>
                      </div>
                      <div style={{ padding: '12px', borderRadius: '16px', background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.22)' }}>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)', margin: '0 0 6px 0' }}><Flame size={14} color="#fb923c" />{language === 'tr' ? 'Seri' : 'Streak'}</p>
                        <p style={{ fontSize: '0.95rem', color: '#fb923c', margin: 0, fontWeight: '600' }}>{analysisData.maxStreak} {t.streak}</p>
                      </div>
                      <div style={{ gridColumn: '1 / -1', padding: '12px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.22)' }}>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)', margin: '0 0 6px 0' }}><Activity size={14} color={accentColor} />{language === 'tr' ? 'Özet' : 'Summary'}</p>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', margin: 0, fontWeight: '600' }}>
                          {language === 'tr'
                            ? `Bu hafta ${analysisData.thisWeekHours} saat odaklandın ve son 3 günde ortalama %${Math.round((analysisData.weeklyTrend.slice(-3).reduce((sum, d) => sum + (d.score || 0), 0) / Math.max(analysisData.weeklyTrend.slice(-3).length, 1)))} aktiflik yakaladın.`
                            : `You focused ${analysisData.thisWeekHours} hours this week with an average ${Math.round((analysisData.weeklyTrend.slice(-3).reduce((sum, d) => sum + (d.score || 0), 0) / Math.max(analysisData.weeklyTrend.slice(-3).length, 1)))}% activity in the last 3 days.`}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  renderPremiumSpotlight(t.monthlyReport, t.proLockedMessage)
                )}

                <div className="chart-card" style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem' }}>{t.threeDayReport}</h3>
                  <div style={{ width: '100%', height: 300 }}>
                    {memoizedBarChart}
                  </div>
                </div>

                <div className="stat-card-grid">
                  {/* Rekor Seri Kartı */}
                  <motion.div className="stat-card" whileHover={{ y: -5, boxShadow: '0 10px 25px -5px #f59e0b66', borderColor: '#f59e0b' }} transition={{ duration: 0.2 }}>
                    <h4 style={{ color: '#f59e0b', margin: '0 0 5px 0' }}>{t.recordStreak}</h4>
                    <div className="stat-card-change" style={{ color: '#f59e0b' }}>
                      <Trophy size={24} />
                      {analysisData.maxStreak} {t.streak}
                    </div>
                    <p className="stat-card-note">{t.longestChain}</p>
                  </motion.div>

                  {analysisData.comparisonData.map(item => (
                    <motion.div key={item.name} className="stat-card" whileHover={{ y: -5, boxShadow: `0 10px 25px -5px ${item.color}66`, borderColor: item.color }} transition={{ duration: 0.2 }}>
                      <h4 style={{ color: item.color, margin: '0 0 5px 0' }}>{item.name}</h4>
                      <div className="stat-card-change" style={{ color: item.change > 0 ? '#10b981' : item.change < 0 ? '#ef4444' : 'var(--text-dim)' }}>
                        {item.change > 0 ? <ArrowUp size={24} /> : item.change < 0 ? <ArrowDown size={24} /> : null}
                        {Math.abs(item.change)}%
                      </div>
                      <p className="stat-card-note">{t.vsLastWeek}</p>
                      {/* Mini Trend Chart */}
                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
                        <MiniTrendChart data={item.trend} color={item.color} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'mentor' && (
              <motion.div
                key="mentor"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                {isPremiumUser ? (
                  <Suspense fallback={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 420, color: 'var(--text-dim)' }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                        <Loader size={28} color={accentColor} />
                      </motion.div>
                    </div>
                  }>
                    <AIMentorChat
                      user={user}
                      historyData={historyData}
                      language={language}
                      accentColor={accentColor}
                    />
                  </Suspense>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div style={{ filter: 'blur(5px)', opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }}>
                      <div className="ai-mentor-card" style={{
                        borderRadius: '16px',
                        background: `linear-gradient(135deg, rgba(${accentColor === '#3b82f6' ? '59, 130, 246' : accentColor === '#8b5cf6' ? '139, 92, 246' : '59, 130, 246'}, 0.05) 0%, rgba(${accentColor === '#3b82f6' ? '59, 130, 246' : accentColor === '#8b5cf6' ? '139, 92, 246' : '59, 130, 246'}, 0.02) 100%)`,
                        border: `2px solid ${accentColor}33`,
                        padding: '20px',
                        minHeight: '380px'
                      }}>
                        <div className="ai-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                          <Sparkles size={24} color={accentColor} />
                          <div>
                            <h3 style={{ margin: 0, color: accentColor, fontSize: '1.2rem' }}>{t.aiMentor}</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                              {language === 'tr' ? 'Haftalık analizin ve odak önerilerin' : 'Weekly analysis and focus recommendations'}
                            </p>
                          </div>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '16px', marginBottom: '15px' }}>
                          <div style={{ height: '14px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', width: '80%', marginBottom: '12px' }} />
                          <div style={{ height: '14px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', width: '95%', marginBottom: '12px' }} />
                          <div style={{ height: '14px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', width: '60%' }} />
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ height: '14px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', width: '90%', marginBottom: '12px' }} />
                          <div style={{ height: '14px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', width: '70%', marginBottom: '12px' }} />
                          <div style={{ height: '14px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', width: '85%' }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', zIndex: 10 }}>
                      {renderPremiumSpotlight(t.aiMentor, t.premiumSubtitle, true)}
                    </div>
                  </div>
                )}
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
                      {theme === 'dark' ? <Sun size={24} color="#f59e0b" /> : <Moon size={24} color="#3b82f6" />}
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
                      {notifications ? <Bell size={24} color="#10b981" /> : <BellOff size={24} color="#ef4444" />}
                      <span>{t.notifications}</span>
                    </button>
                    <button onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')} className="settings-btn">
                      <Languages size={24} color="#f59e0b" />
                      <span>{t.language}: {language.toUpperCase()}</span>
                    </button>
                    <button onClick={() => setIsPasswordModalOpen(true)} className="settings-btn">
                      <Lock size={24} color="#8b5cf6" />
                      <span>{t.changePassword}</span>
                    </button>
                    <button onClick={() => { if (window.confirm(t.confirmLogout)) signOut(auth); }} className="settings-btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                      <LogOut size={24} />
                      <span>{t.logout}</span>
                    </button>
                  </div>

                  <div style={{ marginTop: '30px' }}>
                    <h3 className="stats-title">{t.colorTheme}</h3>
                    <div className="accent-color-grid">
                      {accentColors.map(c => {
                        const isLockedColor = c.value === '#f59e0b' && !isPremiumUser;
                        return (
                          <button
                            key={c.value}
                            className={`accent-color-btn ${accentColor === c.value ? 'active' : ''} ${c.value === '#f59e0b' ? 'accent-color-btn-premium' : ''}`}
                            style={{ backgroundColor: c.value, position: 'relative', overflow: 'hidden' }}
                            onClick={() => {
                              if (isLockedColor) {
                                openPremiumModal();
                                return;
                              }
                              setAccentColor(c.value);
                            }}
                            title={c.label}
                          >
                            {isLockedColor && (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(2px)' }}>
                                <Lock size={16} color="#fff" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="delete-account-container">
                    <button
                      onClick={handleDeleteAccount}
                      className="delete-account-btn"
                    >
                      <Trash2 size={20} />
                      <span>{t.deleteAccount}</span>
                    </button>
                    <p className="delete-account-note">
                      {t.confirmDeleteAccount}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profil Düzenleme Modalı */}
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
                  <button className="modal-close" onClick={() => setIsProfileModalOpen(false)}><X size={24} /></button>
                  <h2 style={{ marginTop: 0, marginBottom: '5px' }}>{t.editProfile}</h2>

                  <form onSubmit={handleUpdateProfile} className="edit-form">
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
                      <label style={{ alignSelf: 'flex-start' }}>{t.chooseAvatar}</label>
                      <div
                        style={{
                          width: '90px',
                          height: '90px',
                          borderRadius: '50%',
                          border: '3px solid var(--brand-blue)',
                          backgroundImage: `url(${selectedAvatar || user?.photoURL || avatarOptionsList[0]})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          marginBottom: '15px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                        }}
                      />
                      <div className="avatar-grid" style={{ justifyContent: 'center', gap: '8px' }}>
                        {avatarOptions.map((avatar, i) => (
                          <motion.button
                            type="button"
                            key={i}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                            onClick={() => setSelectedAvatar(avatar)}
                            style={{
                              width: '45px',
                              height: '45px',
                              borderRadius: '50%',
                              border: selectedAvatar === avatar ? '2px solid var(--brand-blue)' : '2px solid transparent',
                              padding: 0,
                              cursor: 'pointer',
                              backgroundImage: `url(${avatar})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              opacity: selectedAvatar === avatar ? 1 : 0.5,
                              transition: 'all 0.2s ease'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '5px' }}>
                      <label>{t.username}</label>
                      <input type="text" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} placeholder={t.username} />
                    </div>
                    <button type="submit" className="add-btn" style={{ width: '100%', marginTop: '5px' }}>{t.save}</button>
                  </form>

                  {/* Profil İstatistikleri Bölümü */}
                  <div style={{
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    <h4 style={{
                      margin: '0 0 15px 0',
                      fontSize: '0.95rem',
                      color: 'var(--text-main)',
                      fontWeight: '600'
                    }}>
                      {language === 'tr' ? 'İstatistiklerin' : 'Your Statistics'}
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* Üye Olunan Tarih */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--input-bg)', padding: '12px', borderRadius: '12px' }}>
                        <div style={{ color: '#f59e0b', display: 'flex' }}>
                          <Calendar size={18} />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>{language === 'tr' ? 'Katılım' : 'Joined'}</p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{systemStats.memberSince}</p>
                        </div>
                      </div>

                      {/* Toplam Odaklanılan Saat */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--input-bg)', padding: '12px', borderRadius: '12px' }}>
                        <div style={{ color: '#3b82f6', display: 'flex' }}>
                          <Clock size={18} />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>{language === 'tr' ? 'Odaklanma' : 'Focus Time'}</p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{systemStats.totalHours} {language === 'tr' ? 'Saat' : 'Hours'}</p>
                        </div>
                      </div>

                      {/* En Verimli Gün */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--input-bg)', padding: '12px', borderRadius: '12px' }}>
                        <div style={{ color: '#10b981', display: 'flex' }}>
                          <TrendingUp size={18} />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>{language === 'tr' ? 'En Verimli' : 'Best Day'}</p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 'bold', textTransform: 'capitalize', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{analysisData.bestDay || '-'}</p>
                        </div>
                      </div>

                      {/* Toplam Tamamlanan Hedef */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--input-bg)', padding: '12px', borderRadius: '12px' }}>
                        <div style={{ color: '#8b5cf6', display: 'flex' }}>
                          <CheckCircle size={18} />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>{language === 'tr' ? 'Tamamlanan' : 'Completed'}</p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{systemStats.totalCompletedGoals} {language === 'tr' ? 'Hedef' : 'Goals'}</p>
                        </div>
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
                  <button className="modal-close" onClick={() => setEditingActivity(null)}><X size={24} /></button>
                  <h2 style={{ marginTop: 0, marginBottom: '20px' }}>{t.editActivity}</h2>

                  <form onSubmit={handleSaveActivity} className="edit-form">
                    <div className="form-group">
                      <label>{t.activityName}</label>
                      <input type="text" value={editingActivity.name} onChange={(e) => setEditingActivity({ ...editingActivity, name: e.target.value })} required />
                    </div>
                    <div className="edit-goal-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>{t.dailyGoal}</label>
                        <input type="number" value={editingActivity.goal} onChange={(e) => setEditingActivity({ ...editingActivity, goal: parseFloat(e.target.value) })} required />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>{t.weeklyGoal}</label>
                        <input type="number" value={editingActivity.weeklyGoal} onChange={(e) => setEditingActivity({ ...editingActivity, weeklyGoal: parseFloat(e.target.value) })} />
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
                            onClick={() => setEditingActivity({ ...editingActivity, iconName: iconName })}
                          >
                            <Icon name={iconName} size={24} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>{t.colorTheme}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input type="color" value={editingActivity.color} onChange={(e) => setEditingActivity({ ...editingActivity, color: e.target.value })} className="color-picker" />
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{editingActivity.color}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => { deleteActivity(editingActivity.id); setEditingActivity(null); }}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={20} />
                      </button>
                      <button type="submit" className="add-btn" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '10px' }}><Check size={20} /> {t.save}</button>
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
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="settings-btn" style={{ minHeight: 'auto', padding: '10px' }} onClick={() => setIsScratchpadPreview(!isScratchpadPreview)}>
                      {isScratchpadPreview ? <><Edit size={20} /> {t.edit}</> : <><Eye size={20} /> {t.preview}</>}
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
                  <button className="modal-close" onClick={() => setIsPasswordModalOpen(false)}><X size={24} /></button>
                  <h2 style={{ marginTop: 0, marginBottom: '20px' }}>{t.changePassword}</h2>

                  {isGoogleProvider ? (
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
                      <button type="submit" className="add-btn" style={{ width: '100%', marginTop: '10px' }}>{t.save}</button>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Premium Modal */}
          <AnimatePresence>
            {isPremiumModalOpen && (
              <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPremiumModalOpen(false)}
              >
                <motion.div
                  className="modal-content premium-modal"
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: '500px' }}
                >
                  <button className="modal-close" onClick={() => setIsPremiumModalOpen(false)}><X size={24} /></button>

                  {/* Premium Error Alert */}
                  {premiumError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="premium-alert"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginBottom: '20px',
                        color: '#ef4444',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <AlertCircle size={20} />
                      {premiumError}
                    </motion.div>
                  )}

                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      <Crown size={28} style={{ color: '#FF8C00' }} />
                      <h2 style={{
                        margin: 0,
                        fontSize: '1.8rem',
                        background: 'linear-gradient(135deg, #FF8C00, #f59e0b)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 700
                      }}>
                        LifeTrack PRO
                      </h2>
                    </div>
                    <p style={{
                      margin: '8px 0 0 0',
                      color: 'var(--text-dim)',
                      fontSize: '0.95rem',
                      lineHeight: 1.6
                    }}>
                      Yeteneğini açığa çıkar ve başarını maksimize et.
                    </p>
                  </div>

                  {/* Features */}
                  <div style={{
                    background: 'rgba(255, 140, 0, 0.05)',
                    border: '1px solid rgba(255, 140, 0, 0.15)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <h3 style={{
                      margin: '0 0 16px 0',
                      color: '#FF8C00',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      PRO Özellikleri
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        'Haftalık Detaylı Analiz Raporu',
                        'Arka Plan LoFi ve Doğa Sesleri',
                        'AI Mentor Koçluğu',
                        'Sınırsız PDF Dışa Aktarma',
                        'Özel Raporlar ve İçgörüler'
                      ].map((feature, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.15), rgba(255, 140, 0, 0.08))',
                    border: '2px solid rgba(255, 140, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '28px 20px',
                    marginBottom: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '12px', fontWeight: 500 }}>
                      Aylık Abonelik
                    </div>
                    <div style={{
                      fontSize: '2.8rem',
                      fontWeight: 700,
                      color: '#FF8C00',
                      marginBottom: '6px',
                      letterSpacing: '-1px'
                    }}>
                      ₺49.99
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '16px' }}>
                      / ay
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <motion.button
                    onClick={handlePremiumCtaClick}
                    disabled={activePurchaseId || isPremiumCtaLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      background: 'linear-gradient(135deg, #FF8C00, #f59e0b)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: activePurchaseId || isPremiumCtaLoading ? 'not-allowed' : 'pointer',
                      opacity: activePurchaseId || isPremiumCtaLoading ? 0.7 : 1,
                      marginBottom: '12px',
                      boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    className="premium-upgrade-btn"
                  >
                    {isPremiumCtaLoading ? '⏳ İşleniyor...' : 'Hemen Yükselt'}
                  </motion.button>

                  <motion.button
                    onClick={() => setIsPremiumModalOpen(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      background: 'transparent',
                      color: 'var(--text-main)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Şimdi Değil
                  </motion.button>

                  {/* Cancel Info & Legal Links */}
                  <div className="legal-links-footer">
                    <button
                      className="legal-link"
                      onClick={() => window.open('https://omerislamoglu.github.io/lifetrack-docs/privacy-policy.html', '_blank')}
                    >
                      {language === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}
                    </button>
                    <span className="legal-separator">•</span>
                    <button
                      className="legal-link"
                      onClick={() => window.open('https://omerislamoglu.github.io/lifetrack-docs/terms-of-use.html', '_blank')}
                    >
                      {language === 'tr' ? 'Kullanım Koşulları (EULA)' : 'Terms of Use (EULA)'}
                    </button>
                  </div>
                  <p style={{
                    textAlign: 'center',
                    color: 'var(--text-dim)',
                    fontSize: '0.75rem',
                    marginTop: '12px',
                    marginBottom: 0,
                    opacity: 0.8
                  }}>
                    {language === 'tr'
                      ? 'Aboneliğinizi istediğiniz zaman App Store üzerinden yönetebilir veya iptal edebilirsiniz.'
                      : 'You can manage or cancel your subscription anytime via the App Store.'}
                  </p>
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
                animate={{
                  opacity: 1,
                  scale: 1,
                  bottom: 110
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  zIndex: 50,
                  position: 'fixed'
                }}
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
