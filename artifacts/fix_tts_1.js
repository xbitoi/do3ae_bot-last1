const fs = require('fs');

let content = fs.readFileSync('artifacts/api-server/src/lib/bot-manager.ts', 'utf8');

const ttsModelsOldPattern = /const ttsModels = \["gemma-4-31b-it", "gemini-flash-lite-latest", "gemini-pro-latest"\];/g;
const ttsModelsNewPattern = `const ttsModels = ["gemini-3.1-flash-tts-preview", "gemini-3.1-flash-lite-preview", "gemini-2.5-flash-preview-tts"];`;

content = content.replace(ttsModelsOldPattern, ttsModelsNewPattern);

fs.writeFileSync('artifacts/api-server/src/lib/bot-manager.ts', content);
