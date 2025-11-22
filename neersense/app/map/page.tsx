"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Thermometer, Droplets, Gauge, Activity, Waves } from "lucide-react"
import GlassyNavbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { div } from "framer-motion/client"

type ArgoFloat = {
  platform_number: string
  cycle_number: number
  date_creation: string
  platform_type: string
  latitude: number
  longitude: number
  temp: number
  psal: number
  pres: number
}

declare global {
  interface Window {
    L: any
  }
}

// Map Loading Component - only for the map area
const MapLoadingSpinner = () => (
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl rounded-2xl">
    <div className="relative flex items-center justify-center">
      {/* Outer ring */}
      <div className="w-24 h-24 border-4 border-blue-200/20 rounded-full animate-pulse"></div>
      
      {/* Middle ring */}
      <div className="absolute top-1 left-1 w-20 h-20 border-4 border-cyan-400/40 rounded-full animate-spin"></div>
      
      {/* Inner ring */}
      <div className="absolute top-2 left-2 w-16 h-16 border-4 border-blue-500/60 rounded-full animate-ping"></div>
      
      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-bounce"></div>
      </div>
      
      {/* Loading text */}
      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <div className="text-white text-lg font-semibold animate-pulse">Loading Ocean Data...</div>
        <div className="flex justify-center mt-2 space-x-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  </div>
)

// Utility function to round values
const roundValue = (value: number, decimals: number = 2): string => {
  return value?.toFixed(decimals) || '0.00'
}

// Enhanced Stats Card Component
const StatsCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
  <div className={`bg-gradient-to-br ${color} p-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300`}>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-white/80">{subtitle}</div>
      </div>
      <Icon className="h-8 w-8 text-white/90" />
    </div>
  </div>
)

