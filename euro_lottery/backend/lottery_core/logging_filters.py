import logging
from lottery_core.middleware import get_current_request

class RequestIDFilter(logging.Filter):
    """
    Adds request_id to log records.
    """
    def filter(self, record):
        request = get_current_request()
        record.request_id = getattr(request, 'id', '-') if request else '-'
        return True

class UserInfoFilter(logging.Filter):
    """
    Adds user_id and IP address to log records.
    """
    def filter(self, record):
        request = get_current_request()
        if request:
            # Get user ID if user is authenticated
            if hasattr(request, 'user') and request.user.is_authenticated:
                record.user_id = str(request.user.id)
            else:
                record.user_id = 'anonymous'
                
            # Get client IP - handle proxy forwarding
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                record.ip = x_forwarded_for.split(',')[0].strip()
            else:
                record.ip = request.META.get('REMOTE_ADDR', '-')
        else:
            record.user_id = '-'
            record.ip = '-'
            
        return True