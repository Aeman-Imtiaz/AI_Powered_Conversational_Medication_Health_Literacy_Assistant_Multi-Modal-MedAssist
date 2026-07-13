"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "model";
  text: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", text: input };
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
        setMessages([...updatedMessages, { role: "model", text: data.reply }]);
      } else {
        setMessages([...updatedMessages, { role: "model", text: "Error: " + data.error }]);
      }
    } catch (err) {
      setMessages([...updatedMessages, { role: "model", text: "Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 gap-4">
      <h1 className="text-2xl font-bold">MedAssist Chat</h1>

      <div className="w-full max-w-md bg-yellow-50 border border-yellow-300 text-yellow-800 text-xs p-3 rounded">
        ⚠️ This AI provides general information, not medical advice. Always
        consult your doctor or pharmacist before making any medication
        decisions.
      </div>

      <div className="w-full max-w-md flex flex-col gap-3 border rounded p-4 min-h-[300px] bg-gray-50">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm">Conversation yahan dikhegi...</p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded max-w-[80%] ${
              msg.role === "user"
                ? "bg-black text-white self-end whitespace-pre-wrap"
                : "bg-white border self-start prose prose-sm max-w-none"
            }`}
          >
            {msg.role === "model" ? (
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            ) : (
              msg.text
            )}
          </div>
        ))}
        {loading && <p className="text-gray-400 text-sm">Typing...</p>}
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

