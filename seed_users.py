"""Seed script to create test users and set their profile roles."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'maintenance_dispatch.settings')
django.setup()

from django.contrib.auth.models import User

# --- Superuser ---
if not User.objects.filter(username='admin').exists():
    admin_user = User.objects.create_superuser(
        username='admin',
        email='admin@test.com',
        password='Admin@1234',
    )
    admin_user.profile.role = 'manager'
    admin_user.profile.save()
    print("Created superuser: admin")
else:
    print("Superuser 'admin' already exists")

# --- Manager ---
if not User.objects.filter(username='manager_user').exists():
    manager = User.objects.create_user(
        username='manager_user',
        password='Manager@1234',
    )
    manager.profile.role = 'manager'
    manager.profile.save()
    print("Created user: manager_user (role: manager)")
else:
    print("User 'manager_user' already exists")

# --- Staff ---
if not User.objects.filter(username='staff_user').exists():
    staff = User.objects.create_user(
        username='staff_user',
        password='Staff@1234',
    )
    staff.profile.role = 'staff'
    staff.profile.save()
    print("Created user: staff_user (role: staff)")
else:
    print("User 'staff_user' already exists")

# --- Resident ---
if not User.objects.filter(username='resident_user').exists():
    resident = User.objects.create_user(
        username='resident_user',
        password='Resident@1234',
    )
    resident.profile.role = 'resident'
    resident.profile.save()
    print("Created user: resident_user (role: resident)")
else:
    print("User 'resident_user' already exists")

print("\nAll users ready!")
