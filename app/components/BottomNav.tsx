"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Pill, BarChart3, Settings } from "lucide-react";

const tabs = [
  { href: "/", label: "Chat", icon: MessageCircle },
  { href: "/medications", label: "Medications", icon: Pill },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50">
      <div className="max-w-md mx-auto flex items-stretch justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-14 transition-colors ${
                isActive ? "text-teal-700" : "text-stone-400"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.4 : 2}
                fill={isActive ? "currentColor" : "none"}
                className={isActive ? "opacity-90" : ""}
              />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}