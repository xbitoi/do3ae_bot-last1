import React, { createContext, useContext, useState, useEffect } from "react";

export interface Message {
  id: string;
  sender: "user" | "bot";
  text?: string;
  videoUrl?: string;
  isProcessing?: boolean;
  processStep?: string;
  timestamp: string;
  statusLogs?: string[];
  options?: { label: string; actionKey: string }[];
}

interface SimulatorContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isWaitingForVideos: boolean;
  setIsWaitingForVideos: (v: boolean) => void;
  mergeVideosList: File[];
  setMergeVideosList: React.Dispatch<React.SetStateAction<File[]>>;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
  uploadProgress: number;
  setUploadProgress: React.Dispatch<React.SetStateAction<number>>;
}

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

export function SimulatorProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem("telegram_simulator_messages");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Storage access not fully available in current iframe sandbox:", e);
    }
    return [
      {
        id: "welcome",
        sender: "bot",
        text: "👋 أهلاً بك يا أخي المبارك في بوت الأدعية الذكي لتيليغرام!\n\n💬 أرسل لي أي رسالة نصية كـ 'اكتب لي دعاء'، وسأقوم بصياغته لك بالذكاء الاصطناعي البليغ فوراً.\n\n🎥 *أو قم برفع أو سحب وإفلات مقطع فيديو هنا*، وسيقوم البوت بصياغة دعاء روحي عذب وتراكبه على الفيديو ليعود لك مقطعاً رائعاً جاهزاً للتشغيل والنشر مباشرة! 🚀",
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })
      }
    ];
  });

  const [isWaitingForVideos, setIsWaitingForVideos] = useState(false);
  const [mergeVideosList, setMergeVideosList] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem("telegram_simulator_messages", JSON.stringify(messages));
    } catch (e) {
      // Gracefully capture security exceptions in restricted sandboxes
    }
  }, [messages]);

  return (
    <SimulatorContext.Provider
      value={{
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
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
}

export function useSimulator() {
  const context = useContext(SimulatorContext);
  if (!context) {
    throw new Error("useSimulator must be used within a SimulatorProvider");
  }
  return context;
}
