"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle, Pill, ChartColumn, Settings } from "lucide-react";

const tabs = [
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/medications", label: "Medicines", icon: Pill },
  { href: "/reports", label: "Reports", icon: ChartColumn },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/login") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200/70 z-50">
<div className="max-w-2xl mx-auto flex items-stretch justify-around">
          {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[52px]"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-2 inset-y-0 bg-[#2563EB] rounded-2xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon
                  size={20}
                  strokeWidth={2.2}
                  className={isActive ? "text-white" : "text-slate-400"}
                />
                <span
                  className={`text-[10px] font-medium ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}