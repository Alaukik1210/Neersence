

"""
rag_argo_gemini.py

Interactive RAG pipeline for Argo profiles:
- Uses ChromaDB for semantic + structured search (year/month filtering).
- Shows raw top matches.
- Summarizes results with Gemini for human-friendly answers.
"""

import chromadb
from sentence_transformers import SentenceTransformer
from datetime import datetime
import re
import os
from dotenv import load_dotenv
import google.generativeai as genai

# ------------------------------
# Gemini Setup (load key from environment / .env)
# ------------------------------
load_dotenv()
api_keyy = os.getenv("GEMINI_API_KEY") or os.getenv("GENAI_API_KEY")
if not api_keyy:
    raise RuntimeError("GEMINI_API_KEY (or GENAI_API_KEY) not set. Add it to argo_project/.env or export it in the environment.")
genai.configure(api_key=api_keyy)
gemini_model = genai.GenerativeModel("gemini-2.0-flash")

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
    month_names = {m.lower(): i for i, m in enumerate([
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ], 1)}

    year_match = re.search(r"(19|20)\d{2}", query_text)
    month_match = None

    for name, num in month_names.items():
        if name in query_text.lower():
            month_match = num
            break

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
# Print raw results (like your old script)
# ------------------------------
def print_results(results, query_text, parsed_date):
    year, month = parsed_date
    if not results["documents"]:
        print(f"⚠️ No matches found for '{query_text}'")
        return False

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
    return True

# ------------------------------
# Format results for LLM
# ------------------------------
def format_results_for_llm(results):
    summaries = []
    for meta in results["metadatas"][0]:
        summaries.append(
            f"Platform {meta.get('platform_number', 'N/A')} | "
            f"Cycle {meta.get('cycle_number', 'N/A')} | "
            f"Date {meta.get('juld', 'N/A')} | "
            f"Lat {meta.get('latitude', 'N/A')}, Lon {meta.get('longitude', 'N/A')} | "
            f"Temp {meta.get('avg_temp', 'N/A')} | "
            f"Salinity {meta.get('avg_psal', 'N/A')}"
        )
    return "\n".join(summaries)

# ------------------------------
# Summarize with Gemini
# ------------------------------
def summarize_with_gemini(query_text, results):
    if not results["documents"]:
        return "⚠️ No matching profiles found."

    context = format_results_for_llm(results)
    prompt = f"""
    You are a marine science assistant. A user asked: "{query_text}".
    Here are the top retrieved Argo profiles:

    {context}

    Please summarize these results in simple, human-friendly language.
    Mention key trends (date, temp, salinity, location).
    """
    response = gemini_model.generate_content(prompt)
    return response.text

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

        # Show raw results first
        if not print_results(results, query_text, parsed_date):
            continue

        # Then Gemini summary
        summary = summarize_with_gemini(query_text, results)
        print("\n🤖 Gemini Summary:")
        print(summary)
