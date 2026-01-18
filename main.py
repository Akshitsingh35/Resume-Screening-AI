#!/usr/bin/env python3
"""
main.py - Resume Screening AI CLI
Usage: python main.py --resume resume.pdf --jd job_description.txt
"""

import argparse
import json
import sys
from pathlib import Path

from core import extract_text, read_job_description, run_langgraph_pipeline, get_manual_review_response


def parse_arguments() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="AI-powered resume screening system using LangChain and Gemini",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage with file inputs
  python main.py --resume resume.pdf --jd job_description.txt
  
  # With inline job description
  python main.py --resume resume.docx --jd-text "We are looking for a Python developer..."
  
  # Save output to file with verbose mode
  python main.py --resume resume.pdf --jd job.txt --output result.json --verbose
  
  # Show detailed analysis
  python main.py --resume resume.pdf --jd job.txt --verbose
        """
    )
    
    # Required arguments
    parser.add_argument(
        "--resume", "-r",
        type=str,
        required=True,
        help="Path to the resume file (PDF, DOCX, or image)"
    )
    
    # Job description - either file or inline text
    jd_group = parser.add_mutually_exclusive_group(required=True)
    jd_group.add_argument(
        "--jd", "-j",
        type=str,
        help="Path to the job description text file"
    )
    jd_group.add_argument(
        "--jd-text",
        type=str,
        help="Job description as inline text (alternative to --jd)"
    )
    
    # Optional arguments
    parser.add_argument(
        "--output", "-o",
        type=str,
        help="Path to save the JSON output (optional, defaults to stdout)"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output with intermediate analysis results"
    )
    
    parser.add_argument(
        "--pretty",
        action="store_true",
        default=True,
        help="Pretty-print JSON output (default: True)"
    )
    
    return parser.parse_args()


def validate_inputs(args: argparse.Namespace) -> tuple:
    """
    Validate and load input files.
    
    Args:
        args: Parsed command-line arguments
        
    Returns:
        Tuple of (resume_text, job_description_text) on success
        Tuple of (None, None, manual_review_response) on API failure
        
    Raises:
        SystemExit: If validation fails due to file errors
    """
    # Check resume file exists
    resume_path = Path(args.resume)
    if not resume_path.exists():
        print(f"❌ Error: Resume file not found: {args.resume}", file=sys.stderr)
        sys.exit(1)
    
    # Check resume file type (now supports images too since Gemini is multimodal)
    supported_formats = [".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg"]
    if resume_path.suffix.lower() not in supported_formats:
        print(
            f"❌ Error: Unsupported resume format: {resume_path.suffix}\n"
            f"   Supported formats: {', '.join(supported_formats)}",
            file=sys.stderr
        )
        sys.exit(1)
    
    # Extract resume text using AI (File Parser Agent)
    try:
        print(f"📄 Parsing resume with AI: {args.resume}")
        print("   🤖 Agent 1: File Parser (Gemini Multimodal)")
        resume_text = extract_text(args.resume)
        
        # Validate extracted text is not empty or too short
        if not resume_text or len(resume_text.strip()) < 50:
            print("   ⚠️ Extracted text is too short or empty", file=sys.stderr)
            return None, None, get_manual_review_response(
                "Resume text extraction returned empty or very short content. "
                "The file may be corrupted, password-protected, or contain only images."
            )
        
        print(f"   ✓ Extracted {len(resume_text)} characters")
    except Exception as e:
        error_msg = str(e)
        print(f"   ⚠️ File parsing failed: {error_msg[:100]}", file=sys.stderr)
        
        # Check if it's a rate limit / API exhaustion error
        if "rate" in error_msg.lower() or "quota" in error_msg.lower() or "429" in error_msg:
            print("   📋 All API quotas exhausted. Returning manual review response.")
            return None, None, get_manual_review_response(
                f"File parsing failed due to API rate limits. Please try again later or review manually. "
                f"Error: {error_msg[:150]}"
            )
        elif "corrupted" in error_msg.lower() or "invalid" in error_msg.lower():
            return None, None, get_manual_review_response(
                f"Resume file appears to be corrupted or invalid. Error: {error_msg[:150]}"
            )
        else:
            print(f"❌ Error reading resume: {error_msg}", file=sys.stderr)
            sys.exit(1)
    
    # Get job description
    if args.jd:
        jd_path = Path(args.jd)
        if not jd_path.exists():
            print(f"❌ Error: Job description file not found: {args.jd}", file=sys.stderr)
            sys.exit(1)
        
        try:
            print(f"📋 Reading job description: {args.jd}")
            job_description = read_job_description(args.jd)
            print(f"   ✓ Read {len(job_description)} characters")
        except Exception as e:
            print(f"❌ Error reading job description: {str(e)}", file=sys.stderr)
            sys.exit(1)
    else:
        job_description = args.jd_text
        print(f"📋 Using inline job description ({len(job_description)} characters)")
    
    # Validate job description is not empty or too short
    if not job_description or len(job_description.strip()) < 20:
        print("❌ Error: Job description is too short (minimum 20 characters)", file=sys.stderr)
        sys.exit(1)
    
    return resume_text, job_description


def format_output(result: dict, pretty: bool = True) -> str:
    """
    Format the result dictionary as JSON string.
    
    Args:
        result: The matching result dictionary
        pretty: Whether to pretty-print with indentation
        
    Returns:
        JSON string
    """
    if pretty:
        return json.dumps(result, indent=2, ensure_ascii=False)
    return json.dumps(result, ensure_ascii=False)


def display_summary(result: dict) -> None:
    """
    Display a human-readable summary of the results.
    
    Args:
        result: The matching result dictionary
    """
    print("\n" + "=" * 60)
    print("📊 SCREENING RESULT SUMMARY")
    print("=" * 60)
    
    # Color-code the recommendation
    recommendation = result.get("recommendation", "Unknown")
    score = result.get("match_score") or 0  # Handle None
    confidence = result.get("confidence") or 0  # Handle None
    
    if recommendation == "Proceed to interview":
        rec_display = "✅ PROCEED TO INTERVIEW"
    elif recommendation == "Reject":
        rec_display = "❌ REJECT"
    else:
        rec_display = "⚠️  NEEDS MANUAL REVIEW"
    
    print(f"\n  Recommendation: {rec_display}")
    print(f"  Match Score:    {score:.1%}")
    print(f"  Confidence:     {confidence:.1%}")
    print(f"  Human Review:   {'Yes' if result.get('requires_human') else 'No'}")
    
    # Show error reason if manual review required
    if result.get("requires_human") and result.get("error_reason"):
        print(f"\n  ⚠️  Error Reason:")
        print(f"    {result.get('error_reason')}")
    
    print(f"\n  Reasoning:")
    reasoning = result.get("reasoning_summary", "No reasoning provided")
    # Word wrap the reasoning
    words = reasoning.split()
    line = "    "
    for word in words:
        if len(line) + len(word) > 60:
            print(line)
            line = "    " + word + " "
        else:
            line += word + " "
    if line.strip():
        print(line)
    
    # Show technical error details if present (for debugging)
    if result.get("error"):
        print(f"\n  Technical Details:")
        error_text = result.get("error", "")[:150]
        print(f"    {error_text}...")
    
    print("\n" + "=" * 60)


def main() -> int:
    """
    Main entry point for the resume screening CLI.
    
    Returns:
        Exit code (0 for success, non-zero for errors)
    """
    args = parse_arguments()
    
    print("\n🤖 Resume Screening AI")
    print("   Powered by LangChain + Google Gemini\n")
    
    # Validate and load inputs
    validation_result = validate_inputs(args)
    
    # Check if validation returned a manual review response (3 values)
    if len(validation_result) == 3:
        # API failure during file parsing - manual review needed
        _, _, result = validation_result
        print("\n⚠️  System could not process the request automatically.")
    else:
        # Normal case - proceed with pipeline
        resume_text, job_description = validation_result
        
        # Run the screening pipeline using LangGraph
        try:
            result = run_langgraph_pipeline(
                resume_text=resume_text,
                job_description=job_description,
                verbose=args.verbose
            )
        except ValueError as e:
            print(f"\n❌ Pipeline error: {str(e)}", file=sys.stderr)
            return 1
        except Exception as e:
            print(f"\n❌ Unexpected error: {str(e)}", file=sys.stderr)
            return 1
    
    # Display summary
    display_summary(result)
    
    # Format output
    json_output = format_output(result, pretty=args.pretty)
    
    # Save or print output
    if args.output:
        output_path = Path(args.output)
        try:
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(json_output)
            print(f"\n💾 Results saved to: {args.output}")
        except Exception as e:
            print(f"\n❌ Error saving output: {str(e)}", file=sys.stderr)
            return 1
    else:
        print("\n📤 JSON Output:")
        print(json_output)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
