const fs = require('fs');
let content = fs.readFileSync('artifacts/telegram-studio/src/pages/advanced-settings.tsx', 'utf8');

content = content.replace(
  /const \[geminiStatus, setGeminiStatus\] = useState\<{ loading: boolean; valid\?: boolean; status\?: string; message\?: string; models\?: string\[\] } \| null>\(null\);/,
  `const [geminiStatus, setGeminiStatus] = useState<Record<string, { loading: boolean; valid?: boolean; status?: string; message?: string; models?: string[] }>>({});`
);

content = content.replace(
  /const checkGeminiStatus = async \(key: string\) => {[\s\S]*?};/,
  `const checkGeminiStatus = async (key: string, fieldName: string) => {
    if (!key) return;
    setGeminiStatus(p => ({ ...p, [fieldName]: { loading: true } }));
    try {
      const res = await fetch(\`/api/gemini-status?geminiKey=\${encodeURIComponent(key)}\`);
      const data = await res.json() as { valid: boolean; status: string; message: string; models?: string[] };
      setGeminiStatus(p => ({ ...p, [fieldName]: { loading: false, valid: data.valid, status: data.status, message: data.message, models: data.models } }));
    } catch {
      setGeminiStatus(p => ({ ...p, [fieldName]: { loading: false, valid: false, status: "error", message: "تعذّر الاتصال بالخادم" } }));
    }
  };`
);

content = content.replace(
  /if \(field === "geminiKey"\) \{ setGeminiKey\(value\); localStorage\.setItem\("geminiKey", value\); setGeminiStatus\(null\); \}/,
  `if (field === "geminiKey") { setGeminiKey(value); localStorage.setItem("geminiKey", value); setGeminiStatus(p => ({...p, geminiKey: null as any})); }`
);

content = content.replace(
  /if \(field === "geminiKey2"\) \{ setGeminiKey2\(value\); localStorage\.setItem\("geminiKey2", value\); \}/,
  `if (field === "geminiKey2") { setGeminiKey2(value); localStorage.setItem("geminiKey2", value); setGeminiStatus(p => ({...p, geminiKey2: null as any})); }`
);

content = content.replace(
  /if \(field === "geminiKey3"\) \{ setGeminiKey3\(value\); localStorage\.setItem\("geminiKey3", value\); \}/,
  `if (field === "geminiKey3") { setGeminiKey3(value); localStorage.setItem("geminiKey3", value); setGeminiStatus(p => ({...p, geminiKey3: null as any})); }`
);

content = content.replace(
  /if \(field === "geminiKey4"\) \{ setGeminiKey4\(value\); localStorage\.setItem\("geminiKey4", value\); \}/,
  `if (field === "geminiKey4") { setGeminiKey4(value); localStorage.setItem("geminiKey4", value); setGeminiStatus(p => ({...p, geminiKey4: null as any})); }`
);

content = content.replace(
  /if \(field === "geminiKey5"\) \{ setGeminiKey5\(value\); localStorage\.setItem\("geminiKey5", value\); \}/,
  `if (field === "geminiKey5") { setGeminiKey5(value); localStorage.setItem("geminiKey5", value); setGeminiStatus(p => ({...p, geminiKey5: null as any})); }`
);

// We need to match from `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">` down to the `Groq AI` input
// We will replace `onClick={() => checkGeminiStatus(geminiKey)}` since it's the signature.
const renderGeminiStatus = (field, keyVar, label) => \`
              <div className="flex flex-col gap-2 p-3 bg-black/20 rounded-xl border border-border/50">
                <KeyInput
                  label="\${label}"
                  placeholder="AIzaSy..."
                  value={\${keyVar}}
                  onChange={(v) => handleBotKeyChange("\${field}", v)}
                  hint={ "\${field}" === "geminiKey" ? "من Google AI Studio" : "إضافي للتدوير (اختياري)" }
                />
                <div className="flex items-center justify-between gap-2 mt-2">
                  <button
                    onClick={() => checkGeminiStatus(\${keyVar}, "\${field}")}
                    disabled={!\${keyVar} || geminiStatus["\${field}"]?.loading}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {geminiStatus["\${field}"]?.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    فحص
                  </button>
                  {geminiStatus["\${field}"] && !geminiStatus["\${field}"].loading && (
                    <span className={cn(
                      "text-[10.5px] font-bold px-2 py-1 rounded-md border text-right max-w-[150px] truncate leading-tight",
                      geminiStatus["\${field}"].valid
                        ? "text-green-400 bg-green-500/10 border-green-500/20"
                        : geminiStatus["\${field}"].status === "quota_exceeded"
                          ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                          : "text-red-400 bg-red-500/10 border-red-500/20"
                    )}>
                      {geminiStatus["\${field}"].message}
                    </span>
                  )}
                </div>
              </div>
\`;

const oldBlockRegex = /\<div className="grid grid-cols-1 md:grid-cols-2 gap-4"\>[\s\S]*?\<\/div\>\n\ \ \ \ \ \ \ \ \ \ \ \ \ \ \}\)\n\ \ \ \ \ \ \ \ \ \ \ \ \ \ \<\KeyInput\n\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ label="مفتاح Groq AI \(احتياطي\)"/m;

const newBlock = \`<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  \${renderGeminiStatus("geminiKey", "geminiKey", "مفتاح Gemini AI (1)")}
  \${renderGeminiStatus("geminiKey2", "geminiKey2", "مفتاح Gemini AI (2)")}
  \${renderGeminiStatus("geminiKey3", "geminiKey3", "مفتاح Gemini AI (3)")}
  \${renderGeminiStatus("geminiKey4", "geminiKey4", "مفتاح Gemini AI (4)")}
  \${renderGeminiStatus("geminiKey5", "geminiKey5", "مفتاح Gemini AI (5)")}
</div>
{geminiStatus["geminiKey"]?.valid && geminiStatus["geminiKey"].models && geminiStatus["geminiKey"].models.length > 0 && (
  <div className="text-[10px] text-muted-foreground/60 bg-black/20 rounded-xl px-3 py-2 border border-border/30 leading-relaxed mt-2">
    📋 النماذج المتاحة للأساسي: <span className="text-primary font-mono">{geminiStatus["geminiKey"].models.slice(0, 3).join(" · ")}{geminiStatus["geminiKey"].models.length > 3 ? \` · +\${geminiStatus["geminiKey"].models.length - 3}\` : ""}</span>
  </div>
)}
              <KeyInput
                label="مفتاح Groq AI (احتياطي)"\`;

content = content.replace(oldBlockRegex, newBlock);

fs.writeFileSync('artifacts/telegram-studio/src/pages/advanced-settings.tsx', content);
