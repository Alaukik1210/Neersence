# """
# fastapi_rag_argo_gemini.py

# FastAPI-based Interactive RAG pipeline for Argo profiles:
# - Uses ChromaDB for semantic + structured search (year/month filtering).
# - Shows raw top matches.
# - Summarizes results with Gemini for human-friendly answers.
# - Runs as a web API on a specified port.
# """

# import chromadb
# from sentence_transformers import SentenceTransformer
# from datetime import datetime
# import re
# import os
# import google.generativeai as genai
# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# from typing import Optional, List, Dict, Any
# import uvicorn
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware 
# # ------------------------------
# # Gemini Setup
# # ------------------------------
# # NOTE: It is HIGHLY recommended to load your API key from an environment variable 
# # or a .env file rather than hardcoding it, as done in the original file.
# # The hardcoded key below is a placeholder and should be replaced or secured.
# api_keyy = "AIzaSyDFignEWHKB8Er51qaIT89OKSj93UwMi-o"
# genai.configure(api_key=api_keyy)
# gemini_model = genai.GenerativeModel("gemini-2.0-flash")

# # ------------------------------
# # FastAPI App Setup
# # ------------------------------
# app = FastAPI(
#     title="Argo Profiles RAG API",
#     description="Interactive RAG pipeline for Argo profiles with semantic and structured search",
#     version="1.0.1"
# )

# # --- ADD CORS CONFIGURATION ---
# # Replace the list below with the actual origin of your Next.js frontend.
# # The default Next.js dev server runs on port 3000.
# origins = [
#     "http://localhost:3000",  # Next.js default development port
#     "http://127.0.0.1:3000",
#     # If your frontend is running on a different port, add it here.
#     # For maximum flexibility during development, you could use ["*"], but that is insecure for production.
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],  # Allows all methods, including OPTIONS, POST
#     allow_headers=["*"],
# )

# # ------------------------------
# # Pydantic Models
# # ------------------------------
# class QueryRequest(BaseModel):
#     query: str
#     n_results: Optional[int] = 5

# class ProfileMatch(BaseModel):
#     rank: int
#     platform_number: Optional[str]
#     cycle_number: Optional[str]
#     date: Optional[str]
#     latitude: Optional[float]
#     longitude: Optional[float]
#     min_pressure: Optional[float]
#     max_pressure: Optional[float]
#     avg_temperature: Optional[float]
#     avg_salinity: Optional[float]
#     distance: float
    
#     class Config:
#         # Allow automatic type conversion
#         str_to_lower = True

# class QueryResponse(BaseModel):
#     query: str
#     parsed_year: Optional[int]
#     parsed_month: Optional[int]
#     matches_found: bool
#     raw_matches: List[ProfileMatch]
#     gemini_summary: str
#     total_results: int
#     # ADDED FIELD: Contains the exact RAG data sent to the LLM
#     llm_context: str

# # ------------------------------
# # Global variables for caching
# # ------------------------------
# collection = None
# # Using a common embedding model that is widely available via sentence-transformers
# sentence_model = None 

# # ------------------------------
# # Initialize resources
# # ------------------------------
# def initialize_resources():
#     """Initializes the ChromaDB client and the Sentence Transformer model."""
#     global collection, sentence_model
#     if collection is None:
#         # Expects the Chroma data to be in a local folder named 'chroma_store'
#         client = chromadb.PersistentClient(path="./chroma_store")
#         collection = client.get_or_create_collection("argo_profiles")
#         print("[RAG] ChromaDB collection 'argo_profiles' loaded.")
    
#     if sentence_model is None:
#         # The 'all-MiniLM-L6-v2' model is small, fast, and effective.
#         sentence_model = SentenceTransformer("all-MiniLM-L6-v2")
#         print("[RAG] Sentence Transformer embedding model loaded.")

# # ------------------------------
# # Try to parse year/month from user input
# # ------------------------------
# def parse_date_from_query(query_text):
#     """
#     Extracts year (19xx or 20xx) and month (name or number) from the query.
#     Returns year (int) and month (int or None).
#     """
#     month_names = {m.lower(): i for i, m in enumerate([
#         "january","february","march","april","may","june",
#         "july","august","september","october","november","december"
#     ], 1)}

