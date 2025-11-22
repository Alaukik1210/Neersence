import psycopg2

conn = psycopg2.connect(
    dbname="argo_db",
    user="postgres",
    password="1212",
    host="localhost",
    port="5432"
)

cur = conn.cursor()
cur.execute("SELECT * FROM argo_data LIMIT 10;")
rows = cur.fetchall()

for r in rows:
    print(r)

cur.close()
conn.close()
