# import chromadb
# from sentence_transformers import SentenceTransformer
# import psycopg2
# from psycopg2.extras import RealDictCursor
# import google.generativeai as genai
# import os

# # =========================
# # Setup
# # =========================

# # Configure Gemini API key (set your actual key as ENV variable first!)
# API key removed from repository. Set `GEMINI_API_KEY` or `GENAI_API_KEY` in your environment or in `argo_project/.env`.

# # Local persistent Chroma
# client = chromadb.PersistentClient(path="LLM\chroma_store")
# collection = client.get_collection("argo_profiles")

# # Local embedding model
# embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# # Connect to Postgres
# pg = psycopg2.connect("dbname=argo_db user=postgres password=1212 host=localhost port=5432")
# cur = pg.cursor(cursor_factory=RealDictCursor)


# # =========================
# # Helper Functions
# # =========================

# def embed_text(text: str):
#     return embedder.encode(text).tolist()

# def retrieve_best_profile(query: str):
#     """Retrieve the best matching profile from Chroma (only top 1)."""
#     qemb = embed_text(query)
#     res = collection.query(
#         query_embeddings=[qemb],
#         n_results=1,
#         include=["metadatas"]
#     )
#     best_meta = res["metadatas"][0][0]
#     return best_meta["platform_number"], best_meta["juld"]

# def fetch_profile_rows(platform_number: str, juld_iso: str):
#     cur.execute("""
#         SELECT platform_number, juld, pres, temp, psal, latitude, longitude
#         FROM argo_data
#         WHERE platform_number=%s AND juld = %s
#         ORDER BY pres;
#     """, (platform_number, juld_iso))
#     return cur.fetchall()

# def summarize_with_gemini(user_query: str, profile_rows: list):
#     """Use Gemini to write a natural language answer based on the table rows."""
#     # Make a compact table-like string for Gemini
#     table_str = "\n".join(
#         f"pres={r['pres']}, temp={r['temp']}, psal={r['psal']}, lat={r['latitude']}, lon={r['longitude']}"
#         for r in profile_rows[:50]  # avoid sending thousands of rows
#     )

#     prompt = f"""
# You are an oceanography expert. The user asked: "{user_query}"

# Here is the profile data (pressure, temperature, salinity):

# {table_str}

# Write a short, clear, human-friendly summary describing the profile (e.g. trends, ranges, conditions).
# Mention temperature and salinity patterns with depth.
#     """

#     model = genai.GenerativeModel("gemini-1.5-flash")
#     response = model.generate_content(prompt)
#     return response.text.strip()


# # =========================
# # Main
# # =========================

# if __name__ == "__main__":
#     user_query = input("🔍 Enter your query: ").strip()

#     platform, juld = retrieve_best_profile(user_query)
#     rows = fetch_profile_rows(platform, juld)
#     answer = summarize_with_gemini(user_query, rows)

#     print("\n✅ Answer:")
#     print(f"Platform {platform}, juld {juld}")
#     print(answer)











# import chromadb
# from sentence_transformers import SentenceTransformer
# import psycopg2
# from psycopg2.extras import RealDictCursor
# import google.generativeai as genai
# import os

# # =========================
# # Setup
# # =========================
# # API key removed from repository. Set `GEMINI_API_KEY` or `GENAI_API_KEY` in your environment or in `argo_project/.env`.

# # Local persistent Chroma
# client = chromadb.PersistentClient(path="./chroma_store")
# collection = client.get_collection("argo_profiles")

# # Local embedding model
# embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# # Connect to Postgres
# pg = psycopg2.connect("dbname=argo_db user=postgres password=1212 host=localhost port=5432")
# cur = pg.cursor(cursor_factory=RealDictCursor)


# # =========================
# # Helper Functions
# # =========================

# def embed_text(text: str):
#     return embedder.encode(text).tolist()

