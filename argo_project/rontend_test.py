import streamlit as st
import requests
import json
from datetime import datetime

# --- Configuration ---
API_URL = "http://localhost:8000/query"

# --- Session State Setup ---
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
if 'current_session' not in st.session_state:
    st.session_state.current_session = f"Session {datetime.now().strftime('%Y%m%d%H%M%S')}"
if 'all_sessions' not in st.session_state:
    st.session_state.all_sessions = {st.session_state.current_session: []}

# --- Functions ---

def load_session(session_name):
    """Switches the current chat history to the selected session."""
    st.session_state.current_session = session_name
    st.session_state.chat_history = st.session_state.all_sessions[session_name]

def create_new_session():
    """Creates a new, empty chat session."""
    new_name = f"Session {datetime.now().strftime('%Y%m%d%H%M%S')}"
    st.session_state.all_sessions[new_name] = []
    load_session(new_name)
    st.toast(f"New session '{new_name}' created.", icon="➕")

def save_current_session_to_file():
    """Saves the entire session history to a JSON file."""
    try:
        filename = f"chat_history_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(st.session_state.all_sessions, f, indent=4)
        st.success(f"History saved successfully to **{filename}**!")
    except Exception as e:
        st.error(f"Failed to save history: {e}")

def display_match(match: dict):
    """Formats a single raw match result for display."""
    st.markdown(f"**Rank {match.get('rank')}** (Distance: {match.get('distance'):.4f})")
    st.markdown(f"- **Platform/Cycle**: `{match.get('platform_number')}` / `{match.get('cycle_number')}`")
    st.markdown(f"- **Date**: `{match.get('date')}`")
    st.markdown(f"- **Location**: `{match.get('latitude')}, {match.get('longitude')}`")
    st.markdown(f"- **Avg Temp/Salinity**: `{match.get('avg_temperature')}` / `{match.get('avg_salinity')}`")

def send_query():
    """Sends the user query to the FastAPI backend."""
    user_input = st.session_state.query_input
    if not user_input:
        return

    # Add user message to history
    st.session_state.chat_history.append({"role": "user", "content": user_input})
    st.session_state.all_sessions[st.session_state.current_session] = st.session_state.chat_history

    with st.spinner(f"Querying Argo RAG API on {API_URL}..."):
        try:
            # Prepare payload
            payload = {"query": user_input, "n_results": 5}
            
            # Post request to FastAPI
            response = requests.post(API_URL, json=payload)
            response.raise_for_status() # Raise exception for bad status codes
            
            # Parse JSON response
            data = response.json()

            # Format the full response for history
            formatted_response = {
                "role": "assistant",
                "content": data.get("gemini_summary", "Error: No summary returned."),
                "raw_data": data
            }
            st.session_state.chat_history.append(formatted_response)
            st.session_state.all_sessions[st.session_state.current_session] = st.session_state.chat_history

        except requests.exceptions.ConnectionError:
            st.error("❌ Connection Error: Ensure the FastAPI backend is running at http://localhost:8000.")
            st.session_state.chat_history.pop() # Remove user message on failure
        except Exception as e:
            st.error(f"❌ API Error: {e}")
            st.session_state.chat_history.pop() # Remove user message on failure
        
    # Clear input box and Rerun to update chat display
    st.session_state.query_input = ""
    st.rerun()


# --- Streamlit UI Layout ---

st.title("🌊 Argo Profiles RAG Tester (FastAPI + Gemini)")

# Sidebar for session management
with st.sidebar:
    st.header("Chat Sessions")
    
    session_names = list(st.session_state.all_sessions.keys())
    
    # Use a dropdown or selectbox for session switching
    selected_session = st.selectbox(
        "Select Session",
        session_names,
        index=session_names.index(st.session_state.current_session),
        key="session_select",
        on_change=lambda: load_session(st.session_state.session_select)
    )
    
    col1, col2 = st.columns(2)
    with col1:
        st.button("➕ New Session", on_click=create_new_session, use_container_width=True)
    with col2:
        # Added the requested "Save Previous Chat" button
        st.button("💾 Save History", on_click=save_current_session_to_file, use_container_width=True)
        
    st.markdown("---")
    st.info("Backend API URL: http://localhost:8000")


# Main Chat Display Area
chat_placeholder = st.container()

with chat_placeholder:
    for message in st.session_state.chat_history:
        if message["role"] == "user":
            with st.chat_message("user"):
                st.markdown(message["content"])
        
        elif message["role"] == "assistant":
            with st.chat_message("assistant", avatar="🤖"):
                # Display the Gemini Summary (the main answer)
                st.markdown(f"**🤖 Gemini Summary:**\n\n{message['content']}")
                
                # Expanders for raw data and context (as requested)
                raw_data = message.get("raw_data", {})

                # 1. LLM Context (RAG chunk data)
                with st.expander("📖 RAG Context (Data Sent to Gemini)"):
                    st.code(raw_data.get("llm_context", "Context data not available."))
                
                # 2. Raw Matches (Structured data)
                with st.expander(f"📊 {raw_data.get('total_results', 0)} Raw Matches"):
                    if raw_data.get("matches_found"):
                        st.markdown(f"**Query Filter:** Year={raw_data.get('parsed_year')}, Month={raw_data.get('parsed_month')}")
                        for match in raw_data.get('raw_matches', []):
                            display_match(match)
                            st.markdown("---")
                    else:
                        st.markdown("No raw matches found.")

# Chat Input at the bottom
st.chat_input("Ask a question about Argo profiles (e.g., 'SST in 2023 near Hawaii'):", 
               key="query_input", 
               on_submit=send_query)