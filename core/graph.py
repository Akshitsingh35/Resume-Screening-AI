"""
graph.py - LangGraph Multi-Agent Workflow

Defines the resume screening pipeline using LangGraph StateGraph.
Architecture: START -> resume_analyzer -> jd_analyzer -> matching_agent -> END
"""

import json
import time
from typing import TypedDict, List

from langgraph.graph import StateGraph, START, END

from .llm import get_fallback_chain, get_manual_review_response
from .prompts import (
    get_resume_analyzer_prompt,
    get_jd_analyzer_prompt,
    get_matching_prompt,
)
from .output_parsers import (
    get_resume_parser,
    get_jd_parser,
    get_matching_parser,
)


class ResumeScreeningState(TypedDict):
    """State that flows through the LangGraph pipeline."""
    resume_text: str
    job_description: str
    resume_analysis: dict
    jd_analysis: dict
    matching_result: dict
    final_output: dict
    errors: List[str]
    current_agent: str


def resume_analyzer_node(state: ResumeScreeningState) -> ResumeScreeningState:
    """Agent 2: Analyzes resume and extracts structured information."""
    print("   🤖 Agent 2: Resume Analyzer")
    
    try:
        fallback = get_fallback_chain()
        prompt = get_resume_analyzer_prompt()
        parser = get_resume_parser()
        
        def build_chain(llm):
            return prompt | llm | parser
        
        result = fallback.invoke_with_fallback(
            build_chain,
            {"resume_text": state["resume_text"]}
        )
        
        return {
            **state,
            "resume_analysis": result,
            "current_agent": "resume_analyzer",
        }
    except json.JSONDecodeError as e:
        error_msg = f"Resume Analyzer Error: LLM returned invalid JSON - {str(e)[:50]}"
        print(f"      ⚠️ {error_msg[:80]}")
        return {
            **state,
            "errors": state.get("errors", []) + [error_msg],
            "current_agent": "resume_analyzer",
        }
    except Exception as e:
        error_msg = f"Resume Analyzer Error: {str(e)[:100]}"
        print(f"      ⚠️ {error_msg[:80]}")
        return {
            **state,
            "errors": state.get("errors", []) + [error_msg],
            "current_agent": "resume_analyzer",
        }


def jd_analyzer_node(state: ResumeScreeningState) -> ResumeScreeningState:
    """
    Agent 3: Job Description Analyzer Node
    
    Analyzes the job description and extracts requirements.
    Uses fallback chain for API resilience.
    """
    print("   🤖 Agent 3: JD Analyzer (LangGraph Node)")
    
    try:
        fallback = get_fallback_chain()
        prompt = get_jd_analyzer_prompt()
        parser = get_jd_parser()
        
        def build_chain(llm):
            return prompt | llm | parser
        
        result = fallback.invoke_with_fallback(
            build_chain,
            {"job_description": state["job_description"]}
        )
        
        if fallback.last_provider_used:
            print(f"      ✓ Using {fallback.last_provider_used}")
        
        return {
            **state,
            "jd_analysis": result,
            "current_agent": "jd_analyzer",
        }
    except json.JSONDecodeError as e:
        error_msg = f"JD Analyzer Error: LLM returned invalid JSON - {str(e)[:50]}"
        print(f"      ⚠️ {error_msg[:80]}")
        return {
            **state,
            "errors": state.get("errors", []) + [error_msg],
            "current_agent": "jd_analyzer",
        }
    except Exception as e:
        error_msg = f"JD Analyzer Error: {str(e)[:100]}"
        print(f"      ⚠️ {error_msg[:80]}")
        return {
            **state,
            "errors": state.get("errors", []) + [error_msg],
            "current_agent": "jd_analyzer",
        }


