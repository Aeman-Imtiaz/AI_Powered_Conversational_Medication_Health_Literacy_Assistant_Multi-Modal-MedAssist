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
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    try {
      const parsed: unknown = JSON.parse(saved);
      return Array.isArray(parsed) ? (parsed as Message[]) : [];
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Jab bhi messages change hon, unhein localStorage mein save kar dein
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (messages.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [messages]);

  // Naya message aane par khud-ba-khud neeche scroll karein
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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: messages,
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
    <main className="flex min-h-screen flex-col items-center p-8 gap-4">
      <div className="w-full max-w-md flex items-center justify-between">
        <h1 className="text-2xl font-bold">MedAssist Chat</h1>
        {messages.length > 0 && (
          <button
            onClick={clearConversation}
            className="text-xs text-red-600 border border-red-300 px-2 py-1 rounded hover:bg-red-50"
          >
            Clear Chat
          </button>
        )}
      </div>

      <div className="w-full max-w-md bg-yellow-50 border border-yellow-300 text-yellow-800 text-xs p-3 rounded">
        ⚠️ This AI provides general information, not medical advice. Always
        consult your doctor or pharmacist before making any medication
        decisions.
      </div>

      <div className="w-full max-w-md flex flex-col gap-3 border rounded p-4 min-h-75 max-h-125 overflow-y-auto bg-gray-50">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm">Conversation yahan dikhegi...</p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`p-2 rounded max-w-[80%] ${
                msg.role === "user"
                  ? "bg-black text-white whitespace-pre-wrap"
                  : "bg-white border prose prose-sm max-w-none"
              }`}
            >
              {msg.role === "model" ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
            <span className="text-[10px] text-gray-400 mt-1">{msg.time}</span>
          </div>
        ))}
        {loading && (
          <div className="flex items-start">
            <div className="bg-white border rounded p-2 text-sm text-gray-400">
              Typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="w-full max-w-md flex gap-2">
        <textarea
          className="border rounded p-2 flex-1"
          rows={2}
          placeholder="Apna sawal likhein..."
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
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </main>
  );
}