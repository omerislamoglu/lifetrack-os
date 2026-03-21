// Widget Service - iOS Home Screen Widgets
// Koduyla entegre widget data hazırla

import { Capacitor } from '@capacitor/core';

// Tarih formatlama
const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Widget türleri
export const WIDGET_TYPES = {
  STREAK: 'streak',
  DAILY_PROGRESS: 'dailyProgress',
  FOCUS_TIME: 'focusTime',
  WEEKLY_STATS: 'weeklyStats'
};

// Streak widget için veri hazırla
export const prepareStreakWidgetData = (historyData) => {
  if (!historyData) return { streak: 0, lastUpdate: new Date().toISOString() };

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
    dayData.forEach(act => {
      dayTotal += Math.min((act.value / (act.goal || 1)) * 100, 100);
    });
    
    if ((dayTotal / dayData.length) >= 50) {
      streak++;
    } else {
      break;
    }
  }

  return {
    streak,
    lastUpdate: new Date().toISOString(),
    widgetType: WIDGET_TYPES.STREAK
  };
};

// Günlük ilerleme widget'ı
export const prepareDailyProgressWidget = (historyData, currentDate) => {
  const dayData = historyData[currentDate] || [];
  
  let totalProgress = 0;
  let activitiesCount = 0;

  dayData.forEach(act => {
    const progress = Math.min((act.value / (act.goal || 1)) * 100, 100);
    totalProgress += progress;
    activitiesCount++;
  });

  const overallProgress = activitiesCount > 0 ? Math.round(totalProgress / activitiesCount) : 0;

  return {
    date: currentDate,
    progress: overallProgress,
    activitiesCompleted: dayData.filter(act => (act.value / act.goal) >= 1).length,
    totalActivities: activitiesCount,
    lastUpdate: new Date().toISOString(),
    widgetType: WIDGET_TYPES.DAILY_PROGRESS
  };
};

// Odaklanma süresi widget'ı
export const prepareFocusTimeWidget = (timeLeft, pomodoroDuration, isActive) => {
  const totalMinutes = parseInt(pomodoroDuration) || 25;
  const progressPercent = Math.round(((totalMinutes * 60 - timeLeft) / (totalMinutes * 60)) * 100);

  return {
    remainingTime: `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`,
    totalTime: `${totalMinutes}`,
    progress: progressPercent,
    isActive,
    lastUpdate: new Date().toISOString(),
    widgetType: WIDGET_TYPES.FOCUS_TIME
  };
};

export const prepareWidgetMood = (moods, currentDate) => ({
  mood: moods?.[currentDate] || '🙂',
  date: currentDate,
  lastUpdate: new Date().toISOString()
});

export const prepareWidgetTodos = (todos) => {
  const openTodos = Array.isArray(todos)
    ? todos
      .filter(todo => todo && typeof todo.text === 'string' && !todo.completed)
      .slice(0, 2)
      .map(todo => todo.text.trim())
      .filter(Boolean)
    : [];

  return {
    items: openTodos,
    lastUpdate: new Date().toISOString()
  };
};

export const prepareWeeklyTrendWidget = (analysisData) => {
  const points = Array.isArray(analysisData?.weeklyTrend)
    ? analysisData.weeklyTrend.slice(-7).map((point, index) => ({
      label: point?.day || `G${index + 1}`,
      score: Math.max(0, Math.min(100, Math.round(point?.score || 0)))
    }))
    : [];

  return {
    points,
    lastUpdate: new Date().toISOString()
  };
};

// Haftalık istatistikler widget'ı
export const prepareWeeklyStatsWidget = (analysisData) => {
  if (!analysisData) {
    return {
      thisWeekHours: 0,
      streak: 0,
      bestDay: '-',
      efficiency: 0,
      lastUpdate: new Date().toISOString(),
      widgetType: WIDGET_TYPES.WEEKLY_STATS
    };
  }

  return {
    thisWeekHours: analysisData.thisWeekHours || 0,
    streak: analysisData.maxStreak || 0,
    bestDay: analysisData.bestDay || '-',
    efficiency: analysisData.chartData?.[0]?.Skor || 0,
    lastUpdate: new Date().toISOString(),
    widgetType: WIDGET_TYPES.WEEKLY_STATS
  };
};

