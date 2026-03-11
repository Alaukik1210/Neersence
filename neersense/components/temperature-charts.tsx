"use client"

import { useEffect, useState } from "react"
import { getMockTemperatureData, type TemperatureData } from "@/lib/dashboard-mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts"
import { Thermometer, TrendingUp, BarChart3 } from "lucide-react"

interface TemperatureChartsProps {
  selectedFloat: string
  timeRange: string
}

type TemperatureApiResponse = Partial<TemperatureData> & {
  fallback?: boolean
}

function normalizeTemperatureData(result: unknown): TemperatureData {
  if (!result || typeof result !== "object") {
    return getMockTemperatureData()
  }

  const data = result as Partial<TemperatureData>
  return {
    temperatureDepthData: Array.isArray(data.temperatureDepthData) ? data.temperatureDepthData : getMockTemperatureData().temperatureDepthData,
    temperatureTimeData: Array.isArray(data.temperatureTimeData) ? data.temperatureTimeData : getMockTemperatureData().temperatureTimeData,
    temperatureSalinityData: Array.isArray(data.temperatureSalinityData) ? data.temperatureSalinityData : getMockTemperatureData().temperatureSalinityData,
    floatComparison: Array.isArray(data.floatComparison) ? data.floatComparison : getMockTemperatureData().floatComparison,
  }
}

export function TemperatureCharts({ selectedFloat, timeRange }: TemperatureChartsProps) {
  const [data, setData] = useState<TemperatureData>(getMockTemperatureData(selectedFloat))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  useEffect(() => {
    fetchTemperatureData()
  }, [selectedFloat, timeRange])

  const fetchTemperatureData = async () => {
    try {
      setLoading(true)
      setError(null)

      const startDate = "2024-01-01T00:00:00Z"
    const endDate = "2024-12-31T23:59:59Z"
      
        const response = await fetch(
      `/api/temperature?float=${selectedFloat}&startDate=${startDate}&endDate=${endDate}`
    )
      
      if (!response.ok) {
        throw new Error('Failed to fetch temperature data')
      }
      
      const result = (await response.json()) as TemperatureApiResponse
      const normalized = normalizeTemperatureData(result)
      const hasNoSeries =
        normalized.temperatureDepthData.length === 0 &&
        normalized.temperatureTimeData.length === 0 &&
        normalized.temperatureSalinityData.length === 0

      if (result.fallback || hasNoSeries) {
        setData(getMockTemperatureData(selectedFloat))
        setIsFallback(true)
        setError(result.fallback ? "Backend fallback response received" : "Backend returned empty data")
      } else {
        setData(normalized)
        setIsFallback(false)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(getMockTemperatureData(selectedFloat))
      setIsFallback(true)
    } finally {
      setLoading(false)
    }
  }

  // Function to format date for simplified display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  if (loading) {
    return <TemperatureLoadingSkeleton />
  }

  // Process time series data with simplified dates
  const processedTimeData = data.temperatureTimeData.map(item => ({
    ...item,
    displayDate: formatDate(item.date)
  }))

  return (
    <div className="space-y-6">
      {isFallback && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
          Using mock temperature data because backend request failed{error ? `: ${error}` : "."}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature vs Depth Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-red-500" />
              Temperature vs Depth Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart 
                data={data.temperatureDepthData} 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="temperature"
                  label={{ value: "Temperature (°C)", position: "insideBottom", offset: -5 }}
                />
                <YAxis 
                  dataKey="depth" 
                  reversed 
                  label={{ value: "Depth (m)", angle: -90, position: "insideLeft" }} 
                />
                <Tooltip
                  formatter={(value, name) => [
                    `${Number.isFinite(Number(value)) ? Number(value).toFixed(1) : "0.0"}°C`, 
                    typeof name === "string"
                      ? name === "temperature"
                        ? "Average Temperature"
                        : name.startsWith("float")
                          ? `Float ${name.slice(-1)}`
                          : name
                      : String(name)
                  ]}
                  labelFormatter={(label) => `Depth: ${label}m`}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: "#ef4444", strokeWidth: 2, r: 5 }}
                  name="Average Temperature"
                />
                {selectedFloat === "all" && data.floatComparison.length > 0 && (
                  <>
                    {data.floatComparison.map((floatId, index) => (
                      <Line
                        key={floatId}
                        type="monotone"
                        dataKey={`float${index + 1}`}
                        stroke={index === 0 ? "#f87171" : index === 1 ? "#fca5a5" : "#fed7d7"}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name={`Float ${floatId}`}
                      />
                    ))}
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Temperature Time Series */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              Temperature Time Series
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={processedTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="displayDate" 
                  interval="preserveStartEnd"
                  tick={{ fontSize: 12 }}
                />
                <YAxis label={{ value: "Temperature (°C)", angle: -90, position: "insideLeft" }} />
                <Tooltip 
                  formatter={(value, name) => [
                    `${Number.isFinite(Number(value)) ? Number(value).toFixed(1) : "0.0"}°C`, 
                    name === "temperature" ? "Average" : 
                    name === "max" ? "Maximum" : "Minimum"
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `Date: ${payload[0].payload.date}`
                    }
                    return `Date: ${label}`
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="max" 
                  stackId="1" 
                  stroke="#fca5a5" 
                  fill="#fca5a5" 
                  fillOpacity={0.3}
                  name="Maximum"
                />
                <Area 
                  type="monotone" 
                  dataKey="min" 
                  stackId="1" 
                  stroke="#f87171" 
                  fill="#f87171" 
                  fillOpacity={0.3}
                  name="Minimum"
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                  name="Average"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Temperature-Salinity Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-red-500" />
            Temperature-Salinity Diagram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart 
              data={data.temperatureSalinityData} 
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="salinity"
                type="number"
                domain={["dataMin - 2", "dataMax + 2"]}
                tickCount={8}
                label={{ value: "Salinity (PSU)", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                dataKey="temperature"
                type="number"
                domain={["dataMin - 5", "dataMax + 5"]}
                tickCount={8}
                label={{ value: "Temperature (°C)", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                formatter={(value, name, props) => {
                  if (name === "temperature") {
                    return [`${Number.isFinite(Number(value)) ? Number(value).toFixed(1) : "0.0"}°C`, "Temperature"]
                  }
                  return [`${Number.isFinite(Number(value)) ? Number(value).toFixed(1) : "0.0"}`, name]
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload
                    return `Depth: ${parseFloat(data.depth).toFixed(0)}m`
                  }
                  return ""
                }}
              />
              <Scatter 
                dataKey="temperature" 
                fill="#ef4444" 
                r={4} 
                stroke="#dc2626" 
                strokeWidth={1} 
                fillOpacity={0.7} 
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function TemperatureLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Two charts in grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Full width chart */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-52" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