#     year_match = re.search(r"(19|20)\d{2}", query_text)
#     month_match = None

#     for name, num in month_names.items():
#         if name in query_text.lower():
#             month_match = num
#             break

#     if not month_match:
#         # Check for standalone month numbers (01-12) not part of a year
#         m = re.search(r"(?<!\d)\b(0?[1-9]|1[0-2])\b(?!\d)", query_text)
#         if m:
#             # Need to be careful not to pick up numbers that are pressures/temps
#             # This is a heuristic that might need refinement.
#             month_match = int(m.group(1))

#     year = int(year_match.group()) if year_match else None
#     return year, month_match

# # ------------------------------
# # Query Chroma
# # ------------------------------
# def query_profiles(query_text, n_results=5):
#     """Performs the ChromaDB query with semantic search and optional metadata filtering."""
#     global collection, sentence_model
    
#     query_embedding = sentence_model.encode([query_text]).tolist()

#     year, month = parse_date_from_query(query_text)
#     where_filter = None
    
#     # Construct the metadata filter based on parsed dates
#     if year and month:
#         # Note: ChromaDB metadata values must match the stored type (often string or int)
#         where_filter = {"$and": [{"year": year}, {"month": month}]} 
#     elif year:
#         where_filter = {"year": year}

#     results = collection.query(
#         query_embeddings=query_embedding,
#         n_results=n_results,
#         where=where_filter,
#         include=['metadatas', 'distances', 'documents']
#     )
#     return results, (year, month)

# # ------------------------------
# # Convert results to structured format (for 'raw_matches' list)
# # ------------------------------
# def format_raw_results(results):
#     """Converts raw ChromaDB results into a list of Pydantic ProfileMatch models."""
#     matches = []
#     if not results.get("documents") or not results["documents"][0]:
#         return matches
    
#     # Check for empty results list before zipping
#     if not results.get("metadatas") or not results["metadatas"][0]:
#         return matches

#     for rank, (doc, meta, dist) in enumerate(
#         zip(results["documents"][0], results["metadatas"][0], results["distances"][0]), 1
#     ):
#         # Convert metadata values to the expected type for the Pydantic model
#         match = ProfileMatch(
#             rank=rank,
#             platform_number=str(meta.get('platform_number')) if meta.get('platform_number') is not None else None,
#             cycle_number=str(meta.get('cycle_number')) if meta.get('cycle_number') is not None else None,
#             date=str(meta.get('juld')) if meta.get('juld') is not None else None,
#             latitude=float(meta.get('latitude')) if meta.get('latitude') is not None else None,
#             longitude=float(meta.get('longitude')) if meta.get('longitude') is not None else None,
#             min_pressure=float(meta.get('min_pres')) if meta.get('min_pres') is not None else None,
#             max_pressure=float(meta.get('max_pres')) if meta.get('max_pres') is not None else None,
#             avg_temperature=float(meta.get('avg_temp')) if meta.get('avg_temp') is not None else None,
#             avg_salinity=float(meta.get('avg_psal')) if meta.get('avg_psal') is not None else None,
#             distance=float(dist)
#         )
#         matches.append(match)
    
#     return matches

# # ------------------------------
# # Format results for LLM (the RAG Context)
# # ------------------------------
# def format_results_for_llm(results):
#     """
#     Creates a concise, readable string of retrieved data points to send to Gemini.
#     This string is also returned in the API response as 'llm_context'.
#     """
#     if not results.get("metadatas") or not results["metadatas"][0]:
#         return "No relevant Argo profiles found in the vector store."
    
#     summaries = []
#     for meta in results["metadatas"][0]:
#         summaries.append(
#             f"Platform {meta.get('platform_number', 'N/A')} | "
#             f"Cycle {meta.get('cycle_number', 'N/A')} | "
#             f"Date {meta.get('juld', 'N/A')} | "
#             f"Lat {meta.get('latitude', 'N/A')}, Lon {meta.get('longitude', 'N/A')} | "
#             f"Temp {meta.get('avg_temp', 'N/A')} | "
#             f"Salinity {meta.get('avg_psal', 'N/A')}"
#         )
#     return "\n".join(summaries)

