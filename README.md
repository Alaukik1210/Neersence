<p align="center">
  <img src="neersense/public/name.svg" alt="Neersence Logo" width="400"/>
</p>

<h1 align="center">🌊 Neersence - AI-Powered Ocean Data Explorer</h1>

<p align="center">
  <strong>Making oceanographic data accessible through AI-driven natural language queries and interactive visualizations</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#usage">Usage</a> •
  <a href="#future-improvements">Future Improvements</a>
</p>

---

## 📋 Table of Contents

- [The Problem We're Solving](#-the-problem-were-solving)
- [What We've Built](#-what-weve-built)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌍 The Problem We're Solving

### The Challenge with Ocean Data

The **Argo float program** is one of the most ambitious global ocean observation systems, with over **4,000 autonomous floats** continuously collecting crucial oceanographic data including:
- **Temperature profiles** (surface to 2000m depth)
- **Salinity measurements**
- **Pressure readings**
- **Biogeochemical parameters** (in some floats)

However, this wealth of data comes with significant challenges:

1. **Accessibility Barriers**: Raw oceanographic data is stored in complex NetCDF formats and distributed databases, making it difficult for non-technical users to access.

2. **Technical Expertise Required**: Extracting insights traditionally requires knowledge of specialized tools, programming languages, and oceanographic terminology.

3. **Time-Consuming Analysis**: Researchers and students spend significant time on data retrieval rather than actual analysis.

4. **Lack of Interactive Exploration**: Existing tools often lack modern, intuitive interfaces for real-time data exploration.

5. **Context Gap**: Understanding the meaning behind ocean data requires expertise that many users don't have.

### Our Solution: Neersence

**Neersence** bridges this gap by providing an AI-powered platform that allows users to:
- Query ocean data using **natural language** (e.g., "Show me temperature profiles near India in 2023")
- Visualize data through **interactive maps and charts**
- Get **AI-generated summaries** that explain complex patterns in simple terms
- Access data in **dual modes** - simplified for beginners, detailed for researchers

---

## 🚀 What We've Built

### Complete Platform Overview

Neersence consists of two main components working together:

#### 1. **Frontend Application** (`/neersense`)
A modern Next.js 15 web application featuring:
- **Landing Page**: Engaging, animated introduction to the platform
- **FloatChat AI**: Conversational interface for querying ocean data
- **Interactive Map**: Leaflet-based geospatial visualization of Argo floats
- **Dashboard**: Comprehensive data visualization with temperature, salinity, and pressure charts
- **User Authentication**: Role-based access (Researcher vs Non-Technical users)

#### 2. **Backend RAG Pipeline** (`/argo_project`)
A FastAPI-based Retrieval-Augmented Generation (RAG) system that:
- Uses **ChromaDB** for vector storage and semantic search
- Leverages **Sentence Transformers** for embedding generation
- Integrates **Google Gemini AI** for natural language understanding and response generation
- Supports **conversation memory** for context-aware multi-turn dialogues

---

## ✨ Features

### 🤖 FloatChat AI - Conversational Ocean Data Assistant
- **Natural Language Queries**: Ask questions like "What was the average salinity in the Arabian Sea in 2020?"
- **Context-Aware Responses**: Maintains conversation history for follow-up questions
- **AI-Generated Summaries**: Gemini AI explains complex data patterns in human-friendly language
- **Dynamic Visualizations**: Automatically generates temperature and salinity profile charts

### 🗺️ Interactive Global Map
- **Real-Time Float Locations**: Visualize thousands of Argo floats worldwide
- **Click-to-Explore**: Select any float to view detailed measurements
- **Year-Based Filtering**: Navigate through historical data by year
- **Multiple Map Layers**: Switch between satellite and ocean-themed views

### 📊 Comprehensive Dashboard
- **Temperature Charts**: Analyze temperature variations over depth and time
- **Salinity Profiles**: Visualize salinity distribution patterns
- **Pressure Readings**: Track depth profiles of measurements
- **Data Export**: Download datasets in research-ready formats

### 👥 Dual-Mode Interface
- **Non-Technical Mode**: Simplified explanations, guided exploration, visual-first approach
- **Researcher Mode**: Access to raw parameters, advanced filters, detailed scientific data

### 🔍 Advanced Search & Filtering
- **Semantic Search**: Find profiles based on meaning, not just keywords
- **Date Filtering**: Automatically parses year and month from natural language
- **Location-Based Queries**: Search by geographic regions
- **Parameter Filters**: Filter by temperature, salinity, pressure ranges

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework with App Router |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Smooth animations |
| **Recharts** | Data visualization |
| **Leaflet** | Interactive maps |
| **Prisma** | Database ORM |
| **Radix UI** | Accessible UI components |

### Backend (RAG Pipeline)
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance API framework |
| **ChromaDB** | Vector database for embeddings |
| **Sentence Transformers** | Text embeddings (all-MiniLM-L6-v2) |
| **Google Gemini AI** | LLM for response generation |
| **PostgreSQL** | Primary data storage |
| **Python** | Backend language |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Relational database for Argo data |
| **ChromaDB** | Vector store for semantic search |
| **Uvicorn** | ASGI server |
| **Docker** (optional) | Containerization |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  FloatChat   │  │   Map View   │  │     Dashboard        │   │
│  │  (Chat UI)   │  │  (Leaflet)   │  │  (Charts/Tables)     │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
└─────────┼─────────────────┼─────────────────────┼───────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS API ROUTES                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ /api/argo-rag│  │  /api/argo   │  │  /api/temperature    │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
└─────────┼─────────────────┼─────────────────────┼───────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              FastAPI RAG Server (Port 8000)                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │   ChromaDB  │  │  Sentence   │  │    Google Gemini    │ │ │
│  │  │   Vector    │  │ Transformer │  │        AI           │ │ │
│  │  │    Store    │  │  Embeddings │  │   (Summarization)   │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌──────────────────────┐  ┌────────────────────────────────┐   │
│  │     PostgreSQL       │  │         ChromaDB               │   │
│  │   (Argo Raw Data)    │  │    (Vector Embeddings)         │   │
│  │                      │  │                                │   │
│  │  - argo_data table   │  │  - argo_profiles collection    │   │
│  │  - users table       │  │  - Semantic search index       │   │
│  └──────────────────────┘  └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Query**: User types a natural language question in FloatChat
2. **Query Processing**: Frontend sends request to FastAPI backend
3. **Embedding Generation**: Query is converted to vector using Sentence Transformers
4. **Semantic Search**: ChromaDB finds most relevant Argo profiles
5. **Context Assembly**: Retrieved data is formatted for the LLM
6. **AI Response**: Gemini generates a human-friendly summary
7. **Visualization**: Frontend renders charts if plotting was requested
8. **Display**: Results shown with AI summary, charts, and raw data

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.9+
- **PostgreSQL** 14+
- **Google Gemini API Key**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Alaukik1210/Neersence.git
cd Neersence
```

#### 2. Set Up the Backend (RAG Pipeline)

```bash
cd argo_project

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn chromadb sentence-transformers google-generativeai python-dotenv psycopg2-binary matplotlib numpy pydantic

# Create .env file
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env

# Start the FastAPI server
python app.py
# Or use uvicorn directly:
# uvicorn app:app --reload --port 8000
```

#### 3. Set Up the Frontend

```bash
cd neersense

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database URL

# Run database migrations
npx prisma migrate dev

# Start the development server
npm run dev
```

#### 4. Access the Application

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **FloatChat**: http://localhost:3000/floatchat
- **Map View**: http://localhost:3000/map
- **Dashboard**: http://localhost:3000/dashboard

### Environment Variables

#### Backend (`argo_project/.env`)
```env
GEMINI_API_KEY=your_gemini_api_key
# Or
GENAI_API_KEY=your_gemini_api_key
```

#### Frontend (`neersense/.env.local`)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/argo_db
JWT_SECRET=your_jwt_secret
```

---

## 💡 Usage

### FloatChat AI Examples

Try these natural language queries:

```
"Show me temperature profiles from 2024"
"What are the average salinity levels near the Indian Ocean?"
"Plot temperature and salinity profile with 100 data points"
"Find profiles with high temperature readings in 2023"
"Show data from February 2019"
```

### Map Interaction

1. Navigate to `/map`
2. Select a year from the dropdown
3. Click on any float marker to view details
4. Explore temperature, salinity, and pressure readings

### Dashboard

1. Navigate to `/dashboard`
2. View aggregated statistics
3. Explore temperature and salinity charts
4. Filter data by various parameters

---

## 📁 Project Structure

```
Neersence/
├── argo_project/                 # Backend RAG Pipeline
│   ├── app.py                    # Main FastAPI application
│   ├── context.py                # RAG with conversation memory
│   ├── requirements.txt          # Python dependencies
│   ├── LLM/                      # LLM utilities
│   │   ├── embedding.py          # ChromaDB ingestion
│   │   ├── search.py             # Search utilities
│   │   └── rag.py                # RAG logic
│   └── chroma_store/             # ChromaDB data (gitignored)
│
├── neersense/                    # Frontend Application
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Landing page
│   │   ├── floatchat/            # AI Chat interface
│   │   ├── map/                  # Interactive map
│   │   ├── dashboard/            # Data dashboard
│   │   ├── about/                # About page
│   │   ├── login/                # Authentication
│   │   ├── signup/               # Registration
│   │   └── api/                  # API routes
│   ├── components/               # React components
│   │   ├── ui/                   # UI primitives
│   │   ├── Navbar.tsx            # Navigation
│   │   ├── Footer.tsx            # Footer
│   │   ├── LeafletMap.tsx        # Map component
│   │   └── ...                   # Other components
│   ├── prisma/                   # Database schema
│   │   └── schema.prisma         # Prisma schema
│   ├── public/                   # Static assets
│   └── package.json              # Node dependencies
│
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

---

## 📚 API Documentation

### POST `/query`

Query Argo profiles using natural language.

**Request Body:**
```json
{
  "query": "Show me profiles from February 2019",
  "n_results": 5,
  "chat_history": [
    {"role": "user", "content": "previous question"},
    {"role": "assistant", "content": "previous answer"}
  ]
}
```

**Response:**
```json
{
  "query": "Show me profiles from February 2019",
  "parsed_year": 2019,
  "parsed_month": 2,
  "matches_found": true,
  "raw_matches": [...],
  "gemini_summary": "Here are the ocean profiles from February 2019...",
  "llm_context": "Platform 12345 | Date 2019-02-15 | ...",
  "plot_requested": false,
  "plot_data_points": null
}
```

For full API documentation, visit `http://localhost:8000/docs` when the backend is running.

---

## 🔮 Future Improvements

### Planned Features

1. **Real-Time Data Integration**
   - Connect to live Argo GDAC (Global Data Assembly Center)
   - Automatic data updates every 24 hours

2. **Enhanced AI Capabilities**
   - Support for multiple LLM providers (OpenAI, Claude, Llama)
   - Fine-tuned model for oceanographic terminology
   - Anomaly detection and alerting

3. **Advanced Visualizations**
   - 3D ocean profile visualization
   - Time-series animations
   - Heatmaps for parameter distribution

4. **Collaboration Features**
   - Shared workspaces for research teams
   - Annotation and note-taking
   - Export to research publication formats

5. **Mobile Application**
   - React Native mobile app
   - Offline data access
   - Push notifications for anomalies

6. **BGC (Biogeochemical) Data**
   - Integration of oxygen, nitrate, pH data
   - Carbon cycle analysis
   - Ecosystem health indicators

### Suggestions for Contributors

- **Performance Optimization**: Implement caching for frequently accessed data
- **Internationalization**: Add support for multiple languages
- **Accessibility**: Improve WCAG compliance
- **Testing**: Add comprehensive test coverage
- **Documentation**: Create video tutorials and user guides

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Contribution Areas

- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations
- 🧪 Test coverage

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👥 Team

Built with ❤️ for ocean science and data accessibility.

---

## 🙏 Acknowledgments

- **Argo Program**: For providing invaluable ocean data
- **Google Gemini**: For powering our AI capabilities
- **Open Source Community**: For the amazing tools and libraries

---

<p align="center">
  <strong>🌊 Dive into ocean data like never before! 🌊</strong>
</p>
