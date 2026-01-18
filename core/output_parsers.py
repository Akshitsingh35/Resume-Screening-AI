"""
output_parsers.py - Pydantic models for structured LLM output.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_core.output_parsers import JsonOutputParser


class ResumeAnalysis(BaseModel):
    """Output schema for Resume Analyzer."""
    
    skills: List[str] = Field(
        description="List of technical and soft skills found in the resume"
    )
    experience: List[str] = Field(
        description="List of work experiences with company, role, duration, and responsibilities"
    )
    education: List[str] = Field(
        description="List of educational qualifications"
    )
    technologies: List[str] = Field(
        description="List of specific technologies, tools, and frameworks"
    )
    total_years_experience: float = Field(
        description="Estimated total years of professional experience"
    )
    summary: str = Field(
        description="Brief 2-3 sentence summary of the candidate"
    )


def get_resume_parser() -> JsonOutputParser:
    return JsonOutputParser(pydantic_object=ResumeAnalysis)


class JDAnalysis(BaseModel):
    """Output schema for JD Analyzer."""
    
    required_skills: List[str] = Field(
        description="List of skills required or preferred in the job"
    )
    experience_level: str = Field(
        description="Required experience level (Entry, Mid, Senior, Lead, etc.)"
    )
    role_type: str = Field(
        description="Type of role (Full-time, Part-time, Remote, etc.) and job title"
    )
    required_technologies: List[str] = Field(
        description="List of specific technologies required"
    )
    education_requirements: str = Field(
        description="Required or preferred educational qualifications"
    )
    key_responsibilities: List[str] = Field(
        description="Main responsibilities of the role"
    )


def get_jd_parser() -> JsonOutputParser:
    return JsonOutputParser(pydantic_object=JDAnalysis)


class MatchingResult(BaseModel):
    """Output schema for Matching Agent."""
    
    match_score: float = Field(
        description="Score from 0.0 to 1.0 indicating match quality"
    )
    recommendation: str = Field(
        description="One of: 'Proceed to interview', 'Reject', or 'Needs manual review'"
    )
    requires_human: bool = Field(
        description="Whether a human should review this application"
    )
    confidence: float = Field(
        description="Confidence score from 0.0 to 1.0"
    )
    reasoning_summary: str = Field(
        description="Human-readable explanation of the recommendation"
    )
    matching_skills: List[str] = Field(
        description="Skills from resume that match job requirements"
    )
    missing_skills: List[str] = Field(
        description="Required skills missing from the resume"
    )


def get_matching_parser() -> JsonOutputParser:
    return JsonOutputParser(pydantic_object=MatchingResult)
