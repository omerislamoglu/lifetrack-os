const fs = require('fs');
const path = require('path');
const https = require('https');

const SOUNDS_DIR = path.join(__dirname, '../public/sounds');

// Ensure directory exists
if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

// Map of sound files to download (using a reliable open-source MP3 URL as a placeholder)
// In a real production app, you would replace these URLs with your actual Firebase Storage URLs or custom assets.
const filesToDownload = [
  'natureRain.mp3',
  'forest.mp3',
  'fireplace.mp3',
  'cafe.mp3',
  'library.mp3',
  'lofi.mp3',
  'meditation.mp3',
  'beep.mp3',
  'chime.mp3'
];

// Using a stable Wikimedia CC0 or Github Raw MP3 link for demonstration
const SAMPLE_MP3_URL = 'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3';

const downloadFile = (filename, url) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(SOUNDS_DIR, filename);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${filename} already exists.`);
      resolve();
      return;
    }

    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      if (response.statusCode >= 300) {
        reject(new Error(`Failed to download ${filename}: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`⬇️ Downloaded ${filename}`);
          resolve();
        });
      });
    }).on('error', (err) => {
      fs.unlinkSync(filePath);
      reject(err);
    });
  });
};

async function setupSounds() {
  console.log('Starting audio assets download...');
  for (const file of filesToDownload) {
    try {
      await downloadFile(file, SAMPLE_MP3_URL);
    } catch (err) {
      console.error(`❌ Error downloading ${file}:`, err.message);
    }
  }
  console.log('🎉 All audio assets are ready in public/sounds!');
}

setupSounds();