# def retrieve_best_profile(query: str):
#     """Retrieve the best matching profile from Chroma (only top 1)."""
#     qemb = embed_text(query)
#     res = collection.query(
#         query_embeddings=[qemb],
#         n_results=1,
#         include=["metadatas"]
#     )
#     best_meta = res["metadatas"][0][0]
#     return best_meta["platform_number"], best_meta["juld"]

# def fetch_profile_rows(platform_number: str, juld_iso: str):
#     cur.execute("""
#         SELECT platform_number, juld, pres, temp, psal, latitude, longitude
#         FROM argo_data
#         WHERE platform_number=%s AND juld = %s
#         ORDER BY pres;
#     """, (platform_number, juld_iso))
#     return cur.fetchall()

# def summarize_with_gemini(user_query: str, profile_rows: list):
#     """Use Gemini to write a natural language answer based on the table rows."""
#     # Make a compact table-like string for Gemini
#     table_str = "\n".join(
#         f"pres={r['pres']}, temp={r['temp']}, psal={r['psal']}, lat={r['latitude']}, lon={r['longitude']}"
#         for r in profile_rows[:50]  # avoid sending thousands of rows
#     )

#     prompt = f"""
# You are an oceanography expert. The user asked: "{user_query}"

# Here is the profile data (pressure, temperature, salinity):

# {table_str}

# Write a short, clear, human-friendly summary describing the profile (e.g. trends, ranges, conditions).
# Mention temperature and salinity patterns with depth.
#     """

#     model = genai.GenerativeModel("gemini-2.0-flash")
#     response = model.generate_content(prompt)
#     return response.text.strip()


# # =========================
# # Main
# # =========================

# if __name__ == "__main__":
#     user_query = input("🔍 Enter your query: ").strip()

#     platform, juld = retrieve_best_profile(user_query)
#     rows = fetch_profile_rows(platform, juld)
#     answer = summarize_with_gemini(user_query, rows)

#     print("\n✅ Answer:")
#     print(f"Platform {platform}, juld {juld}")
#     print(answer)





























# import google.generativeai as genai
# import chromadb
# from datetime import datetime
# import os

# # ------------------------------
# # 0) Set API key
# # ------------------------------
# # You can set your API key in the environment variable or directly
# # Removed hardcoded environment assignment. Set `GENAI_API_KEY` in environment or `argo_project/.env` instead.

# # ------------------------------
# # 1) Initialize Chroma
# # ------------------------------
# client = chromadb.PersistentClient(path="./chroma_store")
# collection = client.get_collection("argo_profiles")  # already exists

# # ------------------------------
# # 2) Retrieve top profiles
# # ------------------------------
# def retrieve_top_profiles(user_query: str, n_results: int = 5):
#     """
#     Queries Chroma for top n_results matching user query.
#     Returns list of metadata dictionaries.
#     """
#     try:
#         results = collection.query(
#             query_texts=[user_query],
#             n_results=n_results,
#             include=["metadatas", "documents", "distances"]
#         )

#         if not results["documents"] or len(results["documents"][0]) == 0:
#             return []

#         top_metas = results["metadatas"][0]
#         return top_metas
#     except Exception as e:
#         print(f"Error retrieving profiles: {e}")
#         return []

# # ------------------------------
# # 3) Summarize with Gemini
# # ------------------------------
# def summarize_with_gemini(user_query: str, top_metas: list):
#     if not top_metas:
#         return "⚠️ No matching profiles found."

#     # Prepare text for Gemini - handle missing fields gracefully
#     profile_summaries = []
#     for m in top_metas:
#         platform = m.get('platform_number', 'N/A')
#         date = m.get('juld', 'N/A')
#         lat = m.get('lat', 0)  # Your metadata uses 'lat', not 'latitude'
#         lon = m.get('lon', 0)  # Your metadata uses 'lon', not 'longitude'
#         min_pres = m.get('min_pres', 0)
#         max_pres = m.get('max_pres', 0)
#         avg_temp = m.get('avg_temp', 0)
#         avg_psal = m.get('avg_psal', 0)
        
