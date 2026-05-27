import { Router, type IRouter } from "express";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { getProxyStatus, recheckProxy } from "../lib/proxy-manager.js";
import {
  startBot,
  stopBot,
  getBotStatus,
  testBotToken,
  getSettings,
  updateSettings,
  defaultSettings,
  getAvailableGeminiModels,
  checkGeminiKeyStatus,
  generateTTSPreview,
  testYouTubeToken,
  testTikTokToken,
  testFacebookToken,
  sendWelcomeToAll,
  getSchedulerStatus,
  getSmartBotStatus,
  triggerScheduledPost,
  forceTriggerScheduledPost,
  sendManualReport,
  getAnalyticsSummary,
  fetchYouTubeAnalytics,
  fetchFacebookAnalytics,
  fetchTikTokAnalytics,
  fetchBotAnalytics,
  listYouTubeChannelVideos,
  deleteYouTubeVideos,
  listTikTokVideos,
  deleteTikTokVideos,
  listFacebookVideos,
  deleteFacebookVideos,
  saveCredentials,
  loadCredentials,
  updateMemoryKeys,
  testGenerateDuaa,
  processSimulatorVideo,
  handleSimulatorPublish,
  handleSimulatorMessage,
} from "../lib/bot-manager.js";

const router: IRouter = Router();

router.post("/bot/start", async (req, res) => {
  const { geminiKey, geminiKey2, geminiKey3, geminiKey4, geminiKey5, botToken, groqKey, lmStudioUrl, lmStudioKey } = req.body as any;

  if (!geminiKey || !botToken) {
    res.status(400).json({ error: "مفتاح Gemini وتوكن البوت مطلوبان" });
    return;
  }

  const settings = getSettings();
  const result = await startBot(geminiKey, botToken, settings, groqKey || "", lmStudioUrl || "", lmStudioKey || "", false, geminiKey2 || "", geminiKey3 || "", geminiKey4 || "", undefined, geminiKey5 || "");
  res.json(result);
});

router.post("/bot/restart", async (req, res) => {
  const { geminiKey, geminiKey2, geminiKey3, geminiKey4, geminiKey5, botToken, groqKey, lmStudioUrl, lmStudioKey } = req.body as any;

  if (!geminiKey || !botToken) {
    res.status(400).json({ error: "مفتاح Gemini وتوكن البوت مطلوبان" });
    return;
  }

  stopBot(); // Force stop before starting

  const settings = getSettings();
  const result = await startBot(geminiKey, botToken, settings, groqKey || "", lmStudioUrl || "", lmStudioKey || "", false, geminiKey2 || "", geminiKey3 || "", geminiKey4 || "", undefined, geminiKey5 || "");
  res.json(result);
});

router.post("/bot/stop", (_req, res) => {
  const result = stopBot();
  res.json(result);
});

router.get("/bot/status", (_req, res) => {
  res.json(getBotStatus());
});

router.get("/proxy-status", (_req, res) => {
  if (getSettings().offlineMode) {
    res.json({ type: "none", checked: true, checking: false, error: "⚠️ وضع الطيران نشط (تم إيقاف الاتصال)" });
    return;
  }
  res.json(getProxyStatus());
});

// ── Telegram Bot API Reverse Proxy ─────────────────────────────────────────
// HuggingFace (AWS) is blocked by Telegram. This endpoint proxies requests
// so HF Space can set: TELEGRAM_API_URL=https://<replit-domain>/api/tgproxy
router.all(/^\/tgproxy(\/.*)?$/, async (req, res) => {
  const suffix = (req.params as Record<string, string>)[0] || "";
  const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const targetUrl = `https://api.telegram.org${suffix}${qs}`;
  try {
    const fetchOpts: RequestInit = {
      method: req.method,
      headers: { "Content-Type": req.headers["content-type"] || "application/json" },
      signal: AbortSignal.timeout(15000),
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOpts.body = JSON.stringify(req.body);
    }
    const upstream = await fetch(targetUrl, fetchOpts);
    const body = await upstream.arrayBuffer();
    res.status(upstream.status);
    res.set("Content-Type", upstream.headers.get("content-type") || "application/json");
    res.set("Access-Control-Allow-Origin", "*");
    res.send(Buffer.from(body));
  } catch (e: unknown) {
    res.status(502).json({ ok: false, error: (e as Error).message });
  }
});

router.post("/proxy-recheck", async (_req, res) => {
  const status = await recheckProxy();
  res.json(status);
});

