// components/FloatTrajectories.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Map, MapPin, Navigation, Calendar, Loader2, RefreshCw } from "lucide-react"
import { useTrajectories } from "@/hooks/useTrajectories"
import { LeafletMap } from "./LeafletMap"

interface FloatTrajectoriesProps {
  selectedFloat?: string
  timeRange?: string
}

export function FloatTrajectories({ selectedFloat, timeRange }: FloatTrajectoriesProps) {
  const [selectedTrajectory, setSelectedTrajectory] = useState<string | null>(null)
  
  // Use the custom hook with debugging
  const { trajectories, loading, error, refetch } = useTrajectories({
    floatId: selectedFloat,
    autoRefresh: true,
    refreshInterval: 60000 // Refresh every minute
  })

  console.log('FloatTrajectories render:', { 
    trajectoriesCount: trajectories.length, 
    loading, 
    error,
    selectedFloat,
    timeRange 
  })

  const handleRefresh = () => {
    console.log('Manual refresh triggered')
    refetch()
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading trajectories: {error}</p>
              <Button onClick={handleRefresh} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Interactive Trajectory Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Float Trajectories Map ({trajectories.length} floats)
              {loading && <span className="text-sm text-muted-foreground">(Loading...)</span>}
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[500px] bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading trajectory data...</p>
                <p className="text-sm text-muted-foreground mt-2">Fetching data from 2024</p>
              </div>
            </div>
          ) : trajectories.length > 0 ? (
            <LeafletMap
              trajectories={trajectories}
              selectedTrajectory={selectedTrajectory}
              height="500px"
            />
          ) : (
            <div className="h-[500px] bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Map className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No trajectory data available</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedFloat ? `No data found for float ${selectedFloat}` : 'No float data found for 2024'}
                </p>
                <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trajectory Details */}
      {trajectories.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {trajectories.map((trajectory, index) => (
            <Card
              key={trajectory.id}
              className={`cursor-pointer transition-all ${
                selectedTrajectory === trajectory.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedTrajectory(
                selectedTrajectory === trajectory.id ? null : trajectory.id
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation 
                      className="h-5 w-5"
                      style={{ color: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#06b6d4'][index % 10] }}
                    />
                    {trajectory.name}
                  </div>
                  <Badge variant={trajectory.status === "Active" ? "default" : "secondary"}>
                    {trajectory.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <div className="font-medium">{trajectory.type}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Distance:</span>
                    <div className="font-medium">{trajectory.distance}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deployed:</span>
                    <div className="font-medium">{new Date(trajectory.startDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Cycles:</span>
                    <div className="font-medium">{trajectory.totalCycles}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Positions:</span>
                    <div className="font-medium">{trajectory.positions.length}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Float ID:</span>
                    <div className="font-medium">{trajectory.id}</div>
                  </div>
                </div>

                {trajectory.latestPosition && (
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4" />
                      Latest Position
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <div className="font-medium">
                          {new Date(trajectory.latestPosition.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cycle:</span>
                        <div className="font-medium">{trajectory.latestPosition.cycle}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Coordinates:</span>
                        <div className="font-mono text-xs">
                          {trajectory.latestPosition.lat.toFixed(3)}°N, {Math.abs(trajectory.latestPosition.lon).toFixed(3)}°W
                        </div>
                      </div>
                      {trajectory.latestPosition.temperature && (
                        <div>
                          <span className="text-muted-foreground">Temperature:</span>
                          <div className="font-medium">{trajectory.latestPosition.temperature.toFixed(1)}°C</div>
                        </div>
                      )}
                      {trajectory.latestPosition.salinity && (
                        <div>
                          <span className="text-muted-foreground">Salinity:</span>
                          <div className="font-medium">{trajectory.latestPosition.salinity.toFixed(1)} PSU</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('View full trajectory for:', trajectory.id)
                    // You can add navigation logic here or open a modal
                  }}
                >
                  View Full Trajectory Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1 font-mono">
              <div>Loading: {loading.toString()}</div>
              <div>Error: {error || 'none'}</div>
              <div>Trajectories Count: {trajectories.length}</div>
              <div>Selected Float: {selectedFloat || 'none'}</div>
              <div>Selected Trajectory: {selectedTrajectory || 'none'}</div>
              <div>Time Range: 2024-01-01 to 2024-12-31 (hardcoded)</div>
            </div>
          </CardContent>
        </Card>
      )}

      {trajectories.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Navigation className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No trajectory data found</p>
              <p className="text-sm mt-2">
                Make sure your database contains Argo float data for 2024
              </p>
              <div className="mt-4 space-y-2">
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}