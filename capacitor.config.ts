import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.omerislamoglu.lifetrack2',
  appName: 'LifeTrack OS',
  webDir: 'build',
  backgroundColor: '#000000',
  
  // DİKKAT: Beyaz/Splash ekran hatasını çözmek için burayı kapattık. 
  // Artık uygulama çökmeyecek, kendi içindeki dosyaları okuyacak.
  /*
  server: {
    url: 'http://192.168.1.184:3000',
    cleartext: true
  },
  */

  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['google.com', 'apple.com'],
    },
    SplashScreen: {
      launchAutoHide: true,
    },
  },
  ios: {
    useSwiftPackageManagement: true
  }
};

export default config;
