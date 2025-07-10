"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Upload, TrendingUp, BarChart3 } from "lucide-react"
import StockChart from "@/components/stock-chart"
import PredictionResults from "@/components/prediction-results"
import { parseCSV, predictStock } from "@/lib/stock-utils"

interface StockData {
  Date: string
  Open: number
  High: number
  Low: number
  Close: number
  Volume: number
  "Adj Close": number
}

interface PredictionData {
  date: string
  predicted: number
  confidence: number
}

export default function StockDashboard() {
  const [stockData, setStockData] = useState<StockData[]>([])
  const [selectedMetric, setSelectedMetric] = useState("Close")
  const [predictions, setPredictions] = useState<PredictionData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    current: 0,
    min: 0,
    max: 0,
    avg: 0,
  })
  const [indicators, setIndicators] = useState({
    ma7: false,
    ma30: false,
    ma90: false,
    rsi: false,
    macd: false,
    bollinger: false,
  })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const data = await parseCSV(file)
      setStockData(data)
      updateStats(data, selectedMetric)

      // Generate predictions
      const predictionResults = predictStock(data, selectedMetric)
      setPredictions(predictionResults)
    } catch (error) {
      console.error("Error processing file:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateStats = (data: StockData[], metric: string) => {
    if (data.length === 0) return

    const values = data.map((d) => d[metric as keyof StockData] as number)
    const current = values[values.length - 1]
    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = values.reduce((a, b) => a + b, 0) / values.length

    setStats({ current, min, max, avg })
  }

  const handleMetricChange = (value: string) => {
    setSelectedMetric(value)
    updateStats(stockData, value)

    if (stockData.length > 0) {
      const predictionResults = predictStock(stockData, value)
      setPredictions(predictionResults)
    }
  }

  const handleIndicatorChange = (indicator: string, checked: boolean) => {
    setIndicators((prev) => ({ ...prev, [indicator]: checked }))
  }

  const formatNumber = (num: number) => {
    if (selectedMetric === "Volume") {
      return (num / 1000000).toFixed(2) + "M"
    }
    return num.toFixed(2)
  }

  const getDateRange = () => {
    if (stockData.length === 0) return "No data"
    const firstDate = new Date(stockData[0].Date).toLocaleDateString()
    const lastDate = new Date(stockData[stockData.length - 1].Date).toLocaleDateString()
    return `${firstDate} - ${lastDate}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Yahoo Stock Analysis Dashboard</h1>
              <p className="text-primary-foreground/80">
                Interactive visualization and analysis of historical stock data with AI predictions
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                Developed by: <span className="font-normal">Stock Analyst Pro</span>
              </p>
              <p className="text-sm text-primary-foreground/80">Data Source: Yahoo Finance Historical Data</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* File Upload */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <Label htmlFor="csvFile">Upload Yahoo Stock CSV</Label>
                <Input id="csvFile" type="file" accept=".csv" onChange={handleFileUpload} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Data Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-semibold mb-2">Date Range</h5>
                <p className="text-muted-foreground mb-4">{getDateRange()}</p>
                <h5 className="font-semibold mb-2">Data Points</h5>
                <p className="text-muted-foreground">{stockData.length} daily records</p>
              </div>
              <div>
                <h5 className="font-semibold mb-2">Key Metrics</h5>
                <ul className="space-y-1 text-sm">
                  <li>
                    <strong>Current:</strong> {formatNumber(stats.current)}
                  </li>
                  <li>
                    <strong>Min:</strong> {formatNumber(stats.min)}
                  </li>
                  <li>
                    <strong>Max:</strong> {formatNumber(stats.max)}
                  </li>
                  <li>
                    <strong>Average:</strong> {formatNumber(stats.avg)}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Stock Performance & Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <StockChart
                  data={stockData}
                  predictions={predictions}
                  selectedMetric={selectedMetric}
                  indicators={indicators}
                  isLoading={isLoading}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="metricSelect">Select Metric</Label>
                  <Select value={selectedMetric} onValueChange={handleMetricChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Close">Closing Price</SelectItem>
                      <SelectItem value="Open">Opening Price</SelectItem>
                      <SelectItem value="High">Daily High</SelectItem>
                      <SelectItem value="Low">Daily Low</SelectItem>
                      <SelectItem value="Volume">Trading Volume</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date Range</Label>
                  <Input value={getDateRange()} readOnly className="mt-1" />
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h5 className="font-semibold mb-3">Current Statistics</h5>
                  <div className="space-y-2 text-sm">
                    <p>
                      Current: <span className="font-medium">{formatNumber(stats.current)}</span>
                    </p>
                    <p>
                      Min: <span className="font-medium">{formatNumber(stats.min)}</span>
                    </p>
                    <p>
                      Max: <span className="font-medium">{formatNumber(stats.max)}</span>
                    </p>
                    <p>
                      Avg: <span className="font-medium">{formatNumber(stats.avg)}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prediction Results */}
        {predictions.length > 0 && <PredictionResults predictions={predictions} selectedMetric={selectedMetric} />}

        {/* Analysis Tools */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Analysis Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-semibold mb-3">Moving Averages</h5>
                <div className="space-y-3">
                  {[
                    { key: "ma7", label: "7-day MA" },
                    { key: "ma30", label: "30-day MA" },
                    { key: "ma90", label: "90-day MA" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={indicators[key as keyof typeof indicators]}
                        onCheckedChange={(checked) => handleIndicatorChange(key, checked as boolean)}
                      />
                      <Label htmlFor={key}>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="font-semibold mb-3">Technical Indicators</h5>
                <div className="space-y-3">
                  {[
                    { key: "rsi", label: "RSI (14-day)" },
                    { key: "macd", label: "MACD" },
                    { key: "bollinger", label: "Bollinger Bands" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={indicators[key as keyof typeof indicators]}
                        onCheckedChange={(checked) => handleIndicatorChange(key, checked as boolean)}
                      />
                      <Label htmlFor={key}>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold mb-2">About This Dashboard</h5>
              <p className="text-sm text-secondary-foreground/80">
                This interactive dashboard provides visualization and analysis tools for historical Yahoo stock data
                with advanced AI-powered predictions and technical analysis.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-2">Data Information</h5>
              <p className="text-sm text-secondary-foreground/80">
                Includes Open, High, Low, Close, Volume, and Adjusted Close prices with predictive analytics.
              </p>
              <p className="text-sm text-secondary-foreground/80">
                Last updated: <strong>{new Date().toLocaleDateString()}</strong>
              </p>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="text-center">
            <p className="text-sm text-secondary-foreground/80">
              © 2024 Yahoo Stock Analysis Dashboard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
