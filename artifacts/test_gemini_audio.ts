const apiKey = "AIzaSyA1C-hS4oXzSSrLdiSI3nDvpBi6QcRWQis";

async function testTTS(modelName) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1alpha/models/${modelName}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "يرجى قراءة هذا النص فقط كصوت بدون أي نص: مرحبا" }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Puck" }
            }
          }
        }
      })
    });
    const j = await res.json();
    if (!res.ok) {
       console.log(`${modelName}: ERROR ${res.status} - ${j.error?.message}`);
    } else {
       console.log(`${modelName}: OK`);
    }
  } catch (e) {
    console.error(e);
  }
}

async function run() {
  const models = [
    "gemini-3.1-flash-tts-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-flash-preview-tts"
  ];
  for (const m of models) {
    await testTTS(m);
  }
}
run();