router.get("/connectivity-test", async (_req, res) => {
  if (getSettings().offlineMode) {
    res.json({
      telegram: { ok: false, error: "⚠️ تم تعطيل الاتصال بالإنترنت يدويًا عبر وضع الطيران" },
      google: { ok: false, error: "⚠️ تم تعطيل الاتصال بالإنترنت يدويًا عبر وضع الطيران" },
      gemini: { ok: false, error: "⚠️ تم تعطيل الاتصال بالإنترنت يدويًا عبر وضع الطيران" },
      publicIp: { ok: false, error: "⚠️ الوضع غير المتصل نشط" }
    });
    return;
  }

  const results: Record<string, unknown> = {};

  // Test 1: Telegram API
  try {
    const r = await fetch("https://api.telegram.org", { signal: AbortSignal.timeout(8000) });
    results["telegram"] = { ok: true, status: r.status };
  } catch (e: unknown) {
    results["telegram"] = { ok: false, error: (e as Error).message };
  }

  // Test 2: Google (basic internet)
  try {
    const r = await fetch("https://www.google.com", { signal: AbortSignal.timeout(8000) });
    results["google"] = { ok: true, status: r.status };
  } catch (e: unknown) {
    results["google"] = { ok: false, error: (e as Error).message };
  }

  // Test 3: Gemini API
  try {
    const r = await fetch("https://generativelanguage.googleapis.com", { signal: AbortSignal.timeout(8000) });
    results["gemini"] = { ok: true, status: r.status };
  } catch (e: unknown) {
    results["gemini"] = { ok: false, error: (e as Error).message };
  }

  // Test 4: WhatsMyIP
  try {
    const r = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(8000) });
    const data = await r.json() as { ip: string };
    results["publicIp"] = { ok: true, ip: data.ip };
  } catch (e: unknown) {
    results["publicIp"] = { ok: false, error: (e as Error).message };
  }

  res.json(results);
});

router.post("/credentials/save", async (req, res) => {
  const existingCreds = loadCredentials() || {
    botToken: "",
    geminiKey: "",
    geminiKey2: "",
    geminiKey3: "",
    geminiKey4: "",
    geminiKey5: "",
    groqKey: "",
    lmStudioUrl: "",
    lmStudioKey: ""
  };

  const { botToken, geminiKey, geminiKey2, geminiKey3, geminiKey4, geminiKey5, groqKey, lmStudioUrl, lmStudioKey } = req.body as any;

  // Merge with existing credentials dynamically
  const mergedCreds = {
    botToken: botToken !== undefined ? botToken : existingCreds.botToken,
    geminiKey: geminiKey !== undefined ? geminiKey : existingCreds.geminiKey,
    geminiKey2: geminiKey2 !== undefined ? geminiKey2 : (existingCreds.geminiKey2 || ""),
    geminiKey3: geminiKey3 !== undefined ? geminiKey3 : (existingCreds.geminiKey3 || ""),
    geminiKey4: geminiKey4 !== undefined ? geminiKey4 : (existingCreds.geminiKey4 || ""),
    geminiKey5: geminiKey5 !== undefined ? geminiKey5 : (existingCreds.geminiKey5 || ""),
    groqKey: groqKey !== undefined ? groqKey : (existingCreds.groqKey || ""),
    lmStudioUrl: lmStudioUrl !== undefined ? lmStudioUrl : (existingCreds.lmStudioUrl || ""),
    lmStudioKey: lmStudioKey !== undefined ? lmStudioKey : (existingCreds.lmStudioKey || ""),
  };

  saveCredentials(mergedCreds);
  
  updateMemoryKeys(
    mergedCreds.geminiKey,
    mergedCreds.geminiKey2,
    mergedCreds.geminiKey3,
    mergedCreds.geminiKey4,
    mergedCreds.geminiKey5,
    mergedCreds.groqKey,
    mergedCreds.lmStudioUrl,
    mergedCreds.lmStudioKey
  );

  // Auto-start bot only if we now have both a botToken AND a geminiKey, and isn't running
  const botStatus = getBotStatus();
  if (!botStatus.running && mergedCreds.botToken && mergedCreds.geminiKey) {
    const settings = getSettings();
    startBot(
      mergedCreds.geminiKey,
      mergedCreds.botToken,
      settings,
      mergedCreds.groqKey,
      mergedCreds.lmStudioUrl,
      mergedCreds.lmStudioKey,
      true,
      mergedCreds.geminiKey2,
      mergedCreds.geminiKey3,
      mergedCreds.geminiKey4,
      undefined,
      mergedCreds.geminiKey5
    ).catch(() => {});
  }
  res.json({ success: true, creds: mergedCreds });
});

