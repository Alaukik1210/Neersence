export interface StatsData {
  overviewData: Array<{
    date: string
    temperature: number
    salinity: number
    pressure: number
  }>
  stats: {
    avgTemperature: string
    avgSalinity: string
    maxDepth: number
    activeFloats: number
    tempChange: string
    salChange: string
  }
  floatTypeData: Array<{
    name: string
    value: number
    color: string
  }>
  qualityMetrics: {
    temperature: number
    salinity: number
    pressure: number
    gps: number
  }
  recentActivity: Array<{
    float: string
    action: string
    time: string
    depth: string
    status: string
  }>
}

export interface TemperatureData {
  temperatureDepthData: Array<{
    depth: number
    temperature: number
    min_temp: number
    max_temp: number
    float1?: number
    float2?: number
    float3?: number
  }>
  temperatureTimeData: Array<{
    date: string
    temperature: number
    min: number
    max: number
  }>
  temperatureSalinityData: Array<{
    temperature: number
    salinity: number
    depth: number
  }>
  floatComparison: string[]
}

export interface SalinityData {
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

export interface Position {
  lat: number
  lon: number
  date: string
  cycle: number
  depth?: number
  temperature?: number
  salinity?: number
}

export interface Trajectory {
  id: string
  name: string
  type: string
  startDate: string
  status: string
  positions: Position[]
  distance: string
  totalCycles: number
  latestPosition: Position
  earliestPosition: Position
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

const BASE_FLOATS = ["4902916", "4902917", "4902918"]

const BASE_TEMPERATURE_DATA: Omit<TemperatureData, "floatComparison"> = {
  temperatureDepthData: [
    { depth: 0, temperature: 27.2, min_temp: 26.1, max_temp: 28.0, float1: 27.5, float2: 26.9, float3: 27.1 },
    { depth: 50, temperature: 22.4, min_temp: 21.6, max_temp: 23.2, float1: 22.8, float2: 22.0, float3: 22.4 },
    { depth: 100, temperature: 18.3, min_temp: 17.2, max_temp: 19.1, float1: 18.6, float2: 17.8, float3: 18.4 },
    { depth: 200, temperature: 13.2, min_temp: 12.6, max_temp: 14.1, float1: 13.6, float2: 12.9, float3: 13.2 },
    { depth: 500, temperature: 8.1, min_temp: 7.4, max_temp: 8.8, float1: 8.4, float2: 7.8, float3: 8.2 },
    { depth: 1000, temperature: 4.9, min_temp: 4.4, max_temp: 5.3, float1: 5.1, float2: 4.7, float3: 4.9 },
    { depth: 2000, temperature: 2.4, min_temp: 2.1, max_temp: 2.7, float1: 2.6, float2: 2.3, float3: 2.4 },
  ],
  temperatureTimeData: [
    { date: "2024-01-01", temperature: 21.8, min: 20.9, max: 22.7 },
    { date: "2024-02-01", temperature: 22.1, min: 21.1, max: 23.0 },
    { date: "2024-03-01", temperature: 22.3, min: 21.5, max: 23.1 },
    { date: "2024-04-01", temperature: 21.6, min: 20.8, max: 22.4 },
    { date: "2024-05-01", temperature: 20.8, min: 19.9, max: 21.6 },
    { date: "2024-06-01", temperature: 20.2, min: 19.3, max: 21.1 },
    { date: "2024-07-01", temperature: 19.9, min: 19.1, max: 20.8 },
    { date: "2024-08-01", temperature: 20.3, min: 19.4, max: 21.1 },
  ],
  temperatureSalinityData: [
    { temperature: 27.1, salinity: 34.5, depth: 5 },
    { temperature: 25.4, salinity: 34.8, depth: 25 },
    { temperature: 23.2, salinity: 35.1, depth: 60 },
    { temperature: 19.7, salinity: 35.2, depth: 150 },
    { temperature: 14.1, salinity: 35.0, depth: 320 },
    { temperature: 9.2, salinity: 34.8, depth: 700 },
    { temperature: 5.0, salinity: 34.7, depth: 1300 },
    { temperature: 2.5, salinity: 34.6, depth: 2100 },
  ],
}

const BASE_SALINITY_DATA: Omit<SalinityData, "floatComparison"> = {
  salinityDepthData: [
    { depth: 0, salinity: 34.7, min_salinity: 34.3, max_salinity: 35.1, float1: 34.8, float2: 34.6, float3: 34.7 },
    { depth: 50, salinity: 34.9, min_salinity: 34.5, max_salinity: 35.2, float1: 35.0, float2: 34.8, float3: 34.9 },
    { depth: 100, salinity: 35.0, min_salinity: 34.7, max_salinity: 35.3, float1: 35.1, float2: 34.9, float3: 35.0 },
    { depth: 200, salinity: 35.1, min_salinity: 34.9, max_salinity: 35.4, float1: 35.2, float2: 35.0, float3: 35.1 },
    { depth: 500, salinity: 34.9, min_salinity: 34.7, max_salinity: 35.1, float1: 35.0, float2: 34.8, float3: 34.9 },
    { depth: 1000, salinity: 34.8, min_salinity: 34.6, max_salinity: 35.0, float1: 34.9, float2: 34.7, float3: 34.8 },
    { depth: 2000, salinity: 34.7, min_salinity: 34.5, max_salinity: 34.9, float1: 34.8, float2: 34.6, float3: 34.7 },
  ],
  salinityTimeData: [
    { date: "2024-01-01", salinity: 34.82, min: 34.54, max: 35.09 },
    { date: "2024-02-01", salinity: 34.85, min: 34.57, max: 35.12 },
    { date: "2024-03-01", salinity: 34.87, min: 34.60, max: 35.14 },
    { date: "2024-04-01", salinity: 34.83, min: 34.55, max: 35.10 },
    { date: "2024-05-01", salinity: 34.80, min: 34.52, max: 35.06 },
    { date: "2024-06-01", salinity: 34.78, min: 34.50, max: 35.03 },
    { date: "2024-07-01", salinity: 34.79, min: 34.51, max: 35.04 },
    { date: "2024-08-01", salinity: 34.81, min: 34.53, max: 35.07 },
  ],
  salinityDistribution: [
    { range: "< 30.0", count: 4, percentage: 1.2 },
    { range: "30.0-32.0", count: 18, percentage: 5.5 },
    { range: "32.0-34.0", count: 48, percentage: 14.6 },
    { range: "34.0-36.0", count: 227, percentage: 69.2 },
    { range: "36.0-38.0", count: 29, percentage: 8.8 },
    { range: ">= 38.0", count: 2, percentage: 0.7 },
  ],
}

const BASE_STATS_DATA: StatsData = {
  overviewData: [
    { date: "2024-01-01", temperature: 21.8, salinity: 34.8, pressure: 1980 },
    { date: "2024-02-01", temperature: 22.1, salinity: 34.9, pressure: 1995 },
    { date: "2024-03-01", temperature: 22.4, salinity: 34.9, pressure: 2002 },
    { date: "2024-04-01", temperature: 21.6, salinity: 34.8, pressure: 1998 },
    { date: "2024-05-01", temperature: 20.9, salinity: 34.7, pressure: 2010 },
    { date: "2024-06-01", temperature: 20.3, salinity: 34.8, pressure: 2018 },
    { date: "2024-07-01", temperature: 20.0, salinity: 34.8, pressure: 2021 },
  ],
  stats: {
    avgTemperature: "21.3",
    avgSalinity: "34.8",
    maxDepth: 2025,
    activeFloats: 3,
    tempChange: "2.4",
    salChange: "0.3",
  },
  floatTypeData: [
    { name: "APEX", value: 124, color: "#0891b2" },
    { name: "PROVOR", value: 83, color: "#06b6d4" },
    { name: "NAVIS", value: 41, color: "#67e8f9" },
  ],
  qualityMetrics: {
    temperature: 97,
    salinity: 95,
    pressure: 99,
    gps: 98,
  },
  recentActivity: [
    { float: "4902916", action: "Profile completed", time: "1 hour ago", depth: "2000m", status: "success" },
    { float: "4902917", action: "Ascent started", time: "3 hours ago", depth: "1600m", status: "in-progress" },
    { float: "4902918", action: "Sensor calibration warning", time: "6 hours ago", depth: "300m", status: "warning" },
    { float: "4902916", action: "GPS surface fix", time: "10 hours ago", depth: "0m", status: "success" },
  ],
}

const BASE_MOCK_TRAJECTORIES: Trajectory[] = [
  {
    id: "4902916",
    name: "Float 4902916",
    type: "APEX",
    startDate: "2024-01-02",
    status: "Active",
    positions: [
      { lat: 19.22, lon: -68.12, date: "2024-01-02", cycle: 241, depth: 2000, temperature: 24.1, salinity: 34.7 },
      { lat: 19.88, lon: -67.43, date: "2024-02-08", cycle: 242, depth: 2000, temperature: 23.8, salinity: 34.8 },
      { lat: 20.41, lon: -66.79, date: "2024-03-14", cycle: 243, depth: 2000, temperature: 23.3, salinity: 34.9 },
      { lat: 21.03, lon: -66.24, date: "2024-04-19", cycle: 244, depth: 2000, temperature: 22.9, salinity: 35.0 },
    ],
    distance: "286.4 km",
    totalCycles: 244,
    latestPosition: { lat: 21.03, lon: -66.24, date: "2024-04-19", cycle: 244, depth: 2000, temperature: 22.9, salinity: 35.0 },
    earliestPosition: { lat: 19.22, lon: -68.12, date: "2024-01-02", cycle: 241, depth: 2000, temperature: 24.1, salinity: 34.7 },
    bounds: { north: 21.03, south: 19.22, east: -66.24, west: -68.12 },
  },
  {
    id: "4902917",
    name: "Float 4902917",
    type: "PROVOR",
    startDate: "2024-01-10",
    status: "Active",
    positions: [
      { lat: 15.33, lon: -72.84, date: "2024-01-10", cycle: 188, depth: 1800, temperature: 25.2, salinity: 34.5 },
      { lat: 15.95, lon: -72.02, date: "2024-02-15", cycle: 189, depth: 1800, temperature: 24.7, salinity: 34.6 },
      { lat: 16.61, lon: -71.24, date: "2024-03-22", cycle: 190, depth: 1800, temperature: 24.2, salinity: 34.7 },
      { lat: 17.12, lon: -70.49, date: "2024-04-28", cycle: 191, depth: 1800, temperature: 23.8, salinity: 34.8 },
    ],
    distance: "341.9 km",
    totalCycles: 191,
    latestPosition: { lat: 17.12, lon: -70.49, date: "2024-04-28", cycle: 191, depth: 1800, temperature: 23.8, salinity: 34.8 },
    earliestPosition: { lat: 15.33, lon: -72.84, date: "2024-01-10", cycle: 188, depth: 1800, temperature: 25.2, salinity: 34.5 },
    bounds: { north: 17.12, south: 15.33, east: -70.49, west: -72.84 },
  },
]

export function getMockStatsData(): StatsData {
  return structuredClone(BASE_STATS_DATA)
}

export function getMockTemperatureData(selectedFloat = "all"): TemperatureData {
  return {
    ...structuredClone(BASE_TEMPERATURE_DATA),
    floatComparison: selectedFloat === "all" ? [...BASE_FLOATS] : [],
  }
}

export function getMockSalinityData(selectedFloat = "all"): SalinityData {
  return {
    ...structuredClone(BASE_SALINITY_DATA),
    floatComparison: selectedFloat === "all" ? [...BASE_FLOATS] : [],
  }
}

export function getMockTrajectories(floatId?: string): Trajectory[] {
  const base = structuredClone(BASE_MOCK_TRAJECTORIES)
  if (!floatId || floatId === "all") {
    return base
  }

  const filtered = base.filter((trajectory) => trajectory.id === floatId)
  if (filtered.length > 0) {
    return filtered
  }

  const template = base[0]
  return [
    {
      ...template,
      id: floatId,
      name: `Float ${floatId}`,
      latestPosition: { ...template.latestPosition },
      earliestPosition: { ...template.earliestPosition },
      positions: template.positions.map((position) => ({ ...position })),
    },
  ]
}
