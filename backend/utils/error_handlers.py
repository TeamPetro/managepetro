"""
Error handling utilities for consistent error responses.
"""

from fastapi import HTTPException
import logging

_logger = logging.getLogger(__name__)


def raise_500(message: str, exception: Exception = None):
    """
    Raise a 500 error with logging.
    Use for unexpected server errors.
    """
    if exception:
        _logger.exception(f"{message}: {str(exception)}")
    else:
        _logger.error(message)
    raise HTTPException(status_code=500, detail=message)


def raise_404(resource: str, identifier: str = None):
    """
    Raise a 404 error for missing resources.
    Example: raise_404("Truck", "truck-001")
    """
    detail = f"{resource} not found"
    if identifier:
        detail = f"{resource} '{identifier}' not found"
    raise HTTPException(status_code=404, detail=detail)


def raise_400(message: str):
    """
    Raise a 400 error for bad requests/validation errors.
    """
    raise HTTPException(status_code=400, detail=message)


def handle_db_error(operation: str, exception: Exception):
    """
    Handle database errors with consistent logging and response.
    """
    error_msg = f"Database error during {operation}"
    _logger.exception(f"{error_msg}: {str(exception)}")
    raise HTTPException(status_code=500, detail=f"{operation} failed")


def handle_external_api_error(service: str, exception: Exception):
    """
    Handle external API errors (weather, TomTom, etc).
    """
    error_msg = f"{service} service error"
    _logger.error(f"{error_msg}: {str(exception)}")
    raise HTTPException(status_code=500, detail=error_msg)
