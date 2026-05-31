"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { Shield, LayoutDashboard, Activity, Network, Eye, Brain, Radio } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/monitor", label: "Monitor", icon: Activity },
  { href: "/network", label: "Network", icon: Network },
  { href: "/watchlist", label: "Watchlist", icon: Eye },
  { href: "/models", label: "Models", icon: Brain },
  { href: "/feeds", label: "Feeds", icon: Radio },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="w-64 glass-panel h-screen p-6 space-y-8 flex flex-col z-10 border-r border-white/5">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-600/20 rounded-lg neon-border">
          <Shield className="w-8 h-8 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
        </div>
        <h2 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
          CyberShield
        </h2>
      </div>
      
      <div className="flex-1 space-y-3">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <span
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 group",
                  isActive
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                    : "text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive && "drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]")} />
                <span className="font-medium">{link.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