#         profile_summary = (
#             f"Platform {platform}, Date {date}, "
#             f"Location ({lat:.5f}, {lon:.5f}), "
#             f"Pressure {min_pres:.1f}-{max_pres:.1f} dbar, "
#             f"Avg Temp {avg_temp:.2f}°C, Avg Salinity {avg_psal:.2f} PSU"
#         )
#         profile_summaries.append(profile_summary)
    
#     table_str = "\n".join(profile_summaries)

#     prompt = f"""
# You are an oceanography expert. The user asked: "{user_query}"

# Here are the most relevant Argo profiles:

# {table_str}

# Write a short, clear, human-friendly explanation describing the profiles.
# Mention trends, temperature and salinity patterns, and any notable oceanographic features.
# Keep the response concise but informative.
# """

#     try:
#         # Try different Gemini models (in order of preference)
#         model_names = [
#             'gemini-1.5-pro',      # Latest stable model
#             'gemini-1.5-flash',    # Fast model
#             'gemini-pro',          # Fallback
#             'models/gemini-1.5-pro', # With models/ prefix
#             'models/gemini-pro'    # Legacy format
#         ]
        
#         last_error = None
#         for model_name in model_names:
#             try:
#                 print(f"   Trying model: {model_name}")
#                 model = genai.GenerativeModel(model_name)
#                 response = model.generate_content(prompt)
                
#                 if response.text:
#                     return response.text.strip()
#                 else:
#                     last_error = "Empty response from model"
#                     continue
                    
#             except Exception as model_error:
#                 last_error = str(model_error)
#                 print(f"   Failed: {model_error}")
#                 continue
        
#         return f"⚠️ All models failed. Last error: {last_error}"
        
#     except Exception as e:
#         return f"⚠️ Error generating summary: {e}"

# # ------------------------------
# # 6) List available models (for debugging)
# # ------------------------------
# def list_available_models():
#     """List all available Gemini models"""
#     try:
#         print("🔍 Available Gemini models:")
#         models = genai.list_models()
#         for model in models:
#             if 'generateContent' in model.supported_generation_methods:
#                 print(f"   ✅ {model.name}")
#         return True
#     except Exception as e:
#         print(f"⚠️ Error listing models: {e}")
#         return False
# # ------------------------------
# def debug_chroma():
#     """Check what's in the ChromaDB collection"""
#     try:
#         # Get basic info
#         count = collection.count()
#         print(f"📊 Collection has {count} profiles")
        
#         # Get a sample
#         sample = collection.get(limit=3)
#         if sample["metadatas"]:
#             print("📋 Sample metadata keys:")
#             first_meta = sample["metadatas"][0]
#             for key, value in first_meta.items():
#                 print(f"   {key}: {value}")
        
#         return True
#     except Exception as e:
#         print(f"⚠️ Error accessing ChromaDB: {e}")
#         return False

# # ------------------------------
# # 7) Main
# # ------------------------------
# if __name__ == "__main__":
#     print("🌊 Argo Profile RAG System")
#     print("=" * 40)
    
#     # List available models first
#     list_available_models()
    
#     # Debug ChromaDB
#     if not debug_chroma():
#         print("❌ ChromaDB access failed. Please run the data ingestion script first.")
#         exit(1)
    
#     print("\n" + "=" * 40)
#     user_query = input("🔍 Enter your query (e.g. 'show me profiles from December 2019'): ").strip()
    
#     if not user_query:
#         print("❌ Please enter a valid query.")
#         exit(1)
    
#     print(f"\n🔍 Searching for: '{user_query}'")
    
#     top_metas = retrieve_top_profiles(user_query, n_results=5)
    
#     if not top_metas:
#         print("⚠️ No matching profiles found. Try a different query.")
        
#         # Show some example queries
#         print("\n💡 Try these example queries:")
#         print("   - 'profiles from 2019'")
#         print("   - 'high temperature profiles'") 
#         print("   - 'profiles from Southern Ocean'")
#         print("   - 'deep water measurements'")
#     else:
#         print(f"✅ Found {len(top_metas)} matching profiles")
#         print("\n📊 Retrieved Profiles:")
#         for i, meta in enumerate(top_metas, 1):
#             print(f"   {i}. Platform {meta.get('platform_number')}, Date: {meta.get('juld')}")
        
