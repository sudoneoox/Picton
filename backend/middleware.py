from django.shortcuts import redirect

class RedirectAuthenticatedMiddleware:
    """
    Middleware to redirect authenticated users away from login or registration pages.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # List the URL paths to protect (update these if your login/register URLs differ)
        protected_paths = ['/login/', '/register/']

        # If user is authenticated and accessing a protected path, redirect them
        if request.user.is_authenticated and request.path in protected_paths:
            return redirect('dashboard')
        
        # Otherwise, continue processing the request
        return self.get_response(request)
