"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Pill, Send, Sparkles, Mic, Square, Volume2, VolumeX } from "lucide-react";
import GlassCard from "../components/GlassCard";

import FloatingBlob from "../components/FloatingBlob";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

type Message = {
  role: "user" | "model";
  text: string;
  time: string;
};

type Medicine = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
};

type Profile = {
  fullName: string;
  age: string;
  gender: string;
  conditions: string;
  allergies: string;
  notes: string;
};

type AdherenceLog = {
  [date: string]: string[];
};

const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const suggestions = [
  "Panadol kis liye hai?",
  "Side effects of aspirin",
  "Kya do dawaein sath le sakte hain?",
];

const DAILY_LIMIT = 25;

// crude check for Urdu script so speech playback picks the right voice
const containsUrduScript = (text: string) => /[\u0600-\u06FF]/.test(text);

// recognition language per app language setting
const RECOGNITION_LANG: Record<string, string> = {
  en: "en-US",
  ur: "ur-PK",
  roman: "en-US",
};

export default function ChatPage() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [adherenceLog, setAdherenceLog] = useState<AdherenceLog>({});
  const [language, setLanguage] = useState("en");
  const [literacyLevel, setLiteracyLevel] = useState("simple");
  const [usageCount, setUsageCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- voice state ---
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      setMedicines([]);
      setLoaded(false);
      return;
    }

    const loadData = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};

        setMessages(Array.isArray(data.chatHistory) ? data.chatHistory : []);
        setMedicines(Array.isArray(data.medications) ? data.medications : []);
        setLanguage(data.settings?.language || "en");
        setLiteracyLevel(data.settings?.literacyLevel || "simple");
        setProfile(data.profile || null);
        setAdherenceLog(data.adherenceLog && typeof data.adherenceLog === "object" ? data.adherenceLog : {});
        const todayKey = getTodayKey();
        setUsageCount(data.usage?.date === todayKey ? data.usage.count : 0);
      } catch {
        setMessages([]);
        setMedicines([]);
      }
      setLoaded(true);
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (!loaded || !user) return;
    setDoc(doc(db, "users", user.uid), { chatHistory: messages }, { merge: true }).catch(() => {});
  }, [messages, loaded, user]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // --- set up speech recognition once ---
  useEffect(() => {
    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: {
      resultIndex: number;
      results: { [key: number]: { [key: number]: { transcript: string }; isFinal?: boolean }; length: number };
    }) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((event.results[i] as any).isFinal) {
          finalText += chunk;
        } else {
          interimText += chunk;
        }
      }

      if (finalText) {
        // eslint-disable-next-line react-hooks/immutability
        sendMessage(finalText.trim());
      } else {
        setInput(interimText);
      }
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.lang = RECOGNITION_LANG[language] || "en-US";
    setInput("");
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      // already running, ignore
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const speak = useCallback((text: string, index: number | null = null) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = containsUrduScript(text) ? "ur-PK" : "en-US";
    utterance.rate = 0.95;

    utterance.onstart = () => setSpeakingIndex(index);
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeakingIndex(null);
  };

  const getTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText ?? input;
    if (!textToSend.trim() || !user) return;

    const todayKey = getTodayKey();

    const snap = await getDoc(doc(db, "users", user.uid));
    const usage = snap.exists() ? snap.data().usage : null;
    const currentCount = usage?.date === todayKey ? usage.count : 0;

    if (currentCount >= DAILY_LIMIT) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: `You've reached today's free message limit (${DAILY_LIMIT}/day). Upgrade to Premium for unlimited conversations. (Premium — coming soon)`,
          time: getTime(),
        },
      ]);
      return;
    }

    const userMessage: Message = { role: "user", text: textToSend, time: getTime() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    setUsageCount(currentCount + 1);
    await setDoc(
      doc(db, "users", user.uid),
      { usage: { date: todayKey, count: currentCount + 1 } },
      { merge: true }
    ).catch(() => {});

    try {
      const todayTaken = adherenceLog[todayKey] || [];
      const medicationsWithStatus = medicines.map((med) => ({
        ...med,
        takenToday: todayTaken.includes(med.id),
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages,
          language,
          literacyLevel,
          medications: medicationsWithStatus,
          profile,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const newMessages = [...updatedMessages, { role: "model" as const, text: data.reply, time: getTime() }];
        setMessages(newMessages);

        if (voiceReplyEnabled) {
          speak(data.reply, newMessages.length - 1);
        }
      } else {
        setMessages([...updatedMessages, { role: "model", text: "Error: " + data.error, time: getTime() }]);
      }
    } catch {
      setMessages([...updatedMessages, { role: "model", text: "Something went wrong.", time: getTime() }]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    if (confirm("Are you sure you want to clear the entire conversation?")) {
      setMessages([]);
    }
  };

  return (
    <main className="relative flex-1 bg-gradient-to-b from-[#EFF6FF] via-white to-white overflow-hidden flex flex-col items-center px-4 pt-10 gap-5">
      <FloatingBlob color="#2563EB" size={340} top="-110px" left="-110px" />
      <FloatingBlob color="#14B8A6" size={300} top="120px" right="-140px" delay={2} />
      <FloatingBlob color="#06B6D4" size={220} bottom="60px" left="10px" delay={4} />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-2xl flex items-center justify-between z-10"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-xl bg-[#2563EB]"
            />
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center shadow-md text-lg"
            >
              💊
            </motion.div>
          </div>
          <div>
            <h1 className="text-lg font-extrabold bg-gradient-to-r from-[#2563EB] to-[#14B8A6] bg-clip-text text-transparent leading-tight">
              MedAssist
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
              <p className="text-[11px] text-slate-400 leading-tight">
                {DAILY_LIMIT - usageCount} free messages left today
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (voiceReplyEnabled) stopSpeaking();
              setVoiceReplyEnabled((v) => !v);
            }}
            title={voiceReplyEnabled ? "Voice replies on" : "Voice replies off"}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              voiceReplyEnabled
                ? "bg-[#2563EB] text-white"
                : "bg-white border border-slate-200 text-slate-400"
            }`}
          >
            {voiceReplyEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </motion.button>

          {messages.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearConversation}
              className="text-xs text-slate-500 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors bg-white/70"
            >
              Clear
            </motion.button>
          )}
        </div>
      </motion.div>

      {medicines.length > 0 && (
        <GlassCard delay={0.05} hover={false} className="relative w-full max-w-2xl px-4 py-3 flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 flex items-center justify-center shrink-0">
            <Pill size={16} className="text-[#2563EB]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">
              {medicines.length} Active {medicines.length === 1 ? "Medicine" : "Medicines"}
            </p>
            <p className="text-[11px] text-slate-400">
              {medicines[0]?.time
                ? `Next dose: ${medicines[0].time}`
                : "Ask me anything about them"}
            </p>
          </div>
        </GlassCard>
      )}

      <div className="relative w-full max-w-2xl bg-amber-50/90 backdrop-blur border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-2xl z-10">
        ⚠️ This AI provides general information, not medical advice. Always
        consult your doctor or pharmacist before making any medication
        decisions.
      </div>

      {!voiceSupported && (
        <div className="relative w-full max-w-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs px-4 py-3 rounded-2xl z-10">
          Voice input isn&apos;t supported in this browser — you can still
          type your messages below.
        </div>
      )}

      <GlassCard hover={false} className="relative w-full max-w-2xl flex flex-col z-10">
        <div ref={chatContainerRef} className="flex flex-col gap-4 p-4 min-h-[350px] max-h-[500px] overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8">
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2563EB]/10 to-[#14B8A6]/10 flex items-center justify-center text-2xl"
              >
                🗨️
              </motion.div>
              <p className="text-sm text-slate-400 max-w-[240px]">
                Ask about dosage, side effects, or interactions in Urdu or
                English — by typing or by voice
              </p>
              <div className="flex flex-col gap-2 w-full max-w-[280px]">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => sendMessage(s)}
                    className="flex items-center gap-2 text-left text-xs text-slate-600 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 hover:border-[#2563EB]/40 hover:bg-[#2563EB]/5 transition-colors"
                  >
                    <Sparkles size={12} className="text-[#2563EB] shrink-0" />
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-sm flex items-start gap-2 ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-[#2563EB] to-[#1d4fd1] text-white whitespace-pre-wrap rounded-br-sm shadow-sm"
                      : "bg-slate-50 border border-slate-100 text-slate-800 prose prose-sm max-w-none rounded-bl-sm"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {msg.role === "model" ? (
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </div>

                  {msg.role === "model" && (
                    <button
                      onClick={() =>
                        speakingIndex === i ? stopSpeaking() : speak(msg.text, i)
                      }
                      className="shrink-0 text-[#2563EB] hover:opacity-70 mt-0.5"
                      title={speakingIndex === i ? "Stop" : "Play"}
                    >
                      {speakingIndex === i ? (
                        <VolumeX size={14} />
                      ) : (
                        <Volume2 size={14} />
                      )}
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-300 mt-1 px-1">
                  {msg.time}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start"
            >
              <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                {[0, 0.15, 0.3].map((delay) => (
                  <motion.span
                    key={delay}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay }}
                    className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#14B8A6]"
                  />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      </GlassCard>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative w-full max-w-2xl flex gap-2 items-end z-10"
      >
        <textarea
          className="border border-slate-200 bg-white/90 backdrop-blur rounded-xl px-3.5 py-2.5 flex-1 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-shadow"
          rows={3}
          placeholder={listening ? "Listening..." : "Apna sawal likhein ya bolein..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        {voiceSupported && (
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            onClick={listening ? stopListening : startListening}
            disabled={loading}
            className={`relative w-10 h-10 rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center flex-shrink-0 shadow-md ${
              listening
                ? "bg-red-500 text-white"
                : "bg-white border border-slate-200 text-[#2563EB]"
            }`}
            aria-label="Voice input"
          >
            {listening && (
              <motion.span
                animate={{ scale: [1, 1.7, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-xl bg-red-400"
              />
            )}
            {listening ? (
              <Square size={14} className="relative z-10" />
            ) : (
              <Mic size={16} className="relative z-10" />
            )}
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => sendMessage()}
          disabled={loading}
          className="bg-gradient-to-br from-[#2563EB] to-[#14B8A6] text-white w-10 h-10 rounded-xl transition-opacity disabled:opacity-40 flex items-center justify-center flex-shrink-0 shadow-md"
          aria-label="Send message"
        >
          <Send size={16} />
        </motion.button>
      </motion.div>

      
    </main>
  );
}