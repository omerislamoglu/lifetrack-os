/**
 * notificationService.js
 * Unified notification service for LifeTrack with static imports for stability.
 */
import { LocalNotifications } from '@capacitor/local-notifications';

const isNative = () =>
  typeof window !== 'undefined' &&
  window.Capacitor?.isNativePlatform?.();

let _notifId = 1000;

const notificationService = {
  _channelsInitialized: false,

  /**
   * Initialize notification channels.
   */
  async initChannels() {
    if (this._channelsInitialized || !isNative()) return;
    try {
      // Channels are entirely Android-only. Skip on iOS/Web to avoid UNIMPLEMENTED error.
      if (window.Capacitor?.getPlatform() !== 'android') {
        this._channelsInitialized = true;
        return;
      }

      await LocalNotifications.createChannel({
        id: 'pomodoro-finished',
        name: 'Pomodoro Completion',
        description: 'Notifications for completed Pomodoro sessions',
        importance: 5,
        visibility: 1,
        vibration: true,
      });
      this._channelsInitialized = true;
    } catch (e) {
      console.warn('[notificationService] initChannels error:', e);
      this._channelsInitialized = true;
    }
  },

  /**
   * Request notification permission.
   */
  async requestPermission() {
    try {
      if (isNative()) {
        const { display: currentStatus } = await LocalNotifications.checkPermissions();
        if (currentStatus === 'granted') return 'granted';
        const result = await LocalNotifications.requestPermissions({
          permissions: ['display', 'alert', 'sound', 'badge', 'vibration']
        });
        return result.display || 'granted';
      } else {
        if (!('Notification' in window)) return 'unsupported';
        if (Notification.permission === 'granted') return 'granted';
        return await Notification.requestPermission();
      }
    } catch (e) {
      console.error('[notificationService] requestPermission error:', e);
      return 'error';
    }
  },

  /**
   * Schedule an immediate local notification.
   */
  async scheduleNow(title, body) {
    try {
      if (isNative()) {
        await this.initChannels();
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Date.now() / 1000) % 2147483647,
              title: title || 'Pomodoro sayacı bitti!',
              body: body || 'Harika bir iş çıkardın, şimdi mola zamanı! 🔔',
              channelId: 'pomodoro-finished',
              sound: 'chime.mp3',
              vibration: true,
              schedule: { at: new Date(Date.now() + 500) },
              ios: {
                sound: 'chime_short.mp3'
              }
            },
          ],
        });
      } else {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        new Notification(title || 'Pomodoro bitti!', { body: body || 'Mola vakti!' });
      }
    } catch (e) {
      console.error('[notificationService] scheduleNow error:', e);
    }
  },

  /**
   * Schedule a notification for a specific future date/time.
   */
  async scheduleFuture(title, body, date, id = undefined) {
    try {
      if (isNative()) {
        await this.initChannels();
        const scheduleDate = date.getTime() > Date.now() ? date : new Date(Date.now() + 1000);

        await LocalNotifications.schedule({
          notifications: [
            {
              id: id || (Math.floor(Date.now() / 1000) % 2147483647),
              title: 'Pomodoro sayacı bitti!',
              body: 'Harika bir iş çıkardın, şimdi mola zamanı! 🔔',
              channelId: 'pomodoro-finished',
              sound: 'chime.mp3',
              vibration: true,
              schedule: { at: scheduleDate, allowWhileIdle: true },
              ios: {
                sound: 'chime_short.mp3'
              }
            },
          ],
        });
      }
    } catch (e) {
      console.error('[notificationService] scheduleFuture error:', e);
    }
  },

  /**
   * Cancel all pending local notifications.
   */
  async cancelAll() {
    try {
      if (isNative()) {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel(pending);
        }
      }
    } catch (e) { }
  },
};

export default notificationService;