# # ------------------------------
# # Summarize with Gemini
# # ------------------------------
# def summarize_with_gemini(query_text, context_string):
#     """Sends the user query and RAG context to Gemini for summarization."""
#     if context_string == "No relevant Argo profiles found in the vector store.":
#         return "⚠️ No matching profiles found in the database for your request. Try a different query or date range."

#     prompt = f"""
#     You are a marine science assistant. A user asked: "{query_text}".
#     Here are the top retrieved Argo profiles:

#     {context_string}

#     Please summarize these results in simple, human-friendly language.
#     Mention key trends (date, temp, salinity, location). If dates were filtered, mention that.
#     """
#     try:
#         response = gemini_model.generate_content(prompt)
#         return response.text
#     except Exception as e:
#         return f"Error generating summary from Gemini: {str(e)}"

# # ------------------------------
# # FastAPI Endpoints
# # ------------------------------
# @app.on_event("startup")
# async def startup_event():
#     """Initialize resources when the app starts"""
#     initialize_resources()

# @app.get("/")
# async def root():
#     """Root endpoint with API information"""
#     return {
#         "message": "Argo Profiles RAG API is running",
#         "version": "1.0.1",
#         "endpoints": {
#             "/query": "POST - Query Argo profiles (main RAG endpoint)",
#             "/health": "GET - Health check",
#             "/docs": "GET - API documentation"
#         }
#     }

# @app.get("/health")
# async def health_check():
#     """Health check endpoint to verify server status and resource loading."""
#     status = "healthy"
#     details = {}
#     if collection is None:
#         status = "degraded"
#         details["chroma"] = "Not loaded"
#     if sentence_model is None:
#         status = "degraded"
#         details["embedding_model"] = "Not loaded"
        
#     return {
#         "status": status, 
#         "timestamp": datetime.now().isoformat(),
#         "details": details
#     }

# @app.post("/query", response_model=QueryResponse)
# async def query_argo_profiles(request: QueryRequest):
#     """
#     Query Argo profiles using semantic search and optional date filtering.
    
#     - **query**: Your search query (can include years and months for filtering)
#     - **n_results**: Number of results to return (default: 5)
#     """
#     try:
#         # Ensure resources are initialized
#         if collection is None or sentence_model is None:
#             initialize_resources()
        
#         # 1. Perform the search (Semantic + Metadata Filtering)
#         results, (parsed_year, parsed_month) = query_profiles(
#             request.query, 
#             request.n_results
#         )
        
#         # 2. Format raw matches for structured display
#         raw_matches = format_raw_results(results)
        
#         # 3. Create the LLM context string
#         llm_context_data = format_results_for_llm(results)
        
#         # 4. Generate Gemini summary using the context
#         gemini_summary = summarize_with_gemini(request.query, llm_context_data)
        
#         # 5. Prepare and return the response
#         response = QueryResponse(
#             query=request.query,
#             parsed_year=parsed_year,
#             parsed_month=parsed_month,
#             matches_found=len(raw_matches) > 0,
#             raw_matches=raw_matches,
#             gemini_summary=gemini_summary,
#             total_results=len(raw_matches),
#             llm_context=llm_context_data # The new field for frontend display
#         )
        
#         return response
        
#     except Exception as e:
#         print(f"[ERROR] Query processing failed: {e}")
#         raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

# # ------------------------------
# # Main execution
# # ------------------------------
# if __name__ == "__main__":
#     import sys
    
#     # Check for 'cli' argument to run in Command Line Interface mode
#     if len(sys.argv) > 1 and sys.argv[1] == "cli":
#         run_cli()
#     else:
#         # Default: Run FastAPI server
#         print("🚀 Starting FastAPI server...")
#         print("📖 API Documentation: http://localhost:8000/docs")
#         print("💡 To run CLI mode: python fastapi_rag_argo_gemini.py cli")
        
#         # uvicorn.run will automatically call the @app.on_event("startup") function
#         uvicorn.run(
#             app,
#             host="0.0.0.0",
#             port=8000,
#             reload=True # Enables live reload for development
#         )

# # NOTE: The 'run_cli' function from the original code remains unchanged 
# # and is needed if you want to use the CLI functionality.
# def run_cli():
#     """Run the original CLI interface"""
#     initialize_resources()
    
