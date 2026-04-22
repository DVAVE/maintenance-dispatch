"""Full verification script for all Phase 2 checks."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'maintenance_dispatch.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Profile, MaintenanceRequest
from django.core.management import call_command

print("=" * 60)
print("CHECK 1 — Migrations")
print("=" * 60)
call_command('showmigrations', 'core')

print()
print("=" * 60)
print("CHECK 3 & 4 — Users and Profile Roles")
print("=" * 60)
print(f"Total users: {User.objects.count()}")
print(f"Total profiles: {Profile.objects.count()}")
print()
for u in User.objects.all():
    try:
        profile = u.profile
        print(f"  {u.username:20s} | superuser={str(u.is_superuser):5s} | role={profile.role}")
    except Profile.DoesNotExist:
        print(f"  {u.username:20s} | superuser={str(u.is_superuser):5s} | *** NO PROFILE ***")

print()
print("=" * 60)
print("CHECK 5 — MaintenanceRequest data")
print("=" * 60)
print(f"Total requests: {MaintenanceRequest.objects.count()}")
for req in MaintenanceRequest.objects.all():
    print(f"  {req.title} | status={req.status} | created_by={req.created_by.username}")

print()
print("=" * 60)
print("CHECK 6 — __str__ methods")
print("=" * 60)
for p in Profile.objects.all():
    print(f"  Profile.__str__: {p}")
for req in MaintenanceRequest.objects.all():
    print(f"  MaintenanceRequest.__str__: {req}")

print()
print("=" * 60)
print("CHECK 7 — Signal test (create + delete temp user)")
print("=" * 60)
temp_user = User.objects.create_user(username='_signal_test_user', password='Test@1234')
try:
    profile = temp_user.profile
    print(f"  Signal WORKS — profile auto-created with role: {profile.role}")
except Profile.DoesNotExist:
    print("  *** SIGNAL BROKEN — no profile was created! ***")
temp_user.delete()
print("  Temp user deleted.")

print()
print("=" * 60)
print("CHECK 8 — Specific shell queries")
print("=" * 60)
print(f"  User.objects.count() = {User.objects.count()}")
print(f"  Profile.objects.count() = {Profile.objects.count()}")
print(f"  manager_user role = {User.objects.get(username='manager_user').profile.role}")
print(f"  staff_user role = {User.objects.get(username='staff_user').profile.role}")
print(f"  MaintenanceRequest.objects.count() = {MaintenanceRequest.objects.count()}")

print()
print("=" * 60)
print("ALL CHECKS COMPLETE")
print("=" * 60)
