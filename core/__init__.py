"""
Core AI Module - Resume Screening Agents

This package contains the LangGraph-based multi-agent system for resume screening.

Components:
- graph.py: LangGraph pipeline with 4 agents
- llm.py: LLM providers (Gemini + Groq fallback)
- file_utils.py: AI-powered file parsing
- prompts.py: Prompt templates
- output_parsers.py: Pydantic schemas for structured output
"""

from .graph import run_langgraph_pipeline
from .llm import get_llm, get_fallback_chain, get_manual_review_response
from .file_utils import extract_text, read_job_description

__all__ = [
    "run_langgraph_pipeline",
    "get_llm",
    "get_fallback_chain", 
    "get_manual_review_response",
    "extract_text",
    "read_job_description",
]
