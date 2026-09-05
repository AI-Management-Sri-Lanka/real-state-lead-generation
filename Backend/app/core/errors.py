from dataclasses import dataclass
from typing import Optional

@dataclass
class ErrorDefinition:
    code: str
    name: str
    category: str
    severity: str
    module: str
    user_message: str
    internal_message: str
    recommended_action: str
    log_level: str
    alert_required: bool
    http_status: int


class AppError:
    """Registry of all application error definitions."""
    
    # Auth Errors
    AUTH_USER_NOT_FOUND = ErrorDefinition(
        code="AUTH-001",
        name="User Not Found",
        category="validation_error",
        severity="medium",
        module="auth",
        user_message="No account found with this email. Check email spelling or sign up.",
        internal_message="User lookup returned no results for the provided email.",
        recommended_action="Check email spelling or sign up.",
        log_level="warn",
        alert_required=False,
        http_status=404
    )
    
    AUTH_EMAIL_EXISTS = ErrorDefinition(
        code="AUTH-002",
        name="Email Already Exists",
        category="validation_error",
        severity="medium",
        module="auth",
        user_message="An account with this email already exists.",
        internal_message="Integrity error during user creation - email already exists.",
        recommended_action="Try logging in or resetting your password.",
        log_level="warn",
        alert_required=False,
        http_status=409
    )
    
    AUTH_INVALID_CREDENTIALS = ErrorDefinition(
        code="AUTH-003",
        name="Invalid Credentials",
        category="authentication_error",
        severity="medium",
        module="auth",
        user_message="Invalid email or password.",
        internal_message="Failed password verification during login.",
        recommended_action="Check your credentials and try again.",
        log_level="info",
        alert_required=False,
        http_status=401
    )
    
    AUTH_GOOGLE_TOKEN_INVALID = ErrorDefinition(
        code="AUTH-004",
        name="Invalid Google Token",
        category="authentication_error",
        severity="medium",
        module="auth",
        user_message="Google sign-in failed. Please try again.",
        internal_message="Google ID token verification failed (bad signature, audience, issuer, or expired).",
        recommended_action="Retry Google sign-in or use email/password instead.",
        log_level="warn",
        alert_required=False,
        http_status=401
    )

    AUTH_GOOGLE_NOT_CONFIGURED = ErrorDefinition(
        code="AUTH-005",
        name="Google Sign-In Not Configured",
        category="system_error",
        severity="high",
        module="auth",
        user_message="Google sign-in is not available right now.",
        internal_message="GOOGLE_CLIENT_ID is not configured on the server.",
        recommended_action="Set GOOGLE_CLIENT_ID in the backend environment configuration.",
        log_level="error",
        alert_required=True,
        http_status=503
    )

    # DB Errors
    DB_INTEGRITY_ERROR = ErrorDefinition(
        code="DB-001",
        name="Database Integrity Error",
        category="database_error",
        severity="high",
        module="database",
        user_message="A system error occurred while saving data.",
        internal_message="Database integrity error not specifically caught.",
        recommended_action="Contact support if the issue persists.",
        log_level="error",
        alert_required=True,
        http_status=400
    )

    SYS_DATABASE_UNAVAILABLE = ErrorDefinition(
        code="SYS-002",
        name="Database Unavailable",
        category="system_error",
        severity="critical",
        module="database",
        user_message="Service temporarily unavailable.",
        internal_message="Database connection failed or timed out.",
        recommended_action="Contact support if the issue persists.",
        log_level="error",
        alert_required=True,
        http_status=503
    )
    
    VALIDATION_ERROR = ErrorDefinition(
        code="VAL-001",
        name="Validation Error",
        category="validation_error",
        severity="low",
        module="validation",
        user_message="Input validation failed.",
        internal_message="Request validation failed.",
        recommended_action="Correct the input parameters and try again.",
        log_level="warn",
        alert_required=False,
        http_status=422
    )

    HTTP_ERROR = ErrorDefinition(
        code="HTTP-001",
        name="HTTP Error",
        category="http_error",
        severity="medium",
        module="http",
        user_message="An HTTP error occurred.",
        internal_message="Standard HTTP Exception raised.",
        recommended_action="Check request parameters or URL.",
        log_level="info",
        alert_required=False,
        http_status=400
    )

    PERM_PERMISSION_DENIED = ErrorDefinition(
        code="PERM-001",
        name="Permission Denied",
        category="authorization_error",
        severity="high",
        module="auth",
        user_message="You do not have permission to perform this action.",
        internal_message="User lacks required permissions or roles.",
        recommended_action="Request access from an administrator.",
        log_level="warn",
        alert_required=False,
        http_status=403
    )

    SYS_RESOURCE_NOT_FOUND = ErrorDefinition(
        code="SYS-003",
        name="Resource Not Found",
        category="system_error",
        severity="low",
        module="system",
        user_message="The requested resource could not be found.",
        internal_message="Database entity not found.",
        recommended_action="Check the provided ID or parameters.",
        log_level="info",
        alert_required=False,
        http_status=404
    )


class AppException(Exception):
    """
    Main application exception that takes an ErrorDefinition.
    """
    def __init__(self, error: ErrorDefinition, custom_message: Optional[str] = None):
        self.error = error
        self.custom_message = custom_message
        super().__init__(self.custom_message or self.error.user_message)