#     print("🚀 CLI Mode - Argo Profiles RAG")
#     print("💡 Tip: You can also run this as a web API!")
    
#     while True:
#         query_text = input("\n🔍 Enter your query (or 'exit' to quit): ").strip()
#         if query_text.lower() in ["exit", "quit"]:
#             print("👋 Exiting search.")
#             break

#         results, parsed_date = query_profiles(query_text, n_results=5)
        
#         # Print results in the original format
#         year, month = parsed_date
#         if not results["documents"] or not results["documents"][0]:
#             print(f"⚠️ No matches found for '{query_text}'")
#             continue

#         title = query_text
#         if year and month:
#             title += f" (structured filter applied: {month}/{year})"
#         elif year:
#             title += f" (structured filter applied: {year})"

#         print(f"\n📌 Top Matches for: {title}")
#         for rank, (doc, meta, dist) in enumerate(
#             zip(results["documents"][0], results["metadatas"][0], results["distances"][0]), 1
#         ):
#             print(f"📌 Rank {rank}")
#             print(f"   Platform: {meta.get('platform_number', 'N/A')}")
#             print(f"   Cycle: {meta.get('cycle_number', 'N/A')}")
#             print(f"   Date: {meta.get('juld', 'N/A')}")
#             print(f"   Location: ({meta.get('latitude', 'N/A'):.5f}, {meta.get('longitude', 'N/A'):.5f})")
#             print(f"   Pressure Range: {meta.get('min_pres', 'N/A')} - {meta.get('max_pres', 'N/A')}")
#             print(f"   Avg Temp: {meta.get('avg_temp', 'N/A')}")
#             print(f"   Avg Salinity: {meta.get('avg_psal', 'N/A')}")
#             print(f"   Distance: {dist:.4f}")
#             print("-" * 60)

#         # Then Gemini summary
#         # Note: We need the context string here too, so we regenerate it
#         context_string = format_results_for_llm(results)
#         summary = summarize_with_gemini(query_text, context_string)
#         print("\n🤖 Gemini Summary:")
#         print(summary)


