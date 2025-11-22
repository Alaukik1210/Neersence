
"""
argo_chroma_ingest.py

Pipeline:
1. Load aggregated Argo profiles from Postgres (argo_data table).
2. Prepare textual documents + metadata.
3. Encode embeddings using SentenceTransformer (all-MiniLM-L6-v2).
4. Store embeddings in ChromaDB.
5. Query February 2019 profiles using semantic search.
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import chromadb
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
from datetime import datetime

# ------------------------------
# 1) Load profiles from Postgres
# ------------------------------
def load_profiles():
    conn = psycopg2.connect(
        dbname="argo_db",
        user="postgres",
        password="1212",  # <-- update your actual password
        host="localhost",
        port="5432"
    )
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT platform_number, cycle_number, juld, latitude, longitude,
               MIN(pres) AS min_pres, MAX(pres) AS max_pres,
               AVG(temp) AS avg_temp, AVG(psal) AS avg_psal
        FROM argo_data
        GROUP BY platform_number, cycle_number, juld, latitude, longitude
    """)
    rows = cur.fetchall()
    conn.close()
    return rows

# ------------------------------
# 2) Prepare textual documents + metadata
# ------------------------------
def prepare_documents(rows):
    docs, metadatas = [], []
    for r in tqdm(rows, desc="🔄 Preparing profiles"):
        juld = r.get("juld")
        juld_str = juld.isoformat() if isinstance(juld, datetime) else "N/A"

        lat = r["latitude"] if r["latitude"] is not None else 0.0
        lon = r["longitude"] if r["longitude"] is not None else 0.0
        avg_temp = r["avg_temp"] if r["avg_temp"] is not None else 0.0
        avg_psal = r["avg_psal"] if r["avg_psal"] is not None else 0.0
        min_pres = r["min_pres"] if r["min_pres"] is not None else 0.0
        max_pres = r["max_pres"] if r["max_pres"] is not None else 0.0

        doc = (
            f"Profile: platform {r['platform_number']}, cycle {r['cycle_number']}, "
            f"juld {juld_str}, location ({lat:.5f}, {lon:.5f}), "
            f"pressure {min_pres:.2f}-{max_pres:.2f}, "
            f"avg_temp {avg_temp:.3f}, avg_psal {avg_psal:.3f}"
        )
        docs.append(doc)

        # Metadata for Chroma (no None values!)
        metadatas.append({
            "platform_number": str(r["platform_number"] or "N/A"),
            "cycle_number": int(r["cycle_number"] or 0),
            "juld": juld_str,
            "latitude": float(lat),
            "longitude": float(lon),
            "min_pres": float(min_pres),
            "max_pres": float(max_pres),
            "avg_temp": float(avg_temp),
            "avg_psal": float(avg_psal),
            "year": int(juld.year) if isinstance(juld, datetime) else 0,
            "month": int(juld.month) if isinstance(juld, datetime) else 0,
            "pres": float(min_pres)
        })
    return docs, metadatas


# ------------------------------
# 3) Store embeddings in Chroma
# ------------------------------
# ------------------------------
# 3) Store embeddings in Chroma (fixed with batching + skip existing)
# ------------------------------
# ------------------------------
# 3) Store embeddings in Chroma (fixed with batching + skip duplicates)
# ------------------------------
def store_in_chroma(docs, metadatas, batch_size=2000):
    client = chromadb.PersistentClient(path="./chroma_store")
    collection = client.get_or_create_collection("argo_profiles")

    ids = [f"{m['platform_number']}_{m['cycle_number']}_{m['juld']}" for m in metadatas]

    print(f"⚡ Storing {len(ids)} docs into Chroma (batched {batch_size})...")

    for i in range(0, len(docs), batch_size):
        batch_docs = docs[i:i+batch_size]
        batch_metas = metadatas[i:i+batch_size]
        batch_ids = ids[i:i+batch_size]

        # 🚑 Deduplicate IDs in this batch itself
        seen = set()
        unique_docs, unique_metas, unique_ids = [], [], []
        for d, m, id_ in zip(batch_docs, batch_metas, batch_ids):
            if id_ not in seen:
                unique_docs.append(d)
                unique_metas.append(m)
                unique_ids.append(id_)
                seen.add(id_)
            else:
                print(f"⚠️ Removed duplicate within batch: {id_}")

        # check which of these unique IDs already exist in Chroma
        existing = set(collection.get(ids=unique_ids)["ids"])

        # filter out those already in Chroma
        new_docs, new_metas, new_ids = [], [], []
        for d, m, id_ in zip(unique_docs, unique_metas, unique_ids):
            if id_ not in existing:
                new_docs.append(d)
                new_metas.append(m)
                new_ids.append(id_)
            else:
                print(f"⏩ Skipping already in Chroma: {id_}")

        if new_ids:
            collection.upsert(
                documents=new_docs,
                metadatas=new_metas,
                ids=new_ids
            )
            print(f"✅ Upserted batch {i//batch_size+1} ({len(new_ids)} new docs)")
        else:
            print(f"⚠️ Batch {i//batch_size+1} had only duplicates, skipped.")


    return collection


# ------------------------------
# 4) Query February 2019 profiles
# ------------------------------
# ------------------------------
# 4) Query February 2019 profiles (semantic search with distances)
# ------------------------------
# def query_february_2019(collection):
#     from sentence_transformers import SentenceTransformer

#     print("\n🔍 Running query for February 2019...")

#     # Load model
#     model = SentenceTransformer("all-MiniLM-L6-v2")

#     # Semantic search query
#     query_text = "Profiles collected in February 2019"
#     query_embedding = model.encode([query_text]).tolist()

#     # Query Chroma
#     results = collection.query(
#         query_embeddings=query_embedding,
#         n_results=5,
#         where={
#             "$and": [
#                 {"year": 2019},
#                 {"month": 11}
#             ]
#         }
#     )

#     if not results["documents"]:
#         print("⚠️ No matches found for February 2019")
#         return

#     print("\n📌 Top Matches:")
#     for rank, (doc, meta, dist) in enumerate(
#         zip(results["documents"][0], results["metadatas"][0], results["distances"][0]), 1
#     ):
#         print(f"📌 Rank {rank}")
#         print(f"   Platform: {meta.get('platform_number', 'N/A')}")
#         print(f"   Cycle: {meta.get('cycle_number', 'N/A')}")
#         print(f"   Date: {meta.get('juld', 'N/A')}")
#         lat = meta.get("latitude")
#         lon = meta.get("longitude")
#         lat_str = f"{lat:.5f}" if lat is not None else "N/A"
#         lon_str = f"{lon:.5f}" if lon is not None else "N/A"
#         print(f"   Location: ({lat_str}, {lon_str})")
#         print(f"   Pressure Range: {meta.get('min_pres', 'N/A')} - {meta.get('max_pres', 'N/A')}")
#         print(f"   Avg Temp: {meta.get('avg_temp', 'N/A')}")
#         print(f"   Avg Salinity: {meta.get('avg_psal', 'N/A')}")
#         print(f"   Distance: {dist:.4f}")
#         print("-" * 60)

# ------------------------------
# 5) Main
# ------------------------------
if __name__ == "__main__":
    # Load data from Postgres
    rows = load_profiles()
    print(f"📊 Loaded {len(rows)} profiles from Postgres")

    # Prepare docs + metadata
    docs, metadatas = prepare_documents(rows)

    # Store in Chroma
    collection = store_in_chroma(docs, metadatas)

    # Query February 2019
    # query_february_2019(collection)
