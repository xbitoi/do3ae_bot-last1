const fs = require('fs');
let content = fs.readFileSync('artifacts/api-server/src/lib/bot-manager.ts', 'utf8');

const ttsBlockStart = content.indexOf('if (voice && voice !== "gtts") {');
const endBlockInfo = content.indexOf('if (!videoDuration) {');

if (ttsBlockStart !== -1 && endBlockInfo !== -1) {
  const replaceBlock = `    if (voice && voice !== "gtts") {
      const edgeVoices = [voice, "ar-YE-SalehNeural", "ar-IQ-BasselNeural", "ar-SA-HamedNeural", "ar-EG-SalmaNeural", "ar-SA-ZariyahNeural"];
      let edgeSuccess = false;
      
      for (const currentVoice of new Set(edgeVoices)) {
        addLog(\`🎙️ محاولة توليد الصوت بـ Edge TTS: \${currentVoice}\`, "processing");
        const txtFile = rawPath + ".txt";
        const pyFile = rawPath + ".py";
        fs.writeFileSync(txtFile, text, "utf8");
        fs.writeFileSync(pyFile, [
          "import asyncio, edge_tts",
          "async def run():",
          \`    with open(\${JSON.stringify(txtFile)}, encoding='utf-8') as f:\`,
          "        txt = f.read()",
          \`    rate = \${slow ? "'-10%'" : "'+0%'"}\`,
          \`    com = edge_tts.Communicate(txt, '\${currentVoice}', rate=rate)\`,
          \`    await com.save(\${JSON.stringify(rawPath)})\`,
          "asyncio.run(run())"
        ].join("\\n"), "utf8");
        
        try {
          await execAsync(\`python3 \${JSON.stringify(pyFile)}\`, { timeout: 60000 });
          if (fs.existsSync(rawPath) && fs.statSync(rawPath).size > 0) {
            edgeSuccess = true;
            addLog(\`✅ نجح الصوت بـ Edge TTS: \${currentVoice}\`, "success");
            try { fs.unlinkSync(txtFile); fs.unlinkSync(pyFile); } catch {}
            break; 
          }
        } catch (e) {
          addLog(\`⚠️ فشل Edge TTS بصوت \${currentVoice}, جاري تجربة صوت آخر...\`, "warning");
        } finally {
          try { fs.unlinkSync(txtFile); fs.unlinkSync(pyFile); } catch {}
        }
      }
      
      if (!edgeSuccess) {
         addLog(\`🎙️ كل المحاولات فشلت، توليد الصوت بـ gTTS كفرصة أخيرة\`, "warning");
         const escapedText = text.replace(/\\\\/g, "\\\\\\\\").replace(/'/g, "\\\\'");
         const speed = slow ? "slow=True" : "slow=False";
         await execAsync(
           \`python3 -c "from gtts import gTTS; gTTS(text='\${escapedText}', lang='ar', \${speed}).save('\${rawPath}')"\`
         );
      }
    } else {
      addLog(\`🎙️ توليد الصوت بـ gTTS\`, "processing");
      const escapedText = text.replace(/\\\\/g, "\\\\\\\\").replace(/'/g, "\\\\'");
      const speed = slow ? "slow=True" : "slow=False";
      await execAsync(
        \`python3 -c "from gtts import gTTS; gTTS(text='\${escapedText}', lang='ar', \${speed}).save('\${rawPath}')"\`
      );
    }
  }

  // Final normalization to the required format
  try {
    await execAsync(\`ffmpeg -y -i "\${rawPath}" -acodec libmp3lame -ar 44100 -ab 128k "\${outputPath}"\`);
  } finally {
    try { fs.unlinkSync(rawPath); } catch {}
  }

  `;  

  content = content.substring(0, ttsBlockStart) + replaceBlock + content.substring(endBlockInfo);
  fs.writeFileSync('artifacts/api-server/src/lib/bot-manager.ts', content);
} else {
  console.log('Not found');
}
