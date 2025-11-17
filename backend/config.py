"""
Centralized configuration management for ManagePetro backend.

This module loads and validates all environment variables required by the application.
It provides clear error messages when required variables are missing and uses best
practices for Python environment variable management.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class ConfigurationError(Exception):
    """Raised when required environment variables are missing or invalid."""

    pass


class Config:
    """
    Centralized configuration for all environment variables.

    This class ensures all required environment variables are present at startup
    and provides a single source of truth for configuration values.
    """

    # API Keys
    WEATHER_API_KEY: str
    TOMTOM_API_KEY: str
    GEMINI_API_KEY: str

    # Database Configuration
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_USER: str
    DB_PASS: str
    
    # Database Connection Pooling (optional with defaults)
    DB_POOL_SIZE: int
    DB_MAX_OVERFLOW: int
    DB_POOL_RECYCLE: int
    DB_POOL_PRE_PING: bool
    DB_POOL_TIMEOUT: int

    # JWT Configuration
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int

    # Optional Configuration
    WEATHER_CITY: str
    LOG_LEVEL: str

    def __init__(self):
        """Initialize and validate all configuration from environment variables."""
        self._load_and_validate()

    def _load_and_validate(self):
        """Load all environment variables and validate required ones."""
        missing_vars = []

        # API Keys (Required)
        self.WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "").strip()
        if not self.WEATHER_API_KEY:
            missing_vars.append("WEATHER_API_KEY")

        self.TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY", "").strip()
        if not self.TOMTOM_API_KEY:
            missing_vars.append("TOMTOM_API_KEY")

        # Support both "gemenikey" (legacy) and "GEMINI_API_KEY" (standard)
        self.GEMINI_API_KEY = (
            os.getenv("GEMINI_API_KEY", "").strip()
            or os.getenv("gemenikey", "").strip()
        )
        if not self.GEMINI_API_KEY:
            missing_vars.append("GEMINI_API_KEY (or gemenikey)")
        
        # OpenAI (optional)
        self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
        
        # Anthropic (optional)
        self.ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
        
        # Groq (optional - free tier available)
        self.GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()

        # Database Configuration (Required)
        self.DB_HOST = os.getenv("DB_HOST", "").strip()
        if not self.DB_HOST:
            missing_vars.append("DB_HOST")

        db_port_str = os.getenv("DB_PORT", "").strip()
        if not db_port_str:
            missing_vars.append("DB_PORT")
        else:
            try:
                self.DB_PORT = int(db_port_str)
            except ValueError:
                raise ConfigurationError(
                    f"DB_PORT must be a valid integer, got: {db_port_str}"
                )

        self.DB_NAME = os.getenv("DB_NAME", "").strip()
        if not self.DB_NAME:
            missing_vars.append("DB_NAME")

        self.DB_USER = os.getenv("DB_USER", "").strip()
        if not self.DB_USER:
            missing_vars.append("DB_USER")

        self.DB_PASS = os.getenv("DB_PASS", "").strip()
        if not self.DB_PASS:
            missing_vars.append("DB_PASS")
        
        # Database Connection Pooling (Optional with smart defaults)
        # Use environment-specific defaults: smaller pools for dev, larger for production
        is_production = bool(os.getenv("DATABASE_URL"))
        
        # Pool size: number of connections maintained in the pool
        default_pool_size = 20 if is_production else 5
        try:
            self.DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", str(default_pool_size)).strip())
        except ValueError:
            raise ConfigurationError(
                f"DB_POOL_SIZE must be a valid integer, got: {os.getenv('DB_POOL_SIZE')}"
            )
        
        # Max overflow: additional connections beyond pool_size
        default_max_overflow = 30 if is_production else 10
        try:
            self.DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", str(default_max_overflow)).strip())
        except ValueError:
            raise ConfigurationError(
                f"DB_MAX_OVERFLOW must be a valid integer, got: {os.getenv('DB_MAX_OVERFLOW')}"
            )
        
        # Pool recycle: recycle connections older than this (in seconds)
        try:
            self.DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "3600").strip())
        except ValueError:
            raise ConfigurationError(
                f"DB_POOL_RECYCLE must be a valid integer, got: {os.getenv('DB_POOL_RECYCLE')}"
            )
        
        # Pool pre-ping: test connections before using them
        pre_ping_str = os.getenv("DB_POOL_PRE_PING", "True").strip().lower()
        self.DB_POOL_PRE_PING = pre_ping_str in ("true", "1", "yes", "on")
        
        # Pool timeout: how long to wait for a connection
        try:
            self.DB_POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30").strip())
        except ValueError:
            raise ConfigurationError(
                f"DB_POOL_TIMEOUT must be a valid integer, got: {os.getenv('DB_POOL_TIMEOUT')}"
            )

        # JWT Configuration (Required for security)
        self.JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "").strip()
        if not self.JWT_SECRET_KEY:
            missing_vars.append("JWT_SECRET_KEY")

        # JWT Configuration (Optional with secure defaults)
        self.JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256").strip()

        jwt_expire_str = os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30").strip()
        try:
            self.JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(jwt_expire_str)
        except ValueError:
            raise ConfigurationError(
                f"JWT_ACCESS_TOKEN_EXPIRE_MINUTES must be a valid integer, got: {jwt_expire_str}"
            )

        # Optional Configuration (with defaults)
        self.WEATHER_CITY = os.getenv("WEATHER_CITY", "Vancouver").strip()
        # Logging level for the application
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").strip().upper()
        # Default LLM model
        self.DEFAULT_LLM_MODEL = os.getenv("DEFAULT_LLM_MODEL", "gemini-2.5-flash").strip()
        
        # CORS Configuration
        # Support comma-separated list of allowed origins from environment
        # Falls back to localhost-only for local development if not specified
        cors_origins_env = os.getenv("CORS_ORIGINS", "").strip()
        if cors_origins_env:
            # Split by comma and strip whitespace from each origin
            self.CORS_ORIGINS = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
        else:
            # Default CORS origins: localhost only for local development
            # Production deployments MUST set CORS_ORIGINS environment variable explicitly
            self.CORS_ORIGINS = [
                "http://localhost:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
                "http://localhost:5173",  # Vite dev server
            ]
        
        # CORS Origin Regex Pattern (optional)
        # Supports regex patterns for dynamic URLs (e.g., Vercel preview deployments)
        # Example: r"https://.*\.vercel\.app" to allow all Vercel preview URLs
        self.CORS_ORIGIN_REGEX = os.getenv("CORS_ORIGIN_REGEX", "").strip() or None

        # If any required variables are missing, raise a clear error
        if missing_vars:
            error_message = self._format_error_message(missing_vars)
            raise ConfigurationError(error_message)

    def _format_error_message(self, missing_vars: list) -> str:
        """Format a helpful error message for missing environment variables."""
        vars_list = "\n  - ".join(missing_vars)
        return (
            f"\n{'='*70}\n"
            f"CONFIGURATION ERROR: Missing required environment variables\n"
            f"{'='*70}\n\n"
            f"The following required environment variables are not set:\n"
            f"  - {vars_list}\n\n"
            f"To fix this issue:\n"
            f"1. Create a .env file in the backend directory\n"
            f"2. Copy the contents from .env.example\n"
            f"3. Fill in your actual API keys and configuration values\n"
            f'4. Generate a secure JWT_SECRET_KEY (use: python -c "import secrets; print(secrets.token_urlsafe(32))")\n\n'
            f"Example .env file location:\n"
            f"  backend/.env\n\n"
            f"For more information, see backend/README.md\n"
            f"{'='*70}\n"
        )

    def get_db_config(self) -> dict:
        """
        Get database configuration as a dictionary suitable for mysql.connector.

        Returns:
            dict: Database configuration dictionary
        """
        return {
            "host": self.DB_HOST,
            "port": self.DB_PORT,
            "user": self.DB_USER,
            "password": self.DB_PASS,
            "database": self.DB_NAME,
            "charset": "utf8mb4",
            "use_unicode": True,
            "autocommit": False,
            "connection_timeout": 10,
        }


# Create a singleton instance that will be imported throughout the application
# This will fail fast at import time if configuration is invalid
try:
    config = Config()
except ConfigurationError as e:
    # Re-raise with the formatted error message
    raise ConfigurationError(str(e)) from None
