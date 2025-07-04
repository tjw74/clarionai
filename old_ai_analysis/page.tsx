"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import * as Slider from '@radix-ui/react-slider'

import { Brain, Settings, Send, Loader2, Key } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import BitcoinChartJS, { BitcoinChartRef } from "@/components/bitcoin-chart-chartjs"
import ZScoreStatsCards from "@/components/ZScoreStatsCards"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"

// Define trace visibility types
const TRACE_KEYS = [
  'price', 'ma200', 'realizedPrice', 'trueMarketMean',
  'mayer', 'priceRealized', 'priceTrueMean', 'lthMarketValue', 'lthRealizedValue',
  'mvrv', 'lthMvrv', 'sthMarketValue', 'sthRealizedValue', 'sthMvrv', 'mvrvZScore'
] as const

type TraceKey = typeof TRACE_KEYS[number]
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import dynamic from 'next/dynamic'
import { getTrackBackground } from 'react-range';
import { Range } from 'react-range';

type MetricType = 'mvrv' | 'price' | 'volume' | 'onchain' | 'profit-loss'

// Dynamically import PlotlyMVRVTemplate for AI Workbench use
const PlotlyMVRVTemplateDashboard = dynamic(() => import('@/components/PlotlyMVRVTemplate'), { ssr: false })

