const fs = require('fs');
const path = require('path');
const https = require('https');

const fonts = {
  'tajawal.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/tajawal/Tajawal-Bold.ttf',
  'almarai.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/almarai/Almarai-Bold.ttf',
  'lalezar.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/lalezar/Lalezar-Regular.ttf',
  'changa.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/changa/Changa-Bold.ttf',
  'reemkufi.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/reemkufi/ReemKufi%5Bwght%5D.ttf'
};

const dirs = [
  path.join(__dirname, 'artifacts/telegram-studio/public/fonts'),
  path.join(__dirname, 'artifacts/telegram-bot-studio/fonts')
];

dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('Status: ' + res.statusCode));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function run() {
  for (const [filename, url] of Object.entries(fonts)) {
    console.log('Downloading', filename);
    for (const d of dirs) {
      await download(url, path.join(d, filename));
    }
    console.log('Done', filename);
  }
}
run().catch(console.error);
