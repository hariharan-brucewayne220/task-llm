"""Security utilities for the application."""
import hashlib
import secrets
import base64
from cryptography.fernet import Fernet
from datetime import datetime, timedelta
import re
from typing import Optional, Dict, Any

class SecurityManager:
    """Handle security operations like encryption and sanitization."""
    
    def __init__(self, encryption_key: Optional[str] = None):
        """Initialize with encryption key."""
        if encryption_key:
            self.fernet = Fernet(encryption_key.encode())
        else:
            # Generate a new key if none provided
            key = Fernet.generate_key()
            self.fernet = Fernet(key)
    
    def encrypt_api_key(self, api_key: str) -> str:
        """Encrypt API key for secure storage."""
        if not api_key:
            return ""
        
        encrypted = self.fernet.encrypt(api_key.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    
    def decrypt_api_key(self, encrypted_key: str) -> str:
        """Decrypt API key for use."""
        if not encrypted_key:
            return ""
        
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_key.encode())
            decrypted = self.fernet.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception:
            return ""
    
    def hash_password(self, password: str) -> str:
        """Hash password using SHA-256 with salt."""
        salt = secrets.token_hex(16)
        pwd_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return f"{salt}${pwd_hash}"
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash."""
        try:
            salt, pwd_hash = hashed.split('$')
            return hashlib.sha256((password + salt).encode()).hexdigest() == pwd_hash
        except ValueError:
            return False

def sanitize_prompt(prompt: str) -> str:
    """Sanitize prompt input to prevent injection attacks."""
    if not isinstance(prompt, str):
        return ""
    
    # Remove potentially dangerous patterns
    sanitized = prompt.strip()
    
    # Remove null bytes
    sanitized = sanitized.replace('\x00', '')
    
    # Limit length to prevent memory attacks
    sanitized = sanitized[:10000]
    
    return sanitized

def sanitize_response(response: str) -> str:
    """Sanitize LLM response for safe storage and display."""
    if not isinstance(response, str):
        return ""
    
    # Remove potential XSS patterns
    sanitized = response.strip()
    
    # Remove script tags and javascript
    sanitized = re.sub(r'<script[^>]*>.*?</script>', '', sanitized, flags=re.IGNORECASE | re.DOTALL)
    sanitized = re.sub(r'javascript:', '', sanitized, flags=re.IGNORECASE)
    
    # Remove null bytes
    sanitized = sanitized.replace('\x00', '')
    
    # Limit length
    sanitized = sanitized[:50000]
    
    return sanitized

def detect_sensitive_content(text: str) -> Dict[str, Any]:
    """Detect potentially sensitive content in text."""
    if not text:
        return {'has_sensitive': False, 'types': []}
    
    sensitive_patterns = {
        'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        'phone': r'\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b',
        'ssn': r'\b\d{3}-?\d{2}-?\d{4}\b',
        'credit_card': r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
        'ip_address': r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
    }
    
    detected_types = []
    
    for pattern_type, pattern in sensitive_patterns.items():
        if re.search(pattern, text, re.IGNORECASE):
            detected_types.append(pattern_type)
    
    return {
        'has_sensitive': len(detected_types) > 0,
        'types': detected_types
    }

def generate_session_token() -> str:
    """Generate secure session token."""
    return secrets.token_urlsafe(32)

def validate_session_token(token: str) -> bool:
    """Validate session token format."""
    if not token or len(token) < 16:
        return False
    
    # Check if token contains only valid URL-safe characters
    return re.match(r'^[A-Za-z0-9_-]+$', token) is not None

def rate_limit_key(identifier: str, window: str = "minute") -> str:
    """Generate rate limiting key."""
    timestamp = datetime.utcnow()
    
    if window == "minute":
        window_start = timestamp.replace(second=0, microsecond=0)
    elif window == "hour":
        window_start = timestamp.replace(minute=0, second=0, microsecond=0)
    else:
        window_start = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
    
    return f"rate_limit:{identifier}:{window}:{window_start.isoformat()}"

def check_injection_patterns(text: str) -> Dict[str, Any]:
    """Check for common injection attack patterns."""
    if not text:
        return {'has_injection': False, 'patterns': []}
    
    injection_patterns = {
        'sql_injection': [
            r"(?i)(\bunion\b.*\bselect\b)|(\bselect\b.*\bfrom\b)",
            r"(?i)\b(drop|delete|insert|update)\b.*\btable\b",
            r"(?i)\b(exec|execute)\b.*\(",
            r"['\"];?\s*(drop|delete|insert|update|select)"
        ],
        'command_injection': [
            r"[;&|`$(){}[\]<>]",
            r"(?i)\b(wget|curl|nc|netcat|sh|bash|cmd|powershell)\b"
        ],
        'xss': [
            r"<script[^>]*>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe[^>]*>"
        ]
    }
    
    detected_patterns = []
    
    for category, patterns in injection_patterns.items():
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                detected_patterns.append(category)
                break
    
    return {
        'has_injection': len(detected_patterns) > 0,
        'patterns': detected_patterns
    }

# Global security manager instance
security_manager = SecurityManager()