// components/LeafletMap.tsx
"use client"

import { useEffect, useRef } from "react"

interface Position {
  lat: number
  lon: number
  date: string
  cycle: number
  depth?: number
  temperature?: number
  salinity?: number
}

interface Trajectory {
  id: string
  name: string
  type: string
  status: string
  positions: Position[]
  latestPosition: Position
}

interface LeafletMapProps {
  trajectories: Trajectory[]
  selectedTrajectory?: string | null
  height?: string
  className?: string
}

declare global {
  interface Window {
    L: any
  }
}

export function LeafletMap({ 
  trajectories, 
  selectedTrajectory, 
  height = "500px",
  className = "" 
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layersRef = useRef<any[]>([])

  useEffect(() => {
    if (!mapRef.current) return

    const loadLeaflet = async () => {
      // Add Leaflet CSS if not already present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'
        document.head.appendChild(link)
      }

      // Load Leaflet JS if not already loaded
      if (!window.L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'
          script.onload = () => resolve()
          document.head.appendChild(script)
        })
      }

      const L = window.L

      // Initialize map if not already initialized
      if (!mapInstanceRef.current && mapRef.current) {
        mapInstanceRef.current = L.map(mapRef.current, {
          center: [38.0, -72.0],
          zoom: 6,
          zoomControl: true,
          attributionControl: true
        })

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18
        }).addTo(mapInstanceRef.current)
      }

      // Clear existing layers
      layersRef.current.forEach(layer => {
        if (mapInstanceRef.current && layer) {
          mapInstanceRef.current.removeLayer(layer)
        }
      })
      layersRef.current = []

      console.log('Processing trajectories for map:', trajectories.length)

      // Validate trajectories data
      const validTrajectories = trajectories.filter(trajectory => {
        if (!trajectory || !trajectory.positions || !Array.isArray(trajectory.positions)) {
          console.warn('Invalid trajectory data:', trajectory)
          return false
        }
        if (trajectory.positions.length === 0) {
          console.warn('Trajectory has no positions:', trajectory.id)
          return false
        }
        return true
      })

      console.log('Valid trajectories:', validTrajectories.length)

      if (validTrajectories.length === 0) {
        console.log('No valid trajectories to display')
        return
      }

      // Color palette for different trajectories
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#06b6d4']

      // Add trajectory layers
      validTrajectories.forEach((trajectory, index) => {
        const color = colors[index % colors.length]
        const isSelected = selectedTrajectory === trajectory.id
        const opacity = selectedTrajectory && !isSelected ? 0.4 : 1
        const weight = isSelected ? 4 : 3

        // Validate positions
        const validPositions = trajectory.positions.filter(pos => {
          const isValid = pos && 
            typeof pos.lat === 'number' && 
            typeof pos.lon === 'number' && 
            !isNaN(pos.lat) && 
            !isNaN(pos.lon) &&
            pos.lat >= -90 && pos.lat <= 90 &&
            pos.lon >= -180 && pos.lon <= 180
          
          if (!isValid) {
            console.warn('Invalid position:', pos)
          }
          return isValid
        })

        if (validPositions.length === 0) {
          console.warn('No valid positions for trajectory:', trajectory.id)
          return
        }

        console.log(`Adding trajectory ${trajectory.id} with ${validPositions.length} positions`)

        // Create polyline for trajectory path
        const coordinates = validPositions.map(
          (pos) => [pos.lat, pos.lon] as [number, number]
        )
        
        const polyline = L.polyline(coordinates, {
          color: color,
          weight: weight,
          opacity: opacity,
          dashArray: trajectory.status === 'Active' ? undefined : '5, 5'
        })

        // Add polyline to map
        polyline.addTo(mapInstanceRef.current)
        layersRef.current.push(polyline)

        // Add popup to polyline with trajectory info
        const trajectoryPopup = `
          <div class="p-3 min-w-[200px]">
            <h3 class="font-bold text-lg mb-2">${trajectory.name}</h3>
            <div class="space-y-1 text-sm">
              <p><strong>Type:</strong> ${trajectory.type}</p>
              <p><strong>Status:</strong> <span class="${trajectory.status === 'Active' ? 'text-green-600' : 'text-gray-500'}">${trajectory.status}</span></p>
              <p><strong>Total Positions:</strong> ${validPositions.length}</p>
              <p><strong>Date Range:</strong><br>
                ${new Date(validPositions[0].date).toLocaleDateString()} - 
                ${new Date(validPositions[validPositions.length - 1].date).toLocaleDateString()}
              </p>
            </div>
          </div>
        `
        polyline.bindPopup(trajectoryPopup)

        // Add markers for positions
        validPositions.forEach((position, posIndex) => {
          const isLatest = posIndex === validPositions.length - 1
          const isFirst = posIndex === 0
          
          let markerRadius = 4
          let strokeWidth = 1
          let strokeColor = color

          if (isLatest) {
            markerRadius = 8
            strokeWidth = 3
            strokeColor = '#fff'
          } else if (isFirst) {
            markerRadius = 6
            strokeWidth = 2
            strokeColor = '#fff'
          }

          const marker = L.circleMarker([position.lat, position.lon], {
            radius: markerRadius,
            fillColor: color,
            color: strokeColor,
            weight: strokeWidth,
            opacity: opacity,
            fillOpacity: opacity * 0.8
          })

          // Create detailed popup for each position
          let popupContent = `
            <div class="p-3 min-w-[250px]">
              <h3 class="font-bold text-lg mb-2">${trajectory.name}</h3>
              <div class="mb-2">
                <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  ${isLatest ? 'Latest Position' : isFirst ? 'Start Position' : `Position ${posIndex + 1}`}
                </span>
              </div>
              <div class="space-y-2 text-sm">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <strong>Cycle:</strong> ${position.cycle}
                  </div>
                  <div>
                    <strong>Date:</strong><br>
                    ${new Date(position.date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <strong>Coordinates:</strong><br>
                  <code class="bg-gray-100 px-1 rounded">
                    ${position.lat.toFixed(4)}°N, ${Math.abs(position.lon).toFixed(4)}°W
                  </code>
                </div>
                ${position.temperature ? `
                  <div>
                    <strong>Temperature:</strong> ${position.temperature.toFixed(2)}°C
                  </div>
                ` : ''}
                ${position.salinity ? `
                  <div>
                    <strong>Salinity:</strong> ${position.salinity.toFixed(2)} PSU
                  </div>
                ` : ''}
                ${position.depth ? `
                  <div>
                    <strong>Depth:</strong> ${position.depth.toFixed(1)}m
                  </div>
                ` : ''}
              </div>
            </div>
          `

          marker.bindPopup(popupContent, {
            maxWidth: 300,
            closeButton: true
          })

          // Add click event for marker selection
          marker.on('click', () => {
            console.log('Clicked position:', position)
          })

          marker.addTo(mapInstanceRef.current)
          layersRef.current.push(marker)
        })
      })

      // Fit map bounds to show all trajectories
      if (validTrajectories.length > 0 && layersRef.current.length > 0) {
        try {
          const group = new L.featureGroup(layersRef.current.filter(layer => 
            layer.getBounds || layer.getLatLng
          ))
          
          if (group.getLayers().length > 0) {
            mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
          }
        } catch (error) {
          console.warn('Could not fit bounds:', error)
        }
      }
    }

    loadLeaflet().catch(error => {
      console.error('Error loading Leaflet:', error)
    })

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          console.warn('Error removing map:', e)
        }
        mapInstanceRef.current = null
      }
      layersRef.current = []
    }
  }, [trajectories, selectedTrajectory])

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }} 
      className={`rounded-lg overflow-hidden border ${className}`}
    />
  )
}