router.get("/credentials", (_req, res) => {
  const creds = loadCredentials();
  if (!creds) { res.json({ botToken: "", geminiKey: "", geminiKey2: "", geminiKey3: "", geminiKey4: "", geminiKey5: "", groqKey: "", lmStudioUrl: "", lmStudioKey: "" }); return; }
  res.json({
    botToken: creds.botToken,
    geminiKey: creds.geminiKey,
    geminiKey2: creds.geminiKey2 || "",
    geminiKey3: creds.geminiKey3 || "",
    geminiKey4: creds.geminiKey4 || "",
    geminiKey5: creds.geminiKey5 || "",
    groqKey: creds.groqKey || "",
    lmStudioUrl: creds.lmStudioUrl || "",
    lmStudioKey: creds.lmStudioKey || "",
  });
});

router.get("/debug-paths", (_req, res) => {
  try {
    const debugInfo = {
      cwd: process.cwd(),
      dirname: typeof __dirname !== "undefined" ? __dirname : "undefined",
      artifactsRootExists: fs.existsSync("/artifacts"),
      appletArtifactsExists: fs.existsSync("/app/applet/artifacts"),
      artifactsRootContent: fs.existsSync("/artifacts") ? fs.readdirSync("/artifacts") : [],
      appletArtifactsContent: fs.existsSync("/app/applet/artifacts") ? fs.readdirSync("/app/applet/artifacts") : [],
    };
    res.json(debugInfo);
  } catch (err: any) {
    res.json({ error: err.message || err });
  }
});

router.post("/bot/test", async (req, res) => {
  const { botToken } = req.body as { botToken: string };
  if (!botToken) {
    res.status(400).json({ error: "توكن البوت مطلوب" });
    return;
  }
  const result = await testBotToken(botToken);
  res.json(result);
});

router.get("/gemini-models", async (req, res) => {
  let geminiKey = req.query.geminiKey as string;
  if (!geminiKey) {
    const creds = loadCredentials();
    geminiKey = creds?.geminiKey || "";
  }
  if (!geminiKey) {
    res.status(400).json({ error: "geminiKey مطلوب" });
    return;
  }
  const models = await getAvailableGeminiModels(geminiKey);
  res.json({ models });
});

router.get("/gemini-status", async (req, res) => {
  let geminiKey = req.query.geminiKey as string;
  if (!geminiKey) {
    const creds = loadCredentials();
    geminiKey = creds?.geminiKey || "";
  }
  if (!geminiKey) {
    res.status(400).json({ error: "geminiKey مطلوب" });
    return;
  }
  const result = await checkGeminiKeyStatus(geminiKey);
  res.json(result);
});

