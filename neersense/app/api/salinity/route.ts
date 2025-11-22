import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_SQL,
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const selectedFloat = searchParams.get("float")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!selectedFloat || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      // 1. Salinity vs Depth Profile
      let salinityDepthQuery: string
      let salinityDepthParams: (string | Date)[]

      if (selectedFloat === "all") {
        // Get top 3 floats by data count
        const topFloatsQuery = `
          SELECT platform_number, COUNT(*) as data_count
          FROM argo_data 
          WHERE juld BETWEEN $1 AND $2
            AND psal IS NOT NULL 
            AND pres IS NOT NULL
          GROUP BY platform_number
          ORDER BY data_count DESC
          LIMIT 3
        `
        const topFloatsResult = await client.query(topFloatsQuery, [new Date(startDate), new Date(endDate)])
        const topFloats = topFloatsResult.rows.map(row => row.platform_number)

        salinityDepthQuery = `
          WITH depth_buckets AS (
  SELECT 
    ROUND(pres/50.0)::int * 50 AS depth,
    psal,
    platform_number
  FROM argo_data
  WHERE juld BETWEEN $1 AND $2
    AND psal IS NOT NULL 
    AND pres IS NOT NULL
)
SELECT 
  depth,
  AVG(psal) AS salinity,
  MIN(psal) AS min_salinity,
  MAX(psal) AS max_salinity,
  ${topFloats.map((_, index) => 
    `AVG(CASE WHEN platform_number = $${index + 3} THEN psal END) AS float${index + 1}`
  ).join(', ')}
FROM depth_buckets
WHERE platform_number = ANY($${topFloats.length + 3})
GROUP BY depth
ORDER BY depth      `
        salinityDepthParams = [new Date(startDate), new Date(endDate), ...topFloats, topFloats]
      } else {
        salinityDepthQuery = `
          SELECT 
            ROUND(pres/50)*50 AS depth,
            AVG(psal) AS salinity,
            MIN(psal) AS min_salinity,
            MAX(psal) AS max_salinity
          FROM argo_data
          WHERE juld BETWEEN $1 AND $2
            AND platform_number = $3
            AND psal IS NOT NULL 
            AND pres IS NOT NULL
          GROUP BY ROUND(pres/50)*50
          ORDER BY depth
        `
        salinityDepthParams = [new Date(startDate), new Date(endDate), selectedFloat]
      }

      const salinityDepthResult = await client.query(salinityDepthQuery, salinityDepthParams)

      // 2. Salinity Time Series (monthly aggregation)
      let salinityTimeQuery: string
      let salinityTimeParams: (string | Date)[]

      if (selectedFloat === "all") {
        salinityTimeQuery = `
          SELECT 
            DATE_TRUNC('month', juld) AS date,
            AVG(psal) AS salinity,
            MIN(psal) AS min,
            MAX(psal) AS max
          FROM argo_data
          WHERE juld BETWEEN $1 AND $2
            AND psal IS NOT NULL
          GROUP BY DATE_TRUNC('month', juld)
          ORDER BY date
        `
        salinityTimeParams = [new Date(startDate), new Date(endDate)]
      } else {
        salinityTimeQuery = `
          SELECT 
            DATE_TRUNC('month', juld) AS date,
            AVG(psal) AS salinity,
            MIN(psal) AS min,
            MAX(psal) AS max
          FROM argo_data
          WHERE juld BETWEEN $1 AND $2
            AND platform_number = $3
            AND psal IS NOT NULL
          GROUP BY DATE_TRUNC('month', juld)
          ORDER BY date
        `
        salinityTimeParams = [new Date(startDate), new Date(endDate), selectedFloat]
      }

      const salinityTimeResult = await client.query(salinityTimeQuery, salinityTimeParams)

      // 3. Salinity Distribution
      let salinityDistributionQuery: string
      let salinityDistributionParams: (string | Date)[]

      if (selectedFloat === "all") {
        salinityDistributionQuery = `
          WITH salinity_ranges AS (
            SELECT 
              CASE 
                WHEN psal < 30.0 THEN '< 30.0'
                WHEN psal >= 30.0 AND psal < 32.0 THEN '30.0-32.0'
                WHEN psal >= 32.0 AND psal < 34.0 THEN '32.0-34.0'
                WHEN psal >= 34.0 AND psal < 36.0 THEN '34.0-36.0'
                WHEN psal >= 36.0 AND psal < 38.0 THEN '36.0-38.0'
                ELSE '>= 38.0'
              END AS range,
              COUNT(*) AS count
            FROM argo_data
            WHERE juld BETWEEN $1 AND $2
              AND psal IS NOT NULL
            GROUP BY 
              CASE 
                WHEN psal < 30.0 THEN '< 30.0'
                WHEN psal >= 30.0 AND psal < 32.0 THEN '30.0-32.0'
                WHEN psal >= 32.0 AND psal < 34.0 THEN '32.0-34.0'
                WHEN psal >= 34.0 AND psal < 36.0 THEN '34.0-36.0'
                WHEN psal >= 36.0 AND psal < 38.0 THEN '36.0-38.0'
                ELSE '>= 38.0'
              END
          ),
          total_count AS (
            SELECT SUM(count) AS total FROM salinity_ranges
          )
          SELECT 
            range,
            count,
            ROUND(((count::float / total.total) * 100)::numeric, 1) AS percentage
          FROM salinity_ranges, total_count total
          ORDER BY 
            CASE range
              WHEN '< 30.0' THEN 1
              WHEN '30.0-32.0' THEN 2
              WHEN '32.0-34.0' THEN 3
              WHEN '34.0-36.0' THEN 4
              WHEN '36.0-38.0' THEN 5
              ELSE 6
            END
        `
        salinityDistributionParams = [new Date(startDate), new Date(endDate)]
      } else {
        salinityDistributionQuery = `
          WITH salinity_ranges AS (
            SELECT 
              CASE 
                WHEN psal < 30.0 THEN '< 30.0'
                WHEN psal >= 30.0 AND psal < 32.0 THEN '30.0-32.0'
                WHEN psal >= 32.0 AND psal < 34.0 THEN '32.0-34.0'
                WHEN psal >= 34.0 AND psal < 36.0 THEN '34.0-36.0'
                WHEN psal >= 36.0 AND psal < 38.0 THEN '36.0-38.0'
                ELSE '>= 38.0'
              END AS range,
              COUNT(*) AS count
            FROM argo_data
            WHERE juld BETWEEN $1 AND $2
              AND platform_number = $3
              AND psal IS NOT NULL
            GROUP BY 
              CASE 
                WHEN psal < 30.0 THEN '< 30.0'
                WHEN psal >= 30.0 AND psal < 32.0 THEN '30.0-32.0'
                WHEN psal >= 32.0 AND psal < 34.0 THEN '32.0-34.0'
                WHEN psal >= 34.0 AND psal < 36.0 THEN '34.0-36.0'
                WHEN psal >= 36.0 AND psal < 38.0 THEN '36.0-38.0'
                ELSE '>= 38.0'
              END
          ),
          total_count AS (
            SELECT SUM(count) AS total FROM salinity_ranges
          )
          SELECT 
            range,
            count,
            ROUND((count::float / total.total) * 100, 1) AS percentage
          FROM salinity_ranges, total_count total
          ORDER BY 
            CASE range
              WHEN '< 30.0' THEN 1
              WHEN '30.0-32.0' THEN 2
              WHEN '32.0-34.0' THEN 3
              WHEN '34.0-36.0' THEN 4
              WHEN '36.0-38.0' THEN 5
              ELSE 6
            END
        `
        salinityDistributionParams = [new Date(startDate), new Date(endDate), selectedFloat]
      }

      const salinityDistributionResult = await client.query(salinityDistributionQuery, salinityDistributionParams)

      // Get float comparison list for "all" option
      let floatComparison: string[] = []
      if (selectedFloat === "all") {
        const topFloatsQuery = `
          SELECT platform_number
          FROM argo_data 
          WHERE juld BETWEEN $1 AND $2
            AND psal IS NOT NULL 
          GROUP BY platform_number
          ORDER BY COUNT(*) DESC
          LIMIT 3
        `
        const topFloatsResult = await client.query(topFloatsQuery, [new Date(startDate), new Date(endDate)])
        floatComparison = topFloatsResult.rows.map(row => row.platform_number.toString())
      }

      const response = {
        salinityDepthData: salinityDepthResult.rows.map(row => ({
          depth: parseFloat(row.depth || 0),
          salinity: parseFloat(row.salinity || 0),
          min_salinity: parseFloat(row.min_salinity || 0),
          max_salinity: parseFloat(row.max_salinity || 0),
          ...(row.float1 && { float1: parseFloat(row.float1) }),
          ...(row.float2 && { float2: parseFloat(row.float2) }),
          ...(row.float3 && { float3: parseFloat(row.float3) }),
        })),
        salinityTimeData: salinityTimeResult.rows.map(row => ({
          date: row.date.toISOString().split('T')[0],
          salinity: parseFloat(row.salinity || 0),
          min: parseFloat(row.min || 0),
          max: parseFloat(row.max || 0),
        })),
        salinityDistribution: salinityDistributionResult.rows.map(row => ({
          range: row.range,
          count: parseInt(row.count || 0),
          percentage: parseFloat(row.percentage || 0),
        })),
        floatComparison,
      }

      return NextResponse.json(response)

    } finally {
      client.release()
    }

  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}