export default function ArgoFloatMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  const [selectedFloat, setSelectedFloat] = useState<ArgoFloat | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [floats, setFloats] = useState<ArgoFloat[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number>(2021)

  // Load Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== "undefined" && !window.L) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)

        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.onload = () => setIsLoaded(true)
        document.head.appendChild(script)
      } else if (window.L) {
        setIsLoaded(true)
      }
    }
    loadLeaflet()
  }, [])

  // Fetch floats whenever year changes
  useEffect(() => {
    const fetchFloats = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/argo?year=${selectedYear}`)
        if (!res.ok) throw new Error("Failed to fetch floats")
        const data: ArgoFloat[] = await res.json()
        setFloats(data)
      } catch (err) {
        console.error("Error fetching floats:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchFloats()
  }, [selectedYear])

  // Initialize map + markers
  useEffect(() => {
    if (!isLoaded || !mapRef.current || floats.length === 0) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const L = window.L
    const map = L.map(mapRef.current).setView([-20.0, 80.0], 3)

    const oceanLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles &copy; Esri, GEBCO, NOAA, DeLorme" }
    )
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics" }
    )
    satelliteLayer.addTo(map)

    const argoIcon = L.divIcon({
      className: "custom-div-icon",
      html: `
        <div style="
          background: linear-gradient(45deg, #3b82f6, #06b6d4);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
          animation: pulse 2s infinite;
        "></div>
        <style>
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          }
        </style>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    // Guard against invalid coords
    floats.forEach((f) => {
      if (typeof f.latitude === "number" && typeof f.longitude === "number") {
        const marker = L.marker([f.latitude, f.longitude], { icon: argoIcon }).addTo(map)
        marker.on("click", () => {
          console.log("Selected float:", f)
          setSelectedFloat(f)
        })
      } else {
        console.warn("Skipping float with invalid coordinates:", f)
      }
    })

    mapInstanceRef.current = map
  }, [isLoaded, floats])

  return (
    <div>
    <GlassyNavbar />
    <div className="min-h-screen bg-primary3 flex pt-20 flex-col">
      {/* Fixed Navbar - Always visible */}
      

      {/* Main Content */}
      <div className="flex flex-1 pt-16 px-8">
        {/* Map Section - Increased width to 65% */}
        <div className="w-[65%] p-4 flex flex-col">
          {/* Enhanced Year Dropdown */}
          <div className="flex justify-end mb-4">
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-md border border-white/30 rounded-xl px-6 py-3 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 appearance-none cursor-pointer shadow-lg hover:shadow-cyan-400/25 transition-all duration-300"
              >
                {[2025, 2024, 2023, 2022, 2021, 2020, 2019].map((y) => (
                  <option key={y} value={y} className="bg-slate-800 text-white">
                    {y}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/70"></div>
              </div>
            </div>
          </div>

          {/* Map Container with conditional loading */}
          <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10 hover:ring-cyan-400/30 transition-all duration-500">
            {(!isLoaded || loading) ? (
              <MapLoadingSpinner />
            ) : (
              <div ref={mapRef} className="w-full h-full" />
            )}
          </div>
        </div>

        {/* Sidebar - Adjusted width to 35% */}
        <div className="w-[35%] p-6 space-y-6 overflow-y-auto">
          {selectedFloat ? (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-white/20 text-white shadow-2xl hover:shadow-cyan-400/20 transition-all duration-500 rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">Float Details</div>
                    <div className="text-sm text-cyan-300">Platform {selectedFloat.platform_number}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 px-3 py-1 rounded-full">
                    <Activity className="h-3 w-3 mr-1" />
                    {selectedFloat.platform_type}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 px-3 py-1 rounded-full">
                    <Waves className="h-3 w-3 mr-1" />
                    Cycle {selectedFloat.cycle_number}
                  </Badge>
                </div>

                <div className="space-y-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-white/90">
                    <Calendar className="h-5 w-5 text-amber-400" />
                    <div>
                      <div className="text-sm text-white/70">Deployed</div>
                      <div className="font-semibold">{new Date(selectedFloat.date_creation).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <MapPin className="h-5 w-5 text-green-400" />
                    <div>
                      <div className="text-sm text-white/70">Location</div>
                      <div className="font-mono font-semibold">
                        {roundValue(selectedFloat.latitude, 2)}°N, {roundValue(Math.abs(selectedFloat.longitude), 2)}°W
                      </div>
                    </div>
                  </div>
                </div>

                {selectedFloat.temp && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-lg text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-cyan-400" />
                      Latest Measurements
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl backdrop-blur-sm border border-red-300/20">
                        <span className="flex items-center gap-2 text-white/90">
                          <Thermometer className="h-5 w-5 text-red-400" />
                          <div>
                            <div className="font-semibold">Temperature</div>
                            <div className="text-xs text-white/60">Surface temp</div>
                          </div>
                        </span>
                        <span className="font-mono text-xl font-bold text-red-300">{roundValue(selectedFloat.temp)}°C</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl backdrop-blur-sm border border-blue-300/20">
                        <span className="flex items-center gap-2 text-white/90">
                          <Droplets className="h-5 w-5 text-blue-400" />
                          <div>
                            <div className="font-semibold">Salinity</div>
                            <div className="text-xs text-white/60">PSU units</div>
                          </div>
                        </span>
                        <span className="font-mono text-xl font-bold text-blue-300">{roundValue(selectedFloat.psal)} PSU</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl backdrop-blur-sm border border-green-300/20">
                        <span className="flex items-center gap-2 text-white/90">
                          <Gauge className="h-5 w-5 text-green-400" />
                          <div>
                            <div className="font-semibold">Pressure</div>
                            <div className="text-xs text-white/60">Depth pressure</div>
                          </div>
                        </span>
                        <span className="font-mono text-xl font-bold text-green-300">{roundValue(selectedFloat.pres)} dbar</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-white/20 rounded-2xl">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center animate-pulse">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-20 h-20 bg-cyan-400/20 rounded-full animate-ping"></div>
                </div>
                <p className="text-white/70 text-lg">Click on a float marker</p>
                <p className="text-cyan-300 text-sm mt-1">to view detailed oceanographic data</p>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Stats */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              Network Statistics
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <StatsCard 
                title="Active Floats"
                value={floats.length.toLocaleString()}
                subtitle="Active Floats"
                icon={Waves}
                color="from-blue-500 to-cyan-500"
              />
              <StatsCard 
                title="Total Cycles"
                value={floats.reduce((sum, f) => sum + f.cycle_number, 0).toLocaleString()}
                subtitle="Total Cycles"
                icon={Activity}
                color="from-purple-500 to-pink-500"
              />
              <StatsCard 
                title="Coverage"
                value="Global"
                subtitle="Ocean Coverage"
                icon={MapPin}
                color="from-emerald-500 to-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Always visible at bottom */}
      <Footer />
    </div>
    </div>
  )
}