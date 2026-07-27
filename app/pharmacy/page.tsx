"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Star,
  Clock,
  Search,
  Loader2,
  ExternalLink,
  PhoneCall,
} from "lucide-react";
import Footer from "../components/Footer";
import FloatingBlob from "../components/FloatingBlob";
import GlassCard from "../components/GlassCard";

type Pharmacy = {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  totalRatings: number;
  openNow: boolean | null;
  distanceKm: number;
  lat: number;
  lng: number;
};

function NearbyPharmacyContent() {
  const searchParams = useSearchParams();

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [medicineName, setMedicineName] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const med = searchParams.get("medicine");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (med) setMedicineName(med);
  }, [searchParams]);

  const fetchPharmacies = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/nearby-pharmacies?lat=${lat}&lng=${lng}`
      );
      const data = await res.json();

      if (data.success) {
        setPharmacies(data.pharmacies);
      } else {
        setError(data.error || "Couldn't load nearby pharmacies.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  const requestLocation = () => {
    setLocationError("");
    setLocating(true);

    if (!("geolocation" in navigator)) {
      setLocationError("Location isn't supported in this browser.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocating(false);
        fetchPharmacies(latitude, longitude);
      },
      () => {
        setLocationError(
          "Couldn't access your location. Please allow location access and try again."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const directionsUrl = (p: Pharmacy) =>
  `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;

  const viewOnMapsUrl = (p: Pharmacy) =>
  `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;

  return (
    <main className="relative flex-1 min-h-screen bg-gradient-to-b from-[#EFF6FF] via-white to-white overflow-hidden flex flex-col items-center px-4 pt-10 gap-5">
      <FloatingBlob color="#2563EB" size={340} top="-100px" left="-100px" />
      <FloatingBlob color="#10B981" size={280} bottom="60px" right="-100px" delay={2} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-2xl z-10"
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center shadow-sm">
            <MapPin size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Nearby Pharmacies
            </h1>
            <p className="text-xs text-slate-400">
              Find pharmacies close to you
            </p>
          </div>
        </div>
      </motion.div>

      {/* Honest disclaimer about stock */}
      <div className="relative w-full max-w-2xl bg-amber-50/90 backdrop-blur border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-2xl z-10">
        ⚠️ We can&apos;t see live medicine stock at these pharmacies — no
        service in Pakistan currently provides that. Call ahead to confirm
        before heading over.
      </div>

      {/* Medicine name (used to prefill the ask when calling) */}
      <div className="relative w-full max-w-2xl flex items-center gap-2 z-10">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            value={medicineName}
            onChange={(e) => setMedicineName(e.target.value)}
            placeholder="Medicine you're looking for (optional)"
            className="flex-1 text-sm outline-none"
          />
        </div>
      </div>

      {locationError && (
        <div className="relative w-full max-w-2xl bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl z-10 flex items-center justify-between gap-3">
          <span>{locationError}</span>
          <button
            onClick={requestLocation}
            className="shrink-0 text-red-700 font-semibold hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {(locating || loading) && (
        <div className="relative w-full max-w-2xl flex flex-col items-center gap-3 py-14 z-10">
          <Loader2 size={26} className="text-[#2563EB] animate-spin" />
          <p className="text-sm text-slate-400">
            {locating ? "Getting your location..." : "Finding nearby pharmacies..."}
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="relative w-full max-w-2xl bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl z-10">
          {error}
        </div>
      )}

      {!locating && !loading && searched && pharmacies.length === 0 && !error && (
        <div className="relative w-full max-w-2xl flex flex-col items-center text-center gap-3 py-14 z-10">
          <div className="w-14 h-14 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
            <MapPin size={26} className="text-[#2563EB]" />
          </div>
          <p className="text-sm text-slate-400 max-w-[240px]">
            No pharmacies found nearby. Try again from a different location.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && pharmacies.length > 0 && (
        <div className="relative w-full max-w-2xl flex flex-col gap-3 z-10">
          <AnimatePresence initial={false}>
            {pharmacies.map((p, i) => (
              <motion.div
                key={p.placeId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <GlassCard hover={false} className="p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {p.address}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 rounded-full px-2.5 py-1">
                      {p.distanceKm.toFixed(1)} km
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {p.rating !== null && (
                      <div className="flex items-center gap-1">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        {p.rating.toFixed(1)}
                        <span className="text-slate-300">
                          ({p.totalRatings})
                        </span>
                      </div>
                    )}

                    {p.openNow !== null && (
                      <div className="flex items-center gap-1">
                        <Clock size={13} />
                        <span
                          className={
                            p.openNow ? "text-[#10B981] font-medium" : "text-red-500 font-medium"
                          }
                        >
                          {p.openNow ? "Open now" : "Closed"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-1">
                    <a
                      href={directionsUrl(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#2563EB] rounded-xl py-2.5 hover:opacity-90 transition"
                    >
                      <Navigation size={13} />
                      Directions
                    </a>

                    <a
                      href={viewOnMapsUrl(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#2563EB] border border-[#2563EB]/30 rounded-xl py-2.5 hover:bg-[#2563EB]/5 transition"
                    >
                      <PhoneCall size={13} />
                      Call to Confirm
                    </a>

                    <a
                      href={viewOnMapsUrl(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center text-slate-400 hover:text-[#2563EB] transition px-2"
                      title="View on Google Maps"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>

                  {medicineName && (
                    <p className="text-[11px] text-slate-400 italic">
                      Tip: when you call, ask &quot;Kya aapke paas {medicineName} available hai?&quot;
                    </p>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Footer />
    </main>
  );
}

export default function NearbyPharmacyPage() {
  return (
    <Suspense fallback={null}>
      <NearbyPharmacyContent />
    </Suspense>
  );
}