def matching_agent_node(state: ResumeScreeningState) -> ResumeScreeningState:
    """
    Agent 4: Matching Agent Node
    
    Compares resume analysis with job requirements and produces recommendation.
    Uses fallback chain for API resilience.
    """
    print("   🤖 Agent 4: Matching Agent (LangGraph Node)")
    
    # Check if previous agents failed - return manual review
    if state.get("errors"):
        error_summary = "; ".join(state['errors'][:3])
        print("      ⚠️ Previous agents had errors, returning manual review")
        manual_response = get_manual_review_response(
            f"Agent pipeline errors: {error_summary}"
        )
        return {
            **state,
            "matching_result": manual_response,
            "final_output": manual_response,
            "current_agent": "matching_agent",
        }
    
    try:
        fallback = get_fallback_chain()
        prompt = get_matching_prompt()
        parser = get_matching_parser()
        
        # Convert analyses to JSON strings for the prompt
        resume_json = json.dumps(state["resume_analysis"], indent=2)
        jd_json = json.dumps(state["jd_analysis"], indent=2)
        
        def build_chain(llm):
            return prompt | llm | parser
        
        result = fallback.invoke_with_fallback(
            build_chain,
            {"resume_analysis": resume_json, "jd_analysis": jd_json}
        )
        
        if fallback.last_provider_used:
            print(f"      ✓ Using {fallback.last_provider_used}")
        
        # Ensure proper types
        if isinstance(result.get("match_score"), str):
            result["match_score"] = float(result["match_score"])
        if isinstance(result.get("confidence"), str):
            result["confidence"] = float(result["confidence"])
        if isinstance(result.get("requires_human"), str):
            result["requires_human"] = result["requires_human"].lower() == "true"
        
        # Build final output
        final_output = {
            "match_score": result.get("match_score"),
            "recommendation": result.get("recommendation"),
            "requires_human": result.get("requires_human"),
            "confidence": result.get("confidence"),
            "reasoning_summary": result.get("reasoning_summary"),
        }
        
        return {
            **state,
            "matching_result": result,
            "final_output": final_output,
            "current_agent": "matching_agent",
        }
    except json.JSONDecodeError as e:
        error_msg = f"Matching Agent Error: LLM returned invalid JSON - {str(e)[:50]}"
        print(f"      ⚠️ {error_msg[:80]}")
        manual_response = get_manual_review_response(error_msg)
        return {
            **state,
            "errors": state.get("errors", []) + [error_msg],
            "matching_result": manual_response,
            "final_output": manual_response,
            "current_agent": "matching_agent",
        }
    except Exception as e:
        error_msg = f"Matching Agent Error: {str(e)[:100]}"
        print(f"      ⚠️ {error_msg[:80]}")
        
        # Return manual review response on failure
        manual_response = get_manual_review_response(error_msg)
        return {
            **state,
            "errors": state.get("errors", []) + [error_msg],
            "matching_result": manual_response,
            "final_output": manual_response,
            "current_agent": "matching_agent",
        }





def build_resume_screening_graph() -> StateGraph:
    """
    Build the LangGraph StateGraph for resume screening.
    
    Graph Structure:
        START 
          │
          ▼
        resume_analyzer ──► jd_analyzer
                               │
                               ▼
                         matching_agent
                               │
                               ▼
                              END
    
    Returns:
        Compiled StateGraph ready to invoke
    """
    # Create the graph with our state schema
    graph = StateGraph(ResumeScreeningState)
    
    # Add nodes (agents)
    graph.add_node("resume_analyzer", resume_analyzer_node)
    graph.add_node("jd_analyzer", jd_analyzer_node)
    graph.add_node("matching_agent", matching_agent_node)
    
    # Add edges (workflow)
    graph.add_edge(START, "resume_analyzer")
    graph.add_edge("resume_analyzer", "jd_analyzer")
    graph.add_edge("jd_analyzer", "matching_agent")
    graph.add_edge("matching_agent", END)
    
    # Compile the graph
    compiled_graph = graph.compile()
    
    return compiled_graph





def run_langgraph_pipeline(
    resume_text: str,
    job_description: str,
    verbose: bool = False
) -> dict:
    """
    Run the resume screening pipeline using LangGraph.
    
    Features:
    - Multi-provider fallback (Gemini → Groq)
    - Graceful degradation to manual review on failure
    - Detailed error reporting
    
    Args:
        resume_text: Raw text extracted from resume
        job_description: Raw text of job description
        verbose: If True, include detailed analysis in output
        
    Returns:
        Final matching result dictionary (always returns, never throws)
    """
    # Build the graph
    graph = build_resume_screening_graph()
    
    # Initialize state
    initial_state: ResumeScreeningState = {
        "resume_text": resume_text,
        "job_description": job_description,
        "resume_analysis": {},
        "jd_analysis": {},
        "matching_result": {},
        "final_output": {},
        "errors": [],
        "current_agent": "start",
    }
    
    # Run the graph with error handling
    print("\n🔄 Running LangGraph Pipeline (with fallback support)...")
    
    try:
        final_state = graph.invoke(initial_state)
    except Exception as e:
        # Complete graph failure - return manual review
        print(f"   ⚠️ Pipeline failed: {str(e)[:80]}")
        return get_manual_review_response(f"Pipeline failed: {str(e)}")
    
    # Get output (may contain manual review if agents failed)
    output = final_state.get("final_output", {})
    
    # If no output, something went wrong - return manual review
    if not output:
        errors = final_state.get("errors", ["Unknown error"])
        return get_manual_review_response(f"No output generated. Errors: {errors}")
    
    # Log if there were errors but we still got output
    if final_state.get("errors"):
        print(f"   ⚠️ Pipeline had errors but produced output")
    
    # Add details if verbose
    if verbose:
        output["_details"] = {
            "resume_analysis": final_state.get("resume_analysis", {}),
            "jd_analysis": final_state.get("jd_analysis", {}),
            "full_matching_result": final_state.get("matching_result", {}),
            "errors": final_state.get("errors", []),
        }
    
    return output





def get_graph_diagram() -> str:
    """
    Get a Mermaid diagram of the graph structure.
    
    Returns:
        Mermaid diagram string
    """
    return """
    ```mermaid
    graph TD
        START([START]) --> A[Agent 2: Resume Analyzer]
        A --> B[Agent 3: JD Analyzer]
        B --> C[Agent 4: Matching Agent]
        C --> END([END])
        
        style A fill:#e1f5fe
        style B fill:#f3e5f5
        style C fill:#e8f5e9
    ```
    """
