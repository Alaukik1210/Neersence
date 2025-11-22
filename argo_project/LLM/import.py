import psycopg2
from psycopg2.extras import execute_values
import csv
from datetime import datetime

# Database configuration – update password as needed
DB_CONFIG = {
    "dbname": "argo_db",
    "user": "postgres",       
    "password": "1212",  # update this with your actual password
    "host": "localhost",
    "port": "5432"
}

# Path to your CSV file
CSV_FILE = 'nodc_R1901302_273.csv'


# ------------------ Helpers ------------------

def clean_text(val):
    """Remove byte markers and surrounding quotes if present, then strip."""
    if not val:
        return None
    if isinstance(val, bytes):
        val = val.decode("utf-8").strip()
    else:
        val = str(val).strip()

    if val.startswith("b'") and val.endswith("'"):
        val = val[2:-1]
    return val.strip()


def parse_datetime(val):
    """Convert datetime string into datetime object, handling multiple formats and trimming microseconds."""
    val = clean_text(val)
    if not val:
        return None

    # Try known formats
    formats = [
        "%Y%m%d%H%M%S",
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S"
    ]

    for fmt in formats:
        try:
            if fmt == "%Y-%m-%d %H:%M:%S.%f":
                # Trim microseconds to 6 digits if longer
                if '.' in val:
                    base, micros = val.split('.')
                    micros = (micros + '000000')[:6]  # pad or truncate to 6 digits
                    val = f"{base}.{micros}"
            return datetime.strptime(val, fmt)
        except ValueError:
            continue

    print(f"❌ Failed to parse datetime from '{val}'")
    return None



def safe_int(val):
    """Convert to integer safely, even if written as '273.0'."""
    val = clean_text(val)
    if not val:
        return None
    try:
        return int(val)
    except ValueError:
        try:
            return int(float(val))
        except ValueError:
            return None


def safe_float(val):
    """Convert to float safely."""
    val = clean_text(val)
    if not val:
        return None
    try:
        return float(val)
    except ValueError:
        return None


# ------------------ Database Setup ------------------

def create_table(conn):
    """Create the argo_data table and hypertable if it doesn't exist."""
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS argo_data (
                id SERIAL,
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
                PRIMARY KEY (id, juld)
            );
        """)
        conn.commit()

        cur.execute("""
            SELECT create_hypertable('argo_data', 'juld', if_not_exists => TRUE);
        """)
        conn.commit()
        print("✅ Table created with hypertable.")


# ------------------ Import CSV ------------------

def import_csv(conn):
    """Import data from CSV file into the database."""
    tuples = []
    skipped = 0
    with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            try:
                juld = parse_datetime(row.get('juld'))
                if not juld:
                    skipped += 1
                    print("⚠ Skipping row with invalid 'juld':", row)
                    continue

                record = (
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
                tuples.append(record)
            except Exception as e:
                print("❌ Error parsing row:", row)
                print("   →", e)

    if tuples:
        query = """
            INSERT INTO argo_data (
                platform_number, cycle_number, direction, date_creation,
                platform_type, juld, latitude, longitude,
                data_mode, pres, temp, psal
            ) VALUES %s
        """
        with conn.cursor() as cur:
            execute_values(cur, query, tuples)
            conn.commit()
        print(f"✅ Loaded {len(tuples)} rows from CSV.")
    if skipped > 0:
        print(f"⚠ Skipped {skipped} rows due to invalid 'juld'.")


# ------------------ Main ------------------

def main():
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        create_table(conn)
        import_csv(conn)
    except Exception as e:
        print("❌ Error:", e)
    finally:
        if conn:
            conn.close()
            print("🔒 Database connection closed.")


if __name__ == "__main__":
    main()
