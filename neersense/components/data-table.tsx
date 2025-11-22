"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, Filter, Calendar, MapPin } from "lucide-react"

interface DataTableProps {
  selectedFloat: string
  timeRange: string
}

export function DataTable({ selectedFloat, timeRange }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const mockData = [
    {
      id: "1",
      float: "4902916",
      date: "2024-01-15",
      cycle: 245,
      latitude: 35.2,
      longitude: -75.8,
      depth: 2000,
      temperature: 18.5,
      salinity: 35.2,
      pressure: 2020,
      quality: "Good",
    },
    {
      id: "2",
      float: "4902917",
      date: "2024-01-14",
      cycle: 189,
      latitude: 42.1,
      longitude: -68.3,
      depth: 1800,
      temperature: 16.8,
      salinity: 34.8,
      pressure: 1815,
      quality: "Good",
    },
    {
      id: "3",
      float: "4902918",
      date: "2024-01-13",
      cycle: 312,
      latitude: 28.7,
      longitude: -82.1,
      depth: 2000,
      temperature: 22.1,
      salinity: 36.1,
      pressure: 2025,
      quality: "Excellent",
    },
    {
      id: "4",
      float: "4902919",
      date: "2024-01-12",
      cycle: 156,
      latitude: 39.8,
      longitude: -70.5,
      depth: 1900,
      temperature: 19.3,
      salinity: 35.5,
      pressure: 1910,
      quality: "Good",
    },
    {
      id: "5",
      float: "4902920",
      date: "2024-01-11",
      cycle: 278,
      latitude: 33.4,
      longitude: -77.9,
      depth: 2000,
      temperature: 20.5,
      salinity: 35.8,
      pressure: 2018,
      quality: "Fair",
    },
  ]

  const filteredData = mockData.filter((row) => {
    if (selectedFloat !== "all" && row.float !== selectedFloat) return false
    if (
      searchTerm &&
      !Object.values(row).some((value) => value.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    )
      return false
    return true
  })

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const getQualityBadge = (quality: string) => {
    const variant =
      quality === "Excellent"
        ? "default"
        : quality === "Good"
          ? "secondary"
          : quality === "Fair"
            ? "outline"
            : "destructive"
    return <Badge variant={variant}>{quality}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Data Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export NetCDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>ARGO Float Measurements</span>
            <Badge variant="secondary">{filteredData.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("float")}>
                    Float ID
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Date
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("cycle")}>
                    Cycle
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("latitude")}>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Position
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("depth")}>
                    Depth (m)
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("temperature")}>
                    Temp (°C)
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("salinity")}>
                    Salinity (PSU)
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("pressure")}>
                    Pressure (dbar)
                  </TableHead>
                  <TableHead>Quality</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{row.float}</TableCell>
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                    <TableCell>{row.cycle}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {row.latitude.toFixed(2)}°N
                      <br />
                      {Math.abs(row.longitude).toFixed(2)}°W
                    </TableCell>
                    <TableCell>{row.depth.toLocaleString()}</TableCell>
                    <TableCell className="font-mono">{row.temperature}</TableCell>
                    <TableCell className="font-mono">{row.salinity}</TableCell>
                    <TableCell className="font-mono">{row.pressure}</TableCell>
                    <TableCell>{getQualityBadge(row.quality)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