#         print("\n🤖 Generating summary with Gemini...")
#         answer = summarize_with_gemini(user_query, top_metas)
        
#         print("\n" + "="*50)
#         print("✅ Gemini Summary:")
#         print("="*50)
#         print(answer)
#         print("="*50)


























# """
# rag_argo_gemini.py

# Interactive RAG pipeline for Argo profiles:
# - Uses ChromaDB for semantic + structured search (year/month filtering).
# - Summarizes results with Gemini for human-friendly answers.
# """

# import chromadb
# from sentence_transformers import SentenceTransformer
# from datetime import datetime
# import re
# import os
# import google.generativeai as genai

# # ------------------------------
# # Gemini Setup
# # ------------------------------
# API key removed from repository. Set `GEMINI_API_KEY` or `GENAI_API_KEY` in your environment or in `argo_project/.env`.
# # Configure Gemini API key (set your actual key as ENV variable first!)
# genai.configure(api_key=api_keyy)
# gemini_model = genai.GenerativeModel("gemini-2.0-flash")

# # ------------------------------
# # Connect to Chroma
# # ------------------------------
# def get_collection():
#     client = chromadb.PersistentClient(path="./chroma_store")
#     return client.get_or_create_collection("argo_profiles")

# # ------------------------------
# # Try to parse year/month from user input
# # ------------------------------
# def parse_date_from_query(query_text):
#     month_names = {m.lower(): i for i, m in enumerate([
#         "January","February","March","April","May","June",
#         "July","August","September","October","November","December"
#     ], 1)}

#     year_match = re.search(r"(19|20)\d{2}", query_text)
#     month_match = None

#     for name, num in month_names.items():
#         if name in query_text.lower():
#             month_match = num
#             break

#     if not month_match:
#         m = re.search(r"\b(0?[1-9]|1[0-2])\b", query_text)
#         if m:
#             month_match = int(m.group(1))

#     year = int(year_match.group()) if year_match else None
#     return year, month_match

# # ------------------------------
# # Query Chroma
# # ------------------------------
# def query_profiles(collection, query_text, n_results=5):
#     model = SentenceTransformer("all-MiniLM-L6-v2")
#     query_embedding = model.encode([query_text]).tolist()

#     year, month = parse_date_from_query(query_text)
#     where_filter = None
#     if year and month:
#         where_filter = {"$and": [{"year": year}, {"month": month}]}
#     elif year:
#         where_filter = {"year": year}

#     results = collection.query(
#         query_embeddings=query_embedding,
#         n_results=n_results,
#         where=where_filter
#     )
#     return results, (year, month)

# # ------------------------------
# # Format results for LLM
# # ------------------------------
# def format_results_for_llm(results):
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
# def summarize_with_gemini(query_text, results):
#     if not results["documents"]:
#         return "⚠️ No matching profiles found."

#     context = format_results_for_llm(results)
#     prompt = f"""
#     You are a marine science assistant. A user asked: "{query_text}".
#     Here are the top retrieved Argo profiles:

#     {context}

#     Please summarize these results in simple, human-friendly language.
#     Mention key trends (date, temp, salinity, location).
#     """
#     response = gemini_model.generate_content(prompt)
#     return response.text

# # ------------------------------
# # Main loop
# # ------------------------------
# if __name__ == "__main__":
#     collection = get_collection()

#     while True:
#         query_text = input("\n🔍 Enter your query (or 'exit' to quit): ").strip()
#         if query_text.lower() in ["exit", "quit"]:
#             print("👋 Exiting search.")
#             break

#         results, parsed_date = query_profiles(collection, query_text, n_results=5)

#         # ✅ Gemini summary
#         summary = summarize_with_gemini(query_text, results)
#         print("\n🤖 Gemini Summary:")
#         print(summary)







