# دليل نشر تطبيق Telegram Bot Studio على Cloudflare 🚀

تم تصميم هذا المشروع ببنية متكاملة تتكون من **واجهة أمامية تفاعلية (React/Vite)** و**خادم خلفي (Node.js/FFmpeg/Python)** لمعالجة الفيديوهات والرسم، بالإضافة إلى **بروكسي وسيط (Cloudflare Worker)** لتخطي حظر تيليغرام لـ Hugging Face.

إليك الدليل الكامل لنشر التطبيق والملفات الخاصة بكل خدمة:

---

## 🧭 نظرة عامة على البنية البرمجية (Architecture)

1. **الواجهة الأمامية (Vite Frontend - `telegram-studio`)**: يتم نشرها مجاناً وبسهولة على **Cloudflare Pages** مباشرة من مستودع GitHub الخاص بك.
2. **البروكسي الوسيط (Telegram Proxy)**: يتم نشره على **Cloudflare Workers**. يحقن الطلبات لتيليغرام ويتخطى حجب بروتوكول AWS لـ Hugging Face.
3. **الخادم الخلفي لتوليد الفيديوهات (`api-server`)**: **لا يمكن** تشغيله مباشرة داخل Cloudflare لأن بيئة Cloudflare Workers/Pages لا تدعم تشغيل مكتبات معالجة الفيديو الثقيلة مثل `FFmpeg` أو سكربتات `Python` لتركيب المحاذاة الصوتية والتعديل الصوري. لذلك، **يستمر تشغيله على Hugging Face أو أي منصة تدعم Docker**.

---

## 1️⃣ نشر الواجهة الأمامية على Cloudflare Pages (موقع الويب واللوحة)

يدعم Cloudflare Pages تطبيقات React وVite أحادية الصفحة (SPA). اتبع الخطوات التالية لربطه بـ GitHub:

1. ادخل إلى لوحة تحكم [Cloudflare Dashboard](https://dash.cloudflare.com).
2. اذهب إلى **Workers & Pages** ← **Create** ← **Pages**.
3. اختر تبويب **Connect to Git** وقم بربط حساب GitHub الخاص بك.
4. اختر المستودع الخاص بك: `do3ae_bot-last1`.
5. قم بتعبئة **إعدادات البناء (Build Settings)** بالقيم التالية بدقة:
   - **Framework Preset**: برمجية `Vite` (أو اتركه Default).
   - **Root Directory**: `artifacts/telegram-studio` *(مهم جداً لأن المشروع مستودع متعدد الحزم Monorepo)*.
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
6. اضغط على **Save and Deploy**. 

سينتج لك رابط لوحة التحكم مباشرة مجاناً وبحظر مشفر (مثل: `https://telegram-studio.pages.dev`).

---

## 2️⃣ نشر بروكسي التيليغرام على Cloudflare Workers (لتخطي الحجب)

لقد قمنا بإنشاء ملفات الإعداد الخاصة بـ Wrangler (`wrangler.toml`) في مجلد البروكسي:

### الخيار أ: النشر المباشر السريع (من المتصفح في دقيقة واحدة):
1. اذهب لـ Cloudflare ← **Workers & Pages** ← **Create Worker**.
2. اسمّه `telegram-bot-proxy` واضغط **Deploy**.
3. اضغط على **Edit Code** وامسح الكود القديم.
4. انسخ محتويات ملف `hf-deploy/cloudflare-worker-proxy.js` بالكامل والصقه هناك.
5. اضغط على **Save and Deploy**.
6. انسخ رابط الـ Worker الجديد (مثال: `https://telegram-bot-proxy.username.workers.dev`).

### الخيار ب: النشر عبر سطر الأوامر (Wrangler CLI):
من جهازك الشخصي، ادخل لمجلد `hf-deploy` ثم نفذ:
```bash
npx wrangler deploy
```

---

## 3️⃣ إعداد خادم توليد الفيديوهات (Hugging Face / Docker)

بعد نشر برمجيات Cloudflare، اذهب لـ Hugging Face Space Settings وقم بإضافة هذه الأسرار الثنائية (Secrets):

- `TELEGRAM_API_URL`: ضع فيه رابط الـ Cloudflare Worker الذي حصلت عليه في الخطوة 2 (لتخطي حظر تيليجرام لـ HuggingFace).
- `BOT_TOKEN`: رمز البوت الخاص بك من BotFather.
- `WEBHOOK_URL` (اختياري): لتلقي التحديثات بشكل فوري عبر الـ Webhook الخاص بك.
