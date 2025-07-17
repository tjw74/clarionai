'use client';
import { useState } from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";

const metricGroups = [
  { name: 'Price Models' },
  { name: 'Profit & Loss' },
  { name: 'Network Activity' },
];

export default function AIWorkbench() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const handlePrev = () => setSelectedIndex(i => Math.max(i - 1, 0));
  const handleNext = () => setSelectedIndex(i => Math.min(i + 1, metricGroups.length - 1));

  return (
    <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
      <header className="py-8 border-b border-white/20 w-full flex items-center justify-between px-8">
        <h1 className="text-3xl font-bold">AI Workbench</h1>
        {/* Metric group navigation - moved to top right */}
        <div className="flex items-center gap-2">
          <button onClick={handlePrev} disabled={selectedIndex === 0} className="px-3 py-1 rounded border border-white/20 bg-black text-white disabled:opacity-40">&lt;</button>
          <select
            value={selectedIndex}
            onChange={e => setSelectedIndex(Number(e.target.value))}
            className="bg-black border border-white/20 text-white rounded px-2 py-1"
          >
            {metricGroups.map((group, i) => (
              <option key={group.name} value={i}>{group.name}</option>
            ))}
          </select>
          <button onClick={handleNext} disabled={selectedIndex === metricGroups.length - 1} className="px-3 py-1 rounded border border-white/20 bg-black text-white disabled:opacity-40">&gt;</button>
        </div>
      </header>
      <div className="flex flex-col flex-1 p-4 gap-4">
        {/* 2 main panels: left (unified), right (vertical split) */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0 border border-white/20 bg-black">
          {/* Unified Left Panel */}
          <ResizablePanel defaultSize={50} minSize={20} className="min-w-0">
            <div className="flex flex-col h-full w-full items-center justify-center p-2 bg-black border-r border-white/20">
              <span className="text-white text-lg font-semibold mb-4">{metricGroups[selectedIndex].name} (Unified Chart)</span>
              {/* Unified Plotly chart for metrics + z-scores will go here */}
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white/60">[Unified Plotly Chart Placeholder]</span>
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="border border-white/20 border-[1px]" />
          {/* Right side (vertical split) */}
          <ResizablePanel defaultSize={50} minSize={20} className="min-w-0">
            <ResizablePanelGroup direction="vertical" className="h-full min-h-0">
              {/* Top Right */}
              <ResizablePanel defaultSize={50} minSize={20} className="min-h-0">
                <div className="flex flex-col h-full w-full items-center justify-center p-2 bg-black border-b border-white/20">
                  <span className="text-white text-lg font-semibold">Top Right ({metricGroups[selectedIndex].name})</span>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="border border-white/20 border-[1px]" />
              {/* Bottom Right */}
              <ResizablePanel defaultSize={50} minSize={20} className="min-h-0">
                <div className="flex flex-col h-full w-full items-center justify-center p-2 bg-black">
                  <span className="text-white text-lg font-semibold">Bottom Right ({metricGroups[selectedIndex].name})</span>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
} 