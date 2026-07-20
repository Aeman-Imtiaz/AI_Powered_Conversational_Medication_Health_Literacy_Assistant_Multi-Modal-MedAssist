"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

const PUBLIC_PATHS = ["/", "/login", "/reset-password"];

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_PATHS.includes(pathname);

    if (!user && !isPublic) {
      router.push("/login");
      return;
    }

    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCheckingProfile(false);
      return;
    }

    if (isPublic || pathname === "/profile") {
      setCheckingProfile(false);
      return;
    }

    const checkProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      const hasProfile = snap.exists() && !!snap.data().profile?.fullName;
      if (!hasProfile) {
        router.push("/profile");
      }
      setCheckingProfile(false);
    };
    checkProfile();
  }, [user, loading, pathname, router]);

  if (loading || (user && checkingProfile && !PUBLIC_PATHS.includes(pathname) && pathname !== "/profile")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPublic = PUBLIC_PATHS.includes(pathname);
  if (!user && !isPublic) return null;

  return <>{children}</>;
}