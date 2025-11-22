// app/api/stats/route.ts
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

    const floatCondition =
      selectedFloat === 'all' ? '' : `AND platform_number = $3`

    const params =
      selectedFloat === 'all'
        ? [startDate.toISOString(), endDate.toISOString()]
        : [startDate.toISOString(), endDate.toISOString(), selectedFloat]

    // 1. Overview time series
    const overviewQuery = `
      SELECT 
        DATE(juld) as date,
        AVG(temp) as temperature,
        AVG(psal) as salinity,
        AVG(pres) as pressure
      FROM argo_data
      WHERE juld BETWEEN $1 AND $2
        ${floatCondition}
      GROUP BY DATE(juld)
      ORDER BY date
    `
    const overviewResult = await client.query(overviewQuery, params)

    // 2. Key statistics
    const statsQuery = `
      SELECT 
        AVG(temp) as avg_temp,
        AVG(psal) as avg_salinity,
        MAX(pres) as max_depth,
        COUNT(DISTINCT platform_number) as active_floats,
        (MAX(AVG(temp)) OVER () - MIN(AVG(temp)) OVER ()) as temp_change,
        (MAX(AVG(psal)) OVER () - MIN(AVG(psal)) OVER ()) as sal_change
      FROM argo_data
      WHERE juld BETWEEN $1 AND $2
        ${floatCondition}
      GROUP BY DATE(juld)
    `
    const statsResult = await client.query(statsQuery, params)

    // 3. Float type distribution
    const floatTypesQuery = `
      SELECT 
        platform_type as name,
        COUNT(*) as value
      FROM argo_data
      WHERE juld BETWEEN $1 AND $2
        ${selectedFloat === 'all' ? '' : `AND platform_number = $${params.length}`}
      GROUP BY platform_type
    `
    const floatTypesResult = await client.query(floatTypesQuery, params)

    // 4. Data quality metrics
    const qualityQuery = `
      SELECT 
        COUNT(CASE WHEN temp IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as temp_quality,
        COUNT(CASE WHEN psal IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as sal_quality,
        COUNT(CASE WHEN pres IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as pressure_quality,
        COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as gps_quality
      FROM argo_data
      WHERE juld BETWEEN $1 AND $2
        ${floatCondition}
    `
    const qualityResult = await client.query(qualityQuery, params)

    // 5. Recent activity
    const activityQuery = `
      SELECT 
        platform_number,
        'Profile completed' as action,
        juld as measurement_date,
        pres as depth,
        CASE 
          WHEN temp IS NOT NULL AND psal IS NOT NULL THEN 'success'
          WHEN temp IS NULL OR psal IS NULL THEN 'warning'
          ELSE 'in-progress'
        END as status
      FROM argo_data
      WHERE juld BETWEEN $1 AND $2
        ${floatCondition}
      ORDER BY juld DESC
      LIMIT 10
    `
    const activityResult = await client.query(activityQuery, params)

    client.release()

    // Format response
    const stats = statsResult.rows[0]
    const quality = qualityResult.rows[0]

    const colors = ['#0891b2', '#06b6d4', '#67e8f9', '#22d3ee', '#0ea5e9']
    const floatTypeData = floatTypesResult.rows.map((row, index) => ({
      name: row.name,
      value: parseInt(row.value),
      color: colors[index % colors.length],
    }))

    const response = {
      overviewData: overviewResult.rows.map((row) => ({
        date: row.date,
        temperature: parseFloat(row.temperature || 0),
        salinity: parseFloat(row.salinity || 0),
        pressure: parseFloat(row.pressure || 0),
      })),
      stats: {
        avgTemperature: parseFloat(stats?.avg_temp || 0).toFixed(1),
        avgSalinity: parseFloat(stats?.avg_salinity || 0).toFixed(1),
        maxDepth: Math.round(stats?.max_depth || 0),
        activeFloats: parseInt(stats?.active_floats || 0),
        tempChange: parseFloat(stats?.temp_change || 0).toFixed(1),
        salChange: parseFloat(stats?.sal_change || 0).toFixed(1),
      },
      floatTypeData,
      qualityMetrics: {
        temperature: Math.round(quality?.temp_quality || 0),
        salinity: Math.round(quality?.sal_quality || 0),
        pressure: Math.round(quality?.pressure_quality || 0),
        gps: Math.round(quality?.gps_quality || 0),
      },
      recentActivity: activityResult.rows.map((row) => ({
        float: row.platform_number,
        action: row.action,
        time: formatTimeAgo(new Date(row.measurement_date)),
        depth: `${Math.round(row.depth || 0)}m`,
        status: row.status,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats data' },
      { status: 500 }
    )
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))

  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
}
