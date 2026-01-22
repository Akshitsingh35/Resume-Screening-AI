"""
api.py - FastAPI Backend for Resume Screening
Usage: uvicorn backend.api:app --reload --port 8000
"""

import os
import sys
import tempfile
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

sys.path.insert(0, str(Path(__file__).parent.parent))

from core import extract_text, run_langgraph_pipeline, get_manual_review_response

app = FastAPI(
    title="Resume Screening AI",
    description="AI-powered resume screening using LangChain + Gemini",
    version="1.0.0",
)

# CORS - allow frontend to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Configuration
# =============================================================================

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg"}


# =============================================================================
# API Endpoints
# =============================================================================

@app.get("/")
async def root():
    """API root - redirect to docs or return info."""
    return {
        "message": "Resume Screening AI API",
        "docs": "/docs",
        "endpoints": {
            "screen": "POST /api/screen - Upload resume and JD",
            "health": "GET /health - Health check"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "resume-screening-ai"}


@app.post("/api/screen")
async def screen_resume(
    resume: UploadFile = File(..., description="Resume file (PDF, DOCX, or image)"),
    job_description: str = Form(..., description="Job description text"),
    verbose: bool = Form(default=False, description="Include detailed analysis")
):
    """
    Screen a resume against a job description.
    
    - **resume**: Upload PDF, DOCX, or image file
    - **job_description**: Plain text job description
    - **verbose**: If true, includes intermediate analysis
    
    Returns JSON with match_score, recommendation, confidence, etc.
    """
    
    # Validate file extension
    file_ext = Path(resume.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {file_ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Validate file size
    contents = await resume.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)} MB"
        )
    
    # Validate job description
    if not job_description or len(job_description.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Job description is too short (minimum 20 characters)"
        )
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        tmp_file.write(contents)
        tmp_path = tmp_file.name
    
    try:
        # Extract text from resume
        try:
            resume_text = extract_text(tmp_path)
            
            if not resume_text or len(resume_text.strip()) < 50:
                return JSONResponse(
                    status_code=200,
                    content=get_manual_review_response(
                        "Resume text extraction returned empty or very short content."
                    )
                )
        except Exception as e:
            error_msg = str(e)
            if "rate" in error_msg.lower() or "quota" in error_msg.lower():
                return JSONResponse(
                    status_code=200,
                    content=get_manual_review_response(f"API rate limit: {error_msg[:100]}")
                )
            raise HTTPException(status_code=500, detail=f"Failed to parse resume: {error_msg[:200]}")
        
        # Run the screening pipeline
        result = run_langgraph_pipeline(
            resume_text=resume_text,
            job_description=job_description,
            verbose=verbose
        )
        
        return JSONResponse(status_code=200, content=result)
        
    finally:
        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except:
            pass


@app.post("/api/screen-text")
async def screen_resume_text(
    resume_text: str = Form(..., description="Resume text content"),
    job_description: str = Form(..., description="Job description text"),
    verbose: bool = Form(default=False, description="Include detailed analysis")
):
    """
    Screen a resume (as text) against a job description.
    
    Use this if you already have the resume text extracted.
    """
    
    # Validate inputs
    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Resume text is too short (minimum 50 characters)"
        )
    
    if not job_description or len(job_description.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Job description is too short (minimum 20 characters)"
        )
    
    # Run the screening pipeline
    result = run_langgraph_pipeline(
        resume_text=resume_text,
        job_description=job_description,
        verbose=verbose
    )
    
    return JSONResponse(status_code=200, content=result)


# =============================================================================
# Run with: uvicorn backend.api:app --reload --port 8000
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
