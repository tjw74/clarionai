'use client';
import { useEffect, useState } from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import dynamic from 'next/dynamic';
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });
import { fetchAllMetrics, type MetricData, calculateZScores } from '../../datamanager';
import * as Slider from '@radix-ui/react-slider';

const metricGroups = [
  { name: 'Price Models' },
  { name: 'Profit & Loss' },
  { name: 'Network Activity' },
];

export default function AIWorkbench() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const handlePrev = () => setSelectedIndex(i => Math.max(i - 1, 0));
  const handleNext = () => setSelectedIndex(i => Math.min(i + 1, metricGroups.length - 1));
  const [metricData, setMetricData] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sliderRange, setSliderRange] = useState<[number, number] | null>(null);
  useEffect(() => {
    setLoading(true);
    fetchAllMetrics().then((data: MetricData) => {
      setMetricData(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (metricData && metricData.dates.length > 1 && !sliderRange) {
      // Find the first index where the date is in 2013 or later
      let first2013Idx = 0;
      for (let i = 0; i < metricData.dates.length; i++) {
        const year = Number(metricData.dates[i].slice(0, 4));
        if (year >= 2013) {
          first2013Idx = i;
          break;
        }
      }
      setSliderRange([first2013Idx, metricData.dates.length - 1]);
    }
  }, [metricData]);

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
              <div className="w-full h-full flex-1 flex items-center justify-center">
                {loading || !metricData ? (
                  <span className="text-white/60">Loading chart...</span>
                ) : (
                  (() => {
                    // Slice data according to sliderRange
                    const [start, end] = sliderRange || [0, metricData.dates.length - 1];
                    const x = metricData.dates.slice(start, end + 1);
                    const getY = (key: string) => metricData.metrics[key]?.slice(start, end + 1) || [];
                    // Z-score traces (left Y axis, linear)
                    const zPrice = calculateZScores(metricData.metrics['close'] || [], 1460).slice(start, end + 1);
                    const zRealized = calculateZScores(metricData.metrics['realized-price'] || [], 1460).slice(start, end + 1);
                    const zTmm = calculateZScores(metricData.metrics['true-market-mean'] || [], 1460).slice(start, end + 1);
                    const zVaulted = calculateZScores(metricData.metrics['vaulted-price'] || [], 1460).slice(start, end + 1);
                    const zSma = calculateZScores(metricData.metrics['200d-sma'] || [], 1460).slice(start, end + 1);
                    return (
                      <Plot
                        data={[
                          {
                            x,
                            y: getY('close'),
                            name: 'Price',
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: '#33B1FF', width: 1 },
                            yaxis: 'y2',
                          },
                          {
                            x,
                            y: getY('realized-price'),
                            name: 'Realized Price',
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: '#00bcd4', width: 1 },
                            yaxis: 'y2',
                          },
                          {
                            x,
                            y: getY('true-market-mean'),
                            name: 'True Market Mean',
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: '#ff9800', width: 1 },
                            yaxis: 'y2',
                          },
                          {
                            x,
                            y: getY('vaulted-price'),
                            name: 'Vaulted Price',
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: '#8bc34a', width: 1 },
                            yaxis: 'y2',
                          },
                          {
                            x,
                            y: getY('200d-sma'),
                            name: '200d SMA',
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: '#e91e63', width: 1 },
                            yaxis: 'y2',
                          },
                          // Z-score traces (left Y axis, linear)
                          {
                            x,
                            y: zPrice,
                            name: 'Price Z',
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: '#33B1FF', width: 1 },
                            yaxis: 'y',
                          },
                          {
                            x,
                            y: zRealized,
                            name: 'Realized Price Z',
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: '#00bcd4', width: 1 },
                            yaxis: 'y',
                          },
                          {
                            x,
                            y: zTmm,
                            name: 'True Market Mean Z',
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: '#ff9800', width: 1 },
                            yaxis: 'y',
                          },
                          {
                            x,
                            y: zVaulted,
                            name: 'Vaulted Price Z',
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: '#8bc34a', width: 1 },
                            yaxis: 'y',
                          },
                          {
                            x,
                            y: zSma,
                            name: '200d SMA Z',
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: '#e91e63', width: 1 },
                            yaxis: 'y',
                          },
                        ]}
                        layout={{
                          autosize: true,
                          paper_bgcolor: 'black',
                          plot_bgcolor: 'black',
                          font: { color: 'white' },
                          xaxis: {
                            color: 'white',
                            gridcolor: '#333',
                            title: 'Date',
                          },
                          yaxis: {
                            title: 'Z-Score',
                            type: 'linear',
                            side: 'left',
                            color: 'white',
                            gridcolor: '#333',
                            showgrid: true,
                            showline: false,
                            zeroline: false,
                          },
                          yaxis2: {
                            title: 'Price (log10)',
                            type: 'log',
                            side: 'right',
                            color: 'white',
                            gridcolor: '#333',
                            tickformat: '.2s',
                            tickprefix: '$',
                            showgrid: true,
                            showline: false,
                            zeroline: false,
                            exponentformat: 'power',
                            showexponent: 'all',
                            dtick: 1,
                            overlaying: 'y',
                          },
                          margin: { l: 40, r: 40, t: 20, b: 40 },
                          legend: {
                            orientation: 'h',
                            x: 0,
                            y: 1.08,
                            xanchor: 'left',
                            yanchor: 'bottom',
                            font: { color: 'white', size: 12 },
                            itemwidth: 10,
                          },
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ displayModeBar: false }}
                      />
                    );
                  })()
                )}
              </div>
              {/* Minimalist time range slider below chart */}
              {metricData && sliderRange && (
                <div className="w-full flex justify-center items-center mt-2">
                  <Slider.Root
                    className="relative w-full max-w-2xl h-6 flex items-center"
                    min={0}
                    max={metricData.dates.length - 1}
                    step={1}
                    value={sliderRange}
                    onValueChange={([start, end]) => setSliderRange([start, end])}
                    minStepsBetweenThumbs={1}
                  >
                    <Slider.Track className="bg-[#444a] h-[3px] w-full rounded-full">
                      <Slider.Range className="bg-transparent" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-2 h-2 bg-white border-2 border-white rounded-full shadow" />
                    <Slider.Thumb className="block w-2 h-2 bg-white border-2 border-white rounded-full shadow" />
                  </Slider.Root>
                </div>
              )}
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