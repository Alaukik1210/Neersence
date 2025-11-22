#!/usr/bin/env python3
"""
bulk_import.py

Ingest a folder of CSVs (each CSV ~ one profile with ~500 rows) into Postgres (TimescaleDB + PostGIS).
- Creates schema + hypertable + indices if not present.
- Inserts in batches using execute_values.
- Uses ON CONFLICT (platform_number, juld, pres) DO UPDATE to avoid duplicates.
- Computes location (geography POINT) in the DB after insert.
- Deduplicates rows in each batch by (platform_number, juld, pres) to avoid conflict errors.
"""

import os
import glob
import csv
import argparse
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values

# ---------- CONFIG ----------
DEFAULT_BATCH_SIZE = 5000

# ---------- Helpers ----------
def clean_text(val):
    if val is None:
        return None
    if isinstance(val, bytes):
        val = val.decode("utf-8", errors="ignore")
    s = str(val).strip()
    if s == "":
        return None
    if s.startswith("b'") and s.endswith("'"):
        s = s[2:-1]
    return s

def parse_datetime(val):
    s = clean_text(val)
    if not s:
        return None
    fmts = ["%Y%m%d%H%M%S", "%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S"]
    for f in fmts:
        try:
            if f == "%Y-%m-%d %H:%M:%S.%f" and "." in s:
                base, micros = s.split(".", 1)
                micros = (micros + "000000")[:6]
                s = f"{base}.{micros}"
            return datetime.strptime(s, f)
        except Exception:
            continue
    return None

def safe_int(val):
    s = clean_text(val)
    if s is None:
        return None
    try:
        return int(float(s))
    except Exception:
        return None

def safe_float(val):
    s = clean_text(val)
    if s is None:
        return None
    try:
        return float(s)
    except Exception:
        return None

# ---------- DB / schema helpers ----------
SCHEMA_SQL = """
-- enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- create table (id primary key; location stored as GEOGRAPHY)
CREATE TABLE IF NOT EXISTS argo_data (
    id SERIAL PRIMARY KEY,
    platform_number TEXT,
    cycle_number INT,
    direction TEXT,
    date_creation TIMESTAMPTZ,
    platform_type TEXT,
    juld TIMESTAMPTZ NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    data_mode TEXT,
    pres DOUBLE PRECISION,
    temp DOUBLE PRECISION,
    psal DOUBLE PRECISION,
    location GEOGRAPHY(Point, 4326)
);
"""

def ensure_schema(conn):
    with conn.cursor() as cur:
        cur.execute(SCHEMA_SQL)
        conn.commit()

        cur.execute("SELECT create_hypertable('argo_data', 'juld', if_not_exists => TRUE);")
        conn.commit()

        cur.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS ux_argo_platform_juld_pres
            ON argo_data (platform_number, juld, pres);
        """)
        conn.commit()

        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_argo_platform_time
            ON argo_data (platform_number, juld DESC);
        """)
        conn.commit()

        cur.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'idx_argo_location'
                ) THEN
                    CREATE INDEX idx_argo_location ON argo_data USING GIST(location);
                END IF;
            END$$;
        """)
        conn.commit()

        print("✅ Schema, hypertable and indexes ensured.")

# ---------- Insert batch ----------
INSERT_SQL = """
INSERT INTO argo_data (
    platform_number, cycle_number, direction, date_creation,
    platform_type, juld, latitude, longitude,
    data_mode, pres, temp, psal
) VALUES %s
ON CONFLICT (platform_number, juld, pres) DO UPDATE SET
    temp = EXCLUDED.temp,
    psal = EXCLUDED.psal,
    date_creation = COALESCE(EXCLUDED.date_creation, argo_data.date_creation),
    data_mode = COALESCE(EXCLUDED.data_mode, argo_data.data_mode),
    latitude = COALESCE(EXCLUDED.latitude, argo_data.latitude),
    longitude = COALESCE(EXCLUDED.longitude, argo_data.longitude);
"""

def deduplicate_batch(batch):
    # keep only the last row for each (platform_number, juld, pres)
    unique = {}
    for r in batch:
        key = (r[0], r[5], r[9])
        unique[key] = r
    return list(unique.values())

def insert_batch(conn, rows):
    if not rows:
        return 0
    rows = deduplicate_batch(rows)
    with conn.cursor() as cur:
        execute_values(cur, INSERT_SQL, rows, page_size=1000)
        conn.commit()
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE argo_data
            SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::GEOGRAPHY
            WHERE location IS NULL AND longitude IS NOT NULL AND latitude IS NOT NULL;
        """)
        conn.commit()
    return len(rows)

# ---------- Main ingestion ----------
def ingest_folder(conn, folder_path, batch_size=DEFAULT_BATCH_SIZE, pattern="*.csv"):
    csv_paths = sorted(glob.glob(os.path.join(folder_path, pattern)))
    if not csv_paths:
        print("No CSV files found at", folder_path)
        return

    total_files = len(csv_paths)
    print(f"Found {total_files} files. Starting ingestion (batch_size={batch_size})...")

    batch = []
    file_count = 0
    total_rows = 0
    skipped_rows = 0

    for path in csv_paths:
        file_count += 1
        with open(path, newline='', encoding='utf-8') as fh:
            reader = csv.DictReader(fh)
            rows_in_file = 0
            for row in reader:
                rows_in_file += 1
                juld = parse_datetime(row.get('juld'))
                if not juld:
                    skipped_rows += 1
                    continue
                rec = (
                    clean_text(row.get('platform_number')),
                    safe_int(row.get('cycle_number')),
                    clean_text(row.get('direction')),
                    parse_datetime(row.get('date_creation')),
                    clean_text(row.get('platform_type')),
                    juld,
                    safe_float(row.get('latitude')),
                    safe_float(row.get('longitude')),
                    clean_text(row.get('data_mode')),
                    safe_float(row.get('pres')),
                    safe_float(row.get('temp')),
                    safe_float(row.get('psal'))
                )
                batch.append(rec)

                if len(batch) >= batch_size:
                    inserted = insert_batch(conn, batch)
                    total_rows += inserted
                    print(f"  inserted batch of {inserted} rows (total inserted: {total_rows})")
                    batch = []

        print(f"[{file_count}/{total_files}] processed '{os.path.basename(path)}' ({rows_in_file} rows)")

    if batch:
        inserted = insert_batch(conn, batch)
        total_rows += inserted
        print(f"Inserted final batch of {inserted} rows.")

    print("---- Done ----")
    print(f"Files processed: {file_count}")
    print(f"Total rows inserted/updated: {total_rows}")
    print(f"Rows skipped due to bad juld: {skipped_rows}")

# ---------- CLI ----------
def main():
    parser = argparse.ArgumentParser(description="Bulk ingest CSV folder into argo_data (TimescaleDB+PostGIS).")
    parser.add_argument("--folder", "-f", required=True, help="Path to folder containing CSV files.")
    parser.add_argument("--db", "-d", default="dbname=argo_db user=postgres password=1212 host=localhost port=5432", help="psycopg2 connection string (or use env vars).")
    parser.add_argument("--batch", "-b", type=int, default=DEFAULT_BATCH_SIZE, help="Batch size for inserts.")
    parser.add_argument("--pattern", "-p", default="*.csv", help="glob pattern for files (default *.csv).")
    args = parser.parse_args()

    conn = None
    try:
        conn = psycopg2.connect(args.db)
        ensure_schema(conn)
        ingest_folder(conn, args.folder, batch_size=args.batch, pattern=args.pattern)
    except Exception as e:
        print("❌ Fatal error:", e)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
