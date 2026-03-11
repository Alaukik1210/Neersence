"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth_context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { TemperatureCharts } from "@/components/temperature-charts"
import { SalinityCharts } from "@/components/salinity-charts"
import { PressureCharts } from "@/components/pressure-charts"
import { FloatTrajectories } from "@/components/float-trajectories"
import { DataTable } from "@/components/data-table"
import { StatsOverview } from "@/components/stats-overview"
import { BgcCharts } from "@/components/BgcCharts"
import { Thermometer, Droplets, Gauge, Map, Table, TrendingUp, Calendar, MapPin, Waves } from "lucide-react"

export function DashboardContent() {
  const [selectedFloat, setSelectedFloat] = useState("all")
  const [timeRange, setTimeRange] = useState("30d")
  const [activeTab, setActiveTab] = useState("overview")
  
  // Get user from auth context
  const { user } = useAuth()
  // console.log("User role:", user?.role)
  
  // Check if user is a researcher - matches navbar logic
  const isResearcher = user?.role === 'RESEARCHER'

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isResearcher ? 'grid-cols-6' : 'grid-cols-5'} h-auto p-1 bg-muted/50`}>
            <TabsTrigger value="overview" className="flex items-center gap-1 md:gap-2 px-2 py-1.5 text-[10px] md:text-sm">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
              <span className="truncate">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="temperature" className="flex items-center gap-1 md:gap-2 px-2 py-1.5 text-[10px] md:text-sm">
              <Thermometer className="h-3 w-3 md:h-4 md:w-4" />
              <span className="truncate">Temp</span>
            </TabsTrigger>
            <TabsTrigger value="salinity" className="flex items-center gap-1 md:gap-2 px-2 py-1.5 text-[10px] md:text-sm">
              <Droplets className="h-3 w-3 md:h-4 md:w-4" />
              <span className="truncate">Salinity</span>
            </TabsTrigger>
            
            <TabsTrigger value="trajectories" className="flex items-center gap-1 md:gap-2 px-2 py-1.5 text-[10px] md:text-sm">
              <Map className="h-3 w-3 md:h-4 md:w-4" />
              <span className="truncate">Map</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-1 md:gap-2 px-2 py-1.5 text-[10px] md:text-sm">
              <Table className="h-3 w-3 md:h-4 md:w-4" />
              <span className="truncate">Data</span>
            </TabsTrigger>
            
            {/* BGC Data tab - only visible for researchers */}
            {isResearcher && (
              <TabsTrigger value="bgc" className="flex items-center gap-1 md:gap-2 px-2 py-1.5 text-[10px] md:text-sm">
                <Waves className="h-3 w-3 md:h-4 md:w-4" />
                <span className="truncate">BGC</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <StatsOverview selectedFloat={selectedFloat} timeRange={timeRange} />
          </TabsContent>

          <TabsContent value="temperature" className="space-y-6">
            <TemperatureCharts selectedFloat={selectedFloat} timeRange={timeRange} />
          </TabsContent>

          <TabsContent value="salinity" className="space-y-6">
            <SalinityCharts selectedFloat={selectedFloat} timeRange={timeRange} />
          </TabsContent>

          <TabsContent value="trajectories" className="space-y-6">
            <FloatTrajectories selectedFloat={selectedFloat} timeRange={timeRange} />
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <DataTable 
              selectedFloat={selectedFloat} 
              timeRange={timeRange}
              showUpload={isResearcher}
              showExport={isResearcher}
            />
          </TabsContent>

          {/* BGC Data tab content - only for researchers */}
          {isResearcher && (
            <TabsContent value="bgc" className="space-y-6">
              <BgcCharts selectedFloat={selectedFloat} timeRange={timeRange} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
