"use client"

import { useEffect, useState } from "react"
import { getMockSalinityData, type SalinityData } from "@/lib/dashboard-mock-data"
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
  BarChart,
  Bar,
} from "recharts"
import { Droplets, TrendingUp, BarChart3 } from "lucide-react"

interface SalinityChartsProps {
  selectedFloat: string
  timeRange: string
}

type SalinityApiResponse = Partial<SalinityData> & {
  fallback?: boolean
}

function normalizeSalinityData(result: unknown): SalinityData {
  if (!result || typeof result !== "object") {
    return getMockSalinityData()
  }

  const data = result as Partial<SalinityData>
  return {
    salinityDepthData: Array.isArray(data.salinityDepthData) ? data.salinityDepthData : getMockSalinityData().salinityDepthData,
    salinityTimeData: Array.isArray(data.salinityTimeData) ? data.salinityTimeData : getMockSalinityData().salinityTimeData,
    salinityDistribution: Array.isArray(data.salinityDistribution) ? data.salinityDistribution : getMockSalinityData().salinityDistribution,
    floatComparison: Array.isArray(data.floatComparison) ? data.floatComparison : getMockSalinityData().floatComparison,
  }
}

export function SalinityCharts({ selectedFloat, timeRange }: SalinityChartsProps) {
  const [data, setData] = useState<SalinityData>(getMockSalinityData(selectedFloat))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  useEffect(() => {
    fetchSalinityData()
  }, [selectedFloat, timeRange])

  const fetchSalinityData = async () => {
    try {
      setLoading(true)
      setError(null)

      const startDate = "2024-01-01T00:00:00Z"
      const endDate = "2024-12-31T23:59:59Z"
      
      const response = await fetch(
        `/api/salinity?float=${selectedFloat}&startDate=${startDate}&endDate=${endDate}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch salinity data')
      }
      
      const result = (await response.json()) as SalinityApiResponse
      const normalized = normalizeSalinityData(result)
      const hasNoSeries =
        normalized.salinityDepthData.length === 0 &&
        normalized.salinityTimeData.length === 0 &&
        normalized.salinityDistribution.length === 0

      if (result.fallback || hasNoSeries) {
        setData(getMockSalinityData(selectedFloat))
        setIsFallback(true)
        setError(result.fallback ? "Backend fallback response received" : "Backend returned empty data")
      } else {
        setData(normalized)
        setIsFallback(false)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(getMockSalinityData(selectedFloat))
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
    return <SalinityLoadingSkeleton />
  }

  // Process time series data with simplified dates
  const processedTimeData = data.salinityTimeData.map(item => ({
    ...item,
    displayDate: formatDate(item.date)
  }))

  return (
    <div className="space-y-6">
      {isFallback && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
          Using mock salinity data because backend request failed{error ? `: ${error}` : "."}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salinity vs Depth Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              Salinity vs Depth Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart 
                data={data.salinityDepthData} 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="salinity" 
                  label={{ value: "Salinity (PSU)", position: "insideBottom", offset: -5 }} 
                />
                <YAxis 
                  dataKey="depth" 
                  reversed 
                  label={{ value: "Depth (m)", angle: -90, position: "insideLeft" }} 
                />
                <Tooltip
                  formatter={(value, name) => [
                    `${Number.isFinite(Number(value)) ? Number(value).toFixed(2) : "0.00"} PSU`, 
                    typeof name === "string"
                      ? name === "salinity"
                        ? "Average Salinity"
                        : name.startsWith("float")
                          ? `Float ${name.slice(-1)}`
                          : name
                      : String(name)
                  ]}
                  labelFormatter={(label) => `Depth: ${label}m`}
                />
                <Line
                  type="monotone"
                  dataKey="salinity"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                  name="Average Salinity"
                />
                {selectedFloat === "all" && data.floatComparison.length > 0 && (
                  <>
                    {data.floatComparison.map((floatId, index) => (
                      <Line
                        key={floatId}
                        type="monotone"
                        dataKey={`float${index + 1}`}
                        stroke={index === 0 ? "#60a5fa" : index === 1 ? "#93c5fd" : "#bfdbfe"}
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

        {/* Salinity Time Series */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Salinity Time Series
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
                <YAxis label={{ value: "Salinity (PSU)", angle: -90, position: "insideLeft" }} />
                <Tooltip 
                  formatter={(value, name) => [
  value != null && Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)} PSU` : "N/A",
  typeof name === "string"
    ? name === "salinity"
      ? "Average Salinity"
      : name.startsWith("float")
        ? `Float ${name.slice(-1)}`
        : name
    : String(name)
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
                  stroke="#93c5fd" 
                  fill="#93c5fd" 
                  fillOpacity={0.3}
                  name="Maximum"
                />
                <Area 
                  type="monotone" 
                  dataKey="min" 
                  stackId="1" 
                  stroke="#60a5fa" 
                  fill="#60a5fa" 
                  fillOpacity={0.3}
                  name="Minimum"
                />
                <Line
                  type="monotone"
                  dataKey="salinity"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  name="Average"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Salinity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Salinity Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={data.salinityDistribution} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="range" 
                label={{ value: "Salinity Range (PSU)", position: "insideBottom", offset: -5 }} 
              />
              <YAxis label={{ value: "Count", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(value, name) => [
                  name === "count" ? `${value} measurements` : `${value}%`,
                  name === "count" ? "Count" : "Percentage",
                ]}
              />
              <Bar 
                dataKey="count" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function SalinityLoadingSkeleton() {
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
