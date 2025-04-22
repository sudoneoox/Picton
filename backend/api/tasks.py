from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

def send_notification(user_id, title, message, notification_type):
    """
    Basic notification function. Currently just logs the notification.
    In a production environment, this would send actual notifications.
    """
    from .models import User  # Import here to avoid circular imports
    
    try:
        user = User.objects.get(id=user_id)
        print(f"[{timezone.now()}] Notification sent to {user.email}")
        print(f"Title: {title}")
        print(f"Message: {message}")
        print(f"Type: {notification_type}")
        
        # In development, we'll just print the notification
        # In production, you would implement actual notification sending here
        if settings.DEBUG:
            print(f"DEBUG: Would send notification to {user.email}: {title} - {message}")
            return True
            
        # Example email notification (uncomment if email is configured)
        # send_mail(
        #     subject=title,
        #     message=message,
        #     from_email=settings.DEFAULT_FROM_EMAIL,
        #     recipient_list=[user.email],
        #     fail_silently=True,
        # )
        
        return True
    except User.DoesNotExist:
        print(f"Error: User {user_id} not found")
        return False
    except Exception as e:
        print(f"Error sending notification: {str(e)}")
        return False

# Mock the celery delay function since we're not using Celery
def delay(*args, **kwargs):
    return send_notification(*args, **kwargs)

# Attach the delay function to send_notification
send_notification.delay = delay 