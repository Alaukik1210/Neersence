"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts"
import { Droplets, Wind, Waves, TestTube, Activity, Sparkles } from "lucide-react"

// Sample BGC data based on your provided format
const bgcData = [
  { depth: 1, doxy: 187.46, chla: 0.069, bbp700: 0.00068, cdom: 1.69, ph: 7.93, nitrate: 2.20 },
  { depth: 10.76, doxy: 187.54, chla: 0.079, bbp700: 0.00063, cdom: 1.74, ph: 7.94, nitrate: 2.06 },
  { depth: 20.04, doxy: 186.26, chla: 0.114, bbp700: 0.00066, cdom: 1.90, ph: 7.93, nitrate: 1.93 },
  { depth: 32.04, doxy: 180.07, chla: 0.197, bbp700: 0.00065, cdom: 1.77, ph: 7.93, nitrate: 1.95 },
  { depth: 42.08, doxy: 147.63, chla: 0.800, bbp700: 0.00080, cdom: 2.32, ph: 7.89, nitrate: 4.35 },
  { depth: 51.96, doxy: 111.02, chla: 0.569, bbp700: 0.00072, cdom: 2.52, ph: 7.83, nitrate: 9.11 },
  { depth: 62, doxy: 88.26, chla: 0.333, bbp700: 0.00057, cdom: 2.57, ph: 7.79, nitrate: 13.40 },
  { depth: 70.04, doxy: 64.82, chla: 0.226, bbp700: 0.00041, cdom: 2.77, ph: 7.74, nitrate: 17.47 },
  { depth: 82, doxy: 53.96, chla: 0.155, bbp700: 0.00035, cdom: 2.73, ph: 7.71, nitrate: 20.17 },
]

interface BgcChartsProps {
  selectedFloat: string
  timeRange: string
}

export function BgcCharts({ selectedFloat, timeRange }: BgcChartsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">BGC Data Analysis</h2>
          <p className="text-muted-foreground">Biogeochemical parameters by depth</p>
        </div>
      </div>

      {/* Dissolved Oxygen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-blue-500" />
            Dissolved Oxygen (DOXY)
          </CardTitle>
          <CardDescription>Oxygen concentration by depth (μmol/kg)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bgcData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="depth" label={{ value: 'Depth (m)', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'DOXY (μmol/kg)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="doxy" stroke="#3b82f6" strokeWidth={2} name="Dissolved Oxygen" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chlorophyll-a and BBP700 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              Chlorophyll-a (CHLA)
            </CardTitle>
            <CardDescription>Phytoplankton biomass indicator (mg/m³)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={bgcData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="depth" label={{ value: 'Depth (m)', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'CHLA (mg/m³)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Area type="monotone" dataKey="chla" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Chlorophyll-a" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-cyan-500" />
              Backscatter (BBP700)
            </CardTitle>
            <CardDescription>Particle concentration (m⁻¹)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={bgcData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="depth" label={{ value: 'Depth (m)', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'BBP700 (m⁻¹)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="bbp700" stroke="#06b6d4" strokeWidth={2} name="BBP700" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* pH and Nitrate */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-purple-500" />
              pH in Situ
            </CardTitle>
            <CardDescription>Ocean acidity measurement</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={bgcData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="depth" label={{ value: 'Depth (m)', position: 'insideBottom', offset: -5 }} />
                <YAxis domain={[7.7, 7.95]} label={{ value: 'pH', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="ph" stroke="#a855f7" strokeWidth={2} name="pH" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Nitrate
            </CardTitle>
            <CardDescription>Nutrient concentration (μmol/kg)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={bgcData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="depth" label={{ value: 'Depth (m)', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Nitrate (μmol/kg)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Area type="monotone" dataKey="nitrate" stroke="#f97316" fill="#f97316" fillOpacity={0.6} name="Nitrate" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* CDOM */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-amber-500" />
            CDOM (Colored Dissolved Organic Matter)
          </CardTitle>
          <CardDescription>Dissolved organic carbon indicator (ppb)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={bgcData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="depth" label={{ value: 'Depth (m)', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'CDOM (ppb)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Area type="monotone" dataKey="cdom" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="CDOM" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Multi-parameter Correlation */}
      <Card>
        <CardHeader>
          <CardTitle>BGC Parameter Summary</CardTitle>
          <CardDescription>Key biogeochemical indicators at different depths</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-700">Avg DOXY</div>
              <div className="text-2xl font-bold text-blue-900">132.4 μmol/kg</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-700">Max CHLA</div>
              <div className="text-2xl font-bold text-green-900">0.80 mg/m³</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm font-medium text-purple-700">pH Range</div>
              <div className="text-2xl font-bold text-purple-900">7.71 - 7.94</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm font-medium text-orange-700">Max Nitrate</div>
              <div className="text-2xl font-bold text-orange-900">20.2 μmol/kg</div>
            </div>
            <div className="p-4 bg-cyan-50 rounded-lg">
              <div className="text-sm font-medium text-cyan-700">Avg BBP700</div>
              <div className="text-2xl font-bold text-cyan-900">0.00060 m⁻¹</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="text-sm font-medium text-amber-700">Max CDOM</div>
              <div className="text-2xl font-bold text-amber-900">2.77 ppb</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}