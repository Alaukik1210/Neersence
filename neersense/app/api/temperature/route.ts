// app/api/temperature/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL_SQL })

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const selectedFloat = searchParams.get('float') || 'all'
    const timeRange = searchParams.get('timeRange') || '30'

    const client = await pool.connect()

const yearParam = searchParams.get('year') || '2024'
const year = parseInt(yearParam)
    // Calculate date range
    const startDate = new Date(`${year}-01-01T00:00:00Z`)
    const endDate = new Date(`${year}-12-31T23:59:59Z`)
    startDate.setDate(endDate.getDate() - parseInt(timeRange))

    const floatCondition = selectedFloat === 'all' 
      ? '' 
      : `AND platform_number = $3`

    const params = selectedFloat === 'all' 
      ? [startDate.toISOString(), endDate.toISOString()]
      : [startDate.toISOString(), endDate.toISOString(), selectedFloat]

    // 1. Temperature vs Depth Profile
    const tempDepthQuery = `
     SELECT 
  ROUND(pres/50)*50 AS depth,
  AVG(temp) AS temperature,
  MIN(temp) AS min_temp,
  MAX(temp) AS max_temp
FROM argo_data
WHERE juld BETWEEN $1 AND $2
  ${floatCondition}
  AND temp IS NOT NULL 
  AND pres IS NOT NULL
GROUP BY ROUND(pres/50)*50
ORDER BY depth
LIMIT 100

    `
    
    const tempDepthResult = await client.query(tempDepthQuery, params)

    // 2. Get individual float profiles for comparison (when viewing all floats)
    let individualFloatsData = {}
    if (selectedFloat === 'all') {
      const individualFloatsQuery = `
        SELECT 
  platform_number,
  ROUND(pres/50)*50 AS depth,
  AVG(temp) AS temperature
FROM argo_data
WHERE juld BETWEEN $1 AND $2
  AND temp IS NOT NULL 
  AND pres IS NOT NULL
GROUP BY platform_number, ROUND(pres/50)*50
ORDER BY platform_number, depth

      `
      
      const individualResult = await client.query(individualFloatsQuery, params.slice(0, 2))
      
      // Group by platform_number
      individualResult.rows.forEach(row => {
        if (!individualFloatsData[row.platform_number]) {
          individualFloatsData[row.platform_number] = {}
        }
        individualFloatsData[row.platform_number][row.depth] = row.temperature
      })
    }

    // 3. Temperature Time Series
    const tempTimeQuery = `
      SELECT 
  DATE(juld) AS date,
  AVG(temp) AS temperature,
  MIN(temp) AS min_temp,
  MAX(temp) AS max_temp
FROM argo_data
WHERE juld BETWEEN $1 AND $2
  ${floatCondition}
  AND temp IS NOT NULL
GROUP BY DATE(juld)
ORDER BY date

    `
    
    const tempTimeResult = await client.query(tempTimeQuery, params)

    // 4. Temperature-Salinity Scatter Plot
    const tempSalinityQuery = `
      SELECT 
  temp AS temperature,
  psal AS salinity,
  pres AS depth
FROM argo_data
WHERE juld BETWEEN $1 AND $2
  ${floatCondition}
  AND temp IS NOT NULL 
  AND psal IS NOT NULL
  AND pres IS NOT NULL
ORDER BY RANDOM()
LIMIT 200

    `
    
    const tempSalinityResult = await client.query(tempSalinityQuery, params)

    client.release()

    // Format temperature-depth data
    const formattedTempDepth = tempDepthResult.rows.map(row => {
      const baseData = {
        depth: parseFloat(row.depth || 0),
        temperature: parseFloat(row.temperature || 0),
        min_temp: parseFloat(row.min_temp || 0),
        max_temp: parseFloat(row.max_temp || 0)
      }

      // Add individual float data if available
      if (selectedFloat === 'all') {
        const floatKeys = Object.keys(individualFloatsData).slice(0, 3) // Limit to 3 floats
        floatKeys.forEach((floatId, index) => {
          const floatData = individualFloatsData[floatId]
          baseData[`float${index + 1}`] = floatData[row.depth] || null
        })
      }

      return baseData
    })

    const response = {
      temperatureDepthData: formattedTempDepth,
      temperatureTimeData: tempTimeResult.rows.map(row => ({
        date: row.date,
        temperature: parseFloat(row.temperature || 0),
        min: parseFloat(row.min_temp || 0),
        max: parseFloat(row.max_temp || 0)
      })),
      temperatureSalinityData: tempSalinityResult.rows.map(row => ({
        temperature: parseFloat(row.temperature || 0),
        salinity: parseFloat(row.salinity || 0),
        depth: parseFloat(row.depth || 0)
      })),
      floatComparison: selectedFloat === 'all' ? Object.keys(individualFloatsData).slice(0, 3) : []
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch temperature data' },
      { status: 500 }
    )
  }
}