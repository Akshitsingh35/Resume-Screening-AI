"""
llm.py - LLM Initialization with Multi-Provider Fallback
Supports: Google Gemini (primary) → Groq (fallback) → Manual Review
"""

import os
import time
from pathlib import Path
from typing import Optional, Union

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

try:
    from langchain_groq import ChatGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    ChatGroq = None


def load_environment() -> None:
    """Load environment variables from .env file."""
    current_dir = Path(__file__).parent
    env_file = current_dir / ".env"
    
    if env_file.exists():
        load_dotenv(env_file)
    else:
        parent_env = current_dir.parent / ".env"
        if parent_env.exists():
            load_dotenv(parent_env)
        else:
            load_dotenv()



# LLM Provider Classes


class LLMProvider:
    """Base class for LLM providers."""
    
    def __init__(self):
        load_environment()
    
    def is_available(self) -> bool:
        """Check if this provider is configured and available."""
        raise NotImplementedError
    
    def get_llm(self, temperature: float = 0.1):
        """Get the LLM instance."""
        raise NotImplementedError
    
    @property
    def name(self) -> str:
        """Provider name for logging."""
        raise NotImplementedError


class GeminiProvider(LLMProvider):
    """Google Gemini LLM provider."""
    
    MODELS = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
    ]
    
    def __init__(self, model_index: int = 0):
        super().__init__()
        self.model_index = model_index
    
    @property
    def name(self) -> str:
        return f"Gemini ({self.MODELS[self.model_index]})"
    
    @property
    def model(self) -> str:
        return self.MODELS[self.model_index]
    
    def is_available(self) -> bool:
        api_key = os.getenv("GOOGLE_API_KEY")
        return bool(api_key)
    
    def get_llm(self, temperature: float = 0.1) -> ChatGoogleGenerativeAI:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not set")
        
        return ChatGoogleGenerativeAI(
            model=self.model,
            temperature=temperature,
            google_api_key=api_key,
        )


class GroqProvider(LLMProvider):
    """Groq LLM provider (Llama 3.3)."""
    
    MODEL = "llama-3.3-70b-versatile"
    
    @property
    def name(self) -> str:
        return f"Groq ({self.MODEL})"
    
    def is_available(self) -> bool:
        if not GROQ_AVAILABLE:
            return False
        api_key = os.getenv("GROQ_API_KEY")
        return bool(api_key)
    
    def get_llm(self, temperature: float = 0.1):
        if not GROQ_AVAILABLE:
            raise ImportError("langchain-groq not installed")
        
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set")
        
        return ChatGroq(
            model=self.MODEL,
            temperature=temperature,
            api_key=api_key,
        )



# Fallback Chain


class LLMFallbackChain:
    """
    Multi-provider LLM fallback chain.
    
    Tries providers in order:
    1. Gemini (primary model)
    2. Gemini (fallback models)
    3. Groq (if configured)
    4. Raises error for manual review
    """
    
    def __init__(self, temperature: float = 0.1):
        self.temperature = temperature
        self.providers = self._build_provider_chain()
        self.last_provider_used: Optional[str] = None
        self.last_error: Optional[str] = None
    
    def _build_provider_chain(self) -> list:
        """Build the ordered list of providers to try."""
        providers = []
        
        # Add Gemini providers (try different models)
        for i in range(len(GeminiProvider.MODELS)):
            provider = GeminiProvider(model_index=i)
            if provider.is_available():
                providers.append(provider)
        
        # Add Groq as fallback
        groq = GroqProvider()
        if groq.is_available():
            providers.append(groq)
        
        return providers
    
    def get_llm(self):
        """
        Get an LLM instance, trying providers in order.
        
        Returns:
            LLM instance from the first available provider
            
        Raises:
            RuntimeError: If all providers fail
        """
        errors = []
        
        for provider in self.providers:
            try:
                llm = provider.get_llm(self.temperature)
                self.last_provider_used = provider.name
                return llm
            except Exception as e:
                errors.append(f"{provider.name}: {str(e)}")
                continue
        
        # All providers failed
        self.last_error = "; ".join(errors)
        raise RuntimeError(
            f"All LLM providers failed. Errors: {self.last_error}\n"
            "Please check your API keys in .env file:\n"
            "  GOOGLE_API_KEY=your_gemini_key\n"
            "  GROQ_API_KEY=your_groq_key (optional fallback)"
        )
    
    def invoke_with_fallback(self, chain_builder, inputs: dict, max_retries: int = 2):
        """
        Invoke a chain with automatic fallback on failure.
        
        Args:
            chain_builder: Function that takes (llm) and returns a chain
            inputs: Input dict for the chain
            max_retries: Max retries per provider
            
        Returns:
            Chain result
            
        Raises:
            RuntimeError: If all providers and retries fail
        """
        errors = []
        
        for provider in self.providers:
            for attempt in range(max_retries):
                try:
                    llm = provider.get_llm(self.temperature)
                    chain = chain_builder(llm)
                    result = chain.invoke(inputs)
                    self.last_provider_used = provider.name
                    return result
                    
                except Exception as e:
                    error_str = str(e).lower()
                    error_msg = f"{provider.name} (attempt {attempt + 1}): {str(e)[:100]}"
                    errors.append(error_msg)
                    
                    # Check error type for quick decision
                    if "quota" in error_str or "exceeded" in error_str:
                        # Quota exhausted - skip ALL Gemini models immediately
                        print(f"   ⚠️ Quota exceeded, skipping to Groq...")
                        # Skip remaining Gemini providers
                        break
                    elif "429" in str(e) or "rate" in error_str:
                        # Rate limit - brief wait, then try next provider
                        print(f"   ⏳ Rate limited, trying next provider...")
                        time.sleep(1)
                        break  # Move to next provider immediately
                    else:
                        # Other error - small delay then retry
                        time.sleep(1)
        
        # All providers failed
        self.last_error = "; ".join(errors[-3:])  # Keep last 3 errors
        raise RuntimeError(f"All LLM providers failed: {self.last_error}")



