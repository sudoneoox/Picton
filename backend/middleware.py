# backend/middleware.py

from django.shortcuts import redirect

class RedirectAuthenticatedMiddleware:
    """
    Middleware to redirect authenticated users away from login or registration pages.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # List the exact URL paths for login and registration pages.
        # Adjust these paths if your URLs differ.
        protected_paths = ['/login/', '/register/']

        # If the user is already authenticated and is trying to access one of these pages, redirect them.
        if request.user.is_authenticated and request.path in protected_paths:
            return redirect('dashboard')  # 'dashboard' should match your URL name for the dashboard view.

        # Otherwise, continue processing the request.
        response = self.get_response(request)
        return response
