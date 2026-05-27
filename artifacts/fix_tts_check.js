const fs = require('fs');

let content = fs.readFileSync('artifacts/api-server/src/lib/bot-manager.ts', 'utf8');
const oldFuncStart = content.indexOf(`async function generateTTS(text: string, outputPath: string, slow: boolean, videoDuration?: number, voice = "gemini-Puck")`);

// let's just find the next function
const nextFuncMatch = content.slice(oldFuncStart + 100).match(/\n(export )?(async )?function[ (]/);

const oldFuncEnd = oldFuncStart + 100 + nextFuncMatch.index;

console.log("End found at:", oldFuncEnd);
console.log("Next func starts with:", content.slice(oldFuncEnd, oldFuncEnd + 50));

const replacement = `async function generateTTS(text: string, outputPath: string, slow: boolean, videoDuration?: number, voice = "gemini-Puck") {
  const rawPath = outputPath.replace(".mp3", "_raw.mp3");
  let geminiSuccess = false;

  if (voice && voice.startsWith("gemini-")) {
    try {
      addLog(\`🎙️ توليد الصوت بـ Gemini: \${voice}\`, "processing");
      const activeGeminiKey = getActiveGeminiKey();
      if (!activeGeminiKey) throw new Error("مفتاح Gemini غير متاح لتوليد الصوت");
      
      const voiceName = voice.replace("gemini-", "");
      let inlineData: any = null;
      let keysToTry = getAllGeminiKeys();
      if (keysToTry.length === 0 && getActiveGeminiKey()) keysToTry.push(getActiveGeminiKey());
      keysToTry = Array.from(new Set(keysToTry.map(k => k.trim()).filter(k => !!k)));
      
      if (keysToTry.length > 0) {
        const ttsModels = ["gemini-3.1-flash-tts-preview", "gemini-3.1-flash-lite-preview", "gemini-2.5-flash-preview-tts"];
        for (const key of keysToTry) {
          let success = false;
          for (const ttsMod of ttsModels) {
            try {
              addLog(\`🎙️ محاولة صوت: \${ttsMod}\`, "processing");
              const genAI = new GoogleGenerativeAI(key);
              const model = genAI.getGenerativeModel({ model: ttsMod }, { apiVersion: "v1alpha" });
              
              const res = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: "يرجى قراءة هذا النص بصوتك فقط، واضح وخاشع، بدون إضافة أي نص مكتوب أو مؤثرات. النص:\\n" + text }] }],
                generationConfig: {
                  temperature: 0.1,
                  // @ts-ignore
                  responseModalities: ["AUDIO"],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName }
                    }
                  }
                }
              });
              
              inlineData = res.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData;
              if (inlineData) {
                addLog(\`✅ نجح توليد الصوت باستخدام: \${ttsMod} (المفتاح صالح)\`, "success");
                success = true;
                break;
              }
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              const isQuota = msg.includes("429") || msg.toLowerCase().includes("quota");
              addLog(\`⚠️ \${ttsMod}: \${isQuota ? "تجاوز الحصة" : "خطأ/غير مدعوم"}\`, "warning");
              continue; // Try next model
            }
          }
          if (success) break;
        }
      }
      
      if (inlineData) {
        const pcmPath = outputPath.replace(".mp3", "_gemini.pcm");
        fs.writeFileSync(pcmPath, Buffer.from(inlineData.data, "base64"));
        const speedFilter = slow ? "-filter:a \\\"atempo=0.9\\\"" : "";
        await execAsync(\`ffmpeg -y -f s16le -ar 24000 -ac 1 -i "\${pcmPath}" \${speedFilter} -c:a libmp3lame -q:a 2 "\${rawPath}"\`);
        try { fs.unlinkSync(pcmPath); } catch {}
        geminiSuccess = true;
      }
    } catch (err) {
      addLog(\`⚠️ فشل توليد الصوت بـ Gemini: \${String(err)}\`, "warning");
    }
  }

  if (!geminiSuccess) {
    if (voice && voice.startsWith("gemini-")) {
      const edgeVoices = ALL_TTS_VOICES.filter(v => !v.startsWith("gemini-"));
      voice = edgeVoices[Math.floor(Math.random() * edgeVoices.length)];
      addLog(\`⚠️ التحويل التلقائي إلى Edge TTS بصوت \${voice} بسبب فشل Gemini\`, "warning");
    }

    if (!_ttsDepsInstalled) {
      try {
        addLog("📦 Installing TTS dependencies (edge-tts, gTTS)...", "processing");
        await execAsync("python3 -m ensurepip --default-pip || true");
        const getPipStr = "wget -qO get-pip.py https://bootstrap.pypa.io/get-pip.py || curl -sSL https://bootstrap.pypa.io/get-pip.py -o get-pip.py";
        await execAsync(\`\${getPipStr} ; python3 get-pip.py --break-system-packages || true\`);
        await execAsync("python3 -m pip install edge-tts gTTS Pillow arabic-reshaper python-bidi --break-system-packages || pip3 install edge-tts gTTS Pillow arabic-reshaper python-bidi --break-system-packages || pip install edge-tts gTTS Pillow arabic-reshaper python-bidi");
        _ttsDepsInstalled = true;
      } catch (e) {
        addLog(\`⚠️ فشل تثبيت مكتبات الصوت: \${e}\`, "warning");
      }
    }

    if (voice && voice !== "gtts") {
      addLog(\`🎙️ توليد الصوت بـ Edge TTS: \${voice}\`, "processing");
      const txtFile = rawPath + ".txt";
      const pyFile = rawPath + ".py";
      fs.writeFileSync(txtFile, text, "utf8");
      fs.writeFileSync(pyFile, [
        "import asyncio, edge_tts",
        "async def run():",
        \`    with open(\${JSON.stringify(txtFile)}, encoding='utf-8') as f:\`,
        "        txt = f.read()",
        \`    rate = \${slow ? "'-10%'" : "'+0%'"}\`,
        \`    com = edge_tts.Communicate(txt, \${JSON.stringify(voice)}, rate=rate)\`,
        \`    await com.save(\${JSON.stringify(rawPath)})\`,
        "asyncio.run(run())",
      ].join("\\n"), "utf8");
      try {
        await execAsync(\`python3 \${JSON.stringify(pyFile)}\`, { timeout: 60000 });
      } finally {
        try { fs.unlinkSync(txtFile); } catch {}
        try { fs.unlinkSync(pyFile); } catch {}
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

  if (!videoDuration) {
    fs.renameSync(rawPath, outputPath);
    return;
  }

  const audioDuration = await getAudioDuration(rawPath);
  addLog(\`🎵 مدة الصوت: \${audioDuration.toFixed(1)}ث | الفيديو: \${videoDuration.toFixed(1)}ث\`, "info");

  if (audioDuration <= videoDuration) {
    fs.renameSync(rawPath, outputPath);
    return;
  }

  const ratio = audioDuration / videoDuration;
  addLog(\`⚡ تسريع الصوت: \${ratio.toFixed(2)}x لمطابقة الفيديو\`, "processing");

  const atempoFilters: string[] = [];
  let remaining = ratio;
  let safety = 0;
  while (remaining > 1.001 && safety++ < 6) {
    const step = Math.min(2.0, remaining);
    atempoFilters.push(\`atempo=\${step.toFixed(4)}\`);
    remaining /= step;
  }

  const speedFilter = "-filter:a \\\"" + atempoFilters.join(",") + "\\\"";
  await execAsync(\`ffmpeg -y -i "\${rawPath}" \${speedFilter} -c:a libmp3lame -q:a 2 "\${outputPath}"\`);
  try { fs.unlinkSync(rawPath); } catch {}
}`;
content = content.slice(0, oldFuncStart) + replacement + content.slice(oldFuncEnd);
fs.writeFileSync('artifacts/api-server/src/lib/bot-manager.ts', content);
