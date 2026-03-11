"use client"

import { useEffect, useState } from "react"
import { getMockStatsData, type StatsData } from "@/lib/dashboard-mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Thermometer, Droplets, Gauge, MapPin, Calendar, TrendingUp, Activity } from "lucide-react"

interface StatsOverviewProps {
  selectedFloat: string
  timeRange: string
}

function normalizeStatsData(result: unknown): StatsData | null {
  if (!result || typeof result !== "object") {
    return null
  }

  const data = result as Partial<StatsData>
  if (
    !Array.isArray(data.overviewData) ||
    !data.stats ||
    !Array.isArray(data.floatTypeData) ||
    !data.qualityMetrics ||
    !Array.isArray(data.recentActivity)
  ) {
    return null
  }

  return data as StatsData
}

export function StatsOverview({ selectedFloat, timeRange }: StatsOverviewProps) {
  const [data, setData] = useState<StatsData>(getMockStatsData())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  useEffect(() => {
    fetchStatsData()
  }, [selectedFloat, timeRange])

  const fetchStatsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(
        `/api/stats?float=${selectedFloat}&timeRange=${timeRange}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats data')
      }
      
      const result = await response.json()
      const normalized = normalizeStatsData(result)
      if (!normalized || normalized.overviewData.length === 0) {
        setData(getMockStatsData())
        setIsFallback(true)
        setError("Backend returned empty/invalid data")
      } else {
        setData(normalized)
        setIsFallback(false)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(getMockStatsData())
      setIsFallback(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <StatsLoadingSkeleton />
  }

  const stats = [
    {
      title: "Average Temperature",
      value: `${data.stats.avgTemperature}°C`,
      change: `${parseFloat(data.stats.tempChange) >= 0 ? '+' : ''}${data.stats.tempChange}°C`,
      trend: parseFloat(data.stats.tempChange) > 0 ? "up" : parseFloat(data.stats.tempChange) < 0 ? "down" : "stable",
      icon: Thermometer,
      color: "text-red-500",
    },
    {
      title: "Average Salinity",
      value: `${data.stats.avgSalinity} PSU`,
      change: `${parseFloat(data.stats.salChange) >= 0 ? '+' : ''}${data.stats.salChange} PSU`,
      trend: parseFloat(data.stats.salChange) > 0 ? "up" : parseFloat(data.stats.salChange) < 0 ? "down" : "stable",
      icon: Droplets,
      color: "text-blue-500",
    },
    {
      title: "Max Depth",
      value: `${data.stats.maxDepth.toLocaleString()}m`,
      change: "Stable",
      trend: "stable",
      icon: Gauge,
      color: "text-green-500",
    },
    {
      title: "Active Floats",
      value: data.stats.activeFloats.toString(),
      change: "100% operational",
      trend: "stable",
      icon: Activity,
      color: "text-primary",
    },
  ]

  return (
    <div className="space-y-6">
      {isFallback && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
          Using mock dashboard stats because backend data is unavailable{error ? `: ${error}` : "."}
        </div>
      )}
      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span
                  className={
                    stat.trend === "up"
                      ? "text-green-600"
                      : stat.trend === "down"
                        ? "text-red-600"
                        : "text-muted-foreground"
                  }
                >
                  {stat.change}
                </span>{" "}
                from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-parameter Time Series */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Multi-Parameter Time Series
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.overviewData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="temp" orientation="left" />
                <YAxis yAxisId="sal" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Temperature (°C)"
                />
                <Line
                  yAxisId="sal"
                  type="monotone"
                  dataKey="salinity"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Salinity (PSU)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Float Type Distribution */}
        <Card className="">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Float Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.floatTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.floatTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-wrap gap-4 mt-4">
              {data.floatTypeData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm">{entry.name}</span>
                  <Badge variant="secondary">{entry.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Quality Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Data Quality Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Temperature Data</span>
                <span className="text-sm text-muted-foreground">{data.qualityMetrics.temperature}%</span>
              </div>
              <Progress value={data.qualityMetrics.temperature} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Salinity Data</span>
                <span className="text-sm text-muted-foreground">{data.qualityMetrics.salinity}%</span>
              </div>
              <Progress value={data.qualityMetrics.salinity} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Pressure Data</span>
                <span className="text-sm text-muted-foreground">{data.qualityMetrics.pressure}%</span>
              </div>
              <Progress value={data.qualityMetrics.pressure} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">GPS Positioning</span>
                <span className="text-sm text-muted-foreground">{data.qualityMetrics.gps}%</span>
              </div>
              <Progress value={data.qualityMetrics.gps} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Recent Float Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Float {activity.float}</Badge>
                  <span className="text-sm">{activity.action}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{activity.depth}</span>
                  <span>{activity.time}</span>
                  <Badge
                    variant={
                      activity.status === "success"
                        ? "default"
                        : activity.status === "warning"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {activity.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
