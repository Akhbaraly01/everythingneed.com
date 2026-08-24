# System Testing Guide

## Status: ✅ All Systems Running

### Servers Active
- **Backend API**: http://127.0.0.1:8000 (Port 8000)
- **Frontend**: http://127.0.0.1:8080 (Port 8080)

---

## Backend API Testing

### Login Endpoint
**URL**: `http://127.0.0.1:8000/api/auth/login`  
**Method**: `POST`  
**Content-Type**: `application/json`

### Test Credentials (All passwords: `password`)

| Email | Role | Username |
|-------|------|----------|
| super@everythingneed.com | Super Admin | Super Admin |
| admin@everythingneed.com | Administrator | Administrator |
| vendor_admin@everythingneed.com | Vendor Admin | Vendor Admin |
| moderator@everythingneed.com | Moderator | Moderator |
| support@everythingneed.com | Support Staff | Support Staff |
| content_manager@everythingneed.com | Content Manager | Content Manager |
| finance_admin@everythingneed.com | Finance Admin | Finance Admin |
| healthcare_admin@everythingneed.com | Healthcare Admin | Healthcare Admin |
| learning_admin@everythingneed.com | Learning Admin | Learning Admin |
| customer_service@everythingneed.com | Customer Service | Customer Service |
| category_admin@everythingneed.com | Category Admin | Category Admin |

### Login Response Example
```json
{
  "message": "Login successful",
  "data": {
    "user": {
      "id": "f6afd0c6-3820-4914-958e-af656c82bd67",
      "email": "admin@everythingneed.com",
      "name": "Administrator",
      "role": "administrator",
      "profile": null
    },
    "access_token": "2|Khdeg9CroHiEjQi5RZeG4PpWQaHj6vqOWE6q0Fq38354821d"
  }
}
```

### Key API Endpoints
- `GET  /api/auth/user` - Get current user
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout

---

## Frontend Testing

### Main URLs
- **Home**: http://127.0.0.1:8080
- **Auth**: http://127.0.0.1:8080/auth
- **Dashboard**: http://127.0.0.1:8080/dashboard (requires login)

### Authentication Flow
1. Navigate to http://127.0.0.1:8080/auth
2. Enter credentials from the table above
3. Password for all test accounts: `password`
4. Click Login
5. Token will be saved to localStorage as `auth_token`
6. Redirected to dashboard on success

---

## Database Info
- **Type**: SQLite (Local)
- **File**: `backend/database/database.sqlite`
- **Status**: ✅ Migrated & Seeded
- **Tables**: 58 tables
- **Foreign Key Constraints**: Disabled during migration (enabled at runtime)

---

## Fixed Issues Summary

### Backend Fixes
1. ✅ Fixed routes/web.php parse error (removed invalid pipe character)
2. ✅ Switched from PostgreSQL to SQLite for local development
3. ✅ Fixed migration 000015 (removed PostgreSQL gen_random_uuid() calls)
4. ✅ Disabled Telescope temporarily (TELESCOPE_ENABLED=false)
5. ✅ Created database.sqlite file
6. ✅ Ran all migrations successfully (20 migrations)
7. ✅ Database seeded with test users and roles

### Server Verification
- ✅ Backend HTTP 404 on root (expected, API-only routes configured)
- ✅ Backend HTTP 200 on /api/auth/login (working)
- ✅ Frontend HTTP 200 on root (working)
- ✅ Auth tokens generated correctly

---

## Running Servers Manually

### Start Backend
```bash
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

### Start Frontend
```bash
npm run dev
```

### Reset Database
```bash
cd backend
php artisan migrate:fresh --seed
```

---

## Quick Test Commands

### Test Backend Login (PowerShell)
```powershell
php test_login.php
```

### Check Backend Health
```powershell
curl -I http://127.0.0.1:8000/api/auth/user
```

### Check Frontend Health
```powershell
curl -I http://127.0.0.1:8080/
```

---

## Configuration Files Modified
- ✅ `backend/.env` - Database switched to SQLite
- ✅ `backend/routes/web.php` - Fixed syntax error
- ✅ `backend/database/migrations/2026_01_01_000015_expand_app_roles.php` - Fixed UUID generation

---

## Ready to Test
All systems are now running and ready for comprehensive testing of:
- ✅ Authentication flows
- ✅ User role management
- ✅ Backend API responses
- ✅ Frontend UI rendering
- ✅ Token persistence and validation
