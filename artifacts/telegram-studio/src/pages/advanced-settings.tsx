import { useState, useEffect, useRef } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import type { AppSettings } from "@workspace/api-client-react/src/generated/api.schemas";
import { PremiumCard, PremiumButton, Slider, Select, Switch } from "@/components/ui-elements";
import { useToast } from "@/hooks/use-toast";
import { Video, SlidersHorizontal, Key, ChevronDown, Eye, EyeOff, Loader2, CheckCircle2, XCircle, Volume2, VolumeX, Bot, Activity, ExternalLink, Database, Download, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

function KeyInput({ label, placeholder, value, onChange, hint }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-foreground/70 block">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir="ltr"
          className="w-full bg-black/40 border border-border rounded-xl px-4 py-2.5 pl-10 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground text-sm font-mono shadow-inner placeholder:text-muted-foreground/40"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-[10px] text-muted-foreground/50 leading-relaxed">{hint}</p>}
    </div>
  );
}

function SocialTokenSection({ label, icon: Icon, value, onChange, onTest, testing, testResult, hint, inputType = "password" }: any) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-4 p-5 bg-gradient-to-br from-black/40 to-black/10 rounded-3xl border border-border/40 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-base font-black text-foreground tracking-tight">{label}</span>
        {testResult?.success === true && (
          <span className="mr-auto flex items-center gap-1.5 text-xs text-green-400 font-bold bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> {testResult.info}
          </span>
        )}
        {testResult?.success === false && (
          <span className="mr-auto flex items-center gap-1.5 text-xs text-red-400 font-bold max-w-[200px] truncate bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
            <XCircle className="w-3.5 h-3.5 shrink-0" /> {testResult.error || "فشل الاتصال"}
          </span>
        )}
      </div>
      <div className="flex gap-3 items-stretch">
        <div className="relative flex-1 group">
          <input
            type={inputType === "password" ? (show ? "text" : "password") : inputType}
            placeholder="أدخل التوكن أو الرابط..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            dir="ltr"
            className="w-full bg-black/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-foreground text-sm font-mono shadow-inner placeholder:text-muted-foreground/40 group-hover:border-border/80"
          />
          {inputType === "password" && (
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors rounded-lg hover:bg-white/5"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {onTest && (
          <button
            onClick={onTest}
            disabled={!value || testing}
            className="flex items-center justify-center gap-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-5 rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : "اختبار"}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground/50 leading-relaxed font-semibold">{hint}</p>}
    </div>
  );
}

