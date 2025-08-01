'use client';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import dynamic from 'next/dynamic';
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });
import { fetchAllMetrics, type MetricData, calculateZScores } from '../../datamanager';
import { METRIC_GROUPS, METRICS_LIST, METRIC_DISPLAY_NAMES, METRIC_SCALE_TYPES } from '../../datamanager/metricsConfig';
import * as Slider from '@radix-ui/react-slider';
import { Check, ChevronsUpDown, Send, Bot, User } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// import { List, AutoSizer } from 'react-virtualized'; // Unused imports
import html2canvas from 'html2canvas';
import { llmService, type LLMProvider } from '@/lib/llm';
import { getChartAnalysisPrompt, getFollowUpPrompt, type AnalysisContext } from '@/lib/prompts/analysis';

// Debounce function for resize events
function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
      return ((...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Data downsampling function for performance
// IMPORTANT: This preserves statistical accuracy because:
// 1. Z-scores are calculated on FULL dataset first
// 2. Then we sample the results for display
// 3. Statistical relationships remain intact
// 4. Only visual resolution is reduced (which is imperceptible)
function downsampleData<T>(data: T[], maxPoints: number = 1000): T[] {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  const downsampled: T[] = [];
  
  // Always include the first point
  downsampled.push(data[0]);
  
  // Sample at regular intervals
  for (let i = step; i < data.length - step; i += step) {
    downsampled.push(data[i]);
  }
  
  // Always include the last point
  if (downsampled[downsampled.length - 1] !== data[data.length - 1]) {
    downsampled.push(data[data.length - 1]);
  }
  
  return downsampled;
}

export default function AIWorkbench() {
  console.log('METRIC_GROUPS:', METRIC_GROUPS);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['MVRV Ratio']);
  // const [selectedSubgroups, setSelectedSubgroups] = useState<string[]>([]);
  const [selectedIndividualMetrics, setSelectedIndividualMetrics] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [metricData, setMetricData] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sliderRange, setSliderRange] = useState<[number, number] | null>(null);
  // const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [plotPanelKey, setPlotPanelKey] = useState(0);
  const [hiddenTraces, setHiddenTraces] = useState<Set<string>>(new Set()); // Track hidden traces by name

  // Function to get default hidden traces based on selected groups and subgroups
  const getDefaultHiddenTraces = useCallback((groups: string[]) => {
    const hidden = new Set<string>();
    
    groups.forEach(groupName => {
      const group = METRIC_GROUPS.find(g => g.name === groupName);
      if (group) {
        if (groupName === 'Price Models') {
          // For Price Models, show only the main metrics, hide Z-scores
          if (group.metrics) {
            group.metrics.forEach(metric => {
              hidden.add(`${metric.name} Z`);
            });
          }
        } else if (groupName === 'MVRV Ratio') {
          // For MVRV Ratio, show all metrics, hide Z-scores
          if (group.metrics) {
            group.metrics.forEach(metric => {
              hidden.add(`${metric.name} Z`);
            });
          }
        } else {
          // For other groups, hide all traces by default for better UX
          if (group.metrics) {
            group.metrics.forEach(metric => {
              hidden.add(metric.name);
              hidden.add(`${metric.name} Z`);
            });
          }
        }
      }
    });
    
    return hidden;
  }, []);
  const panelRef = useRef<HTMLDivElement>(null);

  // AI Analyst state
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [apiKey, setApiKey] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);
  const [userMessage, setUserMessage] = useState('');

  // Helper function to get all selected metric keys (groups + individual, deduplicated)
  const getSelectedMetricKeys = useCallback(() => {
    const groupMetrics = new Set<string>();
    const individualMetrics = new Set(selectedIndividualMetrics);
    
    // Add all metrics from selected groups
    selectedGroups.forEach(groupName => {
      const group = METRIC_GROUPS.find(g => g.name === groupName);
      if (group) {
        group.metrics.forEach(metric => {
          groupMetrics.add(metric.key);
        });
      }
    });
    
    // Combine and deduplicate
    return [...groupMetrics, ...individualMetrics];
  }, [selectedGroups, selectedIndividualMetrics]);

  // Get currently selected metrics for display
  const selectedMetricKeys = getSelectedMetricKeys();
  console.log('Selected groups:', selectedGroups);
  console.log('Selected metric keys:', selectedMetricKeys);
  console.log('Available metrics in data:', metricData ? Object.keys(metricData.metrics) : 'No data');
  console.log('MVRV metrics available:', metricData ? {
    marketcap: metricData.metrics.marketcap?.length || 0,
    realizedCap: metricData.metrics['realized-cap']?.length || 0,
    mvrvRatio: metricData.metrics['mvrv-ratio']?.length || 0
  } : 'No data');

  // Smart axis assignment logic
  const getAxisAssignment = useCallback((metrics: string[]) => {
    const leftAxisMetrics: string[] = [];
    const rightAxisMetrics: string[] = [];
    
    metrics.forEach(metric => {
      // Special case: MVRV group - Market Cap and Realized Cap on left, MVRV Ratio on right
      if (metric === 'marketcap' || metric === 'realized-cap') {
        leftAxisMetrics.push(metric); // Large USD values on log scale
      } else if (metric === 'mvrv-ratio') {
        rightAxisMetrics.push(metric); // Ratio on linear scale
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if (METRIC_SCALE_TYPES.USD_LARGE.includes(metric as any)) {
        leftAxisMetrics.push(metric); // Log scale for large USD values
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if (METRIC_SCALE_TYPES.USD_PRICE.includes(metric as any)) {
        leftAxisMetrics.push(metric); // Log scale for price values
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if (METRIC_SCALE_TYPES.RATIO.includes(metric as any)) {
        rightAxisMetrics.push(metric); // Linear scale for ratios
      } else if (metric.endsWith('_z')) {
        rightAxisMetrics.push(metric); // Linear scale for z-scores
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if (METRIC_SCALE_TYPES.PERCENTAGE.includes(metric as any)) {
        rightAxisMetrics.push(metric); // Linear scale for percentages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if (METRIC_SCALE_TYPES.COUNT.includes(metric as any)) {
        leftAxisMetrics.push(metric); // Log scale for large counts
      } else {
        // Default: put on left axis
        leftAxisMetrics.push(metric);
      }
    });
    
    return { leftAxisMetrics, rightAxisMetrics };
  }, []);

  const { leftAxisMetrics, rightAxisMetrics } = getAxisAssignment(selectedMetricKeys);
  const hasLeftAxis = leftAxisMetrics.length > 0;
  const hasRightAxis = rightAxisMetrics.length > 0;

  // Update hidden traces when selected groups or individual metrics change
  useEffect(() => {
    const defaultHidden = getDefaultHiddenTraces(selectedGroups);
    
    // Also hide Z-scores for individually selected metrics by default
    selectedIndividualMetrics.forEach(metricKey => {
      const displayName = METRIC_DISPLAY_NAMES[metricKey];
      if (displayName) {
        defaultHidden.add(`${displayName} Z`);
      }
    });
    
    setHiddenTraces(defaultHidden);
  }, [selectedGroups, selectedIndividualMetrics, getDefaultHiddenTraces]);

  // Memoized data processing
  const processedData = useMemo(() => {
    console.log('Processing data:', {
      hasMetricData: !!metricData,
      sliderRange,
      selectedMetricKeysLength: selectedMetricKeys.length,
      selectedMetricKeys
    });
    
    if (!metricData || !sliderRange || selectedMetricKeys.length === 0) return null;
    
    const [start, end] = sliderRange;
    const x = metricData.dates.slice(start, end + 1);
    
    // Determine if we need downsampling (more than 1000 points)
    const needsDownsampling = x.length > 1000;
    const maxPoints = 1000;
    
    // Pre-calculate all z-scores for selected metrics
    const zScores: Record<string, number[]> = {};
    const slicedMetrics: Record<string, number[]> = {};
    
    selectedMetricKeys.forEach(metricKey => {
      // Get the metric data
      const metricDataArray = metricData.metrics[metricKey] || [];
      slicedMetrics[metricKey] = metricDataArray.slice(start, end + 1);
      
      console.log(`Slicing ${metricKey}:`, {
        originalLength: metricDataArray.length,
        start,
        end,
        slicedLength: slicedMetrics[metricKey].length,
        sampleValues: slicedMetrics[metricKey].slice(0, 3)
      });
      
      // Find metric config to check if z-score is needed (same logic as chart data)
      let metricConfig = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m?.key === metricKey);
      if (!metricConfig) {
        const displayName = METRIC_DISPLAY_NAMES[metricKey];
        if (displayName) {
          metricConfig = {
            key: metricKey,
            name: displayName,
            color: '#33B1FF',
            yaxis: 'y',
            zScore: false,
          };
        }
      }
      
      if (metricConfig?.zScore) {
        zScores[metricKey] = calculateZScores(metricDataArray, 1460).slice(start, end + 1);
      }
    });
    
    // Apply downsampling if needed
    if (needsDownsampling) {
      const downsampledX = downsampleData(x, maxPoints);
      const downsampledZScores: Record<string, number[]> = {};
      const downsampledMetrics: Record<string, number[]> = {};
      
      selectedMetricKeys.forEach(metricKey => {
        downsampledMetrics[metricKey] = downsampleData(slicedMetrics[metricKey], maxPoints);
        if (zScores[metricKey]) {
          downsampledZScores[metricKey] = downsampleData(zScores[metricKey], maxPoints);
        }
      });
      
      return { 
        x: downsampledX, 
        zScores: downsampledZScores, 
        slicedMetrics: downsampledMetrics,
        downsampled: true 
      };
    }
    
    return { x, zScores, slicedMetrics, downsampled: false };
  }, [metricData, sliderRange, selectedMetricKeys]);

  // Memoized chart data
  const chartData = useMemo(() => {
    if (!processedData) return [];
    
    const { x, zScores, slicedMetrics } = processedData;
    const traces: unknown[] = [];
    
    console.log('Chart data generation:', {
      selectedMetricKeys,
      availableSlicedMetrics: Object.keys(slicedMetrics),
      xLength: x.length,
      sampleData: selectedMetricKeys.map(key => ({
        key,
        dataLength: slicedMetrics[key]?.length || 0,
        sampleValues: slicedMetrics[key]?.slice(0, 3) || []
      }))
    });
    
    // Add metric traces
    selectedMetricKeys.forEach(metricKey => {
      // Find metric config for display name and styling
      let metricConfig = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m?.key === metricKey);
      
      // If not found in groups, create config from METRICS_LIST and METRIC_DISPLAY_NAMES
      if (!metricConfig) {
        const displayName = METRIC_DISPLAY_NAMES[metricKey];
        if (displayName) {
          metricConfig = {
            key: metricKey,
            name: displayName,
            color: '#33B1FF', // Default color
            yaxis: 'y', // Default y-axis
            zScore: false,
          };
        }
      }
      
      if (!metricConfig) return;
      
      // Main metric trace - no filtering, just plot the data
      const traceData = slicedMetrics[metricKey];
      
      // Check if trace should be visible based on hiddenTraces state
      const shouldBeVisible = !hiddenTraces.has(metricConfig.name);
      
      // Determine which axis to use for this metric
      const isRightAxisMetric = rightAxisMetrics.includes(metricKey);
      
      traces.push({
        x,
        y: traceData,
        name: metricConfig.name,
        type: 'scatter' as const,
        mode: 'lines' as const,
        line: { color: metricConfig.color, width: 1 },
        yaxis: isRightAxisMetric ? 'y2' : 'y',
        visible: shouldBeVisible ? true : 'legendonly',
        connectgaps: false,
      });
      
      // Z-score trace if enabled
      if (metricConfig.zScore && zScores[metricKey]) {
        traces.push({
          x,
          y: zScores[metricKey],
          name: `${metricConfig.name} Z`,
          type: 'scatter' as const,
          mode: 'lines' as const,
          line: { color: metricConfig.color, width: 1 },
          yaxis: 'y2', // Z-scores always go on right axis (linear scale)
          visible: hiddenTraces.has(`${metricConfig.name} Z`) ? 'legendonly' : true,
        });
      }
    });
    
    console.log('Generated traces:', traces.length, traces.map(t => ({
      name: (t as { name: string }).name,
      yLength: (t as { y?: number[] }).y?.length || 0,
      yaxis: (t as { yaxis?: string }).yaxis,
      visible: (t as { visible?: boolean | string }).visible
    })));
    
    return traces;
  }, [processedData, selectedMetricKeys, hiddenTraces]);

  // Dynamic dual-axis chart layout
  const chartLayout = useMemo(() => {
    const baseLayout: Record<string, unknown> = {
      autosize: true,
      paper_bgcolor: 'black',
      plot_bgcolor: 'black',
      font: { color: 'white' },
      xaxis: {
        color: 'white',
        gridcolor: 'rgba(55, 65, 81, 0.3)',
        title: 'Date',
        showgrid: true,
        gridwidth: 1
      },
      margin: { l: 80, r: 80, t: 20, b: 40 },
      showlegend: false,
    };

    // Add left axis if needed
    if (hasLeftAxis) {
      baseLayout.yaxis = {
        title: 'USD Value (log)',
        type: 'log' as const,
        side: 'left' as const,
        color: 'white',
        gridcolor: 'rgba(55, 65, 81, 0.3)',
        showgrid: true,
        showline: false,
        zeroline: false,
        tickformat: '.2s',
        showticklabels: true,
        tickmode: 'auto',
        nticks: 8,
        tickfont: { color: 'white', size: 10 }
      };
    }

    // Add right axis if needed
    if (hasRightAxis) {
      baseLayout.yaxis2 = {
        title: 'MVRV Ratio (linear)',
        type: 'linear' as const,
        side: 'right' as const,
        color: 'white',
        gridcolor: 'rgba(55, 65, 81, 0.3)',
        showgrid: true,
        showline: false,
        zeroline: false,
        tickformat: '.2f',
        showticklabels: true,
        tickmode: 'auto',
        nticks: 8,
        tickfont: { color: 'white', size: 10 },
        overlaying: hasLeftAxis ? 'y' : undefined,
      };
    }

    return baseLayout;
  }, [hasLeftAxis, hasRightAxis]);

  // Debounced resize handler
  const debouncedResizeHandler = useCallback(
    debounce(() => setPlotPanelKey(k => k + 1), 100),
    []
  );

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
  }, [metricData, sliderRange]);

  useEffect(() => {
    if (!panelRef.current) return;
    const ro = new window.ResizeObserver(debouncedResizeHandler);
    ro.observe(panelRef.current);
    return () => ro.disconnect();
  }, [debouncedResizeHandler]);

  // Screenshot capture function
  const captureChartScreenshot = async (): Promise<string> => {
    const chartElement = document.getElementById('ai-workbench-plot');
    if (!chartElement) {
      throw new Error('Chart element not found');
    }

    // Temporarily hide the time slider during capture
    const sliderElement = chartElement.parentElement?.querySelector('.time-slider') as HTMLElement;
    const originalDisplay = sliderElement?.style.display;
    if (sliderElement) {
      sliderElement.style.display = 'none';
    }

    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#000000',
        scale: 2, // High quality
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // Restore the time slider
      if (sliderElement && originalDisplay !== undefined) {
        sliderElement.style.display = originalDisplay;
      }

      return canvas.toDataURL('image/png').split(',')[1]; // Return base64 without data URL prefix
    } catch (error) {
      // Restore the time slider on error
      if (sliderElement && originalDisplay !== undefined) {
        sliderElement.style.display = originalDisplay;
      }
      throw error;
    }
  };

  // AI Analysis function
  const handleAnalysis = async () => {
    if (!apiKey.trim()) {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Please enter your API key first.',
        timestamp: new Date()
      }]);
      return;
    }

    if (selectedMetricKeys.length === 0) {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Please select at least one metric to analyze.',
        timestamp: new Date()
      }]);
      return;
    }

    setIsAnalyzing(true);
    
    // Add initial message
    const analysisMessageId = Date.now().toString();
    setChatMessages(prev => [...prev, {
      id: analysisMessageId,
      type: 'assistant',
      content: 'Capturing chart and analyzing metrics...',
      timestamp: new Date()
    }]);

    try {
      // Debug API key
      console.log('Analysis Debug:', {
        provider: selectedProvider,
        apiKeyLength: apiKey.length,
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        selectedMetrics: selectedMetricKeys.length
      });

      // Set API key for the selected provider
      llmService.setAPIKey(selectedProvider as LLMProvider, apiKey);

      // Capture screenshot
      const imageBase64 = await captureChartScreenshot();
      
      // Debug image data
      console.log('Image Debug:', {
        imageSize: imageBase64.length,
        imageSizeKB: Math.round(imageBase64.length / 1024),
        imagePrefix: imageBase64.substring(0, 50) + '...'
      });

      // Prepare analysis context
      const context: AnalysisContext = {
        selectedMetrics: selectedMetricKeys,
        metricNames: METRIC_DISPLAY_NAMES,
        timeRange: metricData && sliderRange ? 
          `${metricData.dates[sliderRange[0]]} to ${metricData.dates[sliderRange[1]]}` : 
          undefined
      };

      // Get analysis prompt
      const prompt = getChartAnalysisPrompt(context);

      // Call LLM for analysis
      const response = await llmService.analyzeChart(selectedProvider as LLMProvider, {
        prompt,
        imageBase64,
        maxTokens: 1000,
        temperature: 0.7
      });

      console.log('Analysis response:', response);
      console.log('Response content:', response.content);
      console.log('Response type:', typeof response.content);

      // Update the message with the analysis
      setChatMessages(prev => prev.map(msg => 
        msg.id === analysisMessageId 
          ? { ...msg, content: response.content }
          : msg
      ));

    } catch (error) {
      console.error('Analysis error:', error);
      
      // Update the message with error
      setChatMessages(prev => prev.map(msg => 
        msg.id === analysisMessageId 
          ? { ...msg, content: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
          : msg
      ));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Send user message
  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: userMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMessage]);
    const userQuestion = userMessage;
    setUserMessage('');

    // Add loading message
    const loadingMessageId = (Date.now() + 1).toString();
    setChatMessages(prev => [...prev, {
      id: loadingMessageId,
      type: 'assistant',
      content: 'Thinking...',
      timestamp: new Date()
    }]);

    try {
      // Prepare context for follow-up
      const context: AnalysisContext = {
        selectedMetrics: selectedMetricKeys,
        metricNames: METRIC_DISPLAY_NAMES,
        timeRange: metricData && sliderRange ? 
          `${metricData.dates[sliderRange[0]]} to ${metricData.dates[sliderRange[1]]}` : 
          undefined
      };

      // Get follow-up prompt
      const prompt = getFollowUpPrompt(userQuestion, context);

      // Call LLM for chat response
      const response = await llmService.chat(selectedProvider as LLMProvider, {
        prompt,
        maxTokens: 500,
        temperature: 0.7
      });

      console.log('Chat response:', response);

      // Update the loading message with the response
      setChatMessages(prev => prev.map(msg => 
        msg.id === loadingMessageId 
          ? { ...msg, content: response.content }
          : msg
      ));

    } catch (error) {
      console.error('Chat error:', error);
      
      // Update the loading message with error
      setChatMessages(prev => prev.map(msg => 
        msg.id === loadingMessageId 
          ? { ...msg, content: `Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
          : msg
      ));
    }
  };

  return (
    <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
      <header className="py-8 border-b border-white/20 w-full flex items-center justify-between px-8">
        <h1 className="text-3xl font-bold">AI Workbench</h1>
        {/* Metric selection with combobox */}
        <div className="flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[300px] justify-between bg-black border-white/20 text-white hover:bg-white/10"
              >
                {selectedMetricKeys.length > 0 
                  ? `${selectedMetricKeys.length} metric${selectedMetricKeys.length > 1 ? 's' : ''} selected`
                  : "Select metrics..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-black border-white/20">
              <Command>
                <CommandInput placeholder="Search groups and metrics..." className="h-9" />
                <CommandList className="max-h-[400px]">
                  <CommandEmpty>No results found.</CommandEmpty>
                  
                  {/* Groups Section */}
                  <CommandGroup heading="Groups">
                    {METRIC_GROUPS.map((group) => {
                      console.log('Rendering group:', group.name);
                      return (
                        <div key={`group-${group.name}`}>
                          <CommandItem
                            value={group.name}
                            onSelect={() => {
                              console.log('Group selected:', group.name);
                              const isSelected = selectedGroups.includes(group.name);
                              if (isSelected) {
                                setSelectedGroups(prev => prev.filter(g => g !== group.name));
                                // Also remove all subgroups when group is deselected
                                // setSelectedSubgroups(prev => prev.filter(sg => !sg.startsWith(`${group.name} -`)));
                              } else {
                                setSelectedGroups(prev => [...prev, group.name]);
                              }
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedGroups.includes(group.name) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {group.name}
                          </CommandItem>

                        </div>
                      );
                    })}
                  </CommandGroup>
                  
                  {/* Individual Metrics Section */}
                  <CommandGroup heading="Individual Metrics">
                    {METRICS_LIST.map((metricKey) => (
                      <CommandItem
                        key={`metric-${metricKey}`}
                        value={`${METRIC_DISPLAY_NAMES[metricKey] || metricKey} ${metricKey}`}
                        onSelect={() => {
                          const isSelected = selectedIndividualMetrics.includes(metricKey);
                          if (isSelected) {
                            setSelectedIndividualMetrics(prev => prev.filter(m => m !== metricKey));
                          } else {
                            setSelectedIndividualMetrics(prev => [...prev, metricKey]);
                          }
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedIndividualMetrics.includes(metricKey) ? "opacity-100" : "opacity-0"
                          )}
                        />
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
      <div className="flex flex-col flex-1 p-4 gap-4">
        {/* 2 main panels: left (unified), right (vertical split) */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0 border border-white/20 bg-black">
          {/* Unified Left Panel */}
          <ResizablePanel defaultSize={67} minSize={20} className="flex-1 min-h-0 min-w-0 flex flex-col">
            <div ref={panelRef} className="flex-1 min-h-0 min-w-0 flex flex-col p-2 bg-black border-r border-white/20">
              {(() => {
                if (loading || !metricData) {
                  return <span className="text-white/60">Loading chart...</span>;
                }
                
                return (
                  <>
                    {/* Custom Legend Row */}
                    <div className="flex items-center justify-start gap-4 mb-2 px-2">
                      {chartData.map((trace, index: number) => {
                        const typedTrace = trace as { name: string; line?: { color: string }; marker?: { color: string } };
                        const isHidden = hiddenTraces.has(typedTrace.name);
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              setHiddenTraces(prev => {
                                const newHidden = new Set(prev);
                                if (newHidden.has(typedTrace.name)) {
                                  newHidden.delete(typedTrace.name);
                                } else {
                                  newHidden.add(typedTrace.name);
                                }
                                return newHidden;
                              });
                            }}
                            className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                              isHidden 
                                ? 'text-white/40 hover:text-white/60' 
                                : 'text-white hover:text-white/80'
                            }`}
                          >
                            <div 
                              className={`w-3 h-3 rounded-full transition-opacity ${
                                isHidden ? 'opacity-40' : 'opacity-100'
                              }`}
                              style={{ backgroundColor: typedTrace.line?.color || typedTrace.marker?.color || '#fff' }}
                            />
                            <span className="text-sm">{typedTrace.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative flex-1 min-h-0 w-full h-full">
                      <Plot
                        key={plotPanelKey}
                        divId="ai-workbench-plot"
                        data={chartData}
                        layout={chartLayout}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ displayModeBar: false }}
                      />
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
                  </>
                );
              })()}
            </div>
          </ResizablePanel>
          <ResizableHandle className="border border-white/20 border-[1px]" />
          {/* Right side (vertical split) */}
          <ResizablePanel defaultSize={33} minSize={20} className="min-w-0">
            <ResizablePanelGroup direction="vertical" className="h-full min-h-0">
              {/* AI Analyst Panel */}
              <ResizablePanel defaultSize={70} minSize={30} className="min-h-0">
                <div className="flex flex-col h-full w-full bg-black border-b border-white/20">
                  {/* AI Analysis Header */}
                  <div className="p-4 border-b border-white/20 bg-black">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        AI{' '}
                        <button
                          onClick={handleAnalysis}
                          disabled={isAnalyzing}
                          className="text-white px-3 py-1 rounded-md text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          style={{
                            backgroundColor: isAnalyzing ? 'rgb(31, 96, 196)' : 'rgb(31, 96, 196)',
                            opacity: isAnalyzing ? 0.5 : 1,
                            animation: isAnalyzing ? 'none' : 'breathe 3s ease-in-out infinite'
                          }}
                          onMouseEnter={(e) => {
                            if (!isAnalyzing) {
                              e.currentTarget.style.backgroundColor = 'rgb(41, 106, 206)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isAnalyzing) {
                              e.currentTarget.style.backgroundColor = 'rgb(31, 96, 196)';
                            }
                          }}
                        >
                          <style jsx>{`
                            @keyframes breathe {
                              0%, 100% { transform: scale(1); }
                              50% { transform: scale(1.02); }
                            }
                          `}</style>
                          {isAnalyzing ? 'Analyzing...' : 'Analysis'}
                        </button>
                      </h3>
                      <div className="flex items-center gap-2">
                        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                          <SelectTrigger className="w-28 bg-black border-white/20 text-white text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-white/20">
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="anthropic">Anthropic</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="password"
                          placeholder="API Key"
                          value={apiKey}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                          className="w-48 bg-black border-white/20 text-white placeholder:text-white/50 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-white/60 py-8">
                        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Start by analyzing your chart or ask me anything about the metrics.</p>
                      </div>
                    ) : (
                      chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-3",
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {message.type === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-4 py-2",
                              message.type === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/10 text-white'
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs opacity-50 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          {message.type === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Chat Input */}
                  <div className="p-4 border-t border-white/20">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Ask me about the metrics..."
                        value={userMessage}
                                                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserMessage(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1 bg-black border-white/20 text-white placeholder:text-white/50 resize-none"
                        rows={1}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!userMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle className="border border-white/20 border-[1px]" />
              {/* Bottom Right */}
              <ResizablePanel defaultSize={30} minSize={20} className="min-h-0">
                <div className="flex flex-col h-full w-full items-center justify-center p-2 bg-black">
                  <span className="text-white text-lg font-semibold">Bottom Right ({selectedMetricKeys.length} metrics)</span>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
} 