# Convenience Functions (Backward Compatible)


def get_llm(
    model: str = "gemini-2.5-flash",
    temperature: float = 0.1,
    provider: str = "gemini"
) -> Union[ChatGoogleGenerativeAI, "ChatGroq"]:
    """
    Get an LLM instance from the specified provider.
    
    Args:
        model: Model name to use
        temperature: Temperature for generation
        provider: "gemini" or "groq"
    
    For automatic fallback, use LLMFallbackChain instead.
    """
    load_environment()
    
    if provider == "groq":
        if not GROQ_AVAILABLE:
            raise ValueError("langchain-groq is not installed. Run: pip install langchain-groq")
        
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY environment variable is not set.\n"
                "Please add to your .env file:\n"
                "  GROQ_API_KEY=your_api_key_here\n\n"
                "Get your key from: https://console.groq.com/keys"
            )
        
        return ChatGroq(
            model=model,
            temperature=temperature,
            groq_api_key=api_key,
        )
    else:
        # Default: Gemini
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError(
                "GOOGLE_API_KEY environment variable is not set.\n"
                "Please create a .env file with your API key:\n"
                "  GOOGLE_API_KEY=your_api_key_here\n\n"
                "Get your key from: https://aistudio.google.com/app/apikey"
            )
        
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            google_api_key=api_key,
        )


def get_default_llm() -> ChatGoogleGenerativeAI:
    """Get the default LLM instance."""
    return get_llm()


def get_fallback_chain(temperature: float = 0.1) -> LLMFallbackChain:
    """Get an LLM fallback chain for robust API calls."""
    return LLMFallbackChain(temperature=temperature)



# Manual Review Response (When All APIs Fail)


def get_manual_review_response(error_message: str = "") -> dict:
    """
    Return a manual review response when all LLM providers fail.
    
    This is the graceful degradation response.
    """
    # Clean up error message for display
    clean_error = error_message[:300] if error_message else "All LLM providers unavailable"
    
    # Determine specific reason
    if "GOOGLE_API_KEY" in error_message and "GROQ_API_KEY" in error_message:
        reason = "Both Gemini and Groq API keys are not configured."
    elif "GOOGLE_API_KEY" in error_message:
        reason = "Gemini API key not configured and Groq fallback unavailable."
    elif "quota" in error_message.lower() or "rate" in error_message.lower():
        reason = "API rate limits exceeded on all providers."
    elif "GROQ_API_KEY" in error_message:
        reason = "Groq API key not configured (Gemini may have failed)."
    else:
        reason = "LLM providers failed to respond."
    
    return {
        "match_score": 0.0,
        "recommendation": "Manual review required",
        "requires_human": True,
        "confidence": 0.0,
        "reasoning_summary": (
            f"Unable to process automatically. {reason} "
            f"Please review this resume manually."
        ),
        "error": clean_error,
        "error_reason": reason,
        "matching_skills": [],
        "missing_skills": [],
    }
