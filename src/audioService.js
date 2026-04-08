import { NativeAudio } from '@capacitor-community/native-audio';

const nativeSounds = [
  'natureRain', 'cafe', 'fireplace', 'lofi'
];

let isPreloaded = false;

// Otonom Preload
async function preloadAll() {
  if (isPreloaded) return;
  for (const sound of nativeSounds) {
    try {
      await NativeAudio.preload({
        assetId: sound,
        assetPath: `public/sounds/${sound}.mp3`,
        audioChannelNum: 1,
        isUrl: false
      });
    } catch (e) {
      console.error(`[NATIVE AUDIO ERROR] Preload failed for ${sound}:`, e);
    }
  }
  
  // Preload chime as well to avoid doing it every time
  try {
    await NativeAudio.preload({
      assetId: 'pomodoro_chime',
      assetPath: 'public/sounds/chime.mp3',
      audioChannelNum: 1,
      isUrl: false
    });
  } catch (e) {
    console.error(`[NATIVE AUDIO ERROR] Chime preload failed:`, e);
  }

  isPreloaded = true;
}

preloadAll();

let _currentKey = 'none';

const ambientPlayer = {
  play(key, url, volume = 0.5) {
    if (key === 'whiteNoise') {
      console.error('[NATIVE AUDIO ERROR] White noise HTML5 uretimi tamamen silindi. Çalmak icin public/sounds/whiteNoise.mp3 eklenmelidir.');
      return;
    }

    if (key === _currentKey && key !== 'none') {
      this.setVolume(volume);
      return;
    }

    const previousKey = _currentKey;
    _currentKey = key;

    const startNew = () => {
      if (key === 'none') return;
      NativeAudio.loop({ assetId: key })
        .then(() => NativeAudio.setVolume({ assetId: key, volume }))
        .catch(e => console.error(`[NATIVE AUDIO ERROR] Play blocked for ${key}:`, e));
    };

    if (previousKey !== 'none') {
      NativeAudio.stop({ assetId: previousKey })
        .then(startNew)
        .catch(e => {
          console.error(`[NATIVE AUDIO ERROR] Stop error for ${previousKey}:`, e);
          startNew(); 
        });
    } else {
      startNew();
    }
  },

  stop() {
    const prev = _currentKey;
    _currentKey = 'none';
    if (prev !== 'none') {
      NativeAudio.stop({ assetId: prev }).catch(e => console.warn(`[NATIVE AUDIO WARN] Stop skipped for ${prev}:`, e));
    }
  },

  setVolume(volume) {
    if (_currentKey !== 'none') {
      NativeAudio.setVolume({ assetId: _currentKey, volume }).catch(e => console.warn(`[NATIVE AUDIO WARN] Volume setting skipped:`, e));
    }
  },

  playChime() {
    NativeAudio.play({ assetId: 'pomodoro_chime' })
      .catch(e => console.error('[NATIVE AUDIO ERROR] Chime play failed. Not preloaded or missing file.'));
  }
};

export default ambientPlayer;
