import threading
import uuid

# Thread local storage for request objects
_thread_locals = threading.local()

class RequestMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Generate a unique ID for this request
        request_id = str(uuid.uuid4())
        request.id = request_id
        
        # Store the request in thread local storage
        _thread_locals.request = request
        
        # Process request
        response = self.get_response(request)
        
        # Add the request ID to the response headers
        response['X-Request-ID'] = request_id
        
        # Clean up thread local storage
        if hasattr(_thread_locals, 'request'):
            del _thread_locals.request
            
        return response

def get_current_request():
    """
    Returns the current request object from thread local storage.
    Returns None if there is no request object in the current thread.
    """
    return getattr(_thread_locals, 'request', None)

def get_current_user():
    """
    Returns the current authenticated user or None.
    """
    request = get_current_request()
    if request and hasattr(request, 'user'):
        return request.user
    return None