function YouTubeTokenSection({
  refreshToken, clientId, clientSecret,
  onChangeRefresh, onChangeClientId, onChangeClientSecret,
  onTest, testing, testResult
}: {
  refreshToken: string; clientId: string; clientSecret: string;
  onChangeRefresh: (v: string) => void; onChangeClientId: (v: string) => void; onChangeClientSecret: (v: string) => void;
  onTest: () => void; testing: boolean; testResult?: { loading: boolean; success?: boolean; info?: string };
}) {
  const [show, setShow] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const { toast } = useToast();

  const handleCodeExchange = async (code: string) => {
    if (!code || !clientId || !clientSecret) return;
    setOauthLoading(true);
    try {
      const res = await fetch("/api/social/youtube-exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          clientId,
          clientSecret,
          redirectUri: `${window.location.origin}/oauth/callback`
        })
      });
      const data = await res.json();
      if (data.success && data.refreshToken) {
        onChangeRefresh(data.refreshToken);
        toast({ title: "تم ربط يوتيوب بنجاح", description: "تم جلب Refresh Token وحفظه." });
      } else {
        toast({ title: "فشل الربط", description: data.error || "تعذر جلب التوكن", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "فشل الاتصال", description: "تعذر الاتصال بالخادم", variant: "destructive" });
    } finally {
      setOauthLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Security: simple origin check
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        handleCodeExchange(event.data.code);
      }
    };

    // Check for stored code from manual redirection fallback (see oauth-callback.tsx)
    const savedCode = localStorage.getItem("oauth_code");
    if (savedCode) {
      localStorage.removeItem("oauth_code");
      handleCodeExchange(savedCode);
    }

    const interval = setInterval(() => {
      const liveCode = localStorage.getItem("oauth_code");
      if (liveCode) {
        localStorage.removeItem("oauth_code");
        handleCodeExchange(liveCode);
      }
    }, 1000);

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [clientId, clientSecret, onChangeRefresh, toast]);

  const handleConnect = () => {
    if (!clientId || !clientSecret) {
      toast({ title: "مطلوب معرف العميل (Client ID) والسر (Client Secret)", description: "يرجى تعبئتها أولاً لربط حساب يوتيوب.", variant: "destructive" });
      return;
    }
    const redirectUri = `${window.location.origin}/oauth/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
      access_type: 'offline',
      prompt: 'consent'
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    // Attempt to open popup, but also provide a way to open manually if blocked
    const win = window.open(url, 'oauth_popup', 'width=600,height=700');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      toast({ 
        title: "تم حظر النافذة المنبثقة", 
        description: "يرجى النقر على رابط 'فتح رابط الربط يدوياً' أدناه أو السماح بالنوافذ المنبثقة.", 
        variant: "default" 
      });
    }
  };

  const authUrl = () => {
    const redirectUri = `${window.location.origin}/oauth/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
      access_type: 'offline',
      prompt: 'consent'
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  return (
    <div className="space-y-5 p-5 bg-gradient-to-br from-black/40 to-black/10 rounded-3xl border border-border/40 hover:border-red-500/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl shrink-0">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        </div>
        <span className="text-base font-black text-foreground tracking-tight">يوتيوب (OAuth2)</span>
        {testResult?.success === true && (
          <span className="mr-auto flex items-center gap-1.5 text-xs text-green-400 font-bold bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> {testResult.info}
          </span>
        )}
        {testResult?.success === false && (
          <span className="mr-auto flex items-center gap-1.5 text-xs text-red-400 font-bold max-w-[200px] truncate bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
            <XCircle className="w-3.5 h-3.5 shrink-0" /> {testResult.error || "فشل الاتصال"}
          </span>
        )}
      </div>
      <div className="space-y-3">
        {[
          { label: "Client ID", value: clientId, onChange: onChangeClientId },
          { label: "Client Secret", value: clientSecret, onChange: onChangeClientSecret },
          { label: "Refresh Token", value: refreshToken, onChange: onChangeRefresh }
        ].map((field, i) => (
          <div key={i} className="relative group flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={show || i < 2 ? "text" : "password"}
                placeholder={field.label}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                dir="ltr"
                className="w-full bg-black/50 border border-border rounded-xl px-4 py-3 pt-6 focus:outline-none focus:border-red-500/50 transition-all text-foreground text-xs font-mono shadow-inner group-hover:border-border/80"
              />
              <span className="absolute top-1.5 left-4 text-[9px] font-black tracking-widest text-muted-foreground/60 uppercase pointer-events-none">{field.label}</span>
            </div>
            {i === 2 && (
              <button
                onClick={handleConnect}
                disabled={oauthLoading}
                className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-3 rounded-xl transition-colors whitespace-nowrap h-full"
              >
                {oauthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "🔗 جلب تلقائي"}
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="flex items-center justify-center w-full gap-2 p-2 text-xs font-bold text-muted-foreground bg-black/20 rounded-xl hover:bg-black/40 hover:text-foreground transition-colors border border-border/50"
        >
          {show ? <><EyeOff className="w-3.5 h-3.5" /> إخفاء</> : <><Eye className="w-3.5 h-3.5" /> إظهار التوكن</>}
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/30">
        <button onClick={onTest} disabled={!refreshToken || !clientId || !clientSecret || testing}
          className="flex items-center gap-2 text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-6 py-3 rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Activity className="w-4 h-4" /> اختبار الاتصال</>}
        </button>
        
        <div className="flex-1 min-w-[240px] space-y-2">
          <div className="p-3 rounded-xl bg-black/40 border border-border/40 text-[10px] leading-relaxed text-muted-foreground">
            <span className="text-red-400 font-black block mb-1">تعليمات Google Console لتجنب انتهاء الصلاحية:</span>
            1. فعل <span className="text-foreground">YouTube Data API v3</span>.<br/>
            2. أضف <span className="text-foreground font-bold">Redirect URI</span> (مهم جداً):<br/>
            <span className="text-primary font-mono select-all block bg-black/40 p-1 mt-1 rounded border border-primary/20">{window.location.origin}/oauth/callback</span>
            3. إذا كان التطبيق في وضع <span className="text-foreground">Testing</span>، يجب إضافة إيميلك كـ <span className="text-foreground font-bold">Test User</span> لتجنب خطأ 403.<br/>
            4. <span className="text-yellow-400 font-bold">ملاحظة هامة جداً لدوام المفاتيح:</span> إذا كانت حالة مشروعك في Google Console هي <span className="text-foreground font-bold">Testing</span>، ستنتهي صلاحية الـ Refresh Token تلقائياً <span className="text-red-400 font-bold">خلال 7 أيام فقط</span>! لتفادي ذلك، قم بالدخول لصفحة OAuth Consent Screen وانقر على <span className="text-foreground font-bold">Publish App</span> لتغيير حالته إلى الإنتاج (Production).<br/>
            5. تأكد من إدخال <span className="text-foreground font-bold">Refresh Token</span> الفعلي (الذي يبدأ بـ 1//) وليس Access Token مؤقت (والذي يبدأ بـ ya29 وينتهي تلقائياً بعد ساعة واحدة). استخدم زر <span className="text-foreground font-bold">🔗 جلب تلقائي</span> المدمج لإنشاء التوكن الدائم بسهولة.
          </div>
          
          {clientId && clientSecret && (
            <a 
              href={authUrl()} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-2.5 text-[11px] font-black text-red-400 bg-red-500/5 rounded-xl hover:bg-red-500/10 transition-all border border-red-500/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              فتح رابط الربط يدوياً (إذا فشل الزر العلوي)
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdvancedSettings() {
  const { data: serverSettings, isLoading } = useGetSettings();
  const { mutate: updateSettings, isPending } = useUpdateSettings();
  const { toast } = useToast();

  const exportBackup = () => {
    if (!settings) {
      toast({
        variant: "destructive",
        title: "خطأ في التصدير",
        description: "الإعدادات غير محملة بعد، يرجى المحاولة بعد لحظات.",
      });
      return;
    }
    const backupData = {
      settings: settings,
      creds: {
        botToken,
        geminiKey,
        geminiKey2,
        geminiKey3,
        geminiKey4,
        geminiKey5,
        groqKey,
        lmStudioUrl,
        lmStudioKey
      }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quran_bot_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "تم تصدير البيانات بنجاح",
      description: "تم تحميل ملف النسخ الاحتياطي الخاص بك بنجاح.",
    });
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.settings) {
          await fetch("/api/bot/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data.settings)
          });
          setSettings(data.settings);
        }
        if (data.creds) {
          await fetch("/api/credentials/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data.creds)
          });
          setBotToken(data.creds.botToken || "");
          setGeminiKey(data.creds.geminiKey || "");
          setGeminiKey2(data.creds.geminiKey2 || "");
          setGeminiKey3(data.creds.geminiKey3 || "");
          setGeminiKey4(data.creds.geminiKey4 || "");
          setGeminiKey5(data.creds.geminiKey5 || "");
          setGroqKey(data.creds.groqKey || "");
          setLmStudioUrl(data.creds.lmStudioUrl || "");
          setLmStudioKey(data.creds.lmStudioKey || "");
        }
        toast({
          title: "تم استيراد البيانات بنجاح",
          description: "تمت استعادة كافة المفاتيح والإعدادات بنجاح وجاري إعادة تشغيل اللوحة.",
        });
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "فشل الاستيراد",
          description: "تأكد من اختيار ملف نسخ احتياطي صالح تم تصديره مسبقاً من هذا التطبيق.",
        });
      }
    };
    reader.readAsText(file);
  };

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [keysOpen, setKeysOpen] = useState(true);
  const [botToken, setBotToken] = useState("");
  const [telegramApiUrl, setTelegramApiUrl] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiKey2, setGeminiKey2] = useState("");
  const [geminiKey3, setGeminiKey3] = useState("");
  const [geminiKey4, setGeminiKey4] = useState("");
  const [geminiKey5, setGeminiKey5] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [lmStudioUrl, setLmStudioUrl] = useState("");
  const [lmStudioKey, setLmStudioKey] = useState("");
  const [botStatus, setBotStatus] = useState<{ applying: boolean; result?: { success: boolean; message: string } }>({ applying: false });
  const [telegramStatus, setTelegramStatus] = useState<{ loading: boolean; valid?: boolean; botName?: string; botUsername?: string; error?: string } | null>(null);
  const [socialTests, setSocialTests] = useState<Record<string, { loading: boolean; success?: boolean; info?: string }>>({});
  const [geminiStatus, setGeminiStatus] = useState<Record<string, { loading: boolean; valid?: boolean; status?: string; message?: string; models?: string[]; error?: string }>>({});
  
  const [testDuaaLoading, setTestDuaaLoading] = useState(false);
  const [testDuaaResult, setTestDuaaResult] = useState<{ duaa: string; modelUsed: string } | null>(null);
  const [testDuaaError, setTestDuaaError] = useState<string | null>(null);

  const handleTestDuaaGeneration = async () => {
    setTestDuaaLoading(true);
    setTestDuaaResult(null);
    setTestDuaaError(null);
    try {
      const res = await fetch("/api/gemini/test-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل توليد الدعاء الاختباري");
      }
      setTestDuaaResult(data);
    } catch (err) {
      setTestDuaaError(err instanceof Error ? err.message : String(err));
    } finally {
      setTestDuaaLoading(false);
    }
  };

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botRestartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const telegramCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (serverSettings) setSettings(serverSettings);
  }, [serverSettings]);

  useEffect(() => {
    fetch("/api/credentials").then(r => r.json()).then((creds: any) => {
      setBotToken(creds.botToken || "");
      setTelegramApiUrl(creds.telegramApiUrl || "");
      setGeminiKey(creds.geminiKey || "");
      setGeminiKey2(creds.geminiKey2 || "");
      setGeminiKey3(creds.geminiKey3 || "");
      setGeminiKey4(creds.geminiKey4 || "");
      setGeminiKey5(creds.geminiKey5 || "");
      setGroqKey(creds.groqKey || "");
      setLmStudioUrl(creds.lmStudioUrl || "");
      setLmStudioKey(creds.lmStudioKey || "");

      setTimeout(() => {
        const k1 = creds.geminiKey;
        const k2 = creds.geminiKey2;
        const k3 = creds.geminiKey3;
        const k4 = creds.geminiKey4;
        const k5 = creds.geminiKey5;
        if (k1) checkGeminiStatus(k1, "geminiKey");
        if (k2) checkGeminiStatus(k2, "geminiKey2");
        if (k3) checkGeminiStatus(k3, "geminiKey3");
        if (k4) checkGeminiStatus(k4, "geminiKey4");
        if (k5) checkGeminiStatus(k5, "geminiKey5");
      }, 500);

      if (creds.botToken) {
        checkTelegramStatus(creds.botToken, creds.telegramApiUrl || "");
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSettingChange = (newSettings: AppSettings) => {
    setSettings(newSettings);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateSettings({ data: newSettings });
    }, 1200);
  };

  const checkGeminiStatus = async (key: string, fieldName: string) => {
    if (!key) return;
    setGeminiStatus(p => ({ ...p, [fieldName]: { loading: true } }));
    try {
      const res = await fetch(`/api/gemini-status?geminiKey=${encodeURIComponent(key)}`);
      const data = await res.json() as { valid: boolean; status: string; message: string; models?: string[]; error?: string };
      setGeminiStatus(p => ({ ...p, [fieldName]: { loading: false, valid: data.valid, status: data.status, message: data.message, models: data.models, error: data.error } }));
    } catch {
      setGeminiStatus(p => ({ ...p, [fieldName]: { loading: false, valid: false, status: "error", message: "تعذّر الاتصال بالخادم" } }));
    }
  };

  const checkTelegramStatus = async (token: string, customUrl = telegramApiUrl) => {
    if (!token) { setTelegramStatus(null); return; }
    setTelegramStatus({ loading: true });
    try {
      const res = await fetch("/api/bot/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: token, telegramApiUrl: customUrl }),
      });
      const data = await res.json() as { success: boolean; botName?: string; botUsername?: string; error?: string };
      setTelegramStatus({ loading: false, valid: data.success, botName: data.botName, botUsername: data.botUsername, error: data.error });
    } catch {
      setTelegramStatus({ loading: false, valid: false, error: "تعذّر الاتصال بالخادم" });
    }
  };

  const saveKeys = (token: string, gemini: string, gemini2: string, gemini3: string, gemini4: string, gemini5: string, groq: string, lmUrl: string, lmKey: string, telApiUrl = telegramApiUrl) => {
    if (!token && !gemini) return;
    fetch("/api/credentials/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botToken: token, geminiKey: gemini, geminiKey2: gemini2, geminiKey3: gemini3, geminiKey4: gemini4, geminiKey5: gemini5, groqKey: groq, lmStudioUrl: lmUrl, lmStudioKey: lmKey, telegramApiUrl: telApiUrl }),
    }).catch(() => {});
  };

  const handleBotKeyChange = (field: "botToken" | "geminiKey" | "geminiKey2" | "geminiKey3" | "geminiKey4" | "geminiKey5" | "groqKey" | "lmStudioUrl" | "lmStudioKey" | "telegramApiUrl", value: string) => {
    const newToken = field === "botToken" ? value : botToken;
    const newTelegramApiUrl = field === "telegramApiUrl" ? value : telegramApiUrl;
    const newGemini = field === "geminiKey" ? value : geminiKey;
    const newGemini2 = field === "geminiKey2" ? value : geminiKey2;
    const newGemini3 = field === "geminiKey3" ? value : geminiKey3;
    const newGemini4 = field === "geminiKey4" ? value : geminiKey4;
    const newGemini5 = field === "geminiKey5" ? value : geminiKey5;
    const newGroq = field === "groqKey" ? value : groqKey;
    const newLmUrl = field === "lmStudioUrl" ? value : lmStudioUrl;
    const newLmKey = field === "lmStudioKey" ? value : lmStudioKey;

    if (field === "botToken") { setBotToken(value); setTelegramStatus(null); }
    if (field === "telegramApiUrl") { setTelegramApiUrl(value); }
    if (field === "geminiKey") { setGeminiKey(value); setGeminiStatus(p => ({...p, geminiKey: null as any})); }
    if (field === "geminiKey2") { setGeminiKey2(value); setGeminiStatus(p => ({...p, geminiKey2: null as any})); }
    if (field === "geminiKey3") { setGeminiKey3(value); setGeminiStatus(p => ({...p, geminiKey3: null as any})); }
    if (field === "geminiKey4") { setGeminiKey4(value); setGeminiStatus(p => ({...p, geminiKey4: null as any})); }
    if (field === "geminiKey5") { setGeminiKey5(value); setGeminiStatus(p => ({...p, geminiKey5: null as any})); }
    if (field === "groqKey") { setGroqKey(value); }
    if (field === "lmStudioUrl") { setLmStudioUrl(value); }
    if (field === "lmStudioKey") { setLmStudioKey(value); }

    if (telegramCheckTimer.current) clearTimeout(telegramCheckTimer.current);
    if (field === "botToken") {
      telegramCheckTimer.current = setTimeout(() => checkTelegramStatus(value, telegramApiUrl), 1200);
    } else if (field === "telegramApiUrl") {
      telegramCheckTimer.current = setTimeout(() => checkTelegramStatus(botToken, value), 1200);
    } else if (field === "geminiKey") {
      telegramCheckTimer.current = setTimeout(() => checkGeminiStatus(value, "geminiKey"), 1200);
    } else if (field === "geminiKey2") {
      telegramCheckTimer.current = setTimeout(() => checkGeminiStatus(value, "geminiKey2"), 1200);
    } else if (field === "geminiKey3") {
      telegramCheckTimer.current = setTimeout(() => checkGeminiStatus(value, "geminiKey3"), 1200);
    } else if (field === "geminiKey4") {
      telegramCheckTimer.current = setTimeout(() => checkGeminiStatus(value, "geminiKey4"), 1200);
    } else if (field === "geminiKey5") {
      telegramCheckTimer.current = setTimeout(() => checkGeminiStatus(value, "geminiKey5"), 1200);
    }

    if (botRestartTimer.current) clearTimeout(botRestartTimer.current);
    botRestartTimer.current = setTimeout(() => {
      saveKeys(newToken, newGemini, newGemini2, newGemini3, newGemini4, newGemini5, newGroq, newLmUrl, newLmKey, newTelegramApiUrl);
      applyBotKeys(newToken, newGemini, newGemini2, newGemini3, newGemini4, newGemini5, newGroq, newLmUrl, newLmKey, newTelegramApiUrl);
    }, 2000);
  };

  const applyBotKeysForceRestart = async () => {
    if (!botToken || !geminiKey) return;
    setBotStatus({ applying: true });
    try {
      const res = await fetch("/api/bot/restart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken, geminiKey, geminiKey2, geminiKey3, geminiKey4, geminiKey5, groqKey, lmStudioUrl, lmStudioKey, telegramApiUrl }),
      });
      const data = await res.json() as { success: boolean; message: string };
      setBotStatus({ applying: false, result: data });
      if (data.success) toast({ title: "تم تحديث التوكن", description: data.message });
      else toast({ title: "فشل", description: data.message, variant: "destructive" });
    } catch {
      setBotStatus({ applying: false, result: { success: false, message: "تعذّر الاتصال بالخادم" } });
    }
  };

  const applyBotKeys = async (token: string, gemini: string, gemini2: string, gemini3: string, gemini4: string, gemini5: string, groq: string, lmUrl: string, lmKey: string, telApiUrl = telegramApiUrl) => {
    if (!token || !gemini) return;
    setBotStatus({ applying: true });
    try {
      const res = await fetch("/api/bot/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: token, geminiKey: gemini, geminiKey2: gemini2, geminiKey3: gemini3, geminiKey4: gemini4, geminiKey5: gemini5, groqKey: groq, lmStudioUrl: lmUrl, lmStudioKey: lmKey, telegramApiUrl: telApiUrl }),
      });
      const data = await res.json() as { success: boolean; message: string };
      setBotStatus({ applying: false, result: data });
      if (data.success) toast({ title: "تم تطبيق المفاتيح", description: data.message });
    } catch {
      setBotStatus({ applying: false, result: { success: false, message: "تعذّر الاتصال بالخادم" } });
    }
  };

  const handleSocialTokenChange = (field: keyof AppSettings, value: string) => {
    if (!settings) return;
    const newSettings = { ...settings, [field]: value };
    handleSettingChange(newSettings);
  };

  const testSocial = async (platform: "youtube" | "facebook" | "facebookPage" | "tiktok" | "make" | "zapier") => {
    if (platform === "make") {
      if (!settings?.makeWebhookUrl) return;
      setSocialTests(p => ({ ...p, make: { loading: true } }));
      try {
        const res = await fetch("/api/social/test-make", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: settings.makeWebhookUrl }),
        });
        const data = await res.json() as { success: boolean; info?: string; error?: string };
        if (data.success) {
          setSocialTests(p => ({ ...p, make: { loading: false, success: true, info: data.info || "تم الاتصال بـ Make" } }));
        } else {
          setSocialTests(p => ({ ...p, make: { loading: false, success: false, error: data.error } }));
        }
      } catch {
        setSocialTests(p => ({ ...p, make: { loading: false, success: false } }));
      }
      return;
    }
    if (platform === "zapier") {
      if (!settings?.zapierWebhookUrl) return;
      setSocialTests(p => ({ ...p, zapier: { loading: true } }));
      try {
        const res = await fetch("/api/social/test-make", {  // We reuse Make test endpoint since Webhook works the same
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: settings.zapierWebhookUrl }),
        });
        const data = await res.json() as { success: boolean; info?: string; error?: string };
        if (data.success) {
          setSocialTests(p => ({ ...p, zapier: { loading: false, success: true, info: data.info || "تم الاتصال بـ Zapier" } }));
        } else {
          setSocialTests(p => ({ ...p, zapier: { loading: false, success: false, error: data.error } }));
        }
      } catch {
        setSocialTests(p => ({ ...p, zapier: { loading: false, success: false } }));
      }
      return;
    }
    if (platform === "youtube") {
      if (!settings?.youtubeToken || !settings?.youtubeClientId || !settings?.youtubeClientSecret) return;
      setSocialTests(p => ({ ...p, youtube: { loading: true } }));
      try {
        const res = await fetch("/api/social/test-youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: settings.youtubeToken, clientId: settings.youtubeClientId, clientSecret: settings.youtubeClientSecret }),
        });
        const data = await res.json() as { success: boolean; channelName?: string; subscribers?: string; error?: string };
        if (data.success) {
          const info = (data.channelName || "") + (data.subscribers ? ` (${data.subscribers})` : "");
          setSocialTests(p => ({ ...p, youtube: { loading: false, success: true, info } }));
        } else {
          setSocialTests(p => ({ ...p, youtube: { loading: false, success: false, error: data.error } }));
        }
      } catch (e) {
        setSocialTests(p => ({ ...p, youtube: { loading: false, success: false, error: "تعذر الاتصال بالخادم" } }));
      }
      return;
    }
    if (platform === "facebook") {
      if (!settings?.facebookToken) return;
      setSocialTests(p => ({ ...p, facebook: { loading: true } }));
      try {
        const res = await fetch("/api/social/test-facebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: settings.facebookToken }),
        });
        const data = await res.json() as { success: boolean; pageName?: string; followers?: string; error?: string };
        if (data.success) {
          setSocialTests(p => ({ ...p, facebook: { loading: false, success: true, info: data.pageName ? `${data.pageName} (${data.followers || 0})` : "تم الاتصال" } }));
        } else {
          setSocialTests(p => ({ ...p, facebook: { loading: false, success: false, error: data.error } }));
        }
      } catch (e) {
        setSocialTests(p => ({ ...p, facebook: { loading: false, success: false, error: "تعذر الاتصال بالخادم" } }));
      }
      return;
    }
    if (platform === "facebookPage") {
      if (!settings?.facebookPageToken) return;
      setSocialTests(p => ({ ...p, facebookPage: { loading: true } }));
      try {
        const res = await fetch("/api/social/test-facebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: settings.facebookPageToken }),
        });
        const data = await res.json() as { success: boolean; pageName?: string; followers?: string; error?: string };
        if (data.success) {
          setSocialTests(p => ({ ...p, facebookPage: { loading: false, success: true, info: data.pageName ? `${data.pageName} (${data.followers || 0})` : "تم الاتصال" } }));
        } else {
          setSocialTests(p => ({ ...p, facebookPage: { loading: false, success: false, error: data.error } }));
        }
      } catch (e) {
        setSocialTests(p => ({ ...p, facebookPage: { loading: false, success: false, error: "تعذر الاتصال بالخادم" } }));
      }
      return;
    }
    const token = settings?.tiktokToken;
    if (!token) return;
    setSocialTests(p => ({ ...p, [platform]: { loading: true } }));
    try {
      const res = await fetch(`/api/social/test-${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json() as { success: boolean; channelName?: string; pageName?: string; displayName?: string; subscribers?: number; followers?: number; error?: string };
      if (data.success) {
        const name = data.channelName || data.pageName || data.displayName || "";
        const count = data.subscribers || data.followers;
        const info = name + (count ? ` (${count.toLocaleString()})` : "");
        setSocialTests(p => ({ ...p, [platform]: { loading: false, success: true, info } }));
      } else {
        setSocialTests(p => ({ ...p, [platform]: { loading: false, success: false, error: data.error } }));
      }
    } catch (e) {
      setSocialTests(p => ({ ...p, [platform]: { loading: false, success: false, error: "تعذر الاتصال بالخادم" } }));
    }
  };

  if (!settings || isLoading) {
    return <div className="animate-pulse h-[600px] bg-card rounded-[2rem]" />;
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-4xl font-black mb-2 sm:mb-3 tracking-tight text-foreground">الإعدادات المتقدمة</h2>
          <p className="text-lg font-semibold text-muted-foreground">المفاتيح وخيارات المعالجة المتقدمة</p>
        </div>
        {isPending && (
          <div className="flex items-center gap-2 text-sm text-primary/70 font-semibold">
            <Loader2 className="w-4 h-4 animate-spin" />
            حفظ تلقائي...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* ── Core Bot Keys ── */}
        <PremiumCard title="مفاتيح الذكاء الاصطناعي والبوت" icon={Key}>
           <div className="space-y-6">
              <KeyInput
                label="توكن بوت تيليغرام"
                placeholder="123456789:AAHf..."
                value={botToken}
                onChange={(v) => handleBotKeyChange("botToken", v)}
                hint="من @BotFather في تيليغرام"
              />
              <KeyInput
                label="رابط Telegram API مخصص (لتجاوز الحجب والشبكات المحجوبة)"
                placeholder="https://api.telegram.org"
                value={telegramApiUrl}
                onChange={(v) => handleBotKeyChange("telegramApiUrl", v)}
                hint="مثال: https://api.telegram.org أو عنوان بروكسي مخصص لتفادي حجب تيليغرام على خوادم الاستضافة مثل HuggingFace."
              />
              <div className="flex items-center gap-2 flex-wrap pb-4 border-b border-border/30">
                <button
                  onClick={() => checkTelegramStatus(botToken)}
                  disabled={!botToken || telegramStatus?.loading}
                  className="flex items-center justify-center gap-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  {telegramStatus?.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  فحص التوكن
                </button>
                
                <button
                  onClick={() => applyBotKeysForceRestart()}
                  disabled={!botToken || botStatus.applying}
                  className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-green-500/80 hover:bg-green-500 border border-green-500/50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  {botStatus.applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                  تحديث البوت فوري
                </button>

                {telegramStatus && !telegramStatus.loading && (
                  <span className={cn(
                    "text-xs font-bold px-3 py-2 rounded-xl border",
                    telegramStatus.valid
                      ? "text-green-400 bg-green-500/10 border-green-500/20"
                      : "text-red-400 bg-red-500/10 border-red-500/20"
                  )}>
                    {telegramStatus.valid
                      ? `✅ متصل — ${telegramStatus.botName} (@${telegramStatus.botUsername})`
                      : `❌ ${telegramStatus.error || "توكن غير صالح"}`}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black text-foreground">مفاتيح تشغيل Gemini</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "geminiKey", label: "(1) الأساسي", val: geminiKey, set: setGeminiKey },
                    { key: "geminiKey2", label: "(2) احتياطي", val: geminiKey2, set: setGeminiKey2 },
                    { key: "geminiKey3", label: "(3) احتياطي", val: geminiKey3, set: setGeminiKey3 },
                    { key: "geminiKey4", label: "(4) احتياطي", val: geminiKey4, set: setGeminiKey4 },
                    { key: "geminiKey5", label: "(5) احتياطي", val: geminiKey5, set: setGeminiKey5 }
                  ].map((field) => (
                    <div key={field.key} className="flex flex-col gap-2 p-3.5 bg-black/20 rounded-2xl border border-border/50 hover:border-primary/20 transition-colors">
                      <KeyInput
                        label={`مفتاح Gemini AI ${field.label}`}
                        placeholder="AIzaSy..."
                        value={field.val}
                        onChange={(v) => handleBotKeyChange(field.key as any, v)}
                      />
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <button
                          onClick={() => checkGeminiStatus(field.val, field.key)}
                          disabled={!field.val || geminiStatus[field.key]?.loading}
                          className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {geminiStatus[field.key]?.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          فحص
                        </button>
                        {geminiStatus[field.key] && !geminiStatus[field.key].loading && (
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-1.5 rounded-lg border truncate max-w-[150px]",
                            geminiStatus[field.key].valid
                              ? "text-green-400 bg-green-500/10 border-green-500/20"
                              : geminiStatus[field.key].status === "quota_exceeded"
                                ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                                : geminiStatus[field.key].status === "api_disabled"
                                  ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                  : "text-red-400 bg-red-500/10 border-red-500/20"
                          )}>
                            {geminiStatus[field.key].message}
                          </span>
                        )}
                      </div>
                      {geminiStatus[field.key] && !geminiStatus[field.key].loading && geminiStatus[field.key].error && (
                        <div className="text-[10px] text-red-400 bg-red-500/5 border border-red-500/10 rounded-xl px-3 py-2 mt-1 leading-relaxed break-words font-mono">
                          {geminiStatus[field.key].status === "api_disabled" ? (
                            <div className="space-y-1.5">
                              <p className="text-amber-400 font-bold">⚠️ تنبيه: المفتاح صحيح وموجود، لكن يجب تفعيل "Gemini API" في مشروع Google Cloud الخاص بك لاستخدامه.</p>
                              <p className="text-muted-foreground font-sans">تفضل بالضغط على الرابط أدناه لتفعيل الـ API مباشرة في حسابك:</p>
                              <div className="p-2.5 bg-black/40 rounded-xl text-xs leading-normal">
                                {(() => {
                                  const text = geminiStatus[field.key].error || "";
                                  const urlRegex = /(https?:\/\/[^\s]+)/g;
                                  const parts = text.split(urlRegex);
                                  return parts.map((part, index) => {
                                    if (urlRegex.test(part)) {
                                      let url = part;
                                      // Clean up trailing punctuation
                                      if (url.endsWith(".") || url.endsWith(",") || url.endsWith(")") || url.endsWith("]")) {
                                        url = url.slice(0, -1);
                                      }
                                      return (
                                        <a 
                                          key={index} 
                                          href={url} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-blue-400 hover:text-blue-300 underline font-bold break-all inline-block my-1 font-sans"
                                        >
                                          {url}
                                        </a>
                                      );
                                    }
                                    return part;
                                  });
                                })()}
                              </div>
                            </div>
                          ) : (
                            geminiStatus[field.key].error
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {geminiStatus["geminiKey"]?.valid && geminiStatus["geminiKey"].models && geminiStatus["geminiKey"].models.length > 0 && (
                  <div className="text-[11px] text-muted-foreground/80 bg-black/30 rounded-xl px-4 py-3 border border-border/30 font-semibold mt-2 text-center">
                    📋 موديلات الأساسي: <span className="text-primary font-mono">{geminiStatus["geminiKey"].models.slice(0, 3).join(" · ")}{geminiStatus["geminiKey"].models.length > 3 ? ` · +${geminiStatus["geminiKey"].models.length - 3}` : ""}</span>
                  </div>
                )}

                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 mt-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <span className="text-emerald-400">⚡</span>
                        <span>تجربة وتوليد دعاء اختباري</span>
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-1">توليد نص دعاء سريع مع اسم الموديل للتأكد من عمل مفتاح Gemini بنجاح دون نشره تلقائياً.</p>
                    </div>
                    <button
                      onClick={handleTestDuaaGeneration}
                      disabled={testDuaaLoading || !geminiKey}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition-all disabled:opacity-40"
                    >
                      {testDuaaLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "توليد دعاء تجريبي 🎲"}
                    </button>
                  </div>

                  {testDuaaResult && (
                    <div className="mt-4 p-3.5 bg-black/40 border border-emerald-500/10 rounded-xl space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-black text-emerald-400 flex items-center gap-1">
                          <span>✅</span> الدعاء المولد للتجربة:
                        </span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/20">
                          الموديل: {testDuaaResult.modelUsed}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/95 leading-relaxed font-sans font-medium text-right" dir="rtl">{testDuaaResult.duaa}</p>
                    </div>
                  )}

                  {testDuaaError && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-bold leading-relaxed">
                      ❌ فشل الاتصال برابط التوليد أو المفتاح غير صالح: {testDuaaError}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/30">
                <label className="text-sm font-black text-foreground">بدائل إضافية (اختياري)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <KeyInput
                    label="مفتاح Groq AI"
                    placeholder="gsk_..."
                    value={groqKey}
                    onChange={(v) => handleBotKeyChange("groqKey", v)}
                    hint="يسخدم كبديل أسرع"
                  />
                  <div className="flex flex-col gap-2">
                    <KeyInput
                      label="رابط LM Studio"
                      placeholder="http://localhost:1234/v1"
                      value={lmStudioUrl}
                      onChange={(v) => handleBotKeyChange("lmStudioUrl", v)}
                    />
                    <KeyInput
                      label="توكن LM Studio"
                      placeholder="lm-studio"
                      value={lmStudioKey}
                      onChange={(v) => handleBotKeyChange("lmStudioKey", v)}
                    />
                  </div>
                </div>
              </div>

              {botStatus.result && (
                <div className={cn("text-sm font-bold flex items-center justify-center p-3 rounded-2xl border", botStatus.result.success ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-red-400 bg-red-500/10 border-red-500/20")}>
                  {botStatus.result.success ? "✅" : "❌"} {botStatus.result.message}
                </div>
              )}
              <div className="text-[11px] font-bold text-center text-muted-foreground/50 bg-black/20 p-2.5 rounded-xl border border-border/20">
                💾 يُحفظ تلقائياً ويُطبّق بعد ثانيتين
              </div>
           </div>
        </PremiumCard>

        {/* ── Social Media & Sync ── */}
        <PremiumCard title="منصات النشر الاجتماعي" icon={SlidersHorizontal}>
           <div className="space-y-6">
              <YouTubeTokenSection
                refreshToken={settings.youtubeToken || ""}
                clientId={settings.youtubeClientId || ""}
                clientSecret={settings.youtubeClientSecret || ""}
                onChangeRefresh={(v: string) => handleSocialTokenChange("youtubeToken", v)}
                onChangeClientId={(v: string) => handleSocialTokenChange("youtubeClientId", v)}
                onChangeClientSecret={(v: string) => handleSocialTokenChange("youtubeClientSecret", v)}
                onTest={() => testSocial("youtube")}
                testing={socialTests.youtube?.loading ?? false}
                testResult={socialTests.youtube}
              />
              <SocialTokenSection
                label="فيسبوك (لجلب معلومات القناة فقط)"
                icon={({ className }: any) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>}
                value={settings.facebookPageToken || ""}
                onChange={(v: string) => handleSocialTokenChange("facebookPageToken", v)}
                onTest={() => testSocial("facebookPage")}
                testing={socialTests.facebookPage?.loading}
                testResult={socialTests.facebookPage}
                hint="Page Access Token مخصص لجلب الإحصائيات ومعلومات القناة فقط"
              />
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-sm font-bold text-foreground">طريقة النشر عبر فيسبوك</label>
                  <div className="w-1/2">
                    <Select
                      options={[
                        { label: "توكن فيسبوك (مباشر)", value: "token" },
                        { label: "موقع Make.com (Webhooks)", value: "make" },
                        { label: "موقع Zapier.com (Webhooks)", value: "zapier" },
                      ]}
                      value={settings.facebookPublishMethod || "token"}
                      onChange={(v) => handleSettingChange({ ...settings, facebookPublishMethod: v as "token" | "make" | "zapier" })}
                    />
                  </div>
                </div>

                {(!settings.facebookPublishMethod || settings.facebookPublishMethod === "token") && (
                  <SocialTokenSection
                    label="فيسبوك (توكن النشر - Graph API)"
                    icon={({ className }: any) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-4H8l5-6v4h3l-5 6z" /></svg>}
                    value={settings.facebookToken || ""}
                    onChange={(v: string) => handleSocialTokenChange("facebookToken", v)}
                    onTest={() => testSocial("facebook")}
                    testing={socialTests.facebook?.loading}
                    testResult={socialTests.facebook}
                    hint="Page Access Token للنشر التلقائي"
                  />
                )}

                {(!settings.facebookPublishMethod || settings.facebookPublishMethod === "token") && settings.facebookToken && (
                  <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-1 pl-4">
                      <p className="text-xs font-bold text-foreground">📘 تفعيل النشر الفعلي على فيسبوك</p>
                      <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                        عند إلغاء التفعيل، سيقوم التطبيق بـ (مراقبة الأداء وجلب معلومات المتابعين فقط) دون نشر أي منشورات أو فيديوهات تلقائياً.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.facebookPublishEnabled ?? false}
                        onChange={(e) => handleSettingChange({ ...settings, facebookPublishEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 font-bold"></div>
                    </label>
                  </div>
                )}

                {settings.facebookPublishMethod === "make" && (
                  <SocialTokenSection
                    label="رابط ويبهوك Make"
                    icon={({ className }: any) => <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 2l9 4.5v7l-9 4.5l-9 -4.5v-7z" /></svg>}
                    value={settings.makeWebhookUrl || ""}
                    onChange={(v: string) => handleSocialTokenChange("makeWebhookUrl", v)}
                    onTest={() => testSocial("make")}
                    testing={socialTests.make?.loading}
                    testResult={socialTests.make}
                    inputType="text"
                    hint="رابط Webhook المخصص لتلقي الإشعارات والمنشورات (POST)"
                  />
                )}

                {settings.facebookPublishMethod === "zapier" && (
                  <SocialTokenSection
                    label="رابط ويبهوك Zapier"
                    icon={({ className }: any) => <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 2l9 4.5v7l-9 4.5l-9 -4.5v-7z" /></svg>}
                    value={settings.zapierWebhookUrl || ""}
                    onChange={(v: string) => handleSocialTokenChange("zapierWebhookUrl", v)}
                    onTest={() => testSocial("zapier")}
                    testing={socialTests.zapier?.loading || false}
                    testResult={socialTests.zapier}
                    inputType="text"
                    hint="رابط Webhook المخصص لتلقي الإشعارات من Zapier"
                  />
                )}
              </div>
           </div>
        </PremiumCard>
      </div>



      {/* ── Backup & Restore Utility ── */}
      <PremiumCard title="النسخ الاحتياطي واستعادة البيانات بالكامل" icon={Database}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
          <div className="space-y-4 p-5 bg-gradient-to-br from-black/40 to-black/10 rounded-3xl border border-border/40 hover:border-primary/35 transition-all">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-primary/10 rounded-xl"><Download className="w-5 h-5 text-primary" /></span>
              <h4 className="font-bold text-foreground">تصدير النسخة الاحتياطية</h4>
            </div>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              قم بتحميل ملف يحتوي على كافة الإعدادات، مفاتيح الربط، وتوكن البوت. يمكنك الاحتفاظ به كملف جذر لاستيراده في أي وقت أو عند تغيير المتصفح لحفظ بياناتك بالكامل.
            </p>
            <button
              onClick={exportBackup}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white bg-primary hover:bg-primary/95 px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-primary/10 active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              تصدير وتحميل النسخة الاحتياطية (JSON)
            </button>
          </div>

          <div className="space-y-4 p-5 bg-gradient-to-br from-black/40 to-black/10 rounded-3xl border border-border/40 hover:border-green-500/35 transition-all relative">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-green-505/10 rounded-xl"><Upload className="w-5 h-5 text-green-400" /></span>
              <h4 className="font-bold text-foreground">استيراد النسخة الاحتياطية</h4>
            </div>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              اختر ملف النسخ الاحتياطي الذي قمت بتصديره مسبقاً لاستيراد واسترجاع جميع الإعدادات ومفاتيح الربط فورياً وبضغطة زر واحدة حتى عند تبديل المتصفحات.
            </p>
            <label className="w-full flex items-center justify-center gap-2 text-xs font-bold text-foreground bg-black/40 hover:bg-black/60 border border-border px-4 py-3 rounded-xl transition-all cursor-pointer shadow-md select-none active:scale-[0.98]">
              <Upload className="w-3.5 h-3.5 text-green-400" />
              استيراد ورفع ملف النسخة الاحتياطية
              <input
                type="file"
                accept=".json"
                onChange={importBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}
