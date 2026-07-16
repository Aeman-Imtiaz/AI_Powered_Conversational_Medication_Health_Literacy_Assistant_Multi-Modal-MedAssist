"use client";

import { useState, useEffect } from "react";
import { Plus, Pill, Clock, Trash2, Check, X } from "lucide-react";

type Medicine = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
};

type AdherenceLog = {
  [date: string]: string[]; // date -> array of medicine IDs taken that day
};

const MEDS_KEY = "medassist_medications";
const LOG_KEY = "medassist_adherence_log";

const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export default function MedicationsPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [log, setLog] = useState<AdherenceLog>({});
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [time, setTime] = useState("");

  const todayKey = getTodayKey();

  useEffect(() => {
    const savedMeds = window.localStorage.getItem(MEDS_KEY);
    if (savedMeds) {
      try {
        const parsed: unknown = JSON.parse(savedMeds);
        if (Array.isArray(parsed)) {
       // eslint-disable-next-line react-hooks/set-state-in-effect
          setMedicines(parsed as unknown as Medicine[]);
        }
      } catch {
        window.localStorage.removeItem(MEDS_KEY);
      }
    }

    const savedLog = window.localStorage.getItem(LOG_KEY);
    if (savedLog) {
      try {
        const parsed: unknown = JSON.parse(savedLog);
        if (parsed && typeof parsed === "object") {
          setLog(parsed as AdherenceLog);
        }
      } catch {
        window.localStorage.removeItem(LOG_KEY);
      }
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(MEDS_KEY, JSON.stringify(medicines));
  }, [medicines, loaded]);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(LOG_KEY, JSON.stringify(log));
  }, [log, loaded]);

  const resetForm = () => {
    setName("");
    setDosage("");
    setFrequency("");
    setTime("");
    setShowForm(false);
  };

  const addMedicine = () => {
    if (!name.trim()) return;

    const newMed: Medicine = {
      id: Date.now().toString(),
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      time: time.trim(),
    };

    setMedicines((prev) => [...prev, newMed]);
    resetForm();
  };

  const isTakenToday = (id: string) => {
    return (log[todayKey] || []).includes(id);
  };

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

  return (
    <main className="min-h-screen bg-[#FAFAF9] flex flex-col items-center px-4 py-10 gap-5">
      <div className="w-full max-w-md flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            My Medications
          </h1>
          <p className="text-sm text-stone-400 mt-0.5">
            {medicines.length === 0
              ? "No medicines added yet"
              : `${takenCount} of ${medicines.length} taken today`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-11 h-11 rounded-full bg-teal-700 text-white flex items-center justify-center hover:bg-teal-800 transition-colors shrink-0"
          aria-label="Add medicine"
        >
          <Plus size={22} />
        </button>
      </div>

      {showForm && (
        <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-stone-800">Add Medicine</h2>
            <button
              onClick={resetForm}
              className="text-stone-400 hover:text-stone-600"
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </div>

          <div>
            <label className="text-xs text-stone-500 block mb-1">
              Medicine Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Panadol"
              className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 block mb-1">
                Dosage
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 500mg"
                className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
              />
            </div>
            <div>
              <label className="text-xs text-stone-500 block mb-1">
                Frequency
              </label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g. Twice daily"
                className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-stone-500 block mb-1">
              Reminder Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          <button
            onClick={addMedicine}
            disabled={!name.trim()}
            className="w-full bg-teal-700 text-white font-medium py-2.5 rounded-xl hover:bg-teal-800 transition-colors disabled:opacity-40 mt-1"
          >
            Save Medicine
          </button>
        </div>
      )}

      {medicines.length === 0 && !showForm ? (
        <div className="w-full max-w-md flex flex-col items-center text-center gap-3 py-14">
          <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center">
            <Pill size={26} className="text-teal-700" />
          </div>
          <p className="text-sm text-stone-400 max-w-55">
            Add your first medicine to start tracking your daily schedule
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md flex flex-col gap-3">
          {medicines.map((med) => {
            const taken = isTakenToday(med.id);
            return (
              <div
                key={med.id}
                className={`border rounded-2xl p-4 shadow-sm flex items-center gap-3 transition-colors ${
                  taken
                    ? "bg-teal-50 border-teal-200"
                    : "bg-white border-stone-200"
                }`}
              >
                <button
                  onClick={() => toggleTaken(med.id)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                    taken
                      ? "bg-teal-700 border-teal-700 text-white"
                      : "border-stone-200 text-transparent"
                  }`}
                  aria-label={taken ? "Mark as not taken" : "Mark as taken"}
                >
                  <Check size={20} />
                </button>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-900 truncate">
                    {med.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                    {med.dosage && <span>{med.dosage}</span>}
                    {med.frequency && <span>{med.frequency}</span>}
                  </div>
                  {med.time && (
                    <div className="flex items-center gap-1 text-xs text-teal-700 mt-1">
                      <Clock size={12} />
                      <span>{med.time}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => deleteMedicine(med.id)}
                  className="text-stone-300 hover:text-red-500 transition-colors shrink-0"
                  aria-label="Delete medicine"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}