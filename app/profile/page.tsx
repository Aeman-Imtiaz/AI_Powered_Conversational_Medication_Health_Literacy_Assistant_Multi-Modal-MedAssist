"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, ArrowRight } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/GlassCard";
import FloatingBlob from "../components/FloatingBlob";
import Footer from "../components/Footer";

type Profile = {
  fullName: string;
  age: string;
  gender: string;
  conditions: string;
  allergies: string;
  notes: string;
};

const defaultProfile: Profile = {
  fullName: "",
  age: "",
  gender: "",
  conditions: "",
  allergies: "",
  notes: "",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists() && snap.data().profile) {
        setProfile({ ...defaultProfile, ...snap.data().profile });
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await setDoc(doc(db, "users", user.uid), { profile }, { merge: true });
    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push("/chat"), 900);
  };

  if (!loaded) return null;

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#EFF6FF] via-white to-white overflow-hidden flex flex-col items-center px-4 py-10 pb-28 gap-5">
      <FloatingBlob color="#2563EB" size={320} top="-90px" left="-100px" />
      <FloatingBlob color="#14B8A6" size={280} bottom="60px" right="-100px" delay={2} />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-2xl text-center z-10"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] shadow-md mb-3">
          <User size={24} className="text-white" />
        </div>
       <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {profile.fullName ? `${profile.fullName.split(" ")[0]}'s Profile` : "Your Profile"}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          This helps MedAssist give you better, more relevant answers
        </p>
      </motion.div>

      <GlassCard hover={false} className="relative w-full max-w-2xl p-5 z-10">
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Full Name</label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="e.g. Ahmed Khan"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Age</label>
              <input
                type="number"
                min={0}
                value={profile.age}
                onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))}
                placeholder="e.g. 45"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Gender</label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Existing Health Conditions
            </label>
            <textarea
              rows={2}
              value={profile.conditions}
              onChange={(e) => setProfile((p) => ({ ...p, conditions: e.target.value }))}
              placeholder="e.g. Diabetes, high blood pressure"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Known Allergies
            </label>
            <input
              type="text"
              value={profile.allergies}
              onChange={(e) => setProfile((p) => ({ ...p, allergies: e.target.value }))}
              placeholder="e.g. Penicillin"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Other Notes (optional)
            </label>
            <textarea
              rows={2}
              value={profile.notes}
              onChange={(e) => setProfile((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Anything else MedAssist should know"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
          </div>

          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: saving ? 1 : 1.01 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            className="mt-2 w-full bg-[#2563EB] text-white font-semibold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saved ? "Saved!" : saving ? "Saving..." : "Save & Continue"}
            {!saving && !saved && <ArrowRight size={16} />}
          </motion.button>
        </form>
      </GlassCard>
      <Footer />
    </main>
  );
}