"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "../lib/firebase";
import FloatingBlob from "../components/FloatingBlob";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams.get("oobCode");

  const [checking, setChecking] = useState(true);
  const [validCode, setValidCode] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecking(false);
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail);
        setValidCode(true);
      })
      .catch(() => setValidCode(false))
      .finally(() => setChecking(false));
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!oobCode) return;

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch {
      setError("This reset link has expired. Please request a new one.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
    );
  }

  if (!oobCode || !validCode) {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/70 rounded-3xl shadow-lg p-7 text-center">
        <p className="text-sm text-red-600 mb-4">
          This password reset link is invalid or has expired.
        </p>
        <Link href="/login" className="text-sm text-[#2563EB] font-medium hover:underline">
          Back to Sign In
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/70 rounded-3xl shadow-lg p-7 text-center">
        <p className="text-sm text-[#10B981] font-medium">
          Password updated! Redirecting to sign in...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-200/70 rounded-3xl shadow-lg p-7">
      <h1 className="text-xl font-extrabold text-slate-900 text-center mb-1">
        Set a new password
      </h1>
      <p className="text-xs text-slate-400 text-center mb-5">{email}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>

        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ scale: submitting ? 1 : 1.01 }}
          whileTap={{ scale: submitting ? 1 : 0.98 }}
          className="mt-2 w-full bg-[#2563EB] text-white font-semibold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save New Password"}
          {!submitting && <ArrowRight size={16} />}
        </motion.button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#EFF6FF] via-white to-white overflow-hidden flex flex-col items-center justify-center px-6 py-12">
      <FloatingBlob color="#2563EB" size={340} top="-100px" left="-100px" />
      <FloatingBlob color="#06B6D4" size={300} bottom="-100px" right="-100px" delay={2} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-sm z-10"
      >
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#06B6D4] flex items-center justify-center text-white text-sm font-bold">
            M
          </div>
          <span className="text-lg font-bold text-slate-900">MedAssist</span>
        </Link>

        <Suspense fallback={<div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </main>
  );
}