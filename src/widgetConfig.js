// LifeTrack iOS Widget Configuration
// Xcode'a kopyalanması gereken yapılandırma

/*
WIDGET KURULUMU İÇİN:

1. Xcode'da LifeTrack projesini aç
2. File → New → Target seçin
3. iOS seçin, "Widget Extension" ara ve seçin
4. Product Name: "LifeTrackWidget" yazın
5. Team seçin ve Continue
6. LifeTrackWidget.swift dosyasını App/ klasöründe oluşturulan Swift code ile değiştirin

7. Xcode Capabilities:
   - LifeTrackWidget target'ında:
   - "App Groups" capability'sini ekle
   - Com.omerislamoglu.lifetrack2.widgets ekle

8. Info.plist'e ekle:
   <key>NSWidgetDisplayName</key>
   <string>LifeTrack</string>

9. Build Settings:
   - PRODUCT_BUNDLE_IDENTIFIER: com.omerislamoglu.lifetrack2.LifeTrackWidget
*/

// iOS App Groups Configuration
// Bunu App.js'de kullan

export const iOS_APP_GROUP_IDENTIFIER = "group.lifetrack.widgets";

// Widget data'yı Capacitor aracılığıyla paylaş
export const setupWidgetDataSharing = async () => {
  try {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      if (window.Capacitor.isPluginAvailable('App')) {
        const { App } = window.Capacitor.Plugins;
        
        // App Groups yapılandırması sağla
        await App.setAppGroupData?.({
          groupId: iOS_APP_GROUP_IDENTIFIER
        }).catch(() => {
          console.log('App Groups not available');
        });
      }
    }
  } catch (error) {
    console.log('Widget sharing setup skipped:', error.message);
  }
};

// Widget Preferences Setup
export const setupWidgetPreferences = () => {
  if (typeof UserDefaults !== 'undefined') {
    const defaults = UserDefaults(suiteName: iOS_APP_GROUP_IDENTIFIER);
    defaults.setBoolForKey(true, forKey: "widget_enabled");
    return true;
  }
  return false;
};

export default {
  iOS_APP_GROUP_IDENTIFIER,
  setupWidgetDataSharing,
  setupWidgetPreferences
};
