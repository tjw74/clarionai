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
import { getChartAnalysisPrompt, getFollowUpPrompt, type AnalysisContext } from '@/lib/prompts/analysis';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { saveSecret, loadSecret, clearSecret } from '@/lib/vault';

export default function AIWorkbenchV2() {
  // Dynamic color generation functions
  const generateAdaptiveColors = useCallback((selectedMetrics: string[]): Record<string, string> => {
    const colors: Record<string, string> = {};
    const totalMetrics = selectedMetrics.length;
    
    selectedMetrics.forEach((metricKey, index) => {
      // Calculate optimal spacing between colors
      const hueStep = 360 / totalMetrics;
      const baseHue = (index * hueStep) % 360;
      
      // Ensure good contrast by varying saturation and lightness
      const saturation = 70 + (index % 3) * 10; // 70%, 80%, 90%
      const lightness = 50 + (index % 3) * 10;  // 50%, 60%, 70%
      
      // Add slight randomization for visual interest
      const hueVariation = Math.random() * 20 - 10;
      const finalHue = (baseHue + hueVariation + 360) % 360;
      
      colors[metricKey] = `hsl(${finalHue}, ${saturation}%, ${lightness}%)`;
    });
    
    return colors;
  }, []);

  const modifyColorForZScore = useCallback((baseColor: string): string => {
    // Convert HSL to modify lightness for Z-score traces
    if (baseColor.startsWith('hsl(')) {
      const match = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (match) {
        const [, h, s, l] = match;
        const newLightness = Math.min(parseInt(l) + 20, 90); // Lighter version
        return `hsl(${h}, ${s}%, ${newLightness}%)`;
      }
    }
    
    // Fallback: add transparency for non-HSL colors
    return baseColor + '80'; // 50% transparency
  }, []);

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
  const [apiPopoverOpen, setApiPopoverOpen] = useState(false);
  const [rememberKey, setRememberKey] = useState(false);
  // encryption is implicit via vault; no passphrase UI
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chatTransport = useMemo(() => new DefaultChatTransport({ api: '/api/ai/chat', body: () => ({ provider: selectedProvider, apiKey }) }), [selectedProvider, apiKey]);
  const { messages, sendMessage, status } = useChat({ transport: chatTransport });
  const [userInput, setUserInput] = useState('');
  
  const handleRememberChange = async (next: boolean) => {
    setRememberKey(next);
    if (typeof window === 'undefined') return;
    if (!next) {
      await clearSecret(`aiKey:${selectedProvider}`);
      localStorage.removeItem('aiKey:remember');
    } else {
      localStorage.setItem('aiKey:remember', '1');
      if (apiKey.trim()) await saveSecret(`aiKey:${selectedProvider}`, apiKey);
    }
  };

  const handleApiKeyChange = async (value: string) => {
    setApiKey(value);
    if (rememberKey && value.trim()) {
      await saveSecret(`aiKey:${selectedProvider}`, value);
    }
  };

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

  const getAxisAssignment = useCallback((metrics: string[]) => {
    // First, get the actual data ranges for scale conflict detection
    if (!metricData || !sliderRange) {
      // Fallback to simple left/right assignment if no data available
      const leftAxisMetrics: string[] = [];
      const rightAxisMetrics: string[] = [];
      metrics.forEach((metric) => {
        if (metric === 'market_cap' || metric === 'realized_cap') {
          leftAxisMetrics.push(metric);
        } else if (metric === 'mvrv-ratio') {
          rightAxisMetrics.push(metric);
        } else if (METRIC_SCALE_TYPES.USD_LARGE.includes(metric as any)) {
          leftAxisMetrics.push(metric);
        } else if (METRIC_SCALE_TYPES.USD_PRICE.includes(metric as any)) {
          leftAxisMetrics.push(metric);
        } else if (METRIC_SCALE_TYPES.USD_LOSS.includes(metric as any)) {
          rightAxisMetrics.push(metric);
        } else if (METRIC_SCALE_TYPES.RATIO.includes(metric as any)) {
          rightAxisMetrics.push(metric);
        } else if (metric.endsWith('_z')) {
          rightAxisMetrics.push(metric);
        } else if (METRIC_SCALE_TYPES.PERCENTAGE.includes(metric as any)) {
          rightAxisMetrics.push(metric);
        } else if (METRIC_SCALE_TYPES.COUNT.includes(metric as any)) {
          leftAxisMetrics.push(metric);
        } else {
          leftAxisMetrics.push(metric);
        }
      });
      return { leftAxisMetrics, rightAxisMetrics, axisGroups: [] };
    }

    const [start, end] = sliderRange;
    const axisGroups: Array<{ axisId: string; metrics: string[]; side: 'left' | 'right'; scale: 'log' | 'linear'; range: { min: number; max: number } }> = [];
    
    // Analyze data ranges for each metric
    const metricRanges: Array<{ metric: string; range: { min: number; max: number }; scale: 'log' | 'linear' }> = [];
    
    metrics.forEach((metric) => {
      const data = metricData.metrics[metric];
      if (!data || data.length === 0) return;
      
      const slicedData = data.slice(start, end + 1).filter(v => typeof v === 'number' && !isNaN(v));
      if (slicedData.length === 0) return;
      
      const min = Math.min(...slicedData);
      const max = Math.max(...slicedData);
      
      // Skip metrics with invalid ranges (but allow negative values for loss metrics)
      if (min === max) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Skipping metric ${metric} due to invalid range: min=${min}, max=${max}`);
        }
        return;
      }
      
      // For loss metrics, allow negative values; for others, require positive values
      const isLossMetric = METRIC_SCALE_TYPES.USD_LOSS.includes(metric as any);
      if (!isLossMetric && (min <= 0 || max <= 0)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Skipping metric ${metric} due to non-positive range: min=${min}, max=${max}`);
        }
        return;
      }
      
      const range = max - min;
      
      // Determine appropriate scale type
      let scale: 'log' | 'linear' = 'linear';
      if (METRIC_SCALE_TYPES.USD_LARGE.includes(metric as any) || 
          METRIC_SCALE_TYPES.USD_PRICE.includes(metric as any) ||
          METRIC_SCALE_TYPES.COUNT.includes(metric as any)) {
        scale = 'log';
      } else if (METRIC_SCALE_TYPES.USD_LOSS.includes(metric as any)) {
        scale = 'linear'; // Loss metrics should use linear scale
      }
      
      metricRanges.push({ metric, range: { min, max }, scale });
    });
    
    // Sort metrics by their range magnitude (log scale for better comparison)
    metricRanges.sort((a, b) => {
      const aMagnitude = Math.log10(a.range.max / Math.max(a.range.min, 1e-10));
      const bMagnitude = Math.log10(b.range.max / Math.max(b.range.min, 1e-10));
      return bMagnitude - aMagnitude;
    });
    
    // Group metrics by scale compatibility
    const usedRanges: Array<{ min: number; max: number; scale: 'log' | 'linear' }> = [];
    
    metricRanges.forEach(({ metric, range, scale }) => {
      // Check if this metric can share an axis with existing groups
      let assigned = false;
      
      for (let i = 0; i < axisGroups.length; i++) {
        const group = axisGroups[i];
        if (group.scale !== scale) continue;
        
        // Check if ranges are compatible (within reasonable overlap)
        const groupRange = group.range;
        const combinedMin = Math.min(groupRange.min, range.min);
        const combinedMax = Math.max(groupRange.max, range.max);
        
        // For log scale, check if the ratio of max/min is reasonable
        if (scale === 'log') {
          const ratio = combinedMax / Math.max(combinedMin, 1e-10);
          if (ratio <= 1e6) { // Allow up to 6 orders of magnitude
            group.metrics.push(metric);
            group.range = { min: combinedMin, max: combinedMax };
            assigned = true;
            break;
          }
        } else {
          // For linear scale, check if the absolute difference is reasonable
          const rangeDiff = combinedMax - combinedMin;
          const individualRange = range.max - range.min;
          if (rangeDiff <= individualRange * 100) { // Allow up to 100x range difference
            group.metrics.push(metric);
            group.range = { min: combinedMin, max: combinedMax };
            assigned = true;
            break;
          }
        }
        
        // Additional check: if one metric is much larger than the other, separate them
        const groupMagnitude = Math.log10(groupRange.max / Math.max(groupRange.min, 1e-10));
        const metricMagnitude = Math.log10(range.max / Math.max(range.min, 1e-10));
        if (Math.abs(groupMagnitude - metricMagnitude) > 3) { // More than 3 orders of magnitude difference
          continue; // Don't group these metrics together
        }
      }
      
      // If no compatible group found, create a new one
      if (!assigned) {
        const axisId = `y${axisGroups.length + 1}`;
        const side: 'left' | 'right' = axisGroups.length % 2 === 0 ? 'left' : 'right';
        axisGroups.push({
          axisId,
          metrics: [metric],
          side,
          scale,
          range
        });
      }
    });
    
    // Convert to the expected format for backward compatibility
    const leftAxisMetrics: string[] = [];
    const rightAxisMetrics: string[] = [];
    
    axisGroups.forEach((group) => {
      if (group.side === 'left') {
        leftAxisMetrics.push(...group.metrics);
      } else {
        rightAxisMetrics.push(...group.metrics);
      }
    });
    
    return { leftAxisMetrics, rightAxisMetrics, axisGroups };
  }, [metricData, sliderRange]);

  const { leftAxisMetrics, rightAxisMetrics, axisGroups } = getAxisAssignment(selectedMetricKeys);
  const hasLeftAxis = leftAxisMetrics.length > 0;
  const hasRightAxis = rightAxisMetrics.length > 0;
  
  // Debug logging for axis assignment (can be removed in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Axis Assignment Debug:', {
      selectedMetricKeys,
      leftAxisMetrics,
      rightAxisMetrics,
      axisGroups: axisGroups?.map(g => ({
        axisId: g.axisId,
        metrics: g.metrics,
        side: g.side,
        scale: g.scale,
        range: g.range
      }))
    });
  }
  const leftAxisIsUSD = useMemo(() => {
    return leftAxisMetrics.some((m) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      METRIC_SCALE_TYPES.USD_LARGE.includes(m as any) || METRIC_SCALE_TYPES.USD_PRICE.includes(m as any)
    );
  }, [leftAxisMetrics]);

  useEffect(() => {
    setLoading(true);
    fetchAllMetrics()
      .then((data) => {
        setMetricData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load any saved API key for the current provider
  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined') return;
      const remembered = localStorage.getItem('aiKey:remember') === '1';
      setRememberKey(remembered);
      if (remembered) {
        const loaded = await loadSecret(`aiKey:${selectedProvider}`);
        if (loaded) setApiKey(loaded);
      }
    })();
  }, [selectedProvider]);

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
    
    // Generate unique colors for current metric selection
    const metricColors = generateAdaptiveColors(selectedMetricKeys);
    
    // Debug logging for color generation (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Generated colors:', metricColors);
    }
    
    selectedMetricKeys.forEach((key) => {
      let config = METRIC_GROUPS.flatMap((g) => g.metrics).find((m) => m?.key === key);
      if (!config) {
        const name = METRIC_DISPLAY_NAMES[key];
        if (name) config = { key, name, yaxis: 'y', zScore: false } as any;
      }
      if (!config) return;
      
      // Use dynamically generated color
      const color = metricColors[key];
      
      // Find which axis group this metric belongs to
      const axisGroup = axisGroups.find(group => group.metrics.includes(key));
      const yaxis = axisGroup ? axisGroup.axisId : (rightAxisMetrics.includes(key) ? 'y2' : 'y');
      
      traces.push({ 
        x, 
        y: slicedMetrics[key], 
        name: config.name, 
        type: 'scatter', 
        mode: 'lines', 
        line: { color, width: 1 }, 
        yaxis, 
        visible: hiddenTraces.has(config.name) ? 'legendonly' : true, 
        connectgaps: false 
      });
      
      if (config.zScore && zScores[key]) {
        // Z-score traces get a modified version of the parent color
        const zScoreColor = modifyColorForZScore(color);
        traces.push({ 
          x, 
          y: zScores[key], 
          name: `${config.name} Z`, 
          type: 'scatter', 
          mode: 'lines', 
          line: { color: zScoreColor, width: 1 }, 
          yaxis: 'y2', // Z-scores always go on the right axis
          visible: hiddenTraces.has(`${config.name} Z`) ? 'legendonly' : true 
        });
      }
    });
    return traces;
  }, [processedData, selectedMetricKeys, hiddenTraces, rightAxisMetrics, axisGroups, generateAdaptiveColors, modifyColorForZScore]);

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
    
    // Dynamically create axes based on axis groups
    if (axisGroups && axisGroups.length > 0) {
      axisGroups.forEach((group, index) => {
        const axisConfig: any = {
          title: `${group.metrics.length > 1 ? 'Multiple Metrics' : METRIC_DISPLAY_NAMES[group.metrics[0]] || group.metrics[0]}`,
          type: group.scale,
          side: group.side,
          color: 'white',
          gridcolor: 'rgba(55,65,81,0.3)',
          showgrid: true,
          showline: false,
          zeroline: false,
          showticklabels: true,
          tickmode: 'auto',
          nticks: 8,
          tickfont: { color: 'white', size: 10 }
        };
        
        // Configure axis-specific properties
        if (group.scale === 'log') {
          axisConfig.tickformat = '.2s';
          if (group.metrics.some(m => METRIC_SCALE_TYPES.USD_LARGE.includes(m as any) || METRIC_SCALE_TYPES.USD_PRICE.includes(m as any))) {
            axisConfig.tickprefix = '$';
          }
        } else {
          axisConfig.tickformat = '.2f';
        }
        
        // Position axes to avoid overlap
        if (index === 0) {
          // First axis (y) - no overlay
          base.yaxis = axisConfig;
        } else if (index === 1) {
          // Second axis (y2) - overlay on first
          axisConfig.overlaying = 'y';
          base.yaxis2 = axisConfig;
        } else {
          // Additional axes - create separate axes with proper positioning
          axisConfig.overlaying = 'y';
          axisConfig.anchor = 'free';
          
          // Calculate position to avoid overlap
          if (group.side === 'left') {
            axisConfig.position = 0.05 - (index * 0.02);
            axisConfig.side = 'left';
          } else {
            axisConfig.position = 0.95 + (index * 0.02);
            axisConfig.side = 'right';
          }
          
          base[group.axisId] = axisConfig;
        }
      });
    } else {
      // Fallback to original logic for backward compatibility
      if (hasLeftAxis) base.yaxis = { title: 'USD Value (log2)', type: 'log', side: 'left', color: 'white', gridcolor: 'rgba(55,65,81,0.3)', showgrid: true, showline: false, zeroline: false, tickformat: '.2s', tickprefix: leftAxisIsUSD ? '$' : undefined, showticklabels: true, tickmode: 'auto', nticks: 8, tickfont: { color: 'white', size: 10 } };
      if (hasRightAxis) base.yaxis2 = { title: 'Ratio / Z (linear)', type: 'linear', side: 'right', color: 'white', gridcolor: 'rgba(55,65,81,0.3)', showgrid: true, showline: false, zeroline: false, tickformat: '.2f', showticklabels: true, tickmode: 'auto', nticks: 8, tickfont: { color: 'white', size: 10 }, overlaying: hasLeftAxis ? 'y' : undefined };
    }
    
    return base;
  }, [axisGroups, hasLeftAxis, hasRightAxis, leftAxisIsUSD]);

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
      await sendMessage({ parts: [{ type: 'text', text: 'Please enter your API key first.' } as any] });
      return;
    }
    if (selectedMetricKeys.length === 0) {
      await sendMessage({ parts: [{ type: 'text', text: 'Please select at least one metric to analyze.' } as any] });
      return;
    }
    setIsAnalyzing(true);
    try {
      const imageBase64 = await captureChartScreenshot();
      const context: AnalysisContext = { selectedMetrics: selectedMetricKeys, metricNames: METRIC_DISPLAY_NAMES, timeRange: metricData && sliderRange ? `${metricData.dates[sliderRange[0]]} to ${metricData.dates[sliderRange[1]]}` : undefined };
      const prompt = getChartAnalysisPrompt(context);
      await sendMessage({
        parts: [
          { type: 'text', text: prompt } as any,
          { type: 'image', image: imageBase64, mimeType: 'image/png' } as any,
        ],
      }, { body: { provider: selectedProvider, apiKey } });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const context: AnalysisContext = { selectedMetrics: selectedMetricKeys, metricNames: METRIC_DISPLAY_NAMES, timeRange: metricData && sliderRange ? `${metricData.dates[sliderRange[0]]} to ${metricData.dates[sliderRange[1]]}` : undefined };
    const prompt = getFollowUpPrompt(userInput, context);
    setUserInput('');
    await sendMessage({ parts: [{ type: 'text', text: prompt } as any] }, { body: { provider: selectedProvider, apiKey } });
  };

  // When popover closes, persist current state if Remember is enabled
  useEffect(() => {
    (async () => {
      if (!apiPopoverOpen && rememberKey && apiKey.trim()) {
        await saveSecret(`aiKey:${selectedProvider}`, apiKey);
        localStorage.setItem('aiKey:remember', '1');
      }
    })();
  }, [apiPopoverOpen]);

  return (
    <div className="bg-black text-white h-screen w-full flex flex-col overflow-hidden border-b border-white/20">
      <header className="h-16 w-full flex items-center justify-between px-8 flex-none">
        <div />
        <h1 className="text-3xl font-bold">AI Workbench</h1>
        <div className="flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={open} className="h-10 w-[300px] justify-between bg-black border-white/20 text-white hover:bg_WHITE/10">
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
                        <CommandItem value={group.name} onSelect={() => {
                          const isSelected = selectedGroups.includes(group.name);
                          setSelectedGroups((prev) => (isSelected ? prev.filter((g) => g !== group.name) : [...prev, group.name]));
                        }}>
                          <Check className={cn('mr-2 h-4 w-4', selectedGroups.includes(group.name) ? 'opacity-100' : 'opacity-0')} />
                          {group.name}
                        </CommandItem>
                      </div>
                    ))}
                  </CommandGroup>
                  <CommandGroup heading="Individual Metrics">
                    {METRICS_LIST.map((metricKey) => (
                      <CommandItem key={`metric-${metricKey}`} value={`${METRIC_DISPLAY_NAMES[metricKey] || metricKey} ${metricKey}`} onSelect={() => {
                        const isSelected = selectedIndividualMetrics.includes(metricKey);
                        setSelectedIndividualMetrics((prev) => (isSelected ? prev.filter((m) => m !== metricKey) : [...prev, metricKey]));
                      }}>
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

      <div className="flex flex-1 min-h-0 p-4 gap-4 items-stretch overflow-hidden">
        <section ref={panelRef} className="flex-1 min-h-0 min-w-0 flex flex-col p-2 bg-black border border-white/20 rounded-md relative overflow-hidden">
          {(() => {
            if (loading || !metricData) return <span className="text_WHITE/60">Loading chart...</span>;
            return (
              <>
                <div className="flex items-center justify-start gap-4 mb-2 px-2">
                  {chartData.map((trace, index: number) => {
                    const typed = trace as { name: string; line?: { color: string }; marker?: { color: string } };
                    const isHidden = hiddenTraces.has(typed.name);
                    return (
                      <button key={index} onClick={() => {
                        setHiddenTraces((prev) => {
                          const next = new Set(prev);
                          if (next.has(typed.name)) next.delete(typed.name); else next.add(typed.name);
                          return next;
                        });
                      }} className={cn('flex items-center gap-2 px-2 py-1 rounded transition-colors', isHidden ? 'text_WHITE/40 hover:text_WHITE/60' : 'text_WHITE hover:text_WHITE/80')}>
                        <div className={cn('w-3 h-3 rounded-full transition-opacity', isHidden ? 'opacity-40' : 'opacity-100')} style={{ backgroundColor: typed.line?.color || typed.marker?.color || '#fff' }} />
                        <span className="text-sm">{typed.name}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="relative flex-1 min-h-0 w-full h-full overflow-hidden">
                  <Plot divId="ai-workbench-plot-v2" data={chartData} layout={chartLayout} useResizeHandler={true} style={{ width: '100%', height: '100%' }} config={{ displayModeBar: false }} />
                </div>
                {metricData && sliderRange && (
                  <div className="w-full flex justify-center items-center mt-2">
                    <Slider.Root className="time-slider relative w-full max-w-2xl h-6 flex items-center" min={0} max={metricData.dates.length - 1} step={1} value={sliderRange} onValueChange={([start, end]) => setSliderRange([start, end])} minStepsBetweenThumbs={1}>
                      <Slider.Track className="bg-[#444a] h-[3px] w-full rounded-full"><Slider.Range className="bg-transparent" /></Slider.Track>
                      <Slider.Thumb className="block w-2 h-2 bg-white border-2 border-white rounded-full shadow" />
                      <Slider.Thumb className="block w-2 h-2 bg-white border-2 border-white rounded-full shadow" />
                    </Slider.Root>
                  </div>
                )}
              </>
            );
          })()}
        </section>

        <aside className="relative w-[420px] md:w-[360px] min-w-[320px] h-full flex flex-col bg-black border border-white/20 rounded-md overflow-hidden flex-none">
          <div className="p-3 border-b border-white/20 bg-black">
            <div className="flex items_center gap-2 flex-nowrap overflow-hidden">
              <div className="flex items-center gap-2 shrink-0">
                <Bot className="h-5 w-5" />
                <span className="text-base font-semibold">AI</span>
              </div>
              <Button onClick={handleAnalysis} disabled={isAnalyzing} className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                {isAnalyzing ? 'Analyzing…' : 'Analysis'}
              </Button>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="h-9 px-3 bg-black border-white/20 text-white text-sm shrink-0 w-auto min-w-[5.5rem]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-black border-white/20"><SelectItem value="openai">OpenAI</SelectItem><SelectItem value="anthropic">Anthropic</SelectItem></SelectContent>
              </Select>
              <Popover open={apiPopoverOpen} onOpenChange={setApiPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 px-3 bg-black border-white/20 text-white hover:bg-white/10 shrink-0">API Key</Button>
                </PopoverTrigger>
                <PopoverContent className="bg-black border-white/20 w-80 p-3">
                  <div className="flex flex-col gap-2">
                    <Input type="password" placeholder="Enter API Key" value={apiKey} onChange={(e: React.ChangeEvent<HTMLInputElement>) => void handleApiKeyChange(e.target.value)} className="bg-black border-white/20 text-white placeholder:text-white/50 text-sm" />
                    <div className="flex items-center gap-3 text-sm">
                      <label className="flex items-center gap-2"><input type="checkbox" className="accent-blue-600" checked={rememberKey} onChange={(e) => void handleRememberChange(e.target.checked)} /> Remember on this device</label>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button onClick={async () => { setApiKey(''); await clearSecret(`aiKey:${selectedProvider}`); localStorage.removeItem('aiKey:remember'); setRememberKey(false); }} variant="outline" className="h-9 px-3 bg-black border-white/20 text-white hover:bg-white/10">Clear</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center text-white/60 py-8"><Bot className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Start by analyzing your chart or ask me anything about the metrics.</p></div>
            ) : (
              messages.map((m, idx) => {
                const role = (m as any).role as 'user' | 'assistant' | 'system';
                const parts: any[] = (m as any).parts || [];
                const text = parts.filter(p => p.type === 'text').map(p => p.text).join('\n');
                return (
                  <div key={idx} className={cn('flex gap-3', role === 'user' ? 'justify-end' : 'justify-start')}>
                    {role !== 'user' && (<div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0"><Bot className="h-4 w-4 text-white" /></div>)}
                    <div className={cn('max-w-[80%] rounded-lg px-4 py-2', role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white')}>
                      <p className="text-sm whitespace-pre-wrap break-all">{text}</p>
                    </div>
                    {role === 'user' && (<div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-white" /></div>)}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-white/20 flex-none">
            <div className="flex gap-2">
              <Textarea placeholder="Ask me about the metrics..." value={userInput} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserInput(e.target.value)} onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} className="flex-1 bg-black border-white/20 text-white placeholder:text-white/50 resize-none" rows={1} />
              <Button onClick={handleSendMessage} disabled={!userInput.trim() || status !== 'ready'} className="bg-blue-600 hover:bg-blue-700 text-white"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}


