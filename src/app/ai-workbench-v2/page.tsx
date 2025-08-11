'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

import { fetchAllMetrics, type MetricData, calculateZScores } from '@/datamanager';
import { METRIC_GROUPS, METRICS_LIST, METRIC_DISPLAY_NAMES, METRIC_SCALE_TYPES } from '@/datamanager/metricsConfig';
import * as Slider from '@radix-ui/react-slider';
import { Bot, Check, ChevronsUpDown, Send, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import html2canvas from 'html2canvas';
import { llmService, type LLMProvider } from '@/lib/llm';
import { getChartAnalysisPrompt, getFollowUpPrompt, type AnalysisContext } from '@/lib/prompts/analysis';

export default function AIWorkbenchV2() {
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['MVRV Ratio']);
  const [selectedIndividualMetrics, setSelectedIndividualMetrics] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [metricData, setMetricData] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sliderRange, setSliderRange] = useState<[number, number] | null>(null);
  const [hiddenTraces, setHiddenTraces] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  // AI state
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [apiKey, setApiKey] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; type: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [userMessage, setUserMessage] = useState('');
  // AI column is always visible in this version (no hide/unhide)
  // Single control: collapse/expand AI column; no separate focus overlay

  const getDefaultHiddenTraces = useCallback((groups: string[]) => {
    const hidden = new Set<string>();
    groups.forEach((groupName) => {
      const group = METRIC_GROUPS.find((g) => g.name === groupName);
      if (!group) return;
      if (groupName === 'Price Models' || groupName === 'MVRV Ratio') {
        group.metrics?.forEach((m) => hidden.add(`${m.name} Z`));
      } else {
        group.metrics?.forEach((m) => {
          hidden.add(m.name);
          hidden.add(`${m.name} Z`);
        });
      }
    });
    return hidden;
  }, []);

  const getSelectedMetricKeys = useCallback(() => {
    const groupMetrics = new Set<string>();
    const individual = new Set(selectedIndividualMetrics);
    selectedGroups.forEach((groupName) => {
      const group = METRIC_GROUPS.find((g) => g.name === groupName);
      group?.metrics.forEach((m) => groupMetrics.add(m.key));
    });
    return [...groupMetrics, ...individual];
  }, [selectedGroups, selectedIndividualMetrics]);

  const selectedMetricKeys = getSelectedMetricKeys();

  // Axis assignment rules
  const getAxisAssignment = useCallback((metrics: string[]) => {
    const leftAxisMetrics: string[] = [];
    const rightAxisMetrics: string[] = [];
    metrics.forEach((metric) => {
      if (metric === 'marketcap' || metric === 'realized-cap') {
        leftAxisMetrics.push(metric);
      } else if (metric === 'mvrv-ratio') {
        rightAxisMetrics.push(metric);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if (METRIC_SCALE_TYPES.USD_LARGE.includes(metric as any)) {
        leftAxisMetrics.push(metric);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if (METRIC_SCALE_TYPES.USD_PRICE.includes(metric as any)) {
        leftAxisMetrics.push(metric);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if (METRIC_SCALE_TYPES.RATIO.includes(metric as any)) {
        rightAxisMetrics.push(metric);
      } else if (metric.endsWith('_z')) {
        rightAxisMetrics.push(metric);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if (METRIC_SCALE_TYPES.PERCENTAGE.includes(metric as any)) {
        rightAxisMetrics.push(metric);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if (METRIC_SCALE_TYPES.COUNT.includes(metric as any)) {
        leftAxisMetrics.push(metric);
      } else {
        leftAxisMetrics.push(metric);
      }
    });
    return { leftAxisMetrics, rightAxisMetrics };
  }, []);

  const { leftAxisMetrics, rightAxisMetrics } = getAxisAssignment(selectedMetricKeys);
  const hasLeftAxis = leftAxisMetrics.length > 0;
  const hasRightAxis = rightAxisMetrics.length > 0;

  useEffect(() => {
    setLoading(true);
    fetchAllMetrics()
      .then((data) => {
        setMetricData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (metricData && metricData.dates.length > 1 && !sliderRange) {
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
  }, [metricData, sliderRange]);

  useEffect(() => {
    const defaults = getDefaultHiddenTraces(selectedGroups);
    selectedIndividualMetrics.forEach((metricKey) => {
      const display = METRIC_DISPLAY_NAMES[metricKey];
      if (display) defaults.add(`${display} Z`);
    });
    setHiddenTraces(defaults);
  }, [selectedGroups, selectedIndividualMetrics, getDefaultHiddenTraces]);

  const processedData = useMemo(() => {
    if (!metricData || !sliderRange || selectedMetricKeys.length === 0) return null;
    const [start, end] = sliderRange;
    const x = metricData.dates.slice(start, end + 1);
    const needsDownsampling = x.length > 1000;
    const maxPoints = 1000;
    const zScores: Record<string, number[]> = {};
    const sliced: Record<string, number[]> = {};

    selectedMetricKeys.forEach((key) => {
      const arr = metricData.metrics[key] || [];
      sliced[key] = arr.slice(start, end + 1);
      let config = METRIC_GROUPS.flatMap((g) => g.metrics).find((m) => m?.key === key);
      if (!config) {
        const name = METRIC_DISPLAY_NAMES[key];
        if (name) config = { key, name, color: '#33B1FF', yaxis: 'y', zScore: false } as any;
      }
      if (config?.zScore) {
        zScores[key] = calculateZScores(arr, 1460).slice(start, end + 1);
      }
    });

    if (!needsDownsampling) return { x, slicedMetrics: sliced, zScores, downsampled: false } as const;

    const step = Math.ceil(x.length / maxPoints);
    const sample = <T,>(a: T[]) => a.filter((_, i) => i % step === 0);
    const xD = sample(x);
    const sD: Record<string, number[]> = {};
    const zD: Record<string, number[]> = {};
    selectedMetricKeys.forEach((k) => {
      sD[k] = sample(sliced[k]);
      if (zScores[k]) zD[k] = sample(zScores[k]);
    });
    return { x: xD, slicedMetrics: sD, zScores: zD, downsampled: true } as const;
  }, [metricData, sliderRange, selectedMetricKeys]);

  const chartData = useMemo(() => {
    if (!processedData) return [] as any[];
    const { x, zScores, slicedMetrics } = processedData;
    const traces: any[] = [];
    selectedMetricKeys.forEach((key) => {
      let config = METRIC_GROUPS.flatMap((g) => g.metrics).find((m) => m?.key === key);
      if (!config) {
        const name = METRIC_DISPLAY_NAMES[key];
        if (name) config = { key, name, color: '#33B1FF', yaxis: 'y', zScore: false } as any;
      }
      if (!config) return;
      const isRight = rightAxisMetrics.includes(key);
      traces.push({ x, y: slicedMetrics[key], name: config.name, type: 'scatter', mode: 'lines', line: { color: config.color, width: 1 }, yaxis: isRight ? 'y2' : 'y', visible: hiddenTraces.has(config.name) ? 'legendonly' : true, connectgaps: false });
      if (config.zScore && zScores[key]) {
        traces.push({ x, y: zScores[key], name: `${config.name} Z`, type: 'scatter', mode: 'lines', line: { color: config.color, width: 1 }, yaxis: 'y2', visible: hiddenTraces.has(`${config.name} Z`) ? 'legendonly' : true });
      }
    });
    return traces;
  }, [processedData, selectedMetricKeys, hiddenTraces, rightAxisMetrics]);

  const chartLayout = useMemo(() => {
    const base: any = {
      autosize: true,
      paper_bgcolor: 'black',
      plot_bgcolor: 'black',
      font: { color: 'white' },
      xaxis: { color: 'white', gridcolor: 'rgba(55,65,81,0.3)', title: 'Date', showgrid: true, gridwidth: 1 },
      margin: { l: 80, r: 80, t: 20, b: 40 },
      showlegend: false,
    };
    if (hasLeftAxis) base.yaxis = { title: 'USD Value (log2)', type: 'log', side: 'left', color: 'white', gridcolor: 'rgba(55,65,81,0.3)', showgrid: true, showline: false, zeroline: false, tickformat: '.2s', showticklabels: true, tickmode: 'auto', nticks: 8, tickfont: { color: 'white', size: 10 } };
    if (hasRightAxis) base.yaxis2 = { title: 'Ratio / Z (linear)', type: 'linear', side: 'right', color: 'white', gridcolor: 'rgba(55,65,81,0.3)', showgrid: true, showline: false, zeroline: false, tickformat: '.2f', showticklabels: true, tickmode: 'auto', nticks: 8, tickfont: { color: 'white', size: 10 }, overlaying: hasLeftAxis ? 'y' : undefined };
    return base;
  }, [hasLeftAxis, hasRightAxis]);

  // Screenshot capture (non-invasive)
  const captureChartScreenshot = async (): Promise<string> => {
    const el = document.getElementById('ai-workbench-plot-v2');
    if (!el) throw new Error('Chart element not found');
    const canvas = await html2canvas(el, {
      backgroundColor: '#000000',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      onclone: (doc: Document) => {
        const slider = doc.querySelector('.time-slider') as HTMLElement | null;
        if (slider) slider.style.display = 'none';
      },
    });
    return canvas.toDataURL('image/png').split(',')[1];
  };

  const handleAnalysis = async () => {
    if (!apiKey.trim()) {
      setChatMessages((p) => [...p, { id: Date.now().toString(), type: 'assistant', content: 'Please enter your API key first.', timestamp: new Date() }]);
      return;
    }
    if (selectedMetricKeys.length === 0) {
      setChatMessages((p) => [...p, { id: Date.now().toString(), type: 'assistant', content: 'Please select at least one metric to analyze.', timestamp: new Date() }]);
      return;
    }

    setIsAnalyzing(true);
    const msgId = Date.now().toString();
    setChatMessages((p) => [...p, { id: msgId, type: 'assistant', content: 'Capturing chart and analyzing metrics...', timestamp: new Date() }]);

    try {
      llmService.setAPIKey(selectedProvider as LLMProvider, apiKey);
      const imageBase64 = await captureChartScreenshot();
      const context: AnalysisContext = { selectedMetrics: selectedMetricKeys, metricNames: METRIC_DISPLAY_NAMES, timeRange: metricData && sliderRange ? `${metricData.dates[sliderRange[0]]} to ${metricData.dates[sliderRange[1]]}` : undefined };
      const prompt = getChartAnalysisPrompt(context);
      const response = await llmService.analyzeChart(selectedProvider as LLMProvider, { prompt, imageBase64, maxTokens: 1000, temperature: 0.7 });
      setChatMessages((p) => p.map((m) => (m.id === msgId ? { ...m, content: response.content } : m)));
    } catch (e: unknown) {
      setChatMessages((p) => p.map((m) => (m.id === msgId ? { ...m, content: `Analysis failed: ${e instanceof Error ? e.message : 'Unknown error'}` } : m)));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;
    const newMessage = { id: Date.now().toString(), type: 'user' as const, content: userMessage, timestamp: new Date() };
    setChatMessages((p) => [...p, newMessage]);
    const userQuestion = userMessage;
    setUserMessage('');

    const loadingId = (Date.now() + 1).toString();
    setChatMessages((p) => [...p, { id: loadingId, type: 'assistant', content: 'Thinking...', timestamp: new Date() }]);

    try {
      const context: AnalysisContext = { selectedMetrics: selectedMetricKeys, metricNames: METRIC_DISPLAY_NAMES, timeRange: metricData && sliderRange ? `${metricData.dates[sliderRange[0]]} to ${metricData.dates[sliderRange[1]]}` : undefined };
      const prompt = getFollowUpPrompt(userQuestion, context);
      const response = await llmService.chat(selectedProvider as LLMProvider, { prompt, maxTokens: 500, temperature: 0.7 });
      setChatMessages((p) => p.map((m) => (m.id === loadingId ? { ...m, content: response.content } : m)));
    } catch (e: unknown) {
      setChatMessages((p) => p.map((m) => (m.id === loadingId ? { ...m, content: `Chat failed: ${e instanceof Error ? e.message : 'Unknown error'}` } : m)));
    }
  };

  return (
    <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
      <header className="h-16 w-full flex items-center justify-between px-8">
        <div />
        <h1 className="text-3xl font-bold">AI Workbench</h1>
        <div className="flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={open} className="h-10 w-[300px] justify-between bg-black border-white/20 text-white hover:bg-white/10">
                {selectedMetricKeys.length > 0 ? `${selectedMetricKeys.length} metric${selectedMetricKeys.length > 1 ? 's' : ''} selected` : 'Select metrics...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-black border-white/20">
              <Command>
                <CommandInput placeholder="Search groups and metrics..." className="h-9" />
                <CommandList className="max-h-[400px]">
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Groups">
                    {METRIC_GROUPS.map((group) => (
                      <div key={`group-${group.name}`}>
                        <CommandItem
                          value={group.name}
                          onSelect={() => {
                            const isSelected = selectedGroups.includes(group.name);
                            setSelectedGroups((prev) => (isSelected ? prev.filter((g) => g !== group.name) : [...prev, group.name]));
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', selectedGroups.includes(group.name) ? 'opacity-100' : 'opacity-0')} />
                          {group.name}
                        </CommandItem>
                      </div>
                    ))}
                  </CommandGroup>
                  <CommandGroup heading="Individual Metrics">
                    {METRICS_LIST.map((metricKey) => (
                      <CommandItem
                        key={`metric-${metricKey}`}
                        value={`${METRIC_DISPLAY_NAMES[metricKey] || metricKey} ${metricKey}`}
                        onSelect={() => {
                          const isSelected = selectedIndividualMetrics.includes(metricKey);
                          setSelectedIndividualMetrics((prev) => (isSelected ? prev.filter((m) => m !== metricKey) : [...prev, metricKey]));
                        }}
                      >
                        <Check className={cn('mr-2 h-4 w-4', selectedIndividualMetrics.includes(metricKey) ? 'opacity-100' : 'opacity-0')} />
                        {METRIC_DISPLAY_NAMES[metricKey] || metricKey}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 p-4 gap-4 items-stretch">
        {/* Chart Column */}
        <section ref={panelRef} className="flex-1 min-h-0 min-w-0 flex flex-col p-2 bg-black border border-white/20 rounded-md relative">
          {(() => {
            if (loading || !metricData) return <span className="text-white/60">Loading chart...</span>;
            return (
              <>
                {/* Legend */}
                <div className="flex items-center justify-start gap-4 mb-2 px-2">
                  {chartData.map((trace, index: number) => {
                    const typed = trace as { name: string; line?: { color: string }; marker?: { color: string } };
                    const isHidden = hiddenTraces.has(typed.name);
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setHiddenTraces((prev) => {
                            const next = new Set(prev);
                            if (next.has(typed.name)) next.delete(typed.name); else next.add(typed.name);
                            return next;
                          });
                        }}
                        className={cn('flex items-center gap-2 px-2 py-1 rounded transition-colors', isHidden ? 'text-white/40 hover:text-white/60' : 'text-white hover:text-white/80')}
                      >
                        <div className={cn('w-3 h-3 rounded-full transition-opacity', isHidden ? 'opacity-40' : 'opacity-100')} style={{ backgroundColor: typed.line?.color || typed.marker?.color || '#fff' }} />
                        <span className="text-sm">{typed.name}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Chart */}
                <div className="relative flex-1 min-h-0 w-full h-full">
                  <Plot divId="ai-workbench-plot-v2" data={chartData} layout={chartLayout} useResizeHandler={true} style={{ width: '100%', height: '100%' }} config={{ displayModeBar: false }} />
                </div>
                {/* Time slider */}
                {metricData && sliderRange && (
                  <div className="w-full flex justify-center items-center mt-2">
                    <Slider.Root className="time-slider relative w-full max-w-2xl h-6 flex items-center" min={0} max={metricData.dates.length - 1} step={1} value={sliderRange} onValueChange={([start, end]) => setSliderRange([start, end])} minStepsBetweenThumbs={1}>
                      <Slider.Track className="bg-[#444a] h-[3px] w-full rounded-full"><Slider.Range className="bg-transparent" /></Slider.Track>
                      <Slider.Thumb className="block w-2 h-2 bg-white border-2 border-white rounded-full shadow" />
                      <Slider.Thumb className="block w-2 h-2 bg-white border-2 border-white rounded-full shadow" />
                    </Slider.Root>
                  </div>
                )}
                {/* Unhide control is rendered globally (fixed mid-right) */}
              </>
            );
          })()}
        </section>

        {/* AI Column */}
        <aside className="relative w-[420px] md:w-[360px] min-w-[320px] h-full flex flex-col bg-black border border-white/20 rounded-md">
            {/* Header */}
            <div className="p-3 border-b border-white/20 bg-black">
              <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
                <div className="flex items-center gap-2 shrink-0">
                  <Bot className="h-5 w-5" />
                  <span className="text-base font-semibold">AI</span>
                </div>
                <Button
                  onClick={handleAnalysis}
                  disabled={isAnalyzing}
                  className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? 'Analyzing…' : 'Analysis'}
                </Button>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="h-9 px-3 bg-black border-white/20 text-white text-sm shrink-0 w-auto min-w-[5.5rem]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-black border-white/20"><SelectItem value="openai">OpenAI</SelectItem><SelectItem value="anthropic">Anthropic</SelectItem></SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 px-3 bg-black border-white/20 text-white hover:bg-white/10 shrink-0">API Key</Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-black border-white/20 w-80 p-3">
                    <div className="flex items-center gap-2">
                      <Input type="password" placeholder="Enter API Key" value={apiKey} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)} className="flex-1 bg-black border-white/20 text-white placeholder:text-white/50 text-sm" />
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3">Save</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {/* No inline collapse button; global toggle used */}
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-white/60 py-8"><Bot className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Start by analyzing your chart or ask me anything about the metrics.</p></div>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className={cn('flex gap-3', message.type === 'user' ? 'justify-end' : 'justify-start')}>
                    {message.type === 'assistant' && (<div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0"><Bot className="h-4 w-4 text-white" /></div>)}
                    <div className={cn('max-w-[80%] rounded-lg px-4 py-2', message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white')}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-50 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                    </div>
                    {message.type === 'user' && (<div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-white" /></div>)}
                  </div>
                ))
              )}
            </div>
            {/* Input */}
            <div className="p-4 border-t border-white/20">
              <div className="flex gap-2">
                <Textarea placeholder="Ask me about the metrics..." value={userMessage} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserMessage(e.target.value)} onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} className="flex-1 bg-black border-white/20 text-white placeholder:text-white/50 resize-none" rows={1} />
                <Button onClick={handleSendMessage} disabled={!userMessage.trim()} className="bg-blue-600 hover:bg-blue-700 text-white"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </aside>
      </div>

      {/* No hide/unhide control */}
    </div>
  );
}


