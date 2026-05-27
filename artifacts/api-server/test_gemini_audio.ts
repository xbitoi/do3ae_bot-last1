import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import { exec } from "child_process";

const geminiKey = process.env.GEMINI_KEY || JSON.parse(fs.readFileSync('artifacts/api-server/bot-creds.json', 'utf8')).geminiKey;
const genAI = new GoogleGenerativeAI(geminiKey);
async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-tts-preview" }, { apiVersion: "v1alpha" });
  const res = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: "Please read this in Arabic: السلام عليكم ورحمة الله وبركاته" }] }],
    generationConfig: {
      temperature: 0.1,
      // @ts-ignore
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Puck" }
        }
      }
    }
  });
  const inlineData = res.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData;
  if (inlineData) {
    fs.writeFileSync('out.pcm', Buffer.from(inlineData.data, 'base64'));
    console.log("Written out.pcm");
    const cmd = `ffmpeg -y -f s16le -ar 24000 -ac 1 -i out.pcm -c:a libmp3lame -q:a 2 out.mp3`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) console.error(err);
      console.log("Converted to out.mp3!");
    });
  }
}
run().catch(console.error);
