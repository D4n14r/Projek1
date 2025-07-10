"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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

interface StockChartProps {
  data: StockData[]
  predictions: PredictionData[]
  selectedMetric: string
  indicators: Record<string, boolean>
  isLoading: boolean
}

export default function StockChart({ data, predictions, selectedMetric, indicators, isLoading }: StockChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<any>(null)

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return

    const loadChart = async () => {
      const Chart = (await import("chart.js/auto")).default

      // Destroy existing chart
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }

      const ctx = chartRef.current.getContext("2d")
      if (!ctx) return

      // Prepare data
      const labels = data.map((d) => new Date(d.Date).toLocaleDateString())
      const values = data.map((d) => d[selectedMetric as keyof StockData] as number)

      // Add prediction labels and values
      const predictionLabels = predictions.map((p) => new Date(p.date).toLocaleDateString())
      const predictionValues = predictions.map((p) => p.predicted)

      const datasets: any[] = [
        {
          label: `${selectedMetric} (Historical)`,
          data: values,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.1,
          fill: false,
        },
      ]

      // Add prediction dataset
      if (predictions.length > 0) {
        datasets.push({
          label: `${selectedMetric} (Predicted)`,
          data: [...Array(data.length - 1).fill(null), values[values.length - 1], ...predictionValues],
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderDash: [5, 5],
          tension: 0.1,
          fill: false,
        })
      }

      // Add moving averages if selected
      if (indicators.ma7) {
        const ma7 = calculateMovingAverage(values, 7)
        datasets.push({
          label: "7-day MA",
          data: ma7,
          borderColor: "rgb(34, 197, 94)",
          backgroundColor: "transparent",
          tension: 0.1,
          fill: false,
        })
      }

      if (indicators.ma30) {
        const ma30 = calculateMovingAverage(values, 30)
        datasets.push({
          label: "30-day MA",
          data: ma30,
          borderColor: "rgb(168, 85, 247)",
          backgroundColor: "transparent",
          tension: 0.1,
          fill: false,
        })
      }

      if (indicators.ma90) {
        const ma90 = calculateMovingAverage(values, 90)
        datasets.push({
          label: "90-day MA",
          data: ma90,
          borderColor: "rgb(245, 158, 11)",
          backgroundColor: "transparent",
          tension: 0.1,
          fill: false,
        })
      }

      chartInstance.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: [...labels, ...predictionLabels],
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top" as const,
            },
            title: {
              display: true,
              text: `${selectedMetric} Over Time with Predictions`,
            },
          },
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: selectedMetric === "Volume" ? "Volume (Millions)" : "Price ($)",
              },
            },
            x: {
              title: {
                display: true,
                text: "Date",
              },
            },
          },
          interaction: {
            intersect: false,
            mode: "index",
          },
        },
      })
    }

    loadChart()

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, predictions, selectedMetric, indicators])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Upload a CSV file to view the stock chart
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative h-[400px]">
      <canvas ref={chartRef} />
    </div>
  )
}

function calculateMovingAverage(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = []

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      result.push(sum / period)
    }
  }

  return result
}
