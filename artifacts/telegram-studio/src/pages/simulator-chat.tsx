import React, { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { 
  Send, Paperclip, Download, Share2, RefreshCw, X, Play, Maximize2, Menu
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { useSimulator, Message } from "@/context/simulator-context";

export function SimulatorChat() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { toast } = useToast();
  
  const {
    messages,
    setMessages,
    isWaitingForVideos,
    setIsWaitingForVideos,
    mergeVideosList,
    setMergeVideosList,
    isUploading,
    setIsUploading,
    uploadProgress,
    setUploadProgress,
  } = useSimulator();
  
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Popup Video Player State
  const [popupVideoUrl, setPopupVideoUrl] = useState<string | null>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [activePublishId, setActivePublishId] = useState<string | null>(null);

  // New States for Custom Bot workflows
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
  const [activeMenuOpen, setActiveMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addBotMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })
      }
    ]);
  };

  const startMergingMode = () => {
    setIsWaitingForVideos(true);
    setMergeVideosList([]);
    setPendingVideoFile(null);
    
    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: `user-cmd-${Date.now()}`,
        sender: "user",
        text: "ابدأ ⚡",
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })
      }
    ]);

    // Bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-cmd-${Date.now()}`,
          sender: "bot",
          text: "📥 *تم تفعيل وضع دمج الفيديوهات المتعددة وتوليد الدعاء!* \n\nيرجى رفع أو سحب وإفلات مقاطع الفيديو التي ترغب بدمجها هنا بالترتيب.\n\nبمجرد أن ننتهي من الاستلام، سنقوم بدمجها وتطبيق لوحة هندسة الصوت الإيماني وتصوير *الفيديو الأخير* بالذكاء الاصطناعي كما في تلغرام.",
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" }),
          options: [
            { label: "❌ إلغاء وتصفير صف الدمج", actionKey: "reset_merge_mode" }
          ]
        }
      ]);
    }, 450);
  };

  const checkStatusMode = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-status-${Date.now()}`,
        sender: "user",
        text: "حالة وعمل البوت 📊",
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })
      }
    ]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-status-${Date.now()}`,
          sender: "bot",
          text: "📊 *تقرير حالة البوت وخوادم الرندرة في تلغرام:*\n\n🟢 **حالة الاتصال**: متصل بالمحاكاة الرسمية النشطة\n⚡ **محرك الذكاء الاصطناعي**: Gemini Pro 3.5 & Advanced Auto\n🎙️ **صوتيات التوليد**: نشطة (Hamed TTS Engine & 4 Voices)\n🎬 **حالة الرندرة**: خاملة (جاهزة لاستقبال الفيديوهات)\n💾 **الذاكرة المؤقتة**: 310MB / 1.5GB مستقرة\n🔄 **وضع الدمج المتعدد**: " + (isWaitingForVideos ? "🔴 نشط (انتظار فيديوهات)" : "⚪ خامل (معالجة فردية)"),
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })
        }
      ]);
    }, 450);
  };

  const stopProcessMode = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-stop-${Date.now()}`,
        sender: "user",
        text: "إيقاف العملية 🛑",
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })
      }
    ]);

    setIsWaitingForVideos(false);
    setMergeVideosList([]);
    setPendingVideoFile(null);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-stop-${Date.now()}`,
          sender: "bot",
          text: "🛑 **تم إيقاف كافة العمليات النشطة وإعادة تعيين الحالات كلياً!**\n\nالبوت الآن في وضع الاستعداد الفردي لاستقبال الرسائل النصية ومقاطع الفيديو وصياغتها فوراً بدون أي دمج.",
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })
        }
      ]);
    }, 450);
  };

  const handleMenuCommand = (cmd: string) => {
    if (cmd === "start") {
      startMergingMode();
    } else if (cmd === "status") {
      checkStatusMode();
    } else if (cmd === "stop") {
      stopProcessMode();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (!textToSend) setInputText("");

    // Intercept keyboard commands
    const cleanText = text.replace("/", "");
    if (cleanText === "ابدأ" || cleanText === "ابدا" || cleanText === "start" || cleanText === "ابدأ ⚡") {
      startMergingMode();
      return;
    }
    if (cleanText === "إيقاف العملية" || cleanText === "ايقاف العملية" || cleanText === "إيقاف العملية 🛑" || cleanText === "stop") {
      stopProcessMode();
      return;
    }
    if (cleanText === "حالة" || cleanText === "الحالة" || cleanText === "حالة وعمل البوت 📊" || cleanText === "status") {
      checkStatusMode();
      return;
    }

    setIsSending(true);

    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: "user",
        text,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })
      }
    ]);

    try {
      const res = await fetch("/api/simulator/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      if (res.ok) {
        addBotMessage(data.reply);
      } else {
        addBotMessage(`⚠️ حدث خطأ أثناء مهاتفة الخادم: ${data.error || "خطأ مجهول"}`);
      }
    } catch (err: any) {
      addBotMessage(`❌ تعذر إرسال الرسالة، تأكد من تشغيل الخادم. (الخطأ: ${err?.message || err})`);
    } finally {
      setIsSending(false);
    }
  };

  const handleOptionClick = async (opt: { label: string; actionKey: string }) => {
    if (opt.actionKey === "cancel_upload") {
      setPendingVideoFile(null);
      addBotMessage("❌ تم إلغاء معالجة المقطع المرفوع بنجاح وإعادة تعيين البوت للاستقبال المباشر.");
      return;
    }

    if (opt.actionKey === "reset_merge_mode") {
      setMergeVideosList([]);
      setIsWaitingForVideos(false);
      addBotMessage("🛑 تم إلغاء حالة دمج الفيديوهات المتعددة وتطهير المضبطة بنجاح.");
      return;
    }

    if (opt.actionKey === "apply_duaa" || opt.actionKey === "apply_quran" || opt.actionKey === "apply_poetry") {
      if (!pendingVideoFile) {
        addBotMessage("⚠️ عذراً، لم يعد هناك فيديو بانتظار المعالجة.");
        return;
      }
      
      const fileToProcess = pendingVideoFile;
      setPendingVideoFile(null);
      executeRealUpload(fileToProcess, opt.actionKey);
      return;
    }

    if (opt.actionKey === "trigger_merge_process") {
      if (mergeVideosList.length === 0) {
        addBotMessage("⚠️ صف الدمج فارغ كلياً. يرجى رفع مقطع فيديو أولاً.");
        return;
      }

      const lastVideoFile = mergeVideosList[mergeVideosList.length - 1];
      const countMerged = mergeVideosList.length;
      
      setMergeVideosList([]);
      setIsWaitingForVideos(false);

      executeRealUpload(lastVideoFile, "apply_duaa", {
        isMerged: true,
        count: countMerged
      });
    }
  };

  const executeRealUpload = async (file: File, selectionType: string, mergeInfo?: { isMerged: boolean; count: number }) => {
    setIsUploading(true);
    setUploadProgress(10);

    const processingMsgId = `processing-${Date.now()}`;
    const initialLogs = mergeInfo?.isMerged
      ? [
          `📥 جاري دمج المقاطع المرفوعة (${mergeInfo.count} فيديوهات)...`,
          `🔄 تم تناغم المسارات وتوحيد درجات الجودة...`,
          `🤖 جاري هندسة وتراكيب النص الفقهي للمقطع الأخير...`
        ]
      : [
          `📥 جاري قراءة مقطع المرفق ورفعه بالكامل...`,
          `🤖 جاري هندسة الصوت وتوليد المخطوطات الفاخرة بناء على اختيارك (${
            selectionType === "apply_quran" ? "آيات قرآنية مطهرة" : selectionType === "apply_poetry" ? "أبيات شعر زاهدة" : "دعاء إيماني مؤثر"
          })...`
        ];
    
    setMessages((prev) => [
      ...prev,
      {
        id: processingMsgId,
        sender: "bot",
        text: mergeInfo?.isMerged
          ? `⏳ *جاري إلقاء وتركيب دمج الفيديوهات وتوليد السمع للبث...*\n\nالرجاء الانتظار قليلاً لحين إكمال دمج المقاطع وتوليد الصوت للمقطع الأخير وبثها لك...`
          : `⏳ *جاري التصميم وهندسة الصوت الإيماني...*\n\nالرجاء الانتظار قليلاً لحين إكمال تركيب المخطوطة والتعليق الصوتي الخاشع وبثها لك...`,
        isProcessing: true,
        processStep: mergeInfo?.isMerged ? "دمج ميكانيكي ورندرة الصوت الإيماني" : "رفع المكون الصوتي والبصري وتصنيع المخطوطات",
        statusLogs: initialLogs,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })
      }
    ]);

    try {
      const interval = setInterval(() => {
        setUploadProgress((p) => {
          if (p >= 98) {
            clearInterval(interval);
            return 98;
          }
          // Organic deceleration: faster at first, slowing down near 99%
          const increment = p < 50 ? 6.5 : p < 80 ? 3.2 : p < 95 ? 0.8 : 0.2;
          return Math.min(98, +(p + increment).toFixed(1));
        });
      }, 200);

      const response = await fetch(`/api/simulator/upload?type=${selectionType}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: file
      });
      
      clearInterval(interval);
      const data = await response.json();
      
      if (response.ok && data.success) {
        let finalDuaaText = data.duaaText;
        let choiceLabel = "الدعاء الإيماني";
        let stepLogsResult = [
          "📥 تم تحميل وتحليل الفيديو بنجاح.",
          "🤖 تم صياغة المخطوطات الإيمانية الخاشعة.",
          "🔊 تم دمج نبرات القراء وعزل التشويش بدقة.",
          "🎬 تم تركيب المخطوطات المتحركة والرندرة بنجاح! 🎉"
        ];

        if (selectionType === "apply_quran") {
          finalDuaaText = "📖 {الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ} [الرعد: 28]";
          choiceLabel = "الآية القرآنية المباركة";
          stepLogsResult[1] = "🤖 تم اختيار أعذب الآيات القرآنيّة المطهرّة للمقطع.";
        } else if (selectionType === "apply_poetry") {
          finalDuaaText = "✍️ دَعِ الأَيَّامَ تَفْعَلُ مَا تَشَاءُ ... وَطِبْ نَفْسًا إِذَا حَكَمَ القَضَاءُ\nوَلَا تَجْزَعْ لِحَادِثَةِ اللَّيَالِي ... فَمَا لِحَوَادِثِ الدُّنْيَا بَقَاءُ";
          choiceLabel = "القصيدة الشعرية الزاهدة";
          stepLogsResult[1] = "🤖 تم دمج الأبيات الشعرية البليغة في طبقات البث.";
        }

        if (mergeInfo?.isMerged) {
          stepLogsResult = [
            `📥 تم الاستيراد والدمج الميكانيكي لـ ${mergeInfo.count} فيديوهات بنجاح.`,
            `🤖 تم صياغة الدعاء المصمم للمنتج الأخير: "${data.duaaText}"`,
            "🔊 تم تركيب الصوت وتماوج النبرات وعزل التشويش للملف النهائي التلقائي.",
            "🎬 انتهت عملية الدمج الكلي وتوليد الأثر الإيماني بجدار الرندرة بنجاح! 🎉"
          ];
        }

        setMessages((prev) => 
          prev.map((m) => {
            if (m.id === processingMsgId) {
              return {
                ...m,
                text: undefined,
                videoUrl: data.videoUrl,
                isProcessing: false,
                processStep: "اكتملت الرندرة بالكامل ✨",
                statusLogs: stepLogsResult
              };
            }
            return m;
          })
        );

        addBotMessage(
          mergeInfo?.isMerged
            ? `🤲 **تم إتمام دمج المقاطع كلياً بلمسات هندسية فريدة!** \n\nالدعاء الإيماني المصمم لآخر فيديو مرفوع بالدمج هو: \n\n"${finalDuaaText}"\n\n🎯 انقر على المقطع أعلاه لتشغيله أو بثّه فوراً!`
            : `🤲 *${choiceLabel} المصمّمة لهذا الفيديو:*\n\n"${finalDuaaText}"\n\n🎯 انقر على المقطع أعلاه لتشغيله بنافذة منبثقة تفاعلية فوراً!`
        );
      } else {
        throw new Error(data.error || "فشل توليد التراكيب على الخادم");
      }

    } catch (err: any) {
      setMessages((prev) => 
        prev.map((m) => {
          if (m.id === processingMsgId) {
            return {
              ...m,
              text: `❌ *عذراً، فشلت المعالجة*\n\nالسبب: ${err?.message || "خطأ مجهول في دمج الصوت أو توليد الفكرة."}`,
              isProcessing: false,
              processStep: "فشلت الرندرة"
            };
          }
          return m;
        })
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const processVideoFile = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast({
        title: "الملف غير صالح",
        description: "يرجى تحديد ملف فيديو فقط لتركيب الأذكار والأدعية.",
        variant: "destructive"
      });
      return;
    }

    if (isWaitingForVideos) {
      // Waiting for multiple videos to merge them
      const newMergeList = [...mergeVideosList, file];
      setMergeVideosList(newMergeList);

      setMessages((prev) => [
        ...prev,
        {
          id: `user-merge-upload-${Date.now()}`,
          sender: "user",
          text: `🎥 تم إرسال الفيديو رقم (${newMergeList.length}) للدمج...`,
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })
        }
      ]);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-merge-state-${Date.now()}`,
            sender: "bot",
            text: `📥 **تم استلام مقطع الفيديو رقم (${newMergeList.length}) بنجاح!** \n\n📌 مجموع المقاطع المرفوعة حتى الآن: **${newMergeList.length}** فيديوهات.\n\n💬 يمكنك المتابعة في رفع المزيد، أو الضغط على الاختيار بالأسفل لإتمام الدمج كلياً والتوليد على الفيديو الأخير:`,
            timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" }),
            options: [
              { label: "🎬 إتمام الدمج وتوليد للأخير", actionKey: "trigger_merge_process" },
              { label: "❌ إلغاء وتصفير صف الدمج", actionKey: "reset_merge_mode" }
            ]
          }
        ]);
      }, 500);
    } else {
      // Individual upload choice selection
      setPendingVideoFile(file);

      setMessages((prev) => [
        ...prev,
        {
          id: `user-upload-${Date.now()}`,
          sender: "user",
          text: `🎥 تم رفع ملف الفيديو للوصول الفوري: **${file.name}** (بحجم ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })
        }
      ]);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-choice-prompt-${Date.now()}`,
            sender: "bot",
            text: `📥 **تم رفع مقطع الفيديو بنجاح مبروك!**\n\n💬 يرجى تحديد الخدمة الإيمانية التي ترغب من البوت تراكبها وصياغتها على مقطعك لتبدأ المعالجة فوراً:`,
            timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" }),
            options: [
              { label: "🤲 تركيب دعاء إيماني مؤثر", actionKey: "apply_duaa" },
              { label: "📖 تركيب آية قرآنية خاشعة", actionKey: "apply_quran" },
              { label: "✍️ تركيب أبيات شعرية زاهدة", actionKey: "apply_poetry" },
              { label: "❌ إلغاء المعالجة والتصفير", actionKey: "cancel_upload" }
            ]
          }
        ]);
      }, 450);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processVideoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processVideoFile(e.target.files[0]);
    }
  };

  const triggerPublish = async (msgId: string) => {
    setIsPublishing(true);
    setActivePublishId(msgId);

    toast({
      title: "بدء نشر الفيديو",
      description: "جاري بث المقطع على يوتيوب Shorts وفيسبوك وتيك توك وتلغرام تلقائياً...",
    });

    try {
      const res = await fetch("/api/simulator/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms: ["youtube", "facebook"] })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: "تم نشر وتحصين المقطع 🎉",
          description: data.message,
          className: "bg-green-500/10 text-green-500 border-green-500/20"
        });

        const resultsText = data.results.map((r: any) => {
          const platformLabel = r.platform === "youtube" ? "يوتيوب (Shorts)" : "فيسبوك (Reels)";
          return `${r.success ? "✅" : "❌"} *${platformLabel}*: ${r.success ? "تم النشر بنجاح" : `فشل (${r.error || ""})`}`;
        }).join("\n");

        addBotMessage(`📢 *تقرير البث التلقائي للمقطع للمنصات:*\n\n${resultsText}`);
      } else {
        toast({
          title: "فشل بث الفيديو",
          description: data.error || data.message || "فشلت عملية النشر التلقائية",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "خطأ في الاتصال",
        description: err?.message || String(err),
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
      setActivePublishId(null);
    }
  };

  const presetTemplates = [
    { label: "🤲 دعاء اليوم", query: "دعاء اليوم" },
    { label: "🕌 دعاء للوالدين", query: "دعاء للوالدين" },
    { label: "⭐ دعاء للمغفرة", query: "دعاء للمغفرة والتوبة" },
    { label: "🤍 دعاء مأثور", query: "اعطني دعاء حكيم ومؤثر" }
  ];

  return (
    <div id="telegram_simulator_root" className="flex flex-col w-full h-full relative overflow-hidden bg-[#e5e9f0] dark:bg-[#0e1621]" dir="rtl">
      
      {/* Telegram Custom Header */}
      <div className="flex items-center justify-between px-4 h-16 bg-[#2b5278] dark:bg-[#182533] text-white select-none shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          {/* Back Button and profile */}
          <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all active:scale-95 shrink-0 select-none">
            <span>← لوحة التحكم</span>
          </Link>
          <div className="w-9 h-9 rounded-full bg-[#3b82f6] font-black flex items-center justify-center text-sm shadow-md border border-white/10 text-white shrink-0">
            🕌
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black tracking-wide leading-none truncate">بوت الأدعية الذكي</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse shrink-0" />
              <span className="text-[10px] font-bold text-[#b4e7b8] truncate">metصل (المحاكاة الرسمية)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black tracking-widest text-[#a8c8ec] dark:text-[#a8c8ec]/80 select-none hidden sm:inline-block">TELEGRAM LIVE</span>
        </div>
      </div>

      {/* Telegram Chat Area Wallpaper & Flow */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 relative"
        style={{
          backgroundImage: isDark 
            ? `radial-gradient(rgba(255,255,255,0.015) 1px, transparent 0)` 
            : `radial-gradient(rgba(0,0,0,0.04) 1px, transparent 0)`,
          backgroundSize: "20px 20px"
        }}
      >
        {dragActive && (
          <div className="absolute inset-0 bg-primary/10 border-4 border-dashed border-primary z-50 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none transition-all">
            <div className="p-6 rounded-3xl bg-background/90 text-center shadow-xl border max-w-sm animate-in zoom-in duration-200">
              <p className="text-lg font-black text-foreground">أفلت الفيديو هنا لتقوم الروابط بتعديله فوراً 🎥</p>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => {
            const isBot = msg.sender === "bot";
            return (
              <div 
                key={msg.id}
                className={cn(
                  "flex flex-col w-full text-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
                  isBot ? "items-start" : "items-end"
                )}
              >
                <div 
                  className={cn(
                    "px-4 py-3 rounded-2xl relative shadow-[0_1px_2.5px_rgba(0,0,0,0.12)] selection:bg-[#3498db]/40 max-w-[85%] md:max-w-[70%] text-right font-medium",
                    isBot 
                      ? "bg-[#f0f4f8] dark:bg-[#1c2530] text-[#1e293b] dark:text-slate-100 rounded-tl-none border border-[#d2dfec] dark:border-none" 
                      : "bg-[#e2ffd9] dark:bg-[#2e5c30] text-[#193f12] dark:text-slate-100 rounded-tr-none border border-[#c2f2b3] dark:border-none"
                  )}
                >
                  {/* Processing indicator with precise progress bar */}
                  {msg.isProcessing && (
                    <div className="flex flex-col gap-2.5 mb-3 px-3 py-2.5 rounded-xl bg-black/5 dark:bg-black/25">
                      <div className="flex items-center gap-3">
                        <div className="w-5.5 h-5.5 border-3 border-[#2481cc] border-t-transparent rounded-full animate-spin shrink-0" />
                        <div className="min-w-0 flex-1 text-right">
                          <p className="text-xs font-black text-foreground select-none">جاري توليد ومعالجة المقطع الذكي...</p>
                          <p className="text-[10px] font-bold text-primary dark:text-[#2481cc]/80 select-none mt-0.5 truncate">{msg.processStep}</p>
                        </div>
                        <span className="text-[11px] font-black text-[#2481cc] dark:text-sky-400 shrink-0">
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-sky-400 to-[#2481cc] h-full transition-all duration-300 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Rendering Video bubble with a cinematic thumbnail play trigger overlay */}
                  {msg.videoUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden bg-black/10 aspect-video flex flex-col justify-between shadow-inner relative group select-none">
                      <video 
                        src={msg.videoUrl} 
                        className="w-full h-full object-cover rounded-xl"
                      />
                      
                      {/* Play overlay for popup window play trigger */}
                      <button 
                        onClick={() => setPopupVideoUrl(msg.videoUrl || null)}
                        className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/45 transition-all text-white"
                        title="انقر لتشغيل الفيديو بنافذة منبثقة سينيمائية"
                      >
                        <div className="p-3.5 rounded-full bg-primary hover:scale-110 active:scale-95 transition-all duration-300 shadow-md">
                          <Play className="w-6 h-6 fill-white" />
                        </div>
                      </button>

                      <div className="absolute top-2 right-2 bg-black/50 px-2.5 py-1 rounded-lg text-[10px] font-black text-white flex items-center gap-1">
                        <Maximize2 className="w-3.5 h-3.5" />
                        تشغيل بنافذة منبثقة
                      </div>
                    </div>
                  )}

                  {/* Message body text */}
                  {msg.text && (
                    <div 
                      className="whitespace-pre-line text-sm break-words leading-relaxed select-text tracking-wide text-right"
                      dangerouslySetInnerHTML={{
                        __html: msg.text.replace(/\*(.*?)\*/g, "<strong>$1</strong>")
                      }}
                    />
                  )}

                  {/* Telegram Inline Keyboard (Options underneath message) */}
                  {msg.options && msg.options.length > 0 && (
                    <div className="mt-3.5 flex flex-col gap-2 select-none w-full">
                      {msg.options.map((opt) => (
                        <button
                          key={opt.actionKey}
                          onClick={() => handleOptionClick(opt)}
                          className="w-full px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-white text-xs font-black transition-all border border-black/15 shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Internal Status Logs */}
                  {msg.statusLogs && msg.statusLogs.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-dashed border-muted-foreground/15 text-[11px] font-bold space-y-1 bg-black/5 dark:bg-black/25 p-2 rounded-xl text-right">
                      {msg.statusLogs.map((log, index) => (
                        <div key={index} className="flex gap-1.5 justify-start text-muted-foreground/80 leading-normal">
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timestamp & double status ticks */}
                  <div className="flex items-center justify-end gap-1 mt-1.5 select-none">
                    <span className={cn(
                      "block text-[10px] font-semibold",
                      isBot ? "text-muted-foreground/60" : "text-black/50 dark:text-white/60"
                    )}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>

                {/* Video Option Controllers (Publish / Download) */}
                {msg.videoUrl && !msg.isProcessing && (
                  <div className={cn(
                    "flex gap-2 mt-2 select-none animate-in fade-in duration-300 max-w-[85%] md:max-w-[70%]",
                    isBot ? "justify-start" : "justify-end"
                  )}>
                    <button
                      onClick={() => triggerPublish(msg.id)}
                      disabled={isPublishing}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black text-xs transition-all duration-200 shadow-sm",
                        isPublishing && activePublishId === msg.id
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-500 cursor-not-allowed"
                          : "bg-primary text-white border-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                      )}
                    >
                      {isPublishing && activePublishId === msg.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          جاري البث...
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          نشر تلقائي على المنصات
                        </>
                      )}
                    </button>
                    <a
                      href={msg.videoUrl}
                      download={`duaa-video-${Date.now()}.mp4`}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border/70 bg-white dark:bg-[#182533] text-foreground font-black text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-primary" />
                      تنزيل المقطع
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Suggestions at the very bottom matching Telegram style */}
      <div className="w-full bg-[#f4f6fa]/80 dark:bg-[#17212b]/95 border-t border-black/5 py-2 sm:py-2.5 px-3 sm:px-4 flex flex-wrap gap-1.5 sm:gap-2 justify-center items-center z-10 shrink-0 select-none">
        <span className="text-[10px] font-black text-muted-foreground hidden sm:inline">اقتراحات سريعة تظهر على الشاشة:</span>
        {presetTemplates.map((tpl) => (
          <button
            key={tpl.label}
            onClick={() => handleSendMessage(tpl.query)}
            disabled={isSending || isUploading}
            className="px-3 sm:px-4.5 py-1 sm:py-1.5 rounded-full font-black text-[10px] sm:text-xs border border-border bg-background hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shrink-0"
          >
            {tpl.label}
          </button>
        ))}
      </div>

      {/* Hidden native input for video triggering */}
      <input 
        type="file" 
        accept="video/*" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden"
      />

      {/* Telegram Main Footer Sender Bar */}
      <div className="w-full bg-white dark:bg-[#17212b] border-t border-black/10 py-2 sm:py-3.5 px-3 sm:px-4.5 flex flex-col gap-1.5 sm:gap-2 shrink-0 z-10 shadow-inner relative">
        
        {/* Floating Interactive Command Menu Dropdown */}
        {activeMenuOpen && (
          <div className="absolute bottom-18 right-4 bg-white dark:bg-[#182533] border border-black/10 dark:border-white/10 rounded-2xl shadow-xl w-64 overflow-hidden z-40 animate-in slide-in-from-bottom-2 duration-200">
            <div className="px-4 py-2.5 bg-black/5 dark:bg-black/35 text-xs font-black text-muted-foreground border-b border-black/5">
              قائمة أوامر البوت 🤖
            </div>
            <div className="divide-y divide-black/5 dark:divide-white/5">
              <button
                onClick={() => {
                  setActiveMenuOpen(false);
                  handleMenuCommand("start");
                }}
                className="w-full text-right px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 font-bold text-xs flex items-center justify-between transition-colors"
              >
                <span>ابدأ دمج الفيديوهات والتوليد ⚡</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-md font-mono font-bold">/start</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenuOpen(false);
                  handleMenuCommand("status");
                }}
                className="w-full text-right px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 font-bold text-xs flex items-center justify-between transition-colors"
              >
                <span>حالة البوت وجاهزية الرندرة 📊</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-md font-mono font-bold font-black">/status</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenuOpen(false);
                  handleMenuCommand("stop");
                }}
                className="w-full text-right px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 font-bold text-xs flex items-center justify-between transition-colors relative text-red-500 hover:text-red-600"
              >
                <span>إيقاف العملية وإعادة الضبط 🛑</span>
                <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-md font-mono font-bold">/stop</span>
              </button>
            </div>
          </div>
        )}

        <div className="max-w-4xl w-full mx-auto flex items-center gap-2 sm:gap-3">
          
          {/* Telegram Command Menu Toggle */}
          <button
            onClick={() => setActiveMenuOpen(!activeMenuOpen)}
            className={cn(
              "py-2 sm:py-3.5 px-3 sm:px-4.5 rounded-2xl flex items-center gap-1.5 transition-all text-[11px] sm:text-xs font-black select-none border shadow-sm cursor-pointer shrink-0",
              activeMenuOpen 
                ? "bg-primary text-white border-primary" 
                : "bg-black/5 dark:bg-[#1c2530] border-black/10 dark:border-white/10 text-muted-foreground hover:text-foreground"
            )}
            title="قائمة الأوامر"
          >
            <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>القائمة ☰</span>
          </button>

          {/* Paperclip Button for direct video selection */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isUploading}
            title="إرفاق مقطع فيديو فوري"
            className={cn(
              "p-2 sm:p-3.5 rounded-full flex items-center justify-center transition-all bg-black/5 dark:bg-white/5 hover:scale-105 active:scale-95 cursor-pointer shrink-0 disabled:opacity-50",
              isUploading ? "text-amber-500 animate-pulse bg-amber-500/10" : "text-muted-foreground hover:text-primary"
            )}
          >
            {isUploading ? (
              <RefreshCw className="w-5.5 h-5.5 sm:w-6 sm:h-6 animate-spin" />
            ) : (
              <Paperclip className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
            )}
          </button>

          {/* Interactive message box */}
          <div className="flex-1 relative">
            <input
              type="text"
              dir="rtl"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              disabled={isSending || isUploading}
              placeholder={isUploading ? "يرجى الانتظار لحين اكتمال تراكيب الهندسة ورسم الصوت..." : "اكتب رسالة البوت أو اسحب وأفلت ملف إم بي 4 هنا..."}
              className="w-full pr-3 sm:pr-4 pl-3 sm:pl-4 py-2.5 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-black/5 dark:bg-black/25 text-foreground placeholder:text-muted-foreground/60 transition-all border-none focus:outline-none text-right"
            />
          </div>

          {/* Send text trigger button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={isSending || isUploading || !inputText.trim()}
            className={cn(
              "p-2 sm:p-3.5 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer text-white shadow-md",
              inputText.trim() && !isSending && !isUploading
                ? "bg-[#2481cc] hover:bg-[#1e72b4] hover:scale-105 active:scale-95"
                : "bg-muted text-muted-foreground scale-100 opacity-60 cursor-not-allowed shadow-none"
            )}
          >
            <Send className="w-4.5 h-4.5 sm:w-5 sm:h-5 rotate-180" />
          </button>

        </div>
      </div>

      {/* Real-time Cinematic Video Popup Modal Overlay */}
      {popupVideoUrl && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-300">
          <div className="w-full max-w-3xl bg-black border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col justify-between">
            
            {/* Header of Popup */}
            <div className="flex items-center justify-between px-5 py-4.5 bg-[#141517] border-b border-white/5 text-white z-10 shrink-0">
              <span className="text-xs font-black tracking-wide text-[#3498db] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2ed573] animate-pulse" />
                مشاهدة سينيمائية مريحة للمقطع المنتَج
              </span>
              <button 
                onClick={() => setPopupVideoUrl(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white transition-all cursor-pointer flex items-center gap-1 px-3 py-1 text-xs font-bold"
                title="إغلاق ورفع النافذة"
              >
                <span>إغلاق المشغل</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Video element inside Modal */}
            <div className="flex-1 bg-black aspect-video relative flex items-center justify-center">
              <video 
                src={popupVideoUrl} 
                controls 
                autoPlay 
                className="w-full h-full max-h-[70vh] object-contain rounded-b-2xl shadow-inner"
              />
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
