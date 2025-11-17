"""
LangChain LLM Router for ManagePetro

This module provides a unified interface to dynamically select between
different AI providers (OpenAI, Anthropic, Google Gemini)
based on the 'llm_model' string passed from the API request.

Example:
    "openai:gpt-4o-mini"
    "anthropic:claude-3-5-sonnet-latest"
    "google:gemini-1.5-pro"
    "gemini-2.5-flash"  # defaults to Google (from constants.DEFAULT_LLM_MODEL)
"""

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_core.language_models.chat_models import BaseChatModel
from config import config


def resolve_model(model_id: str) -> tuple[str, str]:
    """
    Splits a model string into (provider, model_name).
    Accepts both ":" and "/" separators.
    """
    for sep in (":", "/"):
        if sep in model_id:
            provider, name = model_id.split(sep, 1)
            return provider.lower().strip(), name.strip()

    # Default fallback: treat un-prefixed names as Google Gemini
    return "google", model_id.strip()


def get_chat_model(model_id: str, temperature: float = 0.3) -> BaseChatModel:
    """
    Returns a LangChain ChatModel instance for the given provider and model name.
    """
    provider, name = resolve_model(model_id)

    if provider == "openai":
        return ChatOpenAI(
            model=name,
            temperature=temperature,
            api_key=config.OPENAI_API_KEY,
        )

    elif provider == "anthropic":
        return ChatAnthropic(
            model=name,
            temperature=temperature,
            api_key=config.ANTHROPIC_API_KEY,
        )

    elif provider == "google":
        return ChatGoogleGenerativeAI(
            model=name,
            temperature=temperature,
            api_key=config.GEMINI_API_KEY,
        )

    elif provider == "groq":
        return ChatGroq(
            model=name,
            temperature=temperature,
            api_key=config.GROQ_API_KEY,
        )

    else:
        raise ValueError(
            f"Unknown provider '{provider}'. "
            f"Valid prefixes: 'openai', 'anthropic', 'google', 'groq'."
        )
