import { registerPlugin } from '@capacitor/core';

export interface WidgetDataPlugin {
  saveWidgetDataToUserDefaults(options: {
    widget_streak: number;
    widget_daily_progress: number;
    widget_focus_time: string;
    widget_weekly_hours: number;
    widget_mood: string;
    widget_todos_json: string;
    widget_weekly_trend_json: string;
    widget_accent_color: string;
  }): Promise<void>;
  
  getWidgetData(): Promise<{
    widget_streak: number;
    widget_daily_progress: number;
    widget_focus_time: string;
    widget_weekly_hours: number;
    widget_mood: string;
    widget_todos_json: string;
    widget_weekly_trend_json: string;
    widget_accent_color: string;
  }>;
}

const WidgetDataPlugin = registerPlugin<WidgetDataPlugin>('WidgetDataPlugin', {
  web: () => import('./web').then(m => new m.WidgetDataPluginWeb()),
});

export * from './definitions';
export { WidgetDataPlugin };