router.post("/gemini/test-generate", async (req, res) => {
  let { geminiKey, model } = req.body as { geminiKey?: string; model?: string };
  if (!geminiKey) {
    const creds = loadCredentials();
    geminiKey = creds?.geminiKey || "";
  }
  if (!geminiKey) {
    res.status(400).json({ error: "geminiKey مطلوب" });
    return;
  }
  try {
    const result = await testGenerateDuaa(geminiKey, model || "auto");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/settings", (_req, res) => {
  res.json(getSettings());
});

router.put("/settings", (req, res) => {
  const updated = updateSettings(req.body);
  res.json(updated);
});

router.get("/tts-preview", async (req, res) => {
  const voice = (req.query.voice as string) || "ar-SA-HamedNeural";
  const slow = req.query.slow === "true";
  try {
    const audioPath = await generateTTSPreview(voice, slow);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-cache");
    const stream = fs.createReadStream(audioPath);
    stream.pipe(res);
    stream.on("end", () => {
      try { fs.unlinkSync(audioPath); } catch {}
    });
    stream.on("error", () => {
      try { fs.unlinkSync(audioPath); } catch {}
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// ── Social media key testing ──────────────────────────────────────────────

router.post("/social/test-youtube", async (req, res) => {
  const { token, clientId, clientSecret } = req.body as { token: string; clientId: string; clientSecret: string };
  if (!token || !clientId || !clientSecret) {
    res.status(400).json({ success: false, error: "Refresh Token و Client ID و Client Secret مطلوبة" });
    return;
  }
  const result = await testYouTubeToken(token, clientId, clientSecret);
  res.json(result);
});

router.post("/social/youtube-exchange", async (req, res) => {
  const { code, clientId, clientSecret, redirectUri } = req.body as { code: string; clientId: string; clientSecret: string; redirectUri: string };
  if (!code || !clientId || !clientSecret || !redirectUri) {
    res.status(400).json({ success: false, error: "بيانات الإرسال غير مكتملة" });
    return;
  }
  try {
    const fetchRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });
    const data = await fetchRes.json() as any;
    if (!fetchRes.ok) {
      res.status(400).json({ success: false, error: data.error_description || data.error });
      return;
    }
    res.json({ success: true, refreshToken: data.refresh_token });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/social/test-tiktok", async (req, res) => {
  const { token } = req.body as { token: string };
  if (!token) {
    res.status(400).json({ success: false, error: "التوكن مطلوب" });
    return;
  }
  const result = await testTikTokToken(token);
  res.json(result);
});

router.post("/social/test-facebook", async (req, res) => {
  const { token } = req.body as { token: string };
  if (!token) {
    res.status(400).json({ success: false, error: "التوكن مطلوب" });
    return;
  }
  const result = await testFacebookToken(token);
  res.json(result);
});

router.post("/social/test-make", async (req, res) => {
  const { url } = req.body as { url: string };
  if (!url) {
    res.status(400).json({ success: false, error: "الرابط مطلوب" });
    return;
  }
  try {
    const testRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "test", message: "اختبار الاتصال من بوت الدعاء" })
    });
    if (testRes.ok) {
      res.json({ success: true, info: "تم إرسال الطلب بنجاح" });
    } else {
      res.json({ success: false, error: `استجابة خاطئة: ${testRes.status}` });
    }
  } catch (err) {
    res.json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/bot/send-welcome", async (_req, res) => {
  const result = await sendWelcomeToAll();
  res.json(result);
});

// ── Analytics ─────────────────────────────────────────────────────────────

router.get("/analytics", (_req, res) => {
  const summary = getAnalyticsSummary();
  res.json(summary);
});

router.post("/analytics/report", async (req, res) => {
  const { chatId } = req.body as { chatId?: string };
  const settings = getSettings();
  const targetId = chatId
    ? parseInt(chatId)
    : settings.autoReportChatId
    ? parseInt(settings.autoReportChatId)
    : null;

  if (!targetId || isNaN(targetId)) {
    res.status(400).json({ success: false, error: "معرّف المحادثة مطلوب" });
    return;
  }
  try {
    const text = await sendManualReport(targetId);
    res.json({ success: true, reportText: text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// ── Scheduler ─────────────────────────────────────────────────────────────

router.get("/scheduler/status", (_req, res) => {
  res.json(getSchedulerStatus());
});

router.post("/scheduler/trigger", async (_req, res) => {
  try {
    await triggerScheduledPost();
    res.json({ success: true, message: "تم تشغيل المهمة المجدولة يدوياً" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

router.post("/scheduler/force-trigger", async (_req, res) => {
  try {
    const result = await forceTriggerScheduledPost();
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

router.get("/youtube/videos", async (_req, res) => {
  try {
    const result = await listYouTubeChannelVideos();
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

router.post("/youtube/delete-videos", async (req, res) => {
  const { videoIds } = req.body as { videoIds: string[] };
  if (!Array.isArray(videoIds) || videoIds.length === 0) {
    return res.status(400).json({ error: "يرجى تمرير قائمة معرّفات الفيديوهات" });
  }
  try {
    const result = await deleteYouTubeVideos(videoIds);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// ── TikTok video management ────────────────────────────────────────────────

router.get("/tiktok/videos", async (_req, res) => {
  try {
    const result = await listTikTokVideos();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/tiktok/delete-videos", async (req, res) => {
  const { videoIds } = req.body as { videoIds: string[] };
  if (!Array.isArray(videoIds) || videoIds.length === 0) {
    return res.status(400).json({ error: "يرجى تمرير قائمة معرّفات الفيديوهات" });
  }
  try {
    const result = await deleteTikTokVideos(videoIds);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ── Facebook video management ──────────────────────────────────────────────

router.get("/facebook/videos", async (_req, res) => {
  try {
    const result = await listFacebookVideos();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/facebook/delete-videos", async (req, res) => {
  const { videoIds } = req.body as { videoIds: string[] };
  if (!Array.isArray(videoIds) || videoIds.length === 0) {
    return res.status(400).json({ error: "يرجى تمرير قائمة معرّفات الفيديوهات" });
  }
  try {
    const result = await deleteFacebookVideos(videoIds);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ── Connected platform channels (for smart bot auto-fill) ─────────────────

router.get("/settings/connected-channels", async (_req, res) => {
  const settings = getSettings();
  const result: { youtube?: { channelId: string; channelName: string }; facebook?: { pageId: string; pageName: string }; tiktok?: { username: string } } = {};

  const tasks: Promise<void>[] = [];

  if (settings.youtubeToken && settings.youtubeClientId && settings.youtubeClientSecret) {
    tasks.push(
      testYouTubeToken(settings.youtubeToken, settings.youtubeClientId, settings.youtubeClientSecret)
        .then((r) => { if (r.success && r.channelId) result.youtube = { channelId: r.channelId, channelName: r.channelName || r.channelId }; })
        .catch(() => {})
    );
  }

  const fbToken = settings.facebookPageToken || settings.facebookToken;
  if (fbToken) {
    tasks.push(
      testFacebookToken(fbToken)
        .then((r) => { if (r.success) result.facebook = { pageId: r.pageId || "Webhook", pageName: r.pageName || "فيسبوك" }; })
        .catch(() => {})
    );
  }

  if (settings.tiktokToken) {
    tasks.push(
      testTikTokToken(settings.tiktokToken)
        .then((r: any) => { if (r.success && (r.username || r.displayName)) result.tiktok = { username: r.username || r.displayName }; })
        .catch(() => {})
    );
  }

  await Promise.all(tasks);
  res.json(result);
});

// ── Smart Bot ─────────────────────────────────────────────────────────────

router.get("/smart-bot/status", (_req, res) => {
  res.json(getSmartBotStatus());
});

// ── Platform Real Analytics ───────────────────────────────────────────────

router.get("/analytics/youtube", async (_req, res) => {
  const data = await fetchYouTubeAnalytics();
  res.json(data);
});

router.get("/analytics/facebook", async (_req, res) => {
  const data = await fetchFacebookAnalytics();
  res.json(data);
});

router.get("/analytics/tiktok", async (_req, res) => {
  const data = await fetchTikTokAnalytics();
  res.json(data);
});

router.get("/analytics/bot", (_req, res) => {
  res.json(fetchBotAnalytics());
});

// Help users who mistakenly set the redirect URI to /api/youtube/callback
router.get("/youtube/callback", (req, res) => {
  const { code, error } = req.query;
  if (code) {
    res.redirect(`/oauth/callback?code=${code}`);
  } else if (error) {
    res.redirect(`/oauth/callback?error=${error}`);
  } else {
    res.redirect("/settings");
  }
});

// ── Simulator API endpoints ──────────────────────────────────────────────

router.post("/simulator/message", async (req, res) => {
  const { message } = req.body as { message?: string };
  if (!message) {
    res.status(400).json({ error: "الرسالة مطلوبة" });
    return;
  }
  try {
    const settings = getSettings();
    const result = await handleSimulatorMessage(message, settings);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

router.post("/simulator/upload", async (req, res) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sim-upload-"));
  const inputPath = path.join(tmpDir, "upload_input.mp4");
  const writeStream = fs.createWriteStream(inputPath);

  req.pipe(writeStream);

  writeStream.on("finish", async () => {
    try {
      const settings = getSettings();
      
      const publicDir = path.resolve(process.cwd(), "dist", "public");
      const simulatorDir = path.join(publicDir, "simulator");
      if (!fs.existsSync(simulatorDir)) {
        fs.mkdirSync(simulatorDir, { recursive: true });
      }

      const uniqueId = `video-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const outputFileName = `${uniqueId}.mp4`;
      const outputPath = path.join(tmpDir, "upload_output.mp4");
      
      const duaaText = await processSimulatorVideo(inputPath, outputPath, settings);

      const publicFilePath = path.join(simulatorDir, outputFileName);
      fs.copyFileSync(outputPath, publicFilePath);

      // Cleanup tmp files synchronously
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

      res.json({
        success: true,
        duaaText,
        videoUrl: `/simulator/${outputFileName}`
      });
    } catch (err: any) {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  writeStream.on("error", (err) => {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    res.status(500).json({ error: err.message });
  });
});

router.post("/simulator/publish", async (req, res) => {
  const { platforms } = req.body as { platforms?: string[] };
  try {
    const settings = getSettings();
    const result = await handleSimulatorPublish(settings, platforms);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

export default router;
