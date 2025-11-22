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
  BarChart,
  Bar,
} from "recharts"
import { Droplets, TrendingUp, BarChart3 } from "lucide-react"

interface SalinityChartsProps {
  selectedFloat: string
  timeRange: string
}

interface SalinityData {
  salinityDepthData: Array<{
    depth: number
    salinity: number
    min_salinity: number
    max_salinity: number
    float1?: number
    float2?: number
    float3?: number
  }>
  salinityTimeData: Array<{
    date: string
    salinity: number
    min: number
    max: number
  }>
  salinityDistribution: Array<{
    range: string
    count: number
    percentage: number
  }>
  floatComparison: string[]
}

export function SalinityCharts({ selectedFloat, timeRange }: SalinityChartsProps) {
  const [data, setData] = useState<SalinityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    return <SalinityLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading salinity data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button 
            onClick={fetchSalinityData}
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
  const processedTimeData = data.salinityTimeData.map(item => ({
    ...item,
    displayDate: formatDate(item.date)
  }))

  return (
    <div className="space-y-6">
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
                    `${parseFloat(value as string).toFixed(2)} PSU`, 
                    name === "salinity" ? "Average Salinity" : 
                    name.startsWith("float") ? `Float ${name.slice(-1)}` : name
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
  value != null ? `${parseFloat(value as string).toFixed(2)} PSU` : "N/A",
  name === "salinity" ? "Average Salinity" : name.startsWith("float") ? `Float ${name.slice(-1)}` : name
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