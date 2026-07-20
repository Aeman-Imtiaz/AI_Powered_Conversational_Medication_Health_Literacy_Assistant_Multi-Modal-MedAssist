"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Plus, Pill, Clock, Trash2, Check, X, Camera, Pencil } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/GlassCard";
import ProgressRing from "../components/ProgressRing";
import FloatingBlob from "../components/FloatingBlob";

type Medicine = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
};

type AdherenceLog = {
  [date: string]: string[];
};

const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export default function MedicationsPage() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [log, setLog] = useState<AdherenceLog>({});
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [time, setTime] = useState("");

  const todayKey = getTodayKey();

  useEffect(() => {
    if (!user) {

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMedicines([]);
      setLog({});
      setLoaded(false);
      return;
    }

    const loadData = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};
        setMedicines(Array.isArray(data.medications) ? data.medications : []);
        setLog(data.adherenceLog && typeof data.adherenceLog === "object" ? data.adherenceLog : {});
      } catch {
        setMedicines([]);
        setLog({});
      }
      setLoaded(true);
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (!loaded || !user) return;
    setDoc(doc(db, "users", user.uid), { medications: medicines }, { merge: true }).catch(() => {});
  }, [medicines, loaded, user]);

  useEffect(() => {
    if (!loaded || !user) return;
    setDoc(doc(db, "users", user.uid), { adherenceLog: log }, { merge: true }).catch(() => {});
  }, [log, loaded, user]);

 const resetForm = () => {
    setName("");
    setDosage("");
    setFrequency("");
    setTime("");
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (med: Medicine) => {
    setName(med.name);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    setTime(med.time);
    setEditingId(med.id);
    setShowForm(true);
  };

  const addMedicine = () => {
    if (!name.trim()) return;

    if (editingId) {
      setMedicines((prev) =>
        prev.map((med) =>
          med.id === editingId
            ? { ...med, name: name.trim(), dosage: dosage.trim(), frequency: frequency.trim(), time: time.trim() }
            : med
        )
      );
    } else {
      const newMed: Medicine = {
        id: Date.now().toString(),
        name: name.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        time: time.trim(),
      };
      setMedicines((prev) => [...prev, newMed]);
    }
    resetForm();
  };

  const isTakenToday = (id: string) => (log[todayKey] || []).includes(id);

  const toggleTaken = (id: string) => {
    setLog((prev) => {
      const todayList = prev[todayKey] || [];
      const alreadyTaken = todayList.includes(id);
      const updatedList = alreadyTaken
        ? todayList.filter((medId) => medId !== id)
        : [...todayList, id];
      return { ...prev, [todayKey]: updatedList };
    });
  };

  const deleteMedicine = (id: string) => {
    if (confirm("Remove this medicine from your list?")) {
      setMedicines((prev) => prev.filter((med) => med.id !== id));
    }
  };

  const takenCount = medicines.filter((m) => isTakenToday(m.id)).length;
  const todayPercentage =
    medicines.length > 0 ? Math.round((takenCount / medicines.length) * 100) : 0;

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#EFF6FF] via-white to-white overflow-hidden flex flex-col items-center px-4 py-10 pb-28 gap-5">
      <FloatingBlob color="#2563EB" size={340} top="-100px" right="-120px" />
      <FloatingBlob color="#14B8A6" size={280} bottom="100px" left="-100px" delay={2} />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md z-10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center shadow-sm">
              <Pill size={17} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                My Medications
              </h1>
              <p className="text-xs text-slate-400">Stay organized, never miss a dose</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/prescription">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-11 h-11 rounded-2xl bg-white border border-slate-200 text-[#2563EB] flex items-center justify-center shadow-sm shrink-0"
                aria-label="Scan prescription"
              >
                <Camera size={19} />
              </motion.span>
            </Link>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(true)}
              className="w-11 h-11 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shadow-md shrink-0"
              aria-label="Add medicine"
            >
              <Plus size={22} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {medicines.length > 0 && (
        <GlassCard delay={0.05} hover={false} className="relative w-full max-w-md p-5 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              Today&apos;s Progress
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {takenCount} / {medicines.length}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">medicines taken</p>
          </div>
          <ProgressRing percentage={todayPercentage} color="#2563EB" />
        </GlassCard>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-md z-10"
          >
            <GlassCard hover={false} className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-slate-800">
                  {editingId ? "Edit Medicine" : "Add Medicine"}
                </h2>
                <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Medicine name, e.g. Panadol"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="Dosage, e.g. 500mg"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="Frequency"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={addMedicine}
                disabled={!name.trim()}
                className="w-full bg-[#2563EB] text-white font-medium py-2.5 rounded-xl disabled:opacity-40 mt-1"
              >
                {editingId ? "Save Changes" : "Save Medicine"}
              </motion.button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {medicines.length === 0 && !showForm ? (
        <div className="relative w-full max-w-md flex flex-col items-center text-center gap-3 py-14 z-10">
          <div className="w-14 h-14 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
            <Pill size={26} className="text-[#2563EB]" />
          </div>
          <p className="text-sm text-slate-400 max-w-55">
            Add your first medicine to start tracking your daily schedule
          </p>
        </div>
      ) : (
        <div className="relative w-full max-w-md flex flex-col gap-3 z-10">
          <AnimatePresence>
            {medicines.map((med, i) => {
              const taken = isTakenToday(med.id);
              return (
                <motion.div
                  key={med.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlassCard
                    hover={false}
                    className={`p-4 flex items-center gap-3 ${
                      taken ? "bg-[#2563EB]/5 border-[#2563EB]/20" : ""
                    }`}
                  >
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleTaken(med.id)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                        taken
                          ? "bg-[#2563EB] border-[#2563EB] text-white"
                          : "border-slate-200 text-transparent"
                      }`}
                    >
                      <Check size={20} />
                    </motion.button>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {med.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        {med.dosage && <span>{med.dosage}</span>}
                        {med.frequency && <span>{med.frequency}</span>}
                      </div>
                      {med.time && (
                        <div className="flex items-center gap-1 text-xs text-[#2563EB] mt-1">
                          <Clock size={12} />
                          <span>{med.time}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(med)}
                        className="text-slate-300 hover:text-[#2563EB] transition-colors p-1"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => deleteMedicine(med.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}