"""
context.py (Formerly fastapi_rag_argo_gemini.py)

FastAPI-based Interactive RAG pipeline for Argo profiles.
- Uses ChromaDB for semantic + structured search.
- **Includes Conversation Memory** by accepting chat history from the frontend.
- Summarizes results with Gemini for human-friendly answers.
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
from fastapi.middleware.cors import CORSMiddleware # Required for Next.js/Frontend access

# ------------------------------
# Gemini Setup
# ------------------------------
# NOTE: Replace with secure loading (e.g., from environment variable or .env file)
api_keyy = "AIzaSyDFignEWHKB8Er51qaIT89OKSj93UwMi-o"
genai.configure(api_key=api_keyy)
gemini_model = genai.GenerativeModel("gemini-2.0-flash")

# ------------------------------
# FastAPI App Setup
# ------------------------------
app = FastAPI(
    title="Argo Profiles RAG API",
    description="Interactive RAG pipeline for Argo profiles with semantic and structured search",
    version="2.0.0" # Major version update for memory feature
)

# Configure CORS to allow access from the Next.js frontend (typically port 3000)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------
# Pydantic Models
# ------------------------------
class HistoryMessage(BaseModel):
    """Model for a single message in the conversation history."""
    role: str # 'user' or 'assistant'
    content: str

class QueryRequest(BaseModel):
    query: str
    n_results: Optional[int] = 5
    # ADDED: Field to accept the conversation history from the frontend
    chat_history: Optional[List[HistoryMessage]] = None 

class ProfileMatch(BaseModel):
    # ... (Structure remains the same) ...
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
        str_to_lower = True

class QueryResponse(BaseModel):
    query: str
    parsed_year: Optional[int]
    parsed_month: Optional[int]
    matches_found: bool
    raw_matches: List[ProfileMatch]
    gemini_summary: str
    total_results: int
    llm_context: str


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
        print("[RAG] ChromaDB collection 'argo_profiles' loaded.")
    
    if sentence_model is None:
        sentence_model = SentenceTransformer("all-MiniLM-L6-v2")
        print("[RAG] Sentence Transformer embedding model loaded.")

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
        m = re.search(r"(?<!\d)\b(0?[1-9]|1[0-2])\b(?!\d)", query_text)
        if m:
            month_match = int(m.group(1))

    year = int(year_match.group()) if year_match else None
    return year, month_match

# ------------------------------
# Query Chroma (No change here)
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
        where=where_filter,
        include=['metadatas', 'distances', 'documents']
    )
    return results, (year, month)

# ------------------------------
# Convert results to structured format (No change here)
# ------------------------------
def format_raw_results(results):
    matches = []
    if not results.get("documents") or not results["documents"][0]:
        return matches
    
    if not results.get("metadatas") or not results["metadatas"][0]:
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
# Format results for LLM (No change here)
# ------------------------------
def format_results_for_llm(results):
    if not results.get("metadatas") or not results["metadatas"][0]:
        return "No relevant Argo profiles found in the vector store."
    
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
# Summarize with Gemini (UPDATED for History/Context)
# ------------------------------
def summarize_with_gemini(query_text, context_string, chat_history: Optional[List[HistoryMessage]] = None):
    """Sends the user query, RAG context, and chat history to Gemini."""
    if context_string == "No relevant Argo profiles found in the vector store.":
        return "⚠️ No matching profiles found in the database for your request. Try a different query or date range."

    history_prompt = ""
    if chat_history and len(chat_history) > 0:
        # Build a simple history string (excluding the current user query, which is in query_text)
        for msg in chat_history: 
            role = "User" if msg.role == 'user' else "AI"
            # Limit the content to avoid massive history bloat
            content = msg.content[:200].replace('\n', ' ') 
            history_prompt += f"[{role}]: {content}\n"

    prompt = f"""
    You are a marine science assistant. 
    
    --- CONVERSATION HISTORY ---
    {history_prompt.strip() or "No recent history."}
    --- END HISTORY ---
    
    The user's LATEST question is: "{query_text}".
    Here are the top retrieved Argo profiles from the database (RAG Context):

    {context_string}

    Please summarize the relevant information based on the context, the user's latest question, and the history if necessary for continuity.
    """
    try:
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating summary from Gemini: {str(e)}"

# ------------------------------
# FastAPI Endpoints
# ------------------------------
@app.on_event("startup")
async def startup_event():
    """Initialize resources when the app starts"""
    initialize_resources()

@app.post("/query", response_model=QueryResponse)
async def query_argo_profiles(request: QueryRequest):
    """Query Argo profiles using semantic search, date filtering, and conversation history."""
    try:
        if collection is None or sentence_model is None:
            initialize_resources()
        
        # 1. Perform the search
        results, (parsed_year, parsed_month) = query_profiles(
            request.query, 
            request.n_results
        )
        
        # 2. Format raw matches & LLM context
        raw_matches = format_raw_results(results)
        llm_context_data = format_results_for_llm(results)
        
        # 3. Generate Gemini summary using context AND history
        gemini_summary = summarize_with_gemini(
            request.query, 
            llm_context_data,
            request.chat_history # <-- PASSES THE HISTORY TO THE LLM
        )
        
        # 4. Prepare and return the response
        response = QueryResponse(
            query=request.query,
            parsed_year=parsed_year,
            parsed_month=parsed_month,
            matches_found=len(raw_matches) > 0,
            raw_matches=raw_matches,
            gemini_summary=gemini_summary,
            total_results=len(raw_matches),
            llm_context=llm_context_data
        )
        
        return response
        
    except Exception as e:
        print(f"[ERROR] Query processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


# ------------------------------
# Main execution
# ------------------------------
if __name__ == "__main__":
    # Note: When running with 'uvicorn context:app --reload', this block is typically ignored.
    # It remains here primarily for direct script execution or fallback CLI mode.
    print("Starting FastAPI server via uvicorn (or manually via CLI)...")
    try:
        # We generally expect the user to run the uvicorn command from the shell
        import sys
        if len(sys.argv) > 1 and sys.argv[1] == "cli":
             # Assuming run_cli is defined or imported for this case
             # (run_cli is omitted here for brevity, assuming you have it or will remove it)
             pass 
        else:
            # Fallback for when the file is run directly: python context.py
            uvicorn.run(
                 app,
                 host="0.0.0.0",
                 port=8000,
                 reload=True
            )
    except Exception as e:
        print(f"Error during manual startup: {e}")