"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  GraduationCap,
  Users,
  ShieldCheck,
  Trash2,
  ChevronRight,
  Plus,
  X,
  Info,
} from "lucide-react";

type Settings = {
  language: "en" | "ur";
  literacyLevel: "simple" | "detailed";
  caregivers: string[];
};

const STORAGE_KEY = "medassist_settings";

const defaultSettings: Settings = {
  language: "en",
  literacyLevel: "simple",
  caregivers: [],
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const [showAddCaregiver, setShowAddCaregiver] = useState(false);
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
         setSettings({ ...defaultSettings, ...(parsed as unknown as Settings) });
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, loaded]);

  const addCaregiver = () => {
    const email = caregiverEmail.trim();
    if (!email) return;
    setSettings((prev) => ({
      ...prev,
      caregivers: [...prev.caregivers, email],
    }));
    setCaregiverEmail("");
    setShowAddCaregiver(false);
  };

  const removeCaregiver = (email: string) => {
    setSettings((prev) => ({
      ...prev,
      caregivers: prev.caregivers.filter((c) => c !== email),
    }));
  };

  const clearAllData = () => {
    window.localStorage.removeItem("medassist_chat_history");
    window.localStorage.removeItem("medassist_medications");
    window.localStorage.removeItem(STORAGE_KEY);
    setSettings(defaultSettings);
    setShowClearConfirm(false);
  };

  return (
    <main className="min-h-screen bg-[#FAFAF9] flex flex-col items-center px-4 py-10 gap-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Manage your preferences and privacy
        </p>
      </div>

      {/* Language Section */}
      <section className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <Globe size={16} className="text-teal-700" />
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Language
          </h2>
        </div>
        <div className="px-4 pb-4">
          <div className="flex bg-stone-100 rounded-xl p-1">
            {(["en", "ur"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() =>
                  setSettings((prev) => ({ ...prev, language: lang }))
                }
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings.language === lang
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-stone-500"
                }`}
              >
                {lang === "en" ? "English" : "اردو"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Literacy Level Section */}
      <section className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <GraduationCap size={16} className="text-teal-700" />
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Explanation Style
          </h2>
        </div>
        <div className="px-4 pb-4 flex flex-col gap-2">
          {(
            [
              {
                key: "simple" as const,
                title: "Simple",
                desc: "Short, plain-language explanations",
              },
              {
                key: "detailed" as const,
                title: "Detailed",
                desc: "More medical detail and context",
              },
            ]
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() =>
                setSettings((prev) => ({ ...prev, literacyLevel: opt.key }))
              }
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                settings.literacyLevel === opt.key
                  ? "border-teal-600 bg-teal-50"
                  : "border-stone-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-800">
                  {opt.title}
                </span>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    settings.literacyLevel === opt.key
                      ? "border-teal-600 bg-teal-600"
                      : "border-stone-300"
                  }`}
                />
              </div>
              <p className="text-xs text-stone-400 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Caregiver Linking Section */}
      <section className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-teal-700" />
            <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Family Sharing
            </h2>
          </div>
          <button
            onClick={() => setShowAddCaregiver((v) => !v)}
            className="text-teal-700 hover:text-teal-800"
            aria-label="Add caregiver"
          >
            {showAddCaregiver ? <X size={18} /> : <Plus size={18} />}
          </button>
        </div>

        {showAddCaregiver && (
          <div className="px-4 pb-3 flex gap-2">
            <input
              type="email"
              value={caregiverEmail}
              onChange={(e) => setCaregiverEmail(e.target.value)}
              placeholder="caregiver@email.com"
              className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
            <button
              onClick={addCaregiver}
              className="bg-teal-700 text-white px-4 rounded-xl text-sm font-medium hover:bg-teal-800"
            >
              Add
            </button>
          </div>
        )}

        <div className="px-4 pb-4">
          {settings.caregivers.length === 0 ? (
            <p className="text-xs text-stone-400">
              No family members linked yet. Add someone to share your
              medication updates with them.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {settings.caregivers.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between bg-stone-50 rounded-xl px-3 py-2"
                >
                  <span className="text-sm text-stone-700 truncate">
                    {email}
                  </span>
                  <button
                    onClick={() => removeCaregiver(email)}
                    className="text-stone-400 hover:text-red-500 flex-shrink-0"
                    aria-label="Remove caregiver"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Privacy Section */}
      <section className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <ShieldCheck size={16} className="text-teal-700" />
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Privacy
          </h2>
        </div>

        <button className="w-full flex items-center justify-between px-4 py-3 border-t border-stone-100 hover:bg-stone-50 transition-colors">
          <span className="text-sm text-stone-700">Privacy Policy</span>
          <ChevronRight size={16} className="text-stone-300" />
        </button>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="w-full flex items-center justify-between px-4 py-3 border-t border-stone-100 hover:bg-red-50 transition-colors group"
        >
          <span className="text-sm text-red-600 flex items-center gap-2">
            <Trash2 size={15} />
            Clear All My Data
          </span>
          <ChevronRight size={16} className="text-red-300" />
        </button>
      </section>

      {/* Clear Data Confirmation */}
      {showClearConfirm && (
        <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-sm text-red-700">
            This will permanently delete your chat history, saved
            medications, and preferences from this device. This cannot be
            undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="flex-1 border border-stone-200 text-stone-600 py-2 rounded-xl text-sm font-medium hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={clearAllData}
              className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-700"
            >
              Delete Everything
            </button>
          </div>
        </div>
      )}

      {/* Disclaimer Footer */}
      <div className="w-full max-w-md flex items-start gap-2 text-xs text-stone-400 px-1">
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        <p>Not a substitute for professional medical advice.</p>
      </div>
    </main>
  );
}