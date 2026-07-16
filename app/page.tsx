"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "model";
  text: string;
  time: string;
};

const STORAGE_KEY = "medassist_chat_history";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
           // eslint-disable-next-line react-hooks/set-state-in-effect
          setMessages(parsed as unknown as Message[]);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (messages.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [messages, loaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const getTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", text: input, time: getTime() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const settingsRaw = window.localStorage.getItem("medassist_settings");
      let language = "en";
      let literacyLevel = "simple";
      if (settingsRaw) {
        try {
          const parsed = JSON.parse(settingsRaw);
          language = parsed.language || "en";
          literacyLevel = parsed.literacyLevel || "simple";
        } catch {
          // ignore, use defaults
        }
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: messages,
          language,
          literacyLevel,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages([...updatedMessages, { role: "model", text: data.reply, time: getTime() }]);
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
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAF9] flex flex-col items-center px-4 py-10 gap-4">
      <div className="w-full max-w-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-lg">
            💊
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-900 leading-tight">
              MedAssist
            </h1>
            <p className="text-[11px] text-stone-400 leading-tight">
              Ask about your medications
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearConversation}
            className="text-xs text-stone-500 border border-stone-200 px-3 py-1.5 rounded-full hover:bg-stone-100 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="w-full max-w-md bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-xl">
        ⚠️ This AI provides general information, not medical advice. Always
        consult your doctor or pharmacist before making any medication
        decisions.
      </div>

      <div className="w-full max-w-md flex flex-col gap-4 border border-stone-200 rounded-2xl p-4 min-h-[350px] max-h-[500px] overflow-y-auto bg-white shadow-sm">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-10">
            <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-2xl">
              🗨️
            </div>
            <p className="text-sm text-stone-400 max-w-[220px]">
              Ask about dosage, side effects, or interactions in Urdu or
              English
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-sm ${
                msg.role === "user"
                  ? "bg-teal-700 text-white whitespace-pre-wrap rounded-br-sm"
                  : "bg-stone-50 border border-stone-100 text-stone-800 prose prose-sm max-w-none rounded-bl-sm"
              }`}
            >
              {msg.role === "model" ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
            <span className="text-[10px] text-stone-300 mt-1 px-1">
              {msg.time}
            </span>
          </div>
        ))}
        {loading && (
          <div className="flex items-start">
            <div className="bg-stone-50 border border-stone-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="w-full max-w-md flex gap-2 items-end">
        <textarea
          className="border border-stone-200 rounded-xl px-3.5 py-2.5 flex-1 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
          rows={1}
          placeholder="Type here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-teal-700 text-white w-10 h-10 rounded-xl hover:bg-teal-800 transition-colors disabled:opacity-40 flex items-center justify-center flex-shrink-0"
          aria-label="Send message"
        >
          ➤
        </button>
      </div>
    </main>
  );
}