// Widget verilerini UserDefaults (App Groups) ve localStorage'a kaydet
export const saveWidgetData = (widgetType, data) => {
  try {
    // Tüm veriyi JSON olarak localStorage'a kaydet
    const widgetKey = `lifetrack_widget_${widgetType}`;
    localStorage.setItem(widgetKey, JSON.stringify({
      ...data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Widget data save error:', error);
  }
};

// Tüm widget verilerini güncelle
export const updateAllWidgets = async ({
  historyData,
  currentDate,
  analysisData,
  timeLeft,
  pomodoroDuration,
  isActive,
  moods,
  todos,
  accentColor
}) => {
  try {
    const streakData = prepareStreakWidgetData(historyData);
    const dailyData = prepareDailyProgressWidget(historyData, currentDate);
    const focusData = prepareFocusTimeWidget(timeLeft, pomodoroDuration, isActive);
    const weeklyData = prepareWeeklyStatsWidget(analysisData);
    const moodData = prepareWidgetMood(moods, currentDate);
    const todoData = prepareWidgetTodos(todos);
    const weeklyTrendData = prepareWeeklyTrendWidget(analysisData);

    // Tüm veriyi tek bir object'te birleştir
    const combinedData = {
      widget_streak: streakData.streak,
      widget_daily_progress: dailyData.progress,
      widget_focus_time: focusData.remainingTime,
      widget_weekly_hours: weeklyData.thisWeekHours,
      widget_mood: moodData.mood,
      widget_todos_json: JSON.stringify(todoData.items),
      widget_weekly_trend_json: JSON.stringify(weeklyTrendData.points),
      widget_accent_color: accentColor || '#f97316',
      lastUpdate: new Date().toISOString()
    };

    // localStorage'a kaydet (web storage)
    try {
      localStorage.setItem('lifetrack_widget_data', JSON.stringify(combinedData));
      
      // Individual keys for fallback
      localStorage.setItem('widget_streak', combinedData.widget_streak.toString());
      localStorage.setItem('widget_daily_progress', combinedData.widget_daily_progress.toString());
      localStorage.setItem('widget_focus_time', combinedData.widget_focus_time);
      localStorage.setItem('widget_weekly_hours', combinedData.widget_weekly_hours.toString());
      localStorage.setItem('widget_mood', combinedData.widget_mood);
      localStorage.setItem('widget_todos_json', combinedData.widget_todos_json);
      localStorage.setItem('widget_weekly_trend_json', combinedData.widget_weekly_trend_json);
      localStorage.setItem('widget_accent_color', combinedData.widget_accent_color);
    } catch (error) {
      console.error('Widget localStorage save error:', error);
    }

    // iOS widget'a gönder (Capacitor bridge üzerinden UserDefaults'a)
    if (Capacitor.isNativePlatform() && window?.Capacitor?.Plugins?.WidgetDataPlugin) {
      try {
        // Capacitor 5.x plugin kullan
        await window.Capacitor.Plugins.WidgetDataPlugin.saveWidgetDataToUserDefaults(combinedData);
      } catch (error) {
        console.log('WidgetDataPlugin call failed, trying alternative method:', error);
        
        // Fallback: Preferences plugin kullan
        try {
          const { Preferences } = window.Capacitor.Plugins;
          if (Preferences) {
            await Preferences.set({
              key: 'widget_streak',
              value: combinedData.widget_streak.toString()
            });
            await Preferences.set({
              key: 'widget_daily_progress',
              value: combinedData.widget_daily_progress.toString()
            });
            await Preferences.set({
              key: 'widget_focus_time',
              value: combinedData.widget_focus_time
            });
            await Preferences.set({
              key: 'widget_weekly_hours',
              value: combinedData.widget_weekly_hours.toString()
            });
            await Preferences.set({
              key: 'widget_mood',
              value: combinedData.widget_mood
            });
            await Preferences.set({
              key: 'widget_todos_json',
              value: combinedData.widget_todos_json
            });
            await Preferences.set({
              key: 'widget_weekly_trend_json',
              value: combinedData.widget_weekly_trend_json
            });
            await Preferences.set({
              key: 'widget_accent_color',
              value: combinedData.widget_accent_color
            });
          }
        } catch (prefError) {
          console.log('Preferences fallback also failed:', prefError);
        }
      }
    }
  } catch (error) {
    console.error('updateAllWidgets error:', error);
  }
};

const widgetServiceExport = {
  prepareStreakWidgetData,
  prepareDailyProgressWidget,
  prepareFocusTimeWidget,
  prepareWeeklyStatsWidget,
  prepareWidgetMood,
  prepareWidgetTodos,
  prepareWeeklyTrendWidget,
  saveWidgetData,
  updateAllWidgets
};

export default widgetServiceExport;
