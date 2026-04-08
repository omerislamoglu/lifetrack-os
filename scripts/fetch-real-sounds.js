const https = require('https');
const fs = require('fs');
const path = require('path');

const SOUNDS = [
  { key: 'natureRain', query: 'title:rain AND mediatype:audio AND format:mp3' },
  { key: 'cafe', query: 'title:cafe AND mediatype:audio AND format:mp3' },
  { key: 'fireplace', query: 'title:fireplace AND mediatype:audio AND format:mp3' },
  { key: 'lofi', query: 'title:(lofi OR lofi beat OR hiphop beat) AND mediatype:audio AND format:mp3' },
  { key: 'chime', query: 'title:(chime OR bell) AND mediatype:audio AND format:mp3' }
];

const TARGET_DIR = path.join(__dirname, 'public', 'sounds');
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function searchArchive(query) {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier&sort[]=downloads+desc&rows=3&page=1&output=json`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.response.docs);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function getMp3File(identifier) {
  const url = `https://archive.org/metadata/${identifier}`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const files = parsed.files;
          const mp3 = files.find(f => f.name.endsWith('.mp3'));
          if (mp3) {
            resolve(`https://archive.org/download/${identifier}/${mp3.name}`);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  for (const sound of SOUNDS) {
    console.log(`Searching for ${sound.key}...`);
    try {
      const docs = await searchArchive(sound.query);
      let foundUrl = null;
      for (const doc of docs) {
        const mp3Url = await getMp3File(doc.identifier);
        if (mp3Url) {
          foundUrl = mp3Url;
          break;
        }
      }
      
      if (foundUrl) {
        console.log(`Downloading ${sound.key} from ${foundUrl}`);
        await downloadFile(foundUrl, path.join(TARGET_DIR, `${sound.key}.mp3`));
        console.log(`Success: ${sound.key}`);
      } else {
        console.log(`Failed to find mp3 for ${sound.key}`);
      }
    } catch (e) {
      console.error(`Error for ${sound.key}:`, e.message);
    }
  }
}

main();
