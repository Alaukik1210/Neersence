"""
fastapi_rag_argo_gemini.py

FastAPI-based Interactive RAG pipeline for Argo profiles:
- Uses ChromaDB for semantic + structured search (year/month filtering).
- Shows raw top matches.
- Summarizes results with Gemini for human-friendly answers.
- Runs as a web API on a specified port.
"""

import chromadb
from sentence_transformers import SentenceTransformer
from datetime import datetime
import re
import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn

# ------------------------------
# Gemini Setup
# ------------------------------
api_keyy = "AIzaSyDFignEWHKB8Er51qaIT89OKSj93UwMi-o"
# Configure Gemini API key (set your actual key as ENV variable first!)
genai.configure(api_key=api_keyy)
gemini_model = genai.GenerativeModel("gemini-2.0-flash")

# ------------------------------
# FastAPI App Setup
# ------------------------------
app = FastAPI(
    title="Argo Profiles RAG API",
    description="Interactive RAG pipeline for Argo profiles with semantic and structured search",
    version="1.0.0"
)

# ------------------------------
# Pydantic Models
# ------------------------------
class QueryRequest(BaseModel):
    query: str
    n_results: Optional[int] = 5

class ProfileMatch(BaseModel):
    rank: int
    platform_number: Optional[str]
    cycle_number: Optional[str]
    date: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    min_pressure: Optional[float]
    max_pressure: Optional[float]
    avg_temperature: Optional[float]
    avg_salinity: Optional[float]
    distance: float
    
    class Config:
        # Allow automatic type conversion
        str_to_lower = True

class QueryResponse(BaseModel):
    query: str
    parsed_year: Optional[int]
    parsed_month: Optional[int]
    matches_found: bool
    raw_matches: List[ProfileMatch]
    gemini_summary: str
    total_results: int

# ------------------------------
# Global variables for caching
# ------------------------------
collection = None
sentence_model = None

# ------------------------------
# Initialize resources
# ------------------------------
def initialize_resources():
    global collection, sentence_model
    if collection is None:
        client = chromadb.PersistentClient(path="./chroma_store")
        collection = client.get_or_create_collection("argo_profiles")
    
    if sentence_model is None:
        sentence_model = SentenceTransformer("all-MiniLM-L6-v2")

# ------------------------------
# Try to parse year/month from user input
# ------------------------------
def parse_date_from_query(query_text):
    month_names = {m.lower(): i for i, m in enumerate([
        "january","february","march","april","may","june",
        "july","august","september","october","november","december"
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
def query_profiles(query_text, n_results=5):
    global collection, sentence_model
    
    query_embedding = sentence_model.encode([query_text]).tolist()

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
# Convert results to structured format
# ------------------------------
def format_raw_results(results):
    matches = []
    if not results["documents"] or not results["documents"][0]:
        return matches
    
    for rank, (doc, meta, dist) in enumerate(
        zip(results["documents"][0], results["metadatas"][0], results["distances"][0]), 1
    ):
        match = ProfileMatch(
            rank=rank,
            platform_number=str(meta.get('platform_number')) if meta.get('platform_number') is not None else None,
            cycle_number=str(meta.get('cycle_number')) if meta.get('cycle_number') is not None else None,
            date=str(meta.get('juld')) if meta.get('juld') is not None else None,
            latitude=float(meta.get('latitude')) if meta.get('latitude') is not None else None,
            longitude=float(meta.get('longitude')) if meta.get('longitude') is not None else None,
            min_pressure=float(meta.get('min_pres')) if meta.get('min_pres') is not None else None,
            max_pressure=float(meta.get('max_pres')) if meta.get('max_pres') is not None else None,
            avg_temperature=float(meta.get('avg_temp')) if meta.get('avg_temp') is not None else None,
            avg_salinity=float(meta.get('avg_psal')) if meta.get('avg_psal') is not None else None,
            distance=float(dist)
        )
        matches.append(match)
    
    return matches

# ------------------------------
# Format results for LLM
# ------------------------------
def format_results_for_llm(results):
    if not results["metadatas"] or not results["metadatas"][0]:
        return "No results found."
    
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
    if not results["documents"] or not results["documents"][0]:
        return "⚠️ No matching profiles found."

    context = format_results_for_llm(results)
    prompt = f"""
    You are a marine science assistant. A user asked: "{query_text}".
    Here are the top retrieved Argo profiles:

    {context}

    Please summarize these results in simple, human-friendly language.
    Mention key trends (date, temp, salinity, location).
    """
    try:
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating summary: {str(e)}"

# ------------------------------
# FastAPI Endpoints
# ------------------------------
@app.on_event("startup")
async def startup_event():
    """Initialize resources when the app starts"""
    initialize_resources()

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Argo Profiles RAG API",
        "version": "1.0.0",
        "endpoints": {
            "/query": "POST - Query Argo profiles",
            "/health": "GET - Health check",
            "/docs": "GET - API documentation"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/query", response_model=QueryResponse)
async def query_argo_profiles(request: QueryRequest):
    """
    Query Argo profiles using semantic search and optional date filtering.
    
    - **query**: Your search query (can include years and months for filtering)
    - **n_results**: Number of results to return (default: 5)
    """
    try:
        # Ensure resources are initialized
        if collection is None or sentence_model is None:
            initialize_resources()
        
        # Perform the search
        results, (parsed_year, parsed_month) = query_profiles(
            request.query, 
            request.n_results
        )
        
        # Format raw matches
        raw_matches = format_raw_results(results)
        
        # Generate Gemini summary
        gemini_summary = summarize_with_gemini(request.query, results)
        
        # Prepare response
        response = QueryResponse(
            query=request.query,
            parsed_year=parsed_year,
            parsed_month=parsed_month,
            matches_found=len(raw_matches) > 0,
            raw_matches=raw_matches,
            gemini_summary=gemini_summary,
            total_results=len(raw_matches)
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

# ------------------------------
# Command line interface (optional)
# ------------------------------
def run_cli():
    """Run the original CLI interface"""
    initialize_resources()
    
    print("🚀 CLI Mode - Argo Profiles RAG")
    print("💡 Tip: You can also run this as a web API!")
    
    while True:
        query_text = input("\n🔍 Enter your query (or 'exit' to quit): ").strip()
        if query_text.lower() in ["exit", "quit"]:
            print("👋 Exiting search.")
            break

        results, parsed_date = query_profiles(query_text, n_results=5)
        
        # Print results in the original format
        year, month = parsed_date
        if not results["documents"] or not results["documents"][0]:
            print(f"⚠️ No matches found for '{query_text}'")
            continue

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

        # Then Gemini summary
        summary = summarize_with_gemini(query_text, results)
        print("\n🤖 Gemini Summary:")
        print(summary)

# ------------------------------
# Main execution
# ------------------------------
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "cli":
        # Run CLI mode
        run_cli()
    else:
        # Run FastAPI server
        print("🚀 Starting FastAPI server...")
        print("📖 API Documentation: http://localhost:8000/docs")
        print("💡 To run CLI mode: python fastapi_rag_argo_gemini.py cli")
        
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            reload=True
        )
        
        