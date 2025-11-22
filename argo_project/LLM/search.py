"""
argo_chroma_query.py

Interactive query script for Argo profiles stored in ChromaDB.
Supports free-text semantic queries + automatic year/month filtering.
"""

import chromadb
from sentence_transformers import SentenceTransformer
from datetime import datetime
import re

# ------------------------------
# Connect to Chroma
# ------------------------------
def get_collection():
    client = chromadb.PersistentClient(path="./chroma_store")
    return client.get_or_create_collection("argo_profiles")

# ------------------------------
# Try to parse year/month from user input
# ------------------------------
def parse_date_from_query(query_text):
    # Look for "May 2019", "5 2019", etc.
    month_names = {m.lower(): i for i, m in enumerate([
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ], 1)}

    year_match = re.search(r"(19|20)\d{2}", query_text)
    month_match = None

    # Check if month name is present
    for name, num in month_names.items():
        if name in query_text.lower():
            month_match = num
            break

    # Or check if numeric month appears like "5 2019" or "05/2019"
    if not month_match:
        m = re.search(r"\b(0?[1-9]|1[0-2])\b", query_text)
        if m:
            month_match = int(m.group(1))

    year = int(year_match.group()) if year_match else None
    return year, month_match

# ------------------------------
# Query Chroma
# ------------------------------
def query_profiles(collection, query_text, n_results=5):
    model = SentenceTransformer("all-MiniLM-L6-v2")
    query_embedding = model.encode([query_text]).tolist()

    year, month = parse_date_from_query(query_text)
    where_filter = None
    if year and month:
        where_filter = {"$and": [{"year": year}, {"month": month}]}
    elif year:
        where_filter = {"year": year}

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=n_results,
        where=where_filter
    )
    return results, (year, month)

# ------------------------------
# Pretty-print results
# ------------------------------
def print_results(results, query_text, parsed_date):
    year, month = parsed_date
    if not results["documents"]:
        print(f"⚠️ No matches found for '{query_text}'")
        return

    title = query_text
    if year and month:
        title += f" (structured filter applied: {month}/{year})"
    elif year:
        title += f" (structured filter applied: {year})"

    print(f"\n📌 Top Matches for: {title}")
    for rank, (doc, meta, dist) in enumerate(
        zip(results["documents"][0], results["metadatas"][0], results["distances"][0]), 1
    ):
        print(f"📌 Rank {rank}")
        print(f"   Platform: {meta.get('platform_number', 'N/A')}")
        print(f"   Cycle: {meta.get('cycle_number', 'N/A')}")
        print(f"   Date: {meta.get('juld', 'N/A')}")
        print(f"   Location: ({meta.get('latitude', 'N/A'):.5f}, {meta.get('longitude', 'N/A'):.5f})")
        print(f"   Pressure Range: {meta.get('min_pres', 'N/A')} - {meta.get('max_pres', 'N/A')}")
        print(f"   Avg Temp: {meta.get('avg_temp', 'N/A')}")
        print(f"   Avg Salinity: {meta.get('avg_psal', 'N/A')}")
        print(f"   Distance: {dist:.4f}")
        print("-" * 60)

# ------------------------------
# Main loop
# ------------------------------
if __name__ == "__main__":
    collection = get_collection()

    while True:
        query_text = input("\n🔍 Enter your query (or 'exit' to quit): ").strip()
        if query_text.lower() in ["exit", "quit"]:
            print("👋 Exiting search.")
            break

        results, parsed_date = query_profiles(collection, query_text, n_results=5)
        print_results(results, query_text, parsed_date)
