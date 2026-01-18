"""
prompts.py - Prompt templates for resume screening agents.
"""

from langchain_core.prompts import PromptTemplate

from .output_parsers import (
    get_resume_parser,
    get_jd_parser,
    get_matching_parser,
)

RESUME_ANALYZER_TEMPLATE = """You are an expert HR analyst specializing in resume parsing and candidate evaluation.

Analyze the following resume text and extract key information in a structured format.

RESUME TEXT:
---
{resume_text}
---

INSTRUCTIONS:
1. Carefully read through the ENTIRE resume from start to finish
2. Extract ALL skills mentioned ANYWHERE in the resume, including:
   - Dedicated "Skills" sections
   - Skills mentioned in work experience descriptions (e.g., "Built APIs using Python and FastAPI")
   - Skills mentioned in project descriptions
   - Skills mentioned in education or certifications
   - Both technical skills (programming languages, tools, frameworks) AND soft skills (leadership, communication)
3. Identify ALL work experiences with:
   - Company name
   - Job title/role
   - Duration (start and end dates)
   - Key responsibilities and achievements
   - Technologies/tools used in each role
4. Note ALL educational qualifications (degrees, certifications, courses)
5. List ALL specific technologies, tools, platforms, and frameworks mentioned throughout
6. Estimate total years of professional experience based on work history
7. Provide a brief 2-3 sentence summary of the candidate's overall profile

IMPORTANT: Be thorough! Scan every section of the resume. Skills are often hidden in job descriptions, not just in a "Skills" section. If a candidate says they "developed microservices using Go", extract "Go" and "microservices" as skills.

{format_instructions}
"""


def get_resume_analyzer_prompt() -> PromptTemplate:
    """
    Create the prompt template for resume analysis.
    
    Returns:
        PromptTemplate configured with resume parser format instructions
    """
    parser = get_resume_parser()
    
    return PromptTemplate(
        input_variables=["resume_text"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
        template=RESUME_ANALYZER_TEMPLATE,
    )



# Job Description Analyzer Agent Prompt


JD_ANALYZER_TEMPLATE = """You are an expert HR analyst specializing in job requirement analysis.

Analyze the following job description and extract the key requirements in a structured format.

JOB DESCRIPTION:
---
{job_description}
---

INSTRUCTIONS:
1. Identify all required and preferred skills (technical and soft)
2. Determine the experience level required (entry, mid, senior, etc.)
3. Identify the role type and employment details
4. List specific technologies and tools required
5. Note educational requirements
6. Extract key responsibilities of the role

Be precise in distinguishing between "required" and "preferred" qualifications. Include both in the skills list but focus on requirements.

{format_instructions}
"""


def get_jd_analyzer_prompt() -> PromptTemplate:
    """
    Create the prompt template for job description analysis.
    
    Returns:
        PromptTemplate configured with JD parser format instructions
    """
    parser = get_jd_parser()
    
    return PromptTemplate(
        input_variables=["job_description"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
        template=JD_ANALYZER_TEMPLATE,
    )



# Matching/Decision Agent Prompt


MATCHING_TEMPLATE = """You are a senior hiring manager making candidate screening decisions.

You have been provided with:
1. A structured analysis of a candidate's resume
2. A structured analysis of a job description

Your task is to determine how well the candidate matches the job requirements and provide a recommendation.

CANDIDATE RESUME ANALYSIS:
---
{resume_analysis}
---

JOB REQUIREMENTS ANALYSIS:
---
{jd_analysis}
---

DECISION CRITERIA:
- match_score >= 0.8 AND all critical skills present → "Proceed to interview"
- match_score < 0.5 OR missing critical skills → "Reject"
- match_score between 0.5-0.8 OR unclear fit → "Needs manual review"

Set requires_human to true if:
- The match is borderline (score between 0.5-0.7)
- There are unusual circumstances (career change, gaps, overqualified)
- Key information is missing from the resume
- The confidence score is below 0.7

SCORING GUIDELINES:
- Skills match: Weight technical skills heavily (50% of score)
- Experience level: Must be within one level of requirement (25% of score)  
- Education: Consider if requirements are strict or flexible (15% of score)
- Technologies: Specific tool match vs. transferable skills (10% of score)

Provide a balanced, fair assessment. Avoid bias based on formatting or writing style.
Focus on qualifications and demonstrated abilities.

{format_instructions}
"""


def get_matching_prompt() -> PromptTemplate:
    """
    Create the prompt template for matching/decision making.
    
    Returns:
        PromptTemplate configured with matching parser format instructions
    """
    parser = get_matching_parser()
    
    return PromptTemplate(
        input_variables=["resume_analysis", "jd_analysis"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
        template=MATCHING_TEMPLATE,
    )
