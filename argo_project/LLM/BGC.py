"""
BGC.py

Bulk ingest BGC CSV files (~500 rows each) into PostgreSQL (TimescaleDB + PostGIS).
- Automatically creates table + hypertable + indexes.
- Bulk inserts with execute_values.
- Deduplicates rows by (platform_number, juld, pres).
- Computes location (geography POINT).
- Skips files already fully inserted.
- Robust UTF-8 / Latin-1 encoding handling.
"""

import os
import glob
import csv
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values

# ---------- CONFIG ----------
CSV_FOLDER = r"F:\BGC_ARGO_2025"
DB_CONN_STR = "dbname=argo_db user=postgres password=1212 host=localhost port=5432"
TABLE_NAME = "bgc_argo"
BATCH_SIZE = 5000

# ---------- Helpers ----------
def clean_text(val):
    if val is None:
        return None
    if isinstance(val, bytes):
        val = val.decode("utf-8", errors="ignore")
    s = str(val).strip()
    if s == "":
        return None
    return s

def safe_float(val):
    s = clean_text(val)
    if s is None:
        return None
    try:
        return float(s)
    except:
        return None

def safe_int(val):
    s = clean_text(val)
    if s is None:
        return None
    try:
        return int(float(s))
    except:
        return None

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
        except:
            continue
    return None

def normalize(col):
    """Remove spaces/underscores, uppercase, remove BOM"""
    return col.replace(" ", "").replace("_", "").upper().replace("\ufeff", "")

# ---------- DB helpers ----------
def ensure_table(conn, col_list):
    """
    Create table if not exists, with dynamic BGC columns based on list of column names.
    """
    cols_defs = []

    for col in col_list:
        if col in ["LATITUDE", "LONGITUDE", "PRES", "JULD"]:
            col_type = "REAL"
        elif col in ["DATECREATION", "PLATFORMNUMBER", "CYCNUMBER", "DIRECTION",
                     "DATAMODE", "PLATFORMTYPE"]:
            col_type = "TEXT"
        else:
            col_type = "REAL"  # BGC columns
        cols_defs.append(f'"{col}" {col_type}')

    cols_sql = ",\n    ".join(cols_defs)
    create_sql = f"""
    CREATE TABLE IF NOT EXISTS "{TABLE_NAME}" (
        id SERIAL PRIMARY KEY,
        {cols_sql},
        location GEOGRAPHY(Point, 4326)
    );
    """
    with conn.cursor() as cur:
        cur.execute(create_sql)
        conn.commit()
        # Hypertable
        cur.execute(f"SELECT create_hypertable('{TABLE_NAME}', 'JULD', if_not_exists => TRUE);")
        conn.commit()
        # Indexes
        cur.execute(f"CREATE UNIQUE INDEX IF NOT EXISTS ux_{TABLE_NAME}_platform_juld_pres "
                    f"ON {TABLE_NAME} (PLATFORM_NUMBER, JULD, PRES);")
        conn.commit()
        cur.execute(f"CREATE INDEX IF NOT EXISTS idx_{TABLE_NAME}_location "
                    f"ON {TABLE_NAME} USING GIST(location);")
        conn.commit()
    print("✅ Table and indexes ensured.")

def deduplicate_batch(batch):
    """Remove duplicates in batch by (platform_number, juld, pres)"""
    unique = {}
    for r in batch:
        key = (r[0], r[5], r[9])
        unique[key] = r
    return list(unique.values())

def insert_batch(conn, batch, all_cols):
    if not batch:
        return 0
    batch = deduplicate_batch(batch)
    insert_sql = f"""
    INSERT INTO {TABLE_NAME} ({','.join(all_cols)})
    VALUES %s
    ON CONFLICT (PLATFORM_NUMBER, JULD, PRES) DO UPDATE SET
        {','.join([f'{col}=EXCLUDED.{col}' for col in all_cols if col not in ['PLATFORM_NUMBER','JULD','PRES']])};
    """
    with conn.cursor() as cur:
        execute_values(cur, insert_sql, batch, page_size=1000)
        conn.commit()
        # Update location
        cur.execute(f"""
            UPDATE {TABLE_NAME}
            SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::GEOGRAPHY
            WHERE location IS NULL AND longitude IS NOT NULL AND latitude IS NOT NULL;
        """)
        conn.commit()
    return len(batch)

# ---------- Main ingestion ----------
def ingest_folder(conn, folder_path, batch_size=BATCH_SIZE):
    csv_paths = sorted(glob.glob(os.path.join(folder_path, "*.csv")))
    if not csv_paths:
        print("No CSV files found at", folder_path)
        return

    total_rows = 0
    skipped_rows = 0

    # Determine all columns from first file
    first_file = csv_paths[0]
    with open(first_file, newline='', encoding='utf-8-sig') as fh:
        reader = csv.DictReader(fh)
        first_cols = [normalize(c) for c in reader.fieldnames]

    all_cols = first_cols
    ensure_table(conn, all_cols)

    batch = []
    for path in csv_paths:
        # Read CSV robustly
        for enc in ['utf-8-sig','latin1']:
            try:
                with open(path, newline='', encoding=enc) as fh:
                    reader = csv.DictReader(fh)
                    rows = list(reader)
                break
            except UnicodeDecodeError:
                continue
        else:
            print(f"❌ Could not read {os.path.basename(path)}")
            continue

        if not rows:
            print(f"Empty file {os.path.basename(path)}, skipping")
            continue

        # Skip if already inserted
        first_row = rows[0]
        platform = clean_text(first_row.get('platform_number'))
        juld = parse_datetime(first_row.get('juld'))
        pres = safe_float(first_row.get('pres'))
        if platform and juld and pres is not None:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT 1 FROM {TABLE_NAME} WHERE platform_number=%s AND juld=%s AND pres=%s LIMIT 1",
                    (platform, juld, pres)
                )
                if cur.fetchone():
                    print(f"Skipping {os.path.basename(path)} (already in DB)")
                    continue

        for row in rows:
            rec = tuple(
                clean_text(row.get(c)) if c not in ['JULD','LATITUDE','LONGITUDE','PRES']
                else (parse_datetime(row.get(c)) if c=='JULD' else safe_float(row.get(c)))
                for c in all_cols
            )
            if rec[all_cols.index('JULD')] is None:
                skipped_rows +=1
                continue
            batch.append(rec)
            if len(batch) >= batch_size:
                inserted = insert_batch(conn, batch, all_cols)
                total_rows += inserted
                print(f"Inserted batch of {inserted} rows (total {total_rows})")
                batch = []

    if batch:
        inserted = insert_batch(conn, batch, all_cols)
        total_rows += inserted
        print(f"Inserted final batch of {inserted} rows.")

    print("---- Done ----")
    print(f"Total rows inserted/updated: {total_rows}")
    print(f"Rows skipped due to bad JULD: {skipped_rows}")

# ---------- Run ----------
if __name__ == "__main__":
    conn = psycopg2.connect(DB_CONN_STR)
    ingest_folder(conn, CSV_FOLDER)
    conn.close()
