import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_SQL,
})

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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function processTrajectoryData(rawData: any[]): Trajectory[] {
  // Group data by platform_number
  const grouped = rawData.reduce((acc, row) => {
    const platformId = row.platform_number.toString()
    if (!acc[platformId]) {
      acc[platformId] = []
    }
    acc[platformId].push(row)
    return acc
  }, {} as Record<string, any[]>)

  const trajectories: Trajectory[] = []

  Object.entries(grouped).forEach(([platformId, positions]) => {
    if (positions.length === 0) return

    // Sort positions by date
    const sortedPositions = positions.sort((a, b) => 
      new Date(a.juld).getTime() - new Date(b.juld).getTime()
    )

    const processedPositions: Position[] = sortedPositions.map(pos => ({
      lat: parseFloat(pos.latitude),
      lon: parseFloat(pos.longitude),
      date: pos.juld,
      cycle: pos.cycle_number,
      depth: pos.pres ? parseFloat(pos.pres) : undefined,
      temperature: pos.temp ? parseFloat(pos.temp) : undefined,
      salinity: pos.psal ? parseFloat(pos.psal) : undefined,
    }))

    // Calculate total distance
    let totalDistance = 0
    for (let i = 1; i < processedPositions.length; i++) {
      const prev = processedPositions[i - 1]
      const curr = processedPositions[i]
      totalDistance += calculateDistance(prev.lat, prev.lon, curr.lat, curr.lon)
    }

    const earliestPosition = processedPositions[0]
    const latestPosition = processedPositions[processedPositions.length - 1]

    // Calculate bounds
    const lats = processedPositions.map(p => p.lat)
    const lons = processedPositions.map(p => p.lon)
    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lons),
      west: Math.min(...lons)
    }

    // Determine status (active if latest position is within last 30 days)
    const daysSinceLastPosition = (Date.now() - new Date(latestPosition.date).getTime()) / (1000 * 60 * 60 * 24)
    const status = daysSinceLastPosition <= 30 ? 'Active' : 'Inactive'

    const trajectory: Trajectory = {
      id: platformId,
      name: `Float ${platformId}`,
      type: sortedPositions[0].platform_type || 'Unknown',
      startDate: earliestPosition.date,
      status,
      positions: processedPositions,
      distance: `${totalDistance.toFixed(1)} km`,
      totalCycles: Math.max(...processedPositions.map(p => p.cycle)),
      latestPosition,
      earliestPosition,
      bounds
    }

    trajectories.push(trajectory)
  })

  return trajectories
}

async function getArgoData(startDate: string, endDate: string, floatId?: string) {
  let query = `
    SELECT 
      platform_number,
      cycle_number,
      juld,
      platform_type,
      latitude,
      longitude,
      temp,
      psal,
      pres
    FROM argo_data
    WHERE juld >= $1::timestamptz
      AND juld < $2::timestamptz
  `
  
  const params: any[] = [startDate, endDate]
  
  if (floatId) {
    query += ` AND platform_number = $3`
    params.push(floatId)
  }
  
  query += ` ORDER BY platform_number, juld ASC`

  try {
    const res = await pool.query(query, params)
    return res.rows
  } catch (err) {
    console.error('Database query error:', err)
    throw new Error('Failed to fetch data from the database')
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || '2024-01-01'
    const endDate = searchParams.get('endDate') || '2024-12-31'
    const floatId = searchParams.get('floatId')

    console.log('Fetching trajectories:', { startDate, endDate, floatId })

    const rawData = await getArgoData(startDate, endDate, floatId)
    console.log(`Found ${rawData.length} raw data points`)

    if (rawData.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        data: [],
        message: 'No data found for the specified criteria'
      })
    }

    const trajectories = processTrajectoryData(rawData)
    console.log(`Processed into ${trajectories.length} trajectories`)

    // Limit to 10 floats and sort by latest position date
    const limitedTrajectories = trajectories
      .sort((a, b) => new Date(b.latestPosition.date).getTime() - new Date(a.latestPosition.date).getTime())
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      count: limitedTrajectories.length,
      data: limitedTrajectories,
    })
  } catch (error: any) {
    console.error('Error in GET request:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      platform_number,
      cycle_number,
      juld,
      platform_type,
      latitude,
      longitude,
      temp,
      psal,
      pres,
    } = body

    if (
      !platform_number ||
      !cycle_number ||
      !juld ||
      latitude == null ||
      longitude == null
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: platform_number, cycle_number, juld, latitude, longitude' },
        { status: 400 }
      )
    }

    const insertQuery = `
      INSERT INTO argo_data (
        platform_number,
        cycle_number,
        juld,
        platform_type,
        latitude,
        longitude,
        temp,
        psal,
        pres
      ) VALUES ($1, $2, $3::timestamptz, $4, $5, $6, $7, $8, $9)
    `

    await pool.query(insertQuery, [
      platform_number,
      cycle_number,
      juld,
      platform_type || 'Unknown',
      latitude,
      longitude,
      temp,
      psal,
      pres,
    ])

    return NextResponse.json({
      success: true,
      message: 'Data added successfully',
    })
  } catch (error: any) {
    console.error('Error in POST request:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}