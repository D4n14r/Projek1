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

export async function parseCSV(file: File): Promise<StockData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string
        const lines = csv.split("\n")
        const headers = lines[0].split(",").map((h) => h.trim())

        const data: StockData[] = []

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const values = line.split(",")
          if (values.length !== headers.length) continue

          const row: any = {}
          headers.forEach((header, index) => {
            const value = values[index].trim()
            if (header === "Date") {
              row[header] = value
            } else {
              row[header] = Number.parseFloat(value) || 0
            }
          })

          data.push(row as StockData)
        }

        resolve(data.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime()))
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export function calculateMovingAverage(data: number[], period: number): number[] {
  const result: number[] = []

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i])
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      result.push(sum / period)
    }
  }

  return result
}

export function calculateRSI(data: number[], period = 14): number[] {
  const rsi: number[] = []
  const gains: number[] = []
  const losses: number[] = []

  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }

  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      rsi.push(50) // Default RSI value
    } else {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period

      if (avgLoss === 0) {
        rsi.push(100)
      } else {
        const rs = avgGain / avgLoss
        rsi.push(100 - 100 / (1 + rs))
      }
    }
  }

  return [50, ...rsi] // Add initial value
}

export function predictStock(data: StockData[], metric: string, days = 30): PredictionData[] {
  if (data.length < 10) return []

  const values = data.map((d) => d[metric as keyof StockData] as number)
  const predictions: PredictionData[] = []

  // Simple linear regression for trend
  const n = Math.min(values.length, 60) // Use last 60 days for prediction
  const recentValues = values.slice(-n)
  const x = Array.from({ length: n }, (_, i) => i)

  // Calculate linear regression
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = recentValues.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * recentValues[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Add some randomness and volatility
  const volatility = calculateVolatility(recentValues)
  const lastDate = new Date(data[data.length - 1].Date)

  for (let i = 1; i <= days; i++) {
    const predictedDate = new Date(lastDate)
    predictedDate.setDate(lastDate.getDate() + i)

    // Linear trend + random walk component
    const trendValue = slope * (n + i - 1) + intercept
    const randomComponent = (Math.random() - 0.5) * volatility * Math.sqrt(i)
    const predicted = Math.max(0, trendValue + randomComponent)

    // Calculate confidence (decreases over time)
    const baseConfidence = 0.9
    const timeDecay = Math.exp(-i / 10) // Exponential decay
    const confidence = Math.max(0.3, baseConfidence * timeDecay)

    predictions.push({
      date: predictedDate.toISOString().split("T")[0],
      predicted,
      confidence,
    })
  }

  return predictions
}

function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0

  const returns = []
  for (let i = 1; i < values.length; i++) {
    returns.push((values[i] - values[i - 1]) / values[i - 1])
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length

  return Math.sqrt(variance) * values[values.length - 1]
}
