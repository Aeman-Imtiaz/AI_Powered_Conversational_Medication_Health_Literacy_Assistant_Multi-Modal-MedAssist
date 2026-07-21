"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Users, Pill } from "lucide-react";
import GlassCard from "../components/GlassCard";
import FloatingBlob from "../components/FloatingBlob";

type Owner = { uid: string; name: string };
type Medicine = { id: string; name: string; dosage: string; frequency: string };

export default function SharedPage() {
  const { user } = useAuth();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selected, setSelected] = useState<Owner | null>(null);
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.email) return;

    const load = async () => {
      const shareDocId = user.email!.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const snap = await getDoc(doc(db, "shares", shareDocId));
      if (snap.exists() && Array.isArray(snap.data().owners)) {
        setOwners(snap.data().owners as Owner[]);
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  const viewOwnerMeds = async (owner: Owner) => {
    setSelected(owner);
    const snap = await getDoc(doc(db, "users", owner.uid));
    const data = snap.exists() ? snap.data() : {};
    setMeds(Array.isArray(data.medications) ? data.medications : []);
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#EFF6FF] via-white to-white overflow-hidden flex flex-col items-center px-4 py-10 pb-28 gap-5">
      <FloatingBlob color="#14B8A6" size={300} top="-90px" right="-100px" />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl z-10"
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#14B8A6] to-[#2563EB] flex items-center justify-center shadow-sm">
            <Users size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Shared With Me
            </h1>
            <p className="text-xs text-slate-400">
              Family members who added you as a caregiver
            </p>
          </div>
        </div>
      </motion.div>

      {loaded && owners.length === 0 && (
        <div className="relative w-full max-w-2xl flex flex-col items-center text-center gap-3 py-14 z-10">
          <div className="w-14 h-14 rounded-full bg-[#14B8A6]/10 flex items-center justify-center">
            <Users size={26} className="text-[#14B8A6]" />
          </div>
          <p className="text-sm text-slate-400 max-w-55">
            No one has shared their medications with you yet
          </p>
        </div>
      )}

      <div className="relative w-full max-w-2xl flex flex-col gap-3 z-10">
        {owners.map((owner) => (
          <GlassCard key={owner.uid} className="p-4">
            <button
              onClick={() => viewOwnerMeds(owner)}
              className="w-full text-left flex items-center justify-between"
            >
              <span className="text-sm font-medium text-slate-800">{owner.name}</span>
              <span className="text-xs text-[#2563EB]">View medications</span>
            </button>

            {selected?.uid === owner.uid && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                {meds.length === 0 ? (
                  <p className="text-xs text-slate-400">No medications added yet.</p>
                ) : (
                  meds.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm text-slate-600">
                      <Pill size={13} className="text-[#2563EB]" />
                      {m.name} — {m.dosage}, {m.frequency}
                    </div>
                  ))
                )}
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </main>
  );
}