# Maintenance Dispatch System

A full-stack web application that allows Property Managers to manage and assign maintenance tasks, built with Django REST Framework and Next.js.

---

## Live Demo

- **Frontend (Vercel):** `https://your-app.vercel.app`
- **Backend API (Render):** `https://your-api.onrender.com`

> Replace both URLs above with your actual deployed URLs after completing deployment.

---

## GitHub Repository

`https://github.com/DVAVE/maintenance-dispatch`

---

## Tech Stack

**Backend**
- Python 3.11
- Django 4.x
- Django REST Framework
- SQLite (development) / PostgreSQL (production)
- python-decouple for environment variable management
- Gunicorn as the production WSGI server
- Whitenoise for static file serving

**Frontend**
- Next.js 14 (App Router)
- React 18
- Axios for API communication

---

## User Roles

The system implements three distinct user roles, each with strictly enforced access boundaries:

| Role | Capabilities |
|---|---|
| Property Manager | View all requests, assign Pending requests to staff |
| Maintenance Staff | View only assigned requests, update status of assigned tasks |
| Resident | Submit new requests, view status of own requests only |

---

## Permission Architecture

### Custom Permission Classes

All permission logic lives in `core/permissions.py`. Five custom classes inherit from DRF's `BasePermission`:

**IsPropertyManager** checks that the authenticated user's profile role equals exactly the string `'manager'`. It wraps the profile access in a try/except block to safely return `False` if a user somehow exists without a profile, rather than raising an unhandled exception. This class protects the assign action and the staff user list endpoint.

**IsMaintenanceStaff** follows the same pattern but checks for the role `'staff'`. It is applied to the partial update action, ensuring only staff members can change the status of a task — and only tasks assigned to them, enforced at the queryset level.

**IsResident** checks for the role `'resident'` and is applied exclusively to the create action on the MaintenanceRequest ViewSet, ensuring only residents can submit new requests.

**IsOwnerOrManager** implements object-level permission by overriding `has_object_permission`. It returns `True` if the requesting user is a manager OR if the object's `created_by` field equals the requesting user. This prevents a resident from accessing another resident's request even if they guess the correct ID in the URL.

**IsAssignedStaffOrManager** also implements object-level permission, returning `True` if the requesting user is a manager OR if the object's `assigned_to` field equals the requesting user. This blocks staff members from viewing or modifying tasks assigned to other staff members.

### Row-Level Security via get_queryset

Beyond permission classes, the `MaintenanceRequestViewSet` overrides `get_queryset()` to filter the database query itself based on the authenticated user's role:

```python
def get_queryset(self):
    role = self.request.user.profile.role
    if role == 'manager':
        return MaintenanceRequest.objects.all()
    elif role == 'staff':
        return MaintenanceRequest.objects.filter(assigned_to=self.request.user)
    elif role == 'resident':
        return MaintenanceRequest.objects.filter(created_by=self.request.user)
    return MaintenanceRequest.objects.none()
```

This means a resident who attempts to access `/api/requests/2/` — a request they did not create — will receive a 404 Not Found because that record simply does not exist in the queryset returned for their role. The data is never fetched from the database in the first place, making this a true server-side row-level security implementation.

### Workflow Integrity

The custom `assign` action validates two conditions before allowing assignment: the request must have a status of `'Pending'`, and the user being assigned must have a profile role of `'staff'`. This prevents managers from assigning already-active tasks and prevents non-staff users from being assigned tasks. Staff members have their `partial_update` method further restricted to strip all fields except `status` from the request data, making it impossible for them to reassign tasks or modify other fields even if they send crafted API requests directly.

---

## Cookie-Based Authentication

### How Sessions Are Created

Authentication uses Django's built-in session framework rather than token-based authentication. When a user submits valid credentials to `POST /api/auth/login/`, the backend calls `django.contrib.auth.authenticate()` to validate the credentials and `django.contrib.auth.login()` to create a server-side session. Django then sends a `Set-Cookie` header in the response containing the `sessionid` cookie, which the browser stores and sends automatically with every subsequent request to the same domain.

### How the CSRF Token Flows

Because the frontend runs on a separate origin from the backend, CSRF protection requires an explicit handshake:

1. When the frontend application loads, it sends a `GET` request to `/api/auth/csrf/`. This endpoint is decorated with `@ensure_csrf_cookie`, which forces Django to attach the `csrftoken` cookie to the response even though no form was rendered server-side.

2. The frontend reads this cookie value from `document.cookie` using a utility function in `lib/csrf.js`.

3. Every mutating request (POST, PATCH, DELETE) that the frontend sends includes the `X-CSRFToken` header set to this value. Django's CSRF middleware validates that the cookie value and the header value match before processing the request.

4. The login endpoint itself is decorated with `@csrf_protect` and `CSRF_COOKIE_HTTPONLY` is set to `False` in settings so that JavaScript can read the cookie value. The `sessionid` cookie however has `SESSION_COOKIE_HTTPONLY` set to `True`, meaning JavaScript cannot read it — it is sent automatically by the browser but is invisible to frontend code, protecting it from XSS attacks.

### Production Cookie Security

In production, the following settings harden cookie security:

```python
SESSION_COOKIE_SECURE = True      # Cookie only sent over HTTPS
CSRF_COOKIE_SECURE = True         # CSRF cookie only sent over HTTPS
SESSION_COOKIE_SAMESITE = 'Lax'  # Protects against CSRF from external sites
CSRF_COOKIE_HTTPONLY = False      # Frontend JavaScript must read CSRF cookie
SESSION_COOKIE_HTTPONLY = True    # Session cookie hidden from JavaScript
```

`SameSite=Lax` allows the session cookie to be sent with top-level navigations from external sites (such as following a link) but blocks it from being sent with cross-site subresource requests, providing protection against cross-site request forgery while maintaining usability.

---

## Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/DVAVE/maintenance-dispatch.git
cd maintenance-dispatch

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and set your SECRET_KEY

# Run migrations
python manage.py migrate

# Create a superuser
python manage.py createsuperuser

# Start the backend server
python manage.py runserver
```

### Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create frontend environment file
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

# Start the frontend server
npm run dev
```

### Test User Credentials (Development)

| Role | Username | Password |
|---|---|---|
| Property Manager | manager_user | Manager@1234 |
| Maintenance Staff | staff_user | Staff@1234 |
| Resident | resident_user | Resident@1234 |

---

## Environment Variables

### Backend (.env)

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | Set to True in development, False in production |
| `DATABASE_URL` | PostgreSQL connection URL (production only) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins |

### Frontend (.env.local)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL of the Django backend API |

---

## API Endpoints

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/auth/csrf/` | Public |
| POST | `/api/auth/login/` | Public |
| POST | `/api/auth/logout/` | Authenticated |
| GET | `/api/auth/me/` | Authenticated |
| GET | `/api/requests/` | All roles (filtered by role) |
| POST | `/api/requests/` | Resident only |
| GET | `/api/requests/{id}/` | Owner or Manager |
| PATCH | `/api/requests/{id}/` | Staff (status only) or Manager |
| POST | `/api/requests/{id}/assign/` | Manager only |
| GET | `/api/users/staff/` | Manager only |

---

## Git Commit Convention

This project follows conventional commits:
- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — configuration or tooling changes
- `docs:` — documentation updates

---

## Author

**Takunda T. Denga**
- GitHub: [github.com/DVAVE](https://github.com/DVAVE)
- LinkedIn: [linkedin.com/in/takundad-4984b936a](https://linkedin.com/in/takundad-4984b936a)
- Email: takden9@gmail.com
