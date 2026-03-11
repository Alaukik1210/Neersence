// app/api/temperature/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL_SQL })

interface TempDepthRow {
  depth: number | string | null
  temperature: number | string | null
  min_temp: number | string | null
  max_temp: number | string | null
}

interface IndividualFloatRow {
  platform_number: number | string
  depth: number | string | null
  temperature: number | string | null
}

interface TempTimeRow {
  date: string | Date | null
  temperature: number | string | null
  min_temp: number | string | null
  max_temp: number | string | null
}

interface TempSalinityRow {
  temperature: number | string | null
  salinity: number | string | null
  depth: number | string | null
}

type IndividualFloatsData = Record<string, Record<string, number>>

const EMPTY_TEMPERATURE_RESPONSE = {
  temperatureDepthData: [],
  temperatureTimeData: [],
  temperatureSalinityData: [],
  floatComparison: [],
  fallback: true,
  message: 'Temperature API fallback response',
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const selectedFloat = searchParams.get('float') || 'all'
    const timeRange = searchParams.get('timeRange') || '30'

    const client = await pool.connect()
    try {
      const yearParam = searchParams.get('year') || '2024'
      const year = Number.parseInt(yearParam, 10)
      const parsedYear = Number.isFinite(year) ? year : 2024
      const parsedRange = Number.parseInt(timeRange, 10)
      const days = Number.isFinite(parsedRange) ? parsedRange : 30

      // Calculate date range
      const endDate = new Date(`${parsedYear}-12-31T23:59:59Z`)
      const startDate = new Date(endDate)
      startDate.setUTCDate(endDate.getUTCDate() - days)

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

      const tempDepthResult = await client.query<TempDepthRow>(tempDepthQuery, params)

      // 2. Get individual float profiles for comparison (when viewing all floats)
      const individualFloatsData: IndividualFloatsData = {}
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

        const individualResult = await client.query<IndividualFloatRow>(individualFloatsQuery, params.slice(0, 2))

        // Group by platform_number
        individualResult.rows.forEach((row) => {
          const platformId = String(row.platform_number)
          const depthKey = String(row.depth ?? '')
          if (!individualFloatsData[platformId]) {
            individualFloatsData[platformId] = {}
          }
          individualFloatsData[platformId][depthKey] = toNumber(row.temperature)
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

      const tempTimeResult = await client.query<TempTimeRow>(tempTimeQuery, params)

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

      const tempSalinityResult = await client.query<TempSalinityRow>(tempSalinityQuery, params)

      // Format temperature-depth data
      const formattedTempDepth = tempDepthResult.rows.map((row) => {
        const baseData: {
          depth: number
          temperature: number
          min_temp: number
          max_temp: number
          [key: string]: number | null
        } = {
          depth: toNumber(row.depth),
          temperature: toNumber(row.temperature),
          min_temp: toNumber(row.min_temp),
          max_temp: toNumber(row.max_temp),
        }

        // Add individual float data if available
        if (selectedFloat === 'all') {
          const floatKeys = Object.keys(individualFloatsData).slice(0, 3) // Limit to 3 floats
          floatKeys.forEach((floatId, index) => {
            const floatData = individualFloatsData[floatId]
            const depthKey = String(row.depth ?? '')
            const value = floatData[depthKey]
            baseData[`float${index + 1}`] = Number.isFinite(value) ? value : null
          })
        }

        return baseData
      })

      const response = {
        temperatureDepthData: formattedTempDepth,
        temperatureTimeData: tempTimeResult.rows.map((row) => ({
          date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date ?? ''),
          temperature: toNumber(row.temperature),
          min: toNumber(row.min_temp),
          max: toNumber(row.max_temp),
        })),
        temperatureSalinityData: tempSalinityResult.rows.map((row) => ({
          temperature: toNumber(row.temperature),
          salinity: toNumber(row.salinity),
          depth: toNumber(row.depth),
        })),
        floatComparison: selectedFloat === 'all' ? Object.keys(individualFloatsData).slice(0, 3) : [],
      }

      return NextResponse.json(response)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(EMPTY_TEMPERATURE_RESPONSE)
  }
}
