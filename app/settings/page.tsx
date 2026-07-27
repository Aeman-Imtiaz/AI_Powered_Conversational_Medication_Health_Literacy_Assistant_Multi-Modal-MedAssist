"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe,
  GraduationCap,
  Users,
  ShieldCheck,
  Trash2,
  ChevronRight,
  Plus,
  X,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Info,
  User,
  Moon,
  Sun,
} from "lucide-react";
import { doc, getDoc, setDoc, deleteField, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import GlassCard from "../components/GlassCard";
import Footer from "../components/Footer";
import FloatingBlob from "../components/FloatingBlob";
import { signOut } from "firebase/auth";

type Settings = {
  language: "en" | "ur" | "roman";
  literacyLevel: "simple" | "detailed";
  caregivers: string[];
  notifications: boolean;
};

const defaultSettings: Settings = {
  language: "en",
  literacyLevel: "simple",
  caregivers: [],
  notifications: true,
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter(); 
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const [showAddCaregiver, setShowAddCaregiver] = useState(false);
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettings(defaultSettings);
      setLoaded(false);
      return;
    }

    const loadSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};
        setSettings({ ...defaultSettings, ...(data.settings || {}) });
      } catch {
        setSettings(defaultSettings);
      }
      setLoaded(true);
    };

    loadSettings();
  }, [user]);

  useEffect(() => {
    if (!loaded || !user) return;
    setDoc(doc(db, "users", user.uid), { settings }, { merge: true }).catch(() => {});
  }, [settings, loaded, user]);

  const addCaregiver = async () => {
    const email = caregiverEmail.trim().toLowerCase();
    if (!email || !user) return;

    setSettings((prev) => ({
      ...prev,
      caregivers: [...prev.caregivers, email],
    }));

    const shareDocId = email.replace(/[^a-z0-9]/g, "_");
    await setDoc(
      doc(db, "shares", shareDocId),
      {
        sharedWithEmail: email,
        owners: arrayUnion({
          uid: user.uid,
          name: user.displayName || user.email || "A family member",
        }),
      },
      { merge: true }
    ).catch(() => {});

    setCaregiverEmail("");
    setShowAddCaregiver(false);
  };

  const removeCaregiver = async (email: string) => {
    setSettings((prev) => ({
      ...prev,
      caregivers: prev.caregivers.filter((c) => c !== email),
    }));

    if (!user) return;
    const shareDocId = email.replace(/[^a-z0-9]/g, "_");
    await setDoc(
      doc(db, "shares", shareDocId),
      {
        owners: arrayRemove({
          uid: user.uid,
          name: user.displayName || user.email || "A family member",
        }),
      },
      { merge: true }
    ).catch(() => {});
  };

  const clearAllData = async () => {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid),
      {
        chatHistory: deleteField(),
        medications: deleteField(),
        adherenceLog: deleteField(),
        settings: deleteField(),
      },
      { merge: true }
    ).catch(() => {});
    setSettings(defaultSettings);
    setShowClearConfirm(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <main className="relative flex-1 bg-gradient-to-b from-[#EFF6FF] via-white to-white overflow-hidden flex flex-col items-center px-4 pt-10 gap-5">
          <FloatingBlob color="#2563EB" size={320} top="-80px" left="-100px" />
      <FloatingBlob color="#14B8A6" size={280} top="200px" right="-100px" delay={2} />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-2xl z-10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center shadow-sm">
              <SettingsIcon size={17} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Settings
              </h1>
              <p className="text-xs text-slate-400">
                {user?.email || "Personalize your experience"}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-red-600 border border-red-200 px-3 py-2 rounded-xl hover:bg-red-50"
          >
            <LogOut size={14} />
            Logout
          </motion.button>
        </div>
      </motion.div>

      <Link href="/profile" className="relative w-full max-w-2xl z-10">
        <GlassCard delay={0.15} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={16} className="text-[#2563EB]" />
            <span className="text-sm font-medium text-slate-700">My Profile</span>
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </GlassCard>
      </Link>

      <Link href="/shared" className="relative w-full max-w-2xl z-10">
        <GlassCard delay={0.18} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#14B8A6]" />
            <span className="text-sm font-medium text-slate-700">Shared With Me</span>
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </GlassCard>
      </Link>

      <GlassCard delay={0.19} hover={false} className="relative w-full max-w-2xl p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon size={16} className="text-[#2563EB]" />
            ) : (
              <Sun size={16} className="text-[#2563EB]" />
            )}
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Appearance
            </h2>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              theme === "dark" ? "bg-[#2563EB]" : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                theme === "dark" ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {theme === "dark" ? "Dark mode is on" : "Switch to dark mode"}
        </p>
      </GlassCard>

      <GlassCard delay={0.2} hover={false} className="relative w-full max-w-2xl p-4 z-10">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={16} className="text-[#2563EB]" />
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Language
          </h2>
        </div>
        <div className="flex bg-slate-100/70 rounded-2xl p-1">
          {(["en", "ur", "roman"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setSettings((prev) => ({ ...prev, language: lang }))}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                settings.language === lang
                  ? "bg-white text-[#2563EB] shadow-sm"
                  : "text-slate-500"
              }`}
            >
              {lang === "en" ? "English" : lang === "ur" ? "اردو" : "Roman Urdu"}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard delay={0.1} hover={false} className="relative w-full max-w-2xl p-4 z-10">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap size={16} className="text-[#14B8A6]" />
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Explanation Level
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          {(
            [
              { key: "simple" as const, title: "Simple", desc: "Short, plain-language explanations" },
              { key: "detailed" as const, title: "Detailed", desc: "More medical detail and context" },
            ]
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSettings((prev) => ({ ...prev, literacyLevel: opt.key }))}
              className={`w-full text-left px-4 py-3 rounded-2xl border transition-all ${
                settings.literacyLevel === opt.key
                  ? "border-[#2563EB]/40 bg-[#2563EB]/5"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">{opt.title}</span>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    settings.literacyLevel === opt.key
                      ? "border-[#2563EB] bg-[#2563EB]"
                      : "border-slate-300"
                  }`}
                />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard delay={0.15} hover={false} className="relative w-full max-w-2xl p-4 z-10">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#2563EB]" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Family Sharing
            </h2>
          </div>
          <button
            onClick={() => setShowAddCaregiver((v) => !v)}
            className="text-[#2563EB] hover:opacity-70"
          >
            {showAddCaregiver ? <X size={18} /> : <Plus size={18} />}
          </button>
        </div>

        {showAddCaregiver && (
          <div className="flex gap-2 mt-2 mb-1">
            <input
              type="email"
              value={caregiverEmail}
              onChange={(e) => setCaregiverEmail(e.target.value)}
              placeholder="caregiver@email.com"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
            <button
              onClick={addCaregiver}
              className="bg-[#2563EB] text-white px-4 rounded-xl text-sm font-medium hover:opacity-90"
            >
              Add
            </button>
          </div>
        )}

        <div className="mt-2">
          {settings.caregivers.length === 0 ? (
            <p className="text-xs text-slate-400">No family members linked yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {settings.caregivers.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2"
                >
                  <span className="text-sm text-slate-700 truncate">{email}</span>
                  <button
                    onClick={() => removeCaregiver(email)}
                    className="text-slate-400 hover:text-red-500 flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard delay={0.18} hover={false} className="relative w-full max-w-2xl p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-[#2563EB]" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Notifications
            </h2>
          </div>
          <button
            onClick={() =>
              setSettings((prev) => ({ ...prev, notifications: !prev.notifications }))
            }
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.notifications ? "bg-[#2563EB]" : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                settings.notifications ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Get reminders for your medication schedule.
        </p>
      </GlassCard>

      <GlassCard delay={0.2} hover={false} className="relative w-full max-w-2xl z-10 overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#14B8A6]" />
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Privacy
          </h2>
        </div>
        <p className="px-4 pb-3 text-xs text-slate-400">
          Your data is securely stored and linked only to your account.
        </p>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="w-full flex items-center justify-between px-4 py-3 border-t border-slate-100 hover:bg-red-50 transition-colors"
        >
          <span className="text-sm text-red-600 flex items-center gap-2">
            <Trash2 size={15} />
            Clear All My Data
          </span>
          <ChevronRight size={16} className="text-red-300" />
        </button>
      </GlassCard>

      <GlassCard delay={0.22} hover={false} className="relative w-full max-w-2xl p-4 z-10">
        <div className="flex items-center gap-2 mb-2">
          <Info size={16} className="text-[#2563EB]" />
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            About MedAssist
          </h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          MedAssist is an AI-powered medication companion built to help
          families in Pakistan understand medicines, track adherence, and
          stay connected — in Urdu and English. Version 1.0.
        </p>
      </GlassCard>

      {showClearConfirm && (
        <GlassCard hover={false} className="relative w-full max-w-2xl p-4 bg-red-50/90 border-red-200 z-10">
          <p className="text-sm text-red-700">
            This will permanently delete your chat history, medications, and
            preferences. This cannot be undone.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-sm font-medium hover:bg-white"
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
        </GlassCard>
      )}

      <Footer />
    </main>
  );
}