"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
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

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(auth, provider);

      await setDoc(
        doc(db, "users", cred.user.uid),
        {
          uid: cred.user.uid,
          name: cred.user.displayName || "",
          email: cred.user.email,
          premium: false,
          trialActive: true,
          language: "English",
          literacyLevel: "Simple",
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      router.push("/chat");
    } catch (err) {
      const code = err instanceof Error && "code" in err ? String((err as { code: string }).code) : "";
      if (code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled. Please try again.");
      } else if (code === "auth/operation-not-allowed") {
        setError("Google sign-in needs to be enabled in Firebase Authentication first.");
      } else {
        setError(mapAuthError(code));
      }
    } finally {
      setSubmitting(false);
    }
  };

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
        await setDoc(doc(db, "users", cred.user.uid), {
  uid: cred.user.uid,
  name: name.trim(),
  email: cred.user.email,
  premium: false,
  trialActive: true,
  language: "English",
  literacyLevel: "Simple",
  createdAt: serverTimestamp(),
});

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
     <main className="relative flex-1 bg-gradient-to-b from-[#EFF6FF] via-white to-white overflow-hidden flex flex-col items-center px-4 pt-10 gap-5">
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

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                  <path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.79h3.14c1.83-1.69 2.92-4.18 2.92-7.75Z" />
                  <path fill="#34A853" d="M12 21.76c2.62 0 4.82-.87 6.43-2.36l-3.14-2.79c-.87.58-1.99.92-3.29.92-2.53 0-4.67-1.71-5.44-4.01H3.31v2.88A9.72 9.72 0 0 0 12 21.76Z" />
                  <path fill="#FBBC05" d="M6.56 13.52a5.83 5.83 0 0 1 0-3.04V7.6H3.31a9.76 9.76 0 0 0 0 8.8l3.25-2.88Z" />
                  <path fill="#EA4335" d="M12 6.47c1.42 0 2.69.49 3.69 1.45l2.77-2.77C16.82 3.62 14.62 2.24 12 2.24A9.72 9.72 0 0 0 3.31 7.6l3.25 2.88C7.33 8.18 9.47 6.47 12 6.47Z" />
                </svg>
                Continue with Google
              </button>

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
