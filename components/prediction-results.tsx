"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"

interface PredictionData {
  date: string
  predicted: number
  confidence: number
}

interface PredictionResultsProps {
  predictions: PredictionData[]
  selectedMetric: string
}

export default function PredictionResults({ predictions, selectedMetric }: PredictionResultsProps) {
  const formatNumber = (num: number) => {
    if (selectedMetric === "Volume") {
      return (num / 1000000).toFixed(2) + "M"
    }
    return num.toFixed(2)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500"
    if (confidence >= 0.6) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getTrend = () => {
    if (predictions.length < 2) return null
    const first = predictions[0].predicted
    const last = predictions[predictions.length - 1].predicted
    return last > first ? "up" : "down"
  }

  const trend = getTrend()

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          AI Prediction Results
          {trend && (
            <Badge variant={trend === "up" ? "default" : "destructive"} className="ml-2">
              {trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {trend === "up" ? "Bullish" : "Bearish"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">Next Day Prediction</h4>
              <p className="text-2xl font-bold">
                {predictions.length > 0 ? formatNumber(predictions[0].predicted) : "N/A"}
              </p>
              {predictions.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${getConfidenceColor(predictions[0].confidence)}`} />
                  <span className="text-sm text-muted-foreground">
                    {(predictions[0].confidence * 100).toFixed(1)}% confidence
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">7-Day Average</h4>
              <p className="text-2xl font-bold">
                {predictions.length > 0
                  ? formatNumber(
                      predictions.slice(0, 7).reduce((sum, p) => sum + p.predicted, 0) /
                        Math.min(7, predictions.length),
                    )
                  : "N/A"}
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">Prediction Range</h4>
              <p className="text-2xl font-bold">{predictions.length > 0 ? `${predictions.length} days` : "N/A"}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Detailed Predictions</h4>
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {predictions.slice(0, 10).map((prediction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <div>
                    <span className="font-medium">{new Date(prediction.date).toLocaleDateString()}</span>
                    <span className="text-sm text-muted-foreground ml-2">Day +{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatNumber(prediction.predicted)}</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getConfidenceColor(prediction.confidence)}`} />
                      <span className="text-xs text-muted-foreground">{(prediction.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