export default function AIAnalysisPage() {
  const [apiKey, setApiKey] = useState("")
  const [provider, setProvider] = useState("openai")
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('price')

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [followUpInput, setFollowUpInput] = useState("")
  const chartRef = useRef<BitcoinChartRef>(null)
  const ratioChartRef = useRef<BitcoinChartRef>(null)
  const [range, setRange] = useState<[number, number]>([0, 100])
  const [dataLength, setDataLength] = useState(0)
  const [chartsReady, setChartsReady] = useState(false)
  const [zScoreStats, setZScoreStats] = useState<any>(undefined)
  
  // Shared trace visibility state for both chart instances
  const [visibleTraces, setVisibleTraces] = useState<Record<TraceKey, boolean>>({
    price: true,
    ma200: true,
    realizedPrice: true,
    trueMarketMean: true,
    mayer: true,
    priceRealized: false,
    priceTrueMean: false,
    lthMarketValue: false,
    lthRealizedValue: false,
    mvrv: true,
    lthMvrv: false,
    sthMarketValue: false,
    sthRealizedValue: false,
    sthMvrv: false,
    mvrvZScore: false
  })

  // MVRV Ratio Plotly panel state for AI Workbench
  const [plotlyDates, setPlotlyDates] = useState<string[]>([]);
  const [plotlyRange, setPlotlyRange] = useState<[number, number] | null>(null);
  useEffect(() => {
    async function fetchPlotly() {
      try {
        const [marketArr, realizedArr] = await Promise.all([
          fetch('https://brk.openonchain.dev/api/vecs/dateindex-to-marketcap?from=-10000').then(r => r.json()),
          fetch('https://brk.openonchain.dev/api/vecs/dateindex-to-realized-cap?from=-10000').then(r => r.json()),
        ]);
        const n = Math.min(marketArr.length, realizedArr.length);
        const genesisDate = new Date('2009-01-03');
        const dateLabels = Array.from({ length: n }, (_, i) => {
          const d = new Date(genesisDate);
          d.setDate(d.getDate() + i);
          return d.toISOString().split('T')[0];
        });
        const jan2012Idx = dateLabels.findIndex(d => d >= '2012-01-01');
        setPlotlyDates(dateLabels);
        setPlotlyRange([jan2012Idx !== -1 ? jan2012Idx : 0, n - 1]);
      } catch (e) {
        setPlotlyDates([]);
        setPlotlyRange(null);
      }
    }
    fetchPlotly();
  }, []);

  // Reset range when dataLength changes
  useEffect(() => {
    if (dataLength > 0) {
      // Set default left position to approximately 2014 (about 31% through the data)
      const startPosition = Math.floor(dataLength * 0.31)
      setRange([startPosition, dataLength - 1])
    }
  }, [dataLength])

  const handleDataLengthChange = (len: number) => {
    setDataLength(len)
    // Check if charts are ready after data loads
    setTimeout(() => {
      if (chartRef.current && ratioChartRef.current) {
        setChartsReady(true)
      }
    }, 1000)
  }
  
  const handleTraceToggle = (key: TraceKey) => {
    setVisibleTraces(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Function to combine both chart images into a single high-resolution image
  const combineChartImages = async (mainImageData: string, ratioImageData: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const mainImg = new Image()
        const ratioImg = new Image()
        let loadedCount = 0

        const onImageLoad = () => {
          loadedCount++
          if (loadedCount === 2) {
            // Both images loaded, combine them
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
              reject(new Error('Could not get canvas context'))
              return
            }

            // Set canvas dimensions with legend space
            const legendHeight = 60
            const totalWidth = Math.max(mainImg.width, ratioImg.width)
            const totalHeight = mainImg.height + ratioImg.height + legendHeight
            
            canvas.width = totalWidth
            canvas.height = totalHeight

            // Fill with dark background to match chart theme
            ctx.fillStyle = '#000000'
            ctx.fillRect(0, 0, totalWidth, totalHeight)

            // Draw legend at the top
            ctx.fillStyle = '#ffffff'
            ctx.font = '14px system-ui, -apple-system, sans-serif'
            ctx.textAlign = 'center'
            
            const legendY = 35
            const legendCenterX = totalWidth / 2
            
            // Draw legend items
            const legendItems = [
              { color: '#3b82f6', label: 'Price' },
              { color: '#fbbf24', label: '200DMA' },
              { color: '#10b981', label: 'Realized Price' },
              { color: '#fb923c', label: 'True Market Mean' },
              { color: '#ffffff', label: 'Mayer Ratio' },
              { color: '#10b981', label: 'LTH Market Value' },
              { color: '#fb923c', label: 'LTH Realized Value' },
              { color: '#8b5cf6', label: 'STH Market Value' },
              { color: '#f59e0b', label: 'STH Realized Value' },
              { color: '#ffffff', label: 'MVRV Ratio' },
              { color: '#ffffff', label: 'LTH MVRV Ratio' },
              { color: '#ffffff', label: 'STH MVRV Ratio' },
              { color: '#10b981', label: 'Price/Realized Price' },
              { color: '#fb923c', label: 'Price/True Market Mean' }
            ]
            
            const itemSpacing = 110
            const startX = legendCenterX - (legendItems.length - 1) * itemSpacing / 2
            
            legendItems.forEach((item, index) => {
              const x = startX + index * itemSpacing
              
              // Draw colored circle
              ctx.fillStyle = item.color
              ctx.beginPath()
              ctx.arc(x - 30, legendY, 6, 0, 2 * Math.PI)
              ctx.fill()
              
              // Draw label
              ctx.fillStyle = '#ffffff'
              ctx.fillText(item.label, x, legendY + 5)
            })

            // Draw main chart below legend
            ctx.drawImage(mainImg, 0, legendHeight)
            
            // Draw ratio chart below main chart
            ctx.drawImage(ratioImg, 0, legendHeight + mainImg.height)

            // Return combined image as high-quality data URL
            resolve(canvas.toDataURL('image/png', 0.95))
          }
        }

        mainImg.onload = onImageLoad
        ratioImg.onload = onImageLoad
        mainImg.onerror = () => reject(new Error('Failed to load main chart image'))
        ratioImg.onerror = () => reject(new Error('Failed to load ratio chart image'))
        
        mainImg.src = mainImageData
        ratioImg.src = ratioImageData
      } catch (error) {
        reject(error)
      }
    })
  }

  const analyzeChart = async () => {
    if (!apiKey) return

    setIsAnalyzing(true)
    
    try {
      // Simple approach: wait for charts to exist and try capture with retries
      let attempts = 0
      let mainImageData: string | null = null
      let ratioImageData: string | null = null
      
             while (attempts < 10 && (!mainImageData || !ratioImageData)) {
         await new Promise(resolve => setTimeout(resolve, 1000))
         
         try {
           if (chartRef.current && !mainImageData) {
             console.log('Attempting to capture main chart...')
             mainImageData = await chartRef.current.captureImage()
             console.log('Main chart captured successfully')
           }
           if (ratioChartRef.current && !ratioImageData) {
             console.log('Attempting to capture ratio chart...')
             ratioImageData = await ratioChartRef.current.captureImage()
             console.log('Ratio chart captured successfully')
           }
         } catch (error) {
           console.log(`Capture attempt ${attempts + 1}:`, error)
           console.log('Chart refs status:', {
             mainChart: !!chartRef.current,
             ratioChart: !!ratioChartRef.current,
             mainCaptured: !!mainImageData,
             ratioCaptured: !!ratioImageData
           })
         }
         
         attempts++
       }
      
             if (!mainImageData) {
         throw new Error('Unable to capture main chart. Please wait for the charts to fully load and try again.')
       }
       
       // If we have both charts, combine them. Otherwise, use just the main chart
       let finalImageData: string
       if (ratioImageData) {
         console.log('Combining both charts...')
         finalImageData = await combineChartImages(mainImageData, ratioImageData)
       } else {
         console.log('Using main chart only (ratio chart not available)')
         finalImageData = mainImageData
       }
      
      // Send to API
      const response = await fetch('/api/analyze-chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: finalImageData,
          apiKey,
          provider,
          prompt: "ROLE: Elite Bitcoin on-chain analyst. Think like a quantitative hedge fund manager analyzing for position sizing.\n\nTASK: Extract actionable signals from this Bitcoin chart data.\n\nANALYSIS REQUIREMENTS:\n1. State current numerical values (price levels, MVRV ratio, timeframes)\n2. Compare to historical cycle extremes (2017: MVRV ~4.5, 2021: MVRV ~7)\n3. Identify specific support/resistance with exact price levels\n4. Quantify momentum using visible price action patterns\n\nOUTPUT FORMAT:\n• Signal Strength: X/10 (justify with 2 quantitative factors)\n• Current Levels: [specific numbers from chart]\n• Historical Context: [comparison to previous cycles]\n• Actionable Insight: [specific entry/exit consideration]\n• Immediate Risk: [specific price level or pattern breakdown]\n\nCONSTRAINTS: Use exact numbers. No generic statements. Justify all ratings. 120 words maximum."
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed')
      }

      // Add messages to chat
      const userMessage = { role: 'user' as const, content: 'Analyze the current chart data' }
      const assistantMessage = { role: 'assistant' as const, content: result.analysis }
      
      setMessages(prev => [...prev, userMessage, assistantMessage])

    } catch (error: unknown) {
      console.error('Analysis error:', error)
      const errorMessage = { 
        role: 'assistant' as const, 
        content: `Error: ${(error as Error).message || 'Failed to analyze chart. Please check your API key and try again.'}` 
      }
      setMessages(prev => [...prev, { role: 'user' as const, content: 'Analyze the current chart data' }, errorMessage])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const sendFollowUp = async () => {
    if (!followUpInput.trim() || !apiKey || isAnalyzing) return

    const userMessage = { role: 'user' as const, content: followUpInput }
    setMessages(prev => [...prev, userMessage])
    setFollowUpInput("")
    setIsAnalyzing(true)

    try {
      // For follow-up questions, we can send the chart image again with the conversation context
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (!chartRef.current || !ratioChartRef.current) {
        throw new Error('Charts are still loading. Please wait a moment and try again.')
      }
      
      let mainImageData: string | null = null
      let ratioImageData: string | null = null
      
      try {
        mainImageData = await chartRef.current.captureImage()
      } catch (error) {
        console.log('Failed to capture main chart in follow-up:', error)
      }
      
      try {
        ratioImageData = await ratioChartRef.current.captureImage()
      } catch (error) {
        console.log('Failed to capture ratio chart in follow-up:', error)
      }
      
      if (!mainImageData) {
        throw new Error('Unable to capture main chart for follow-up question.')
      }
      
      let finalImageData: string
      if (ratioImageData) {
        finalImageData = await combineChartImages(mainImageData, ratioImageData)
      } else {
        finalImageData = mainImageData
      }
      
      const conversationContext = messages.map(m => `${m.role}: ${m.content}`).join('\n')
      const prompt = `Previous conversation:\n${conversationContext}\n\nUser's follow-up question: ${followUpInput}\n\nPlease respond to the follow-up question in the context of the chart and previous conversation.`

      const response = await fetch('/api/analyze-chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: finalImageData,
          apiKey,
          provider,
          prompt
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed')
      }

      const assistantMessage = { role: 'assistant' as const, content: result.analysis }
      setMessages(prev => [...prev, assistantMessage])

    } catch (error: unknown) {
      console.error('Follow-up error:', error)
      const errorMessage = { 
        role: 'assistant' as const, 
        content: `Error: ${(error as Error).message || 'Failed to process follow-up question.'}` 
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const metricOrder: MetricType[] = ['price', 'mvrv', 'profit-loss']
  const [carouselIndex, setCarouselIndex] = useState(0)
  const carouselApiRef = useRef<any>(null)

  // Sync carousel index to metric selection
  useEffect(() => {
    setSelectedMetric(metricOrder[carouselIndex])
  }, [carouselIndex])

  // Sync metric selection to carousel index
  useEffect(() => {
    const idx = metricOrder.indexOf(selectedMetric)
    if (idx !== -1 && idx !== carouselIndex && carouselApiRef.current) {
      carouselApiRef.current.scrollTo(idx)
    }
  }, [selectedMetric])

  // Handler for carousel API
  const handleSetCarouselApi = (api: any) => {
    carouselApiRef.current = api
    api.on('select', () => {
      const idx = api.selectedScrollSnap()
      setCarouselIndex(idx)
    })
  }

  return (
    <DashboardLayout 
      title="AI Analysis"
    >
      <PanelGroup direction="vertical" className="h-screen min-h-0 w-full">
        <Panel defaultSize={65} minSize={20} maxSize={85} className="flex flex-col min-h-0">
          <PanelGroup direction="horizontal" className="w-full h-full min-h-0 rounded-md overflow-hidden">
            <Panel defaultSize={66.66} minSize={20} maxSize={90} className="flex flex-col h-full min-h-0">
              <Card className="border-border w-full h-full flex flex-col min-h-0 bg-black">
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Workbench
                    </CardTitle>
                    <Select value={selectedMetric} onValueChange={(value: string) => setSelectedMetric(value as MetricType)}>
                      <SelectTrigger className="h-7 px-3 w-32 bg-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black">
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="mvrv">MVRV</SelectItem>
                        <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="px-6 py-3 min-w-0 flex-1 min-h-0 flex flex-col">
                  <PanelGroup direction="vertical" className="flex-1 min-h-0 w-full">
                    <Panel defaultSize={60} minSize={20} maxSize={90} className="flex flex-col min-h-0">
                      <BitcoinChartJS 
                        ref={chartRef} 
                        selectedMetric={selectedMetric} 
                        chartSection="main" 
                        range={range} 
                        onDataLengthChange={handleDataLengthChange}
                        visibleTraces={visibleTraces}
                        onTraceToggle={handleTraceToggle}
                        onZScoreStatsChange={setZScoreStats}
                      />
                    </Panel>
                    <PanelResizeHandle className="bg-[#222] hover:bg-[#444] transition-colors duration-150 h-1 w-full cursor-row-resize" />
                    <Panel defaultSize={40} minSize={10} maxSize={80} className="flex flex-col min-h-0">
                      <BitcoinChartJS 
                        ref={ratioChartRef}
                        selectedMetric={selectedMetric} 
                        chartSection="ratio" 
                        range={range} 
                        onDataLengthChange={handleDataLengthChange}
                        visibleTraces={visibleTraces}
                        onTraceToggle={handleTraceToggle}
                      />
                    </Panel>
                  </PanelGroup>
                  <div className="w-full flex justify-center items-center py-1">
                    <Slider.Root
                      className="relative flex items-center w-[90%] h-4"
                      min={0}
                      max={Math.max(0, dataLength - 1)}
                      step={1}
                      value={range}
                      onValueChange={(v: number[]) => setRange([v[0], v[1]])}
                      minStepsBetweenThumbs={1}
                    >
                      <Slider.Track className="bg-[#333] relative flex-1 h-[2px] rounded-full">
                        <Slider.Range className="absolute bg-[#666] h-full rounded-full" />
                      </Slider.Track>
                      <Slider.Thumb className="block w-3 h-3 bg-white rounded-full shadow focus:outline-none" />
                      <Slider.Thumb className="block w-3 h-3 bg-white rounded-full shadow focus:outline-none" />
                    </Slider.Root>
                  </div>
                </CardContent>
              </Card>
            </Panel>
            <PanelResizeHandle className="bg-[#222] hover:bg-[#444] transition-colors duration-150 w-1 cursor-col-resize" />
            <Panel defaultSize={33.34} minSize={10} maxSize={80} className="flex flex-col h-full min-h-0">
              <Card className="border-border flex flex-col w-full h-full min-h-0 bg-black">
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-orange-500" />
                      <CardTitle>AI</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 px-3">
                            <Key className="h-3 w-3 mr-1" />
                            Enter Key...
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium leading-none">AI Configuration</h4>
                              <p className="text-sm text-muted-foreground">
                                Configure your AI provider and credentials.
                              </p>
                            </div>
                            <div className="grid gap-3">
                              <div className="grid gap-2">
                                <Label htmlFor="apikey">API Key</Label>
                                <Input
                                  id="apikey"
                                  type="password"
                                  placeholder="Enter your API key"
                                  value={apiKey}
                                  onChange={(e) => setApiKey(e.target.value)}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="provider">Provider</Label>
                                <Select value={provider} onValueChange={setProvider}>
                                  <SelectTrigger id="provider">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                                    <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      <Button 
                        variant="outline"
                        size="sm"
                        disabled={!apiKey || isAnalyzing || !chartsReady}
                        onClick={analyzeChart}
                        className="h-7 px-4 !text-white [&_svg]:!text-white [&]:!text-white [&_*]:!text-white !border-white/20"
                        style={{ color: '#ffffff !important' }}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Analyzing...
                          </>
                        ) : !chartsReady ? (
                          "Loading..."
                                                  ) : (
                            <>
                              <Brain className="h-3 w-3 mr-1" />
                              Analysis
                            </>
                          )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0">
                  <div className="flex flex-col h-full space-y-4">
                    {/* Chat Messages Area - Now expands to fill available space */}
                    <div className="border rounded-md p-4 flex-1 overflow-y-auto bg-black">
                      {messages.length > 0 ? (
                        <div className="space-y-4">
                          {messages.map((message, index) => (
                            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`rounded-lg px-3 py-2 max-w-[80%] ${
                                message.role === 'user' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              </div>
                            </div>
                          ))}
                          {isAnalyzing && (
                            <div className="flex justify-start">
                              <div className="bg-muted rounded-lg px-3 py-2">
                                <div className="flex items-center gap-1">
                                  <Brain className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p className="text-sm">AI conversation will appear here...</p>
                        </div>
                      )}
                    </div>

                    {/* Chat Input Area - Fixed at bottom */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask a follow-up question about the analysis..."
                        className="flex-1"
                        value={followUpInput}
                        onChange={(e) => setFollowUpInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendFollowUp()
                          }
                        }}
                        disabled={messages.length === 0 || isAnalyzing}
                      />
                      <Button 
                        size="sm" 
                        onClick={sendFollowUp}
                        disabled={messages.length === 0 || isAnalyzing || !followUpInput.trim()}
                      >
                        {isAnalyzing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle className="bg-[#222] hover:bg-[#444] transition-colors duration-150 h-1 w-full cursor-row-resize" />
        <Panel defaultSize={35} minSize={15} maxSize={80} className="min-h-0 flex flex-col">
          {/* Z-Score Statistics Cards - Only show when MVRV selected and Z-Score stats available */}
          {selectedMetric === 'mvrv' && zScoreStats && (
            <div className="w-full py-2 px-6">
              <ZScoreStatsCards stats={zScoreStats} />
            </div>
          )}
          {/* Carousel with 4 data cards below the bottom grab handle */}
          <div className="w-full px-6 mt-4">
            <Carousel setApi={handleSetCarouselApi}>
              <CarouselContent>
                {metricOrder.map((metric, idx) => (
                  <CarouselItem key={metric}>
                    <div className="flex flex-row gap-4 w-full">
                      <Card className="flex-1 bg-black">
                        <CardHeader>
                          <CardTitle>{`Card ${idx + 1}-1`}</CardTitle>
                          <CardDescription>{`Data card 1 in position ${idx + 1}`}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <span className="text-2xl font-bold">{`Value ${idx + 1}-1`}</span>
                        </CardContent>
                      </Card>
                      <Card className="flex-1 bg-black">
                        <CardHeader>
                          <CardTitle>{`Card ${idx + 1}-2`}</CardTitle>
                          <CardDescription>{`Data card 2 in position ${idx + 1}`}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <span className="text-2xl font-bold">{`Value ${idx + 1}-2`}</span>
                        </CardContent>
                      </Card>
                      <Card className="flex-1 bg-black">
                        <CardHeader>
                          <CardTitle>{`Card ${idx + 1}-3`}</CardTitle>
                          <CardDescription>{`Data card 3 in position ${idx + 1}`}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <span className="text-2xl font-bold">{`Value ${idx + 1}-3`}</span>
                        </CardContent>
                      </Card>
                      <Card className="flex-1 bg-black">
                        <CardHeader>
                          <CardTitle>{`Card ${idx + 1}-4`}</CardTitle>
                          <CardDescription>{`Data card 4 in position ${idx + 1}`}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <span className="text-2xl font-bold">{`Value ${idx + 1}-4`}</span>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </Panel>
      </PanelGroup>
    </DashboardLayout>
  )
} 