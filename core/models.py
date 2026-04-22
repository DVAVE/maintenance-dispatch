from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class Profile(models.Model):
    """Extended user profile with role-based access."""

    ROLE_CHOICES = (
        ('manager', 'Property Manager'),
        ('staff', 'Maintenance Staff'),
        ('resident', 'Resident'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='resident')

    def __str__(self):
        return f"{self.user.username} — {self.role}"


class MaintenanceRequest(models.Model):
    """A maintenance request submitted by a resident."""

    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests_created')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='requests_assigned', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} — {self.status}"


# -----------------------------------------------------------------------
# Signals — auto-create and save a Profile whenever a User is created/saved
# -----------------------------------------------------------------------

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a Profile automatically when a new User is created."""
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the Profile whenever the User is saved."""
    if hasattr(instance, 'profile'):
        instance.profile.save()
