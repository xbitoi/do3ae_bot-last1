const fs = require('fs');
let content = fs.readFileSync('artifacts/api-server/src/lib/bot-manager.ts', 'utf8');

const regex = /async function generateTTS\(text: string, outputPath: string, slow: boolean, videoDuration\?: number, voice = "ar-SA-HamedNeural"\) \{([\s\S]*?)if \(\!videoDuration\) \{/m;

const replacement = `async function generateTTS(text: string, outputPath: string, slow: boolean, videoDuration?: number, voice = "ar-SA-HamedNeural") {
  const rawPath = outputPath.replace(".mp3", "_raw.mp3");

  if (voice && voice.startsWith("gemini-")) {
    addLog(\`🎙️ توليد الصوت بـ Gemini: \${voice}\`, "processing");
    const activeGeminiKey = getActiveGeminiKey();
    if (!activeGeminiKey) throw new Error("مفتاح Gemini غير متاح لتوليد الصوت");
    
    // Fallback if the requested voice is not natively supported
    const voiceName = voice.replace("gemini-", "");
    const genAI = new GoogleGenerativeAI(activeGeminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-tts-preview" }, { apiVersion: "v1alpha" });
    
    const res = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "يرجى قراءة هذا النص باللغة العربية بتأنٍ ووضوح وخشوع، وبدون أي إضافات موسيقية أو مؤثرات. النص هو:\\n\\n" + text }] }],
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
    
    const inlineData = res.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData;
    if (!inlineData) {
      throw new Error("لم يتم إرجاع أي بيانات صوتية من نموذج Gemini");
    }
    
    const pcmPath = outputPath.replace(".mp3", "_gemini.pcm");
    fs.writeFileSync(pcmPath, Buffer.from(inlineData.data, "base64"));
    
    // Convert PCM (audio/l16; rate=24000; channels=1) to mp3
    // Use a slightly slower playback speed if slow=true by applying atempo
    const speedFilter = slow ? "-filter:a \\"atempo=0.9\\"" : "";
    await execAsync(\`ffmpeg -y -f s16le -ar 24000 -ac 1 -i "\${pcmPath}" \${speedFilter} -c:a libmp3lame -q:a 2 "\${rawPath}"\`);
    
    try { fs.unlinkSync(pcmPath); } catch {}
  } else {
    // Legacy edge-tts and gTTS
    if (!_ttsDepsInstalled) {
      try {
        addLog("📦 Installing TTS dependencies (edge-tts, gTTS)...", "processing");
        await execAsync("python3 -m ensurepip --default-pip || true");
        await execAsync("python3 -m pip install edge-tts gTTS --break-system-packages || pip3 install edge-tts gTTS --break-system-packages || pip install edge-tts gTTS");
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

  if (!videoDuration) {`;

content = content.replace(regex, replacement);
fs.writeFileSync('artifacts/api-server/src/lib/bot-manager.ts', content);
