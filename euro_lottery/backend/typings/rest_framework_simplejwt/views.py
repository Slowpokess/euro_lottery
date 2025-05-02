from typing import Dict, Any, Optional
from rest_framework.request import Request
from rest_framework.response import Response

class TokenViewBase:
    """
    Base class for token views
    """
    serializer_class: Any = None
    
    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        ...


class TokenObtainPairView(TokenViewBase):
    """
    Takes a set of user credentials and returns an access and refresh JSON web
    token pair to prove the authentication of those credentials.
    """
    serializer_class: Any = None


class TokenRefreshView(TokenViewBase):
    """
    Takes a refresh type JSON web token and returns an access type JSON web
    token if the refresh token is valid.
    """
    serializer_class: Any = None


class TokenVerifyView(TokenViewBase):
    """
    Takes a token and indicates if it is valid.  This view provides no
    information about a token's fitness for a particular use.
    """
    serializer_class: Any = None


class TokenObtainSlidingView(TokenViewBase):
    """
    Takes a set of user credentials and returns a sliding JSON web token to
    prove the authentication of those credentials.
    """
    serializer_class: Any = None


class TokenRefreshSlidingView(TokenViewBase):
    """
    Takes a sliding token and returns a new, refreshed version if the token's
    refresh period hasn't expired.
    """
    serializer_class: Any = None