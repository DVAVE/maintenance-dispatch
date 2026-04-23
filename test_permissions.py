"""Test all custom permission classes with real DB objects."""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'maintenance_dispatch.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import MaintenanceRequest
from core.permissions import (
    IsPropertyManager, IsMaintenanceStaff, IsResident,
    IsOwnerOrManager, IsAssignedStaffOrManager,
)

# ── Mock request ──────────────────────────────────────────────────────────────
class MockRequest:
    def __init__(self, username):
        self.user = User.objects.get(username=username)

manager_req  = MockRequest('manager_user')
staff_req    = MockRequest('staff_user')
resident_req = MockRequest('resident_user')

# ── Ensure a MaintenanceRequest exists ───────────────────────────────────────
resident_user = User.objects.get(username='resident_user')
staff_user    = User.objects.get(username='staff_user')

req_obj, created = MaintenanceRequest.objects.get_or_create(
    title='Broken kitchen tap',
    defaults={
        'description': 'The kitchen tap has been leaking for two days',
        'status': 'Pending',
        'created_by': resident_user,
        'assigned_to': staff_user,
    }
)
if created:
    print(f"Created test MaintenanceRequest: {req_obj}")
else:
    print(f"Using existing MaintenanceRequest: {req_obj}")

print(f"  created_by  : {req_obj.created_by}")
print(f"  assigned_to : {req_obj.assigned_to}")

# ── Helper ────────────────────────────────────────────────────────────────────
def check(label, result, expected):
    icon = '✓' if result == expected else '✗'
    status = 'PASS' if result == expected else 'FAIL'
    print(f"  [{icon}] {status}  {label}  →  got={result}  expected={expected}")

# ── IsPropertyManager ─────────────────────────────────────────────────────────
print("\n── IsPropertyManager ──")
p = IsPropertyManager()
check('manager  has_permission', p.has_permission(manager_req,  None), True)
check('staff    has_permission', p.has_permission(staff_req,    None), False)
check('resident has_permission', p.has_permission(resident_req, None), False)

# ── IsMaintenanceStaff ────────────────────────────────────────────────────────
print("\n── IsMaintenanceStaff ──")
p = IsMaintenanceStaff()
check('manager  has_permission', p.has_permission(manager_req,  None), False)
check('staff    has_permission', p.has_permission(staff_req,    None), True)
check('resident has_permission', p.has_permission(resident_req, None), False)

# ── IsResident ────────────────────────────────────────────────────────────────
print("\n── IsResident ──")
p = IsResident()
check('manager  has_permission', p.has_permission(manager_req,  None), False)
check('staff    has_permission', p.has_permission(staff_req,    None), False)
check('resident has_permission', p.has_permission(resident_req, None), True)

# ── IsOwnerOrManager ──────────────────────────────────────────────────────────
print("\n── IsOwnerOrManager ──")
p = IsOwnerOrManager()
# has_permission: any authenticated user passes
check('manager  has_permission', p.has_permission(manager_req,  None), True)
check('resident has_permission', p.has_permission(resident_req, None), True)
# has_object_permission
check('manager  has_object_perm (always True)',  p.has_object_permission(manager_req,  None, req_obj), True)
check('resident has_object_perm (is owner)',     p.has_object_permission(resident_req, None, req_obj), True)
check('staff    has_object_perm (not owner)',    p.has_object_permission(staff_req,    None, req_obj), False)

# ── IsAssignedStaffOrManager ──────────────────────────────────────────────────
print("\n── IsAssignedStaffOrManager ──")
p = IsAssignedStaffOrManager()
check('manager  has_object_perm (always True)',   p.has_object_permission(manager_req,  None, req_obj), True)
check('staff    has_object_perm (is assigned)',   p.has_object_permission(staff_req,    None, req_obj), True)
check('resident has_object_perm (not assigned)', p.has_object_permission(resident_req, None, req_obj), False)

print("\n── Done ──")
