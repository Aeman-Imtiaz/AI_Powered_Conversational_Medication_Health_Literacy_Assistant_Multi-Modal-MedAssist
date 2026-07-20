"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import FloatingBlob from "../components/FloatingBlob";

function mapAuthError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Try signing in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [resetSent, setResetSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/chat");
    } catch (err) {
      const code = err instanceof Error && "code" in err ? String((err as { code: string }).code) : "";
      setError(mapAuthError(code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email above first, then tap 'Forgot password?'");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      setError(null);
    } catch {
      setError("Could not send reset email. Check the address and try again.");
    }
  };

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

        <div className="bg-white/80 backdrop-blur-md border border-slate-200/70 rounded-3xl shadow-lg p-7">
          <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
            <button
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === "signin" ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-500"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === "signup" ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-500"
              }`}
            >
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === "signin" ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "signin" ? 12 : -12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-3"
            >
              <h1 className="text-xl font-extrabold text-slate-900 text-center mb-1">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-xs text-slate-400 text-center mb-3">
                {mode === "signin"
                  ? "Sign in to continue to MedAssist"
                  : "Start managing your family's medications"}
              </p>

              {mode === "signup" && (
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              )}

              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              {mode === "signin" && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-[#2563EB] text-right hover:underline -mt-1"
                >
                  Forgot password?
                </button>
              )}

              {resetSent && (
                <p className="text-xs text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl px-3 py-2">
                  Password reset link sent to your email.
                </p>
              )}

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
                className="mt-2 w-full bg-[#2563EB] text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
                {!submitting && <ArrowRight size={16} />}
              </motion.button>

              <p className="text-center text-[11px] text-slate-400 mt-2">
                {mode === "signin" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button type="button" onClick={() => { setMode("signup"); setError(null); }} className="text-[#2563EB] font-medium hover:underline">
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button type="button" onClick={() => { setMode("signin"); setError(null); }} className="text-[#2563EB] font-medium hover:underline">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </motion.form>
          </AnimatePresence>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          By continuing, you agree that MedAssist provides general information only, not medical advice.
        </p>
      </motion.div>
    </main>
  );
}