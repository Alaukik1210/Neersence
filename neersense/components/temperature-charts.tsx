"use client"

import { useEffect, useState } from "react"
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

interface TemperatureData {
  temperatureDepthData: Array<{
    depth: number
    temperature: number
    min_temp: number
    max_temp: number
    float1?: number
    float2?: number
    float3?: number
  }>
  temperatureTimeData: Array<{
    date: string
    temperature: number
    min: number
    max: number
  }>
  temperatureSalinityData: Array<{
    temperature: number
    salinity: number
    depth: number
  }>
  floatComparison: string[]
}

export function TemperatureCharts({ selectedFloat, timeRange }: TemperatureChartsProps) {
  const [data, setData] = useState<TemperatureData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading temperature data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button 
            onClick={fetchTemperatureData}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  // Process time series data with simplified dates
  const processedTimeData = data.temperatureTimeData.map(item => ({
    ...item,
    displayDate: formatDate(item.date)
  }))

  return (
    <div className="space-y-6">
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
                    `${parseFloat(value as string).toFixed(1)}°C`, 
                    name === "temperature" ? "Average Temperature" : 
                    name.startsWith("float") ? `Float ${name.slice(-1)}` : name
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
                    `${parseFloat(value as string).toFixed(1)}°C`, 
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
                  if (name === "temperature") return [`${parseFloat(value as string).toFixed(1)}°C`, "Temperature"]
                  return [`${parseFloat(value as string).toFixed(1)}`, name]
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