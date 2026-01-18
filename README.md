# Resume Screening AI

An AI-powered resume screening system using **LangChain**, **LangGraph**, and **Google Gemini**. The system uses a multi-agent architecture to analyze resumes against job descriptions and provide match scores, recommendations, and detailed reasoning.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RESUME SCREENING AI                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │
│  │   Agent 1   │     │   Agent 2   │     │   Agent 3   │           │
│  │ File Parser │ ──▶ │   Resume    │ ──▶ │     JD      │           │
│  │  (Gemini)   │     │  Analyzer   │     │  Analyzer   │           │
│  └─────────────┘     └─────────────┘     └─────────────┘           │
│         │                   │                   │                   │
│         │                   └─────────┬─────────┘                   │
│         │                             ▼                             │
│         │                   ┌─────────────────┐                     │
│         │                   │    Agent 4      │                     │
│         │                   │ Matching Agent  │                     │
│         │                   └────────┬────────┘                     │
│         │                            │                              │
│         ▼                            ▼                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        JSON OUTPUT                           │   │
│  │  { match_score, recommendation, confidence, reasoning }      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## ✨ Features

- **4 AI Agents**: File Parser, Resume Analyzer, JD Analyzer, Matching Agent
- **LangGraph Orchestration**: State machine-based multi-agent workflow
- **Multi-Provider Fallback**: Gemini → Groq → Manual Review
- **Multimodal Input**: Supports PDF, DOCX, and images
- **Local Fallback**: pdfplumber/python-docx when APIs are unavailable
- **CLI Tool**: Command-line interface for terminal usage
- **Web Interface**: React frontend with FastAPI backend
- **Robust Error Handling**: Graceful degradation with informative messages

## 📁 Project Structure

```
resume_screening_ai/
├── main.py                 # CLI entry point
├── requirements.txt        # Python dependencies
├── .env                    # API keys (create this)
├── README.md
│
├── core/                   # AI/LangGraph module
│   ├── __init__.py
│   ├── graph.py            # LangGraph pipeline
│   ├── llm.py              # LLM providers (Gemini + Groq)
│   ├── file_utils.py       # File parsing
│   ├── prompts.py          # Prompt templates
│   └── output_parsers.py   # Pydantic schemas
│
├── backend/                # FastAPI server
│   └── api.py
│
└── frontend/               # React app
    ├── src/
    │   ├── App.jsx
    │   └── App.css
    ├── vite.config.js
    └── package.json
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd resume_screening_ai

# Python dependencies
pip install -r requirements.txt

# Frontend dependencies (optional, for web UI)
cd frontend && npm install && cd ..
```

### 2. Configure API Keys

Create a `.env` file in the project root:

```bash
# Required - Get from https://aistudio.google.com/app/apikey
GOOGLE_API_KEY=your_gemini_api_key_here

# Optional (fallback) - Get from https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Run the CLI

```bash
# Basic usage
python main.py --resume resume.pdf --jd job_description.txt

# With inline job description
python main.py --resume resume.pdf --jd-text "We need a Python developer with 3+ years..."

# Save output to file
python main.py --resume resume.pdf --jd job.txt --output result.json

# Verbose mode (show intermediate analysis)
python main.py --resume resume.pdf --jd job.txt --verbose
```

### 4. Run the Web App

**Terminal 1 - Backend:**
```bash
cd resume_screening_ai
python -m uvicorn backend.api:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd resume_screening_ai/frontend
npm run dev
```

**Open:** http://localhost:3000

## 📊 Output Format

```json
{
  "match_score": 0.85,
  "recommendation": "Proceed to interview",
  "requires_human": false,
  "confidence": 0.9,
  "reasoning_summary": "Strong match based on skills and experience..."
}
```

### Recommendation Values:
- `"Proceed to interview"` - Strong match (score >= 0.7)
- `"Reject"` - Poor match (score < 0.4)
- `"Needs manual review"` - Uncertain (0.4 <= score < 0.7 or requires_human=true)

## 🛡️ Error Handling

The system gracefully handles failures:

| Error Type | Handling |
|------------|----------|
| Gemini rate limit | Falls back to Groq |
| All APIs unavailable | Falls back to local PDF extraction |
| Complete failure | Returns `requires_human: true` |
| File too large | Returns error (max 10MB) |
| Invalid file type | Returns error (PDF/DOCX/images only) |

## 🔧 CLI Options

```
python main.py --help

Options:
  --resume, -r    Path to resume file (PDF, DOCX, PNG, JPG)
  --jd, -j        Path to job description file
  --jd-text       Inline job description text
  --output, -o    Output file path (default: stdout)
  --verbose, -v   Show detailed intermediate analysis
  --pretty        Pretty-print JSON output (default: true)
```

## 🧪 Testing Fallback Behavior

### Test Groq Fallback (disable Gemini):
```bash
# In .env, rename:
DISABLED_GOOGLE_API_KEY=your_key

# Run - should use Groq
python main.py --resume resume.pdf --jd job.txt
```

### Test Manual Review (disable all):
```bash
# In .env, rename both:
DISABLED_GOOGLE_API_KEY=your_gemini_key
DISABLED_GROQ_API_KEY=your_groq_key

# Run - should return requires_human: true
python main.py --resume resume.pdf --jd job.txt
```

## 📦 Tech Stack

| Component | Technology |
|-----------|------------|
| AI Framework | LangChain, LangGraph |
| LLM Providers | Google Gemini, Groq (Llama 3.3) |
| File Parsing | Gemini Multimodal, pdfplumber, python-docx |
| Backend | FastAPI, Uvicorn |
| Frontend | React, Vite, Framer Motion |
| Styling | Custom CSS (dark theme) |

## 🔑 API Keys

### Google Gemini (Required)
1. Go to https://aistudio.google.com/app/apikey
2. Create a new API key
3. Add to `.env` as `GOOGLE_API_KEY`

### Groq (Optional - Fallback)
1. Go to https://console.groq.com/keys
2. Create a new API key
3. Add to `.env` as `GROQ_API_KEY`

## 📚 Additional Documentation

- **[DEVELOPMENT_NOTES.md](./DEVELOPMENT_NOTES.md)** - AI prompts used, manual vs AI-generated code breakdown, and future improvements roadmap

---

## 📝 License

MIT License - feel free to use for personal or commercial projects.

---

*Built with LangChain + LangGraph + Google Gemini*