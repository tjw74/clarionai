'use client';
import Link from "next/link";
import { useState } from "react";
import { Bot, BarChart3, DollarSign, Activity, TrendingUp } from "lucide-react";

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const notifyResize = () => {
    if (typeof window === 'undefined') return;
    // Fire after layout update so Plotly's useResizeHandler picks it up
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    });
  };

  // When closed, only show the open arrow button floating at the left edge
  if (!open) {
    return (
      <button
        className="fixed top-[calc(50%+2rem)] -translate-y-1/2 left-0 z-50 w-8 h-8 flex items-center justify-center bg-black border border-white/20 rounded-full text-white hover:bg-white/10 shadow-lg"
        onClick={() => { setOpen(true); notifyResize(); }}
        aria-label="Open sidebar"
        type="button"
      >
        <span>{'>'}</span>
      </button>
    );
  }

  return (
    <aside className="relative w-56 h-full bg-black border-r border-white/20 flex flex-col shadow-lg z-40 flex-none">
      {/* Collapse button */}
      <button
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-50 w-8 h-8 flex items-center justify-center bg-black border border-white/20 rounded-full text-white hover:bg-white/10"
        onClick={() => { setOpen(false); notifyResize(); }}
        aria-label="Collapse sidebar"
        type="button"
      >
        <span>{'<'}</span>
      </button>
      {/* Navigation */}
      <nav className="flex flex-col gap-2 mt-8 px-4">

        <Link
          href="/ai-workbench"
          className="flex items-center gap-3 px-3 py-2 rounded transition-colors border border-transparent hover:border-white/40 text-base"
        >
          <Bot className="w-5 h-5" />
          AI Workbench
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
        <Link
          href="/metric-analysis/mvrv-delta-gradient"
          className="flex items-center gap-3 px-3 py-2 rounded transition-colors border border-transparent hover:border-white/40 text-base ml-4"
        >
          <TrendingUp className="w-5 h-5" />
          MVRV Delta
        </Link>
      </nav>
    </aside>
  );
} 