"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  ComposedChart,
  Bar,
} from "recharts"
import { Gauge, TrendingUp, Activity } from "lucide-react"

interface PressureChartsProps {
  selectedFloat: string
  timeRange: string
}

export function PressureCharts({ selectedFloat, timeRange }: PressureChartsProps) {
  const pressureDepthData = [
    { depth: 0, pressure: 10, expected: 10, deviation: 0 },
    { depth: 50, pressure: 60, expected: 55, deviation: 5 },
    { depth: 100, pressure: 110, expected: 105, deviation: 5 },
    { depth: 200, pressure: 205, expected: 205, deviation: 0 },
    { depth: 500, pressure: 510, expected: 505, deviation: 5 },
    { depth: 1000, pressure: 1015, expected: 1010, deviation: 5 },
    { depth: 2000, pressure: 2025, expected: 2020, deviation: 5 },
  ]

  const pressureTimeData = [
    { date: "2024-01-01", surface: 10, max: 2020, cycle: 245 },
    { date: "2024-01-05", surface: 12, max: 2025, cycle: 246 },
    { date: "2024-01-10", surface: 9, max: 2018, cycle: 247 },
    { date: "2024-01-15", surface: 11, max: 2022, cycle: 248 },
    { date: "2024-01-20", surface: 10, max: 2020, cycle: 249 },
    { date: "2024-01-25", surface: 13, max: 2028, cycle: 250 },
    { date: "2024-01-30", surface: 10, max: 2020, cycle: 251 },
  ]

  const pressureCycleData = [
    { time: "00:00", depth: 1000, pressure: 1010, phase: "Parking" },
    { time: "06:00", depth: 2000, pressure: 2020, phase: "Descent" },
    { time: "12:00", depth: 1500, pressure: 1515, phase: "Ascent" },
    { time: "18:00", depth: 500, pressure: 505, phase: "Ascent" },
    { time: "24:00", depth: 0, pressure: 10, phase: "Surface" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pressure vs Depth Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-green-500" />
              Pressure vs Depth Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={pressureDepthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="pressure" label={{ value: "Pressure (dbar)", position: "insideBottom", offset: -5 }} />
                <YAxis dataKey="depth" reversed label={{ value: "Depth (m)", angle: -90, position: "insideLeft" }} />
                <Tooltip
                  formatter={(value, name) => [
                    `${value} ${name === "pressure" || name === "expected" ? "dbar" : "dbar"}`,
                    name === "pressure" ? "Measured" : name === "expected" ? "Expected" : "Deviation",
                  ]}
                  labelFormatter={(label) => `Depth: ${label}m`}
                />
                <Line
                  type="monotone"
                  dataKey="pressure"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ fill: "#22c55e", strokeWidth: 2, r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="expected"
                  stroke="#86efac"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Bar dataKey="deviation" fill="#fbbf24" fillOpacity={0.3} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pressure Time Series */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Pressure Range Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={pressureTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: "Pressure (dbar)", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value) => [`${value} dbar`, "Pressure"]} />
                <Area type="monotone" dataKey="max" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                <Area type="monotone" dataKey="surface" stackId="2" stroke="#86efac" fill="#86efac" fillOpacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Float Cycle Pressure Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Float Cycle Pressure Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={pressureCycleData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: "Time (hours)", position: "insideBottom", offset: -5 }} />
              <YAxis label={{ value: "Pressure (dbar)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(value, name) => [
                  name === "pressure" ? `${value} dbar` : `${value}m`,
                  name === "pressure" ? "Pressure" : "Depth",
                ]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="pressure"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: "#22c55e", strokeWidth: 2, r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="depth"
                stroke="#86efac"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "#86efac", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
