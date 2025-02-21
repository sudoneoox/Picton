from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)

ROLE_CHOICES = (
    ('basicuser', 'Basic User'),
    ('admin', 'Admin'),
    # add additional roles as needed
)

# IMPORTANT: override default django user table
class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError("Username is required")
        if not email:
            raise ValueError("Email is required")

        extra_fields.setdefault('role', 'basicuser')
        user = self.model(
            username=username, 
            email=self.normalize_email(email), 
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        user = self.create_user(
            username=username, 
            email=email, 
            password=password, 
            **extra_fields
        )
        user.is_superuser = True
        user.is_staff = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    # Required fields
    username = models.CharField(max_length=40, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  # Django handles this
    first_name = models.CharField(max_length=128, default="")
    last_name = models.CharField(max_length=128, default="")

    # Optional fields
    phone_number = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)

    # User role
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='basicuser')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Status fields
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)  # Replaces is_admin
    is_staff = models.BooleanField(default=False)  # needed for admin panel

    objects = CustomUserManager()

    # required fields for Django auth to work
    USERNAME_FIELD = "username"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = ["email"]  # username is automatically required

    def __str__(self):
        return self.username


# # Example model
#
# class ExampleModel(models.Model):
#     # Text Fields
#     char_field = models.CharField(max_length=255)  # String with max length
#     text_field = models.TextField()  # Unlimited text
#     email_field = models.EmailField()  # Email validation
#     slug_field = models.SlugField()  # URL-friendly text
#     url_field = models.URLField()  # URL validation
#
#     # Numeric Fields
#     integer_field = models.IntegerField()  # Whole numbers
#     float_field = models.FloatField()  # Decimal numbers
#     decimal_field = models.DecimalField(max_digits=10, decimal_places=2)  # Precise decimals
#     positive_integer = models.PositiveIntegerField()  # Positive numbers only
#
#     # Boolean Fields
#     boolean_field = models.BooleanField(default=False)  # True/False
#     null_boolean = models.BooleanField(null=True)  # True/False/None
#
#     # Date and Time Fields
#     date_field = models.DateField()  # Date only
#     time_field = models.TimeField()  # Time only
#     datetime_field = models.DateTimeField()  # Date and time
#     duration_field = models.DurationField()  # Time duration
#
#     # File Fields
#     file_field = models.FileField(upload_to='files/')  # Any file
#     image_field = models.ImageField(upload_to='images/')  # Image files only
#
#     # Relationship Fields
#     foreign_key = models.ForeignKey('OtherModel', on_delete=models.CASCADE)  # Many-to-one
#     many_to_many = models.ManyToManyField('OtherModel')  # Many-to-many
#     one_to_one = models.OneToOneField('OtherModel', on_delete=models.CASCADE)  # One-to-one
#
#     # Auto Fields
#     auto_field = models.AutoField(primary_key=True)  # Auto-incrementing ID
#     uuid_field = models.UUIDField()  # Unique identifier
#
#     # Common Field Options
#     nullable_field = models.CharField(
#         max_length=100,
#         null=True,  # Allow NULL in database
#         blank=True,  # Allow blank in forms
#         default='default value',  # Default value
#         unique=True,  # Must be unique
#         db_index=True,  # Create database index
#         choices=[  # Predefined choices
#             ('A', 'Choice A'),
#             ('B', 'Choice B'),
#         ],
#         help_text="Help text for forms",  # Help text
#         verbose_name="Human readable name",  # Display name
#         editable=False,  # Not editable in admin
#         error_messages={  # Custom error messages
#             'null': 'This field cannot be null.',
#             'blank': 'This field cannot be blank.',
#         }
#     )
#
#     class Meta:
#         # Model metadata options
#         db_table = 'custom_table_name'  # Custom table name
#         ordering = ['-created_at']  # Default ordering
#         verbose_name = 'Example'  # Human readable name
#         verbose_name_plural = 'Examples'  # Plural name
#         unique_together = ['field1', 'field2']  # Unique constraint
#         indexes = [
#             models.Index(fields=['field1', 'field2'])  # Custom index
#         ]
#         permissions = [
#             ("can_do_something", "Can do something")  # Custom permissions
#         ]
#
#     def __str__(self):
#         return self.char_field  # String representation
#
#     def save(self, *args, **kwargs):
#         # Override save method
#         if not self.slug_field:
#             self.slug_field = slugify(self.char_field)
#         super().save(*args, **kwargs)
#
#     def get_absolute_url(self):
#         # URL for object
#         return f"/example/{self.id}/"
