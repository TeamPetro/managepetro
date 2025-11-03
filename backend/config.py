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

        # DeepSeek (optional) – OpenAI-compatible API
        self.DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()

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
