import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL_SQL })

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get("year") || "2021", 10)

  // Define time range for the selected year
  const start = `${year}-01-01T00:00:00Z`
  const end = `${year + 1}-01-01T00:00:00Z`

  try {
    const client = await pool.connect()
    const query = `
      SELECT DISTINCT ON (platform_number)
        platform_number, cycle_number, juld,
        platform_type, latitude, longitude, temp, psal, pres
      FROM argo_data
      WHERE juld >= $1::timestamptz
        AND juld < $2::timestamptz
      ORDER BY platform_number, juld DESC
    `
    const result = await client.query(query, [start, end])
    client.release()

    return NextResponse.json(result.rows)
  } catch (err) {
    console.error("Error fetching ARGO data:", err)
    return NextResponse.json({ error: "Failed to fetch ARGO data" }, { status: 500 })
  }
}

