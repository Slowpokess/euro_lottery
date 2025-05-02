from typing import Dict, Any, Optional, List

class Token:
    """
    A class which validates and wraps an existing JWT or can be used to create a
    new JWT.
    """
    token_type: str
    lifetime: Optional[Any] = None
    
    def __init__(self, token: Optional[str] = None, verify: bool = True) -> None:
        ...
    
    def __repr__(self) -> str:
        ...
    
    def __getitem__(self, key: str) -> Any:
        ...
    
    def __setitem__(self, key: str, value: Any) -> None:
        ...
    
    def __delitem__(self, key: str) -> None:
        ...
    
    def __contains__(self, key: str) -> bool:
        ...
    
    def get(self, key: str, default: Any = None) -> Any:
        ...
    
    def __str__(self) -> str:
        ...
    
    @classmethod
    def for_user(cls, user: Any) -> "Token":
        ...


class BlacklistMixin:
    """
    If the `rest_framework_simplejwt.token_blacklist` app was installed,
    tokens created from `BlacklistMixin` subclasses will be blacklisted
    when their `blacklist` method is called.
    """
    def blacklist(self) -> None:
        ...


class RefreshToken(BlacklistMixin, Token):
    """
    A refresh token that can be used to generate new access tokens
    """
    token_type: str = "refresh"
    lifetime: Any
    no_copy_claims: List[str] = []
    
    @property
    def access_token(self) -> "AccessToken":
        ...

    
class AccessToken(Token):
    """
    An access token that can be used to authenticate with the API
    """
    token_type: str = "access"
    lifetime: Any