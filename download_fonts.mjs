import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fonts = {
  'tajawal.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/tajawal/Tajawal-Bold.ttf',
  'almarai.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/almarai/Almarai-Bold.ttf',
  'lalezar.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/lalezar/Lalezar-Regular.ttf',
  'changa.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/changa/Changa%5Bwght%5D.ttf',
  'reemkufi.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/reemkufi/ReemKufi%5Bwght%5D.ttf'
};

const dirs = [
  path.join(__dirname, 'artifacts/telegram-studio/public/fonts'),
  path.join(__dirname, 'artifacts/telegram-bot-studio/fonts')
];

dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Status: ' + res.status);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buffer));
}

async function run() {
  for (const [filename, url] of Object.entries(fonts)) {
    console.log('Downloading', filename);
    const dests = dirs.map(d => path.join(d, filename));
    if (fs.existsSync(dests[0]) && fs.statSync(dests[0]).size > 1000) {
      console.log('Skipping', filename, 'already exists');
      continue;
    }
    await download(url, dests[0]);
    // copy to second
    fs.copyFileSync(dests[0], dests[1]);
    console.log('Done', filename);
  }
}

run().catch(console.error);
