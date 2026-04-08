# 🚀 LifeTrack OS

**LifeTrack OS**, kullanıcıların günlük odak noktalarını belirlemesine, zamanlarını yönetmesine ve kişisel gelişim süreçlerini yapay zeka desteğiyle takip etmesine olanak tanıyan bir iOS uygulamasıdır.

## ✨ Özellikler

- **Günlük Odaklanma & Mood Takibi:** Ruh halini ve günlük hedefleri kayıt altına alma.
- **Zaman Yönetimi (Pomodoro):** Verimli çalışma için entegre sayaç.
- **AI Mentor:** Yapay zeka destekli kişisel tavsiyeler.
- **İlerleme Analizi:** Recharts ile görselleştirilmiş performans grafikleri.
- **Premium Üyelik (IAP):** RevenueCat ile abonelik yönetimi.
- **App Store Uyumluluğu:** Apple standartlarına uygun hesap silme ve yasal linkler.

## 🛠 Kullanılan Teknolojiler

- **Frontend:** React.js, CSS3
- **Mobil Framework:** Capacitor (Native iOS Bridge)
- **Backend:** Firebase (Auth & Firestore)
- **Ödeme Altyapısı:** RevenueCat SDK
- **Veri Görselleştirme:** Recharts
- **Yayınlama:** Xcode, App Store Connect

## 📦 Kurulum ve Çalıştırma

```bash
# Projeyi klonlayın
git clone https://github.com/omerislamoglu/lifetrack-os.git

# Bağımlılıkları yükleyin
npm install

# Web uygulamasını başlatın
npm start

# iOS tarafına aktarın
npx cap sync ios
