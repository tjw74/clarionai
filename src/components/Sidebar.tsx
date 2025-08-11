'use client';
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { Home, Bot, TrendingUp, BarChart3, DollarSign, Activity } from "lucide-react";

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  // When closed, only show the open arrow button floating at the left edge
  if (!open) {
    return (
      <button
        className="fixed top-1/2 -translate-y-1/2 left-0 z-50 w-8 h-8 flex items-center justify-center bg-black border border-white/20 rounded-full text-white hover:bg-white/10 shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Open sidebar"
        type="button"
      >
        <span>{'>'}</span>
      </button>
    );
  }

  return (
    <aside className="relative w-56 h-screen bg-black border-r border-white/20 flex flex-col shadow-lg z-40 flex-none">
      {/* Collapse button */}
      <button
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-50 w-8 h-8 flex items-center justify-center bg-black border border-white/20 rounded-full text-white hover:bg-white/10"
        onClick={() => setOpen(false)}
        aria-label="Collapse sidebar"
        type="button"
      >
        <span>{'<'}</span>
      </button>
      {/* Logo and title row */}
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex flex-row items-center gap-3">
          <Image
            src="/clarion_chain_logo.png"
            alt="ClarionChain Logo"
            width={32}
            height={32}
            className="rounded"
          />
          <span className="text-lg font-bold tracking-wide">ClarionChain</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Empty space to match main header structure */}
        </div>
      </div>
      {/* Unified horizontal divider is rendered globally in layout */}
      {/* Navigation */}
      <nav className="flex flex-col gap-2 mt-8 px-4">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded transition-colors border border-transparent hover:border-white/40 text-base"
        >
          <Home className="w-5 h-5" />
          Dashboard
        </Link>
        <Link
          href="/ai-workbench"
          className="flex items-center gap-3 px-3 py-2 rounded transition-colors border border-transparent hover:border-white/40 text-base"
        >
          <Bot className="w-5 h-5" />
          AI Workbench
        </Link>
        <Link
          href="/dca-ranker"
          className="flex items-center gap-3 px-3 py-2 rounded transition-colors border border-transparent hover:border-white/40 text-base"
        >
          <TrendingUp className="w-5 h-5" />
          DCA Ranker
        </Link>
        <Link
          href="/metric-analysis"
          className="flex items-center gap-3 px-3 py-2 rounded transition-colors border border-transparent hover:border-white/40 text-base"
        >
          <BarChart3 className="w-5 h-5" />
          Metric Analysis
        </Link>
        <Link
          href="/metric-analysis/price"
          className="flex items-center gap-3 px-3 py-2 rounded transition-colors border border-transparent hover:border-white/40 text-base ml-4"
        >
          <DollarSign className="w-5 h-5" />
          Price
        </Link>
        <Link
          href="/metric-analysis/sopr"
          className="flex items-center gap-3 px-3 py-2 rounded transition-colors border border-transparent hover:border-white/40 text-base ml-4"
        >
          <Activity className="w-5 h-5" />
          SOPR
        </Link>
      </nav>
    </aside>
  );
} 