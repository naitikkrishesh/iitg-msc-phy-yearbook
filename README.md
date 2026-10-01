# Physics Yearbook IITG — Complete Local Project

This folder contains the **frontend + backend together**.

## Stack
- Frontend: React 19 + Vite
- Backend: FastAPI + SQLAlchemy
- Database: MySQL 8+
- Authentication: JWT + bcrypt
- OTP: console mail stub in local development
- Uploads: local `uploads/` directory

## Recommended local setup (macOS/Linux)

### 1. Database
Create the database/schema using the supplied SQL:

```bash
mysql -u root -p < yearbook-backend/schema.sql
```

The schema also inserts the default allowed registration domain `iitg.ac.in`.

Create the super-admin:

```bash
cd yearbook-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python seed_super_admin.py
```

Edit `.env` if your MySQL username/password differs.

### 2. Start backend

From `yearbook-backend` with the virtual environment activated:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

Backend:
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

### 3. Start frontend

Open a second terminal:

```bash
cd yearbook-frontend
npm install
cp .env.example .env
npm run dev
```

Open the URL printed by Vite, normally http://localhost:5173.

## OTP in local development

`MAIL_ENABLED=false` is intentional. Registration/password-reset OTPs are printed in the backend terminal, for example:

```text
[DEV MAIL STUB] To=someone@iitg.ac.in Subject=...
Your registration OTP is 123456...
```

This makes the complete authentication flow testable without paying for an email service.

For real email, set the SMTP values in `yearbook-backend/.env` and set:

```text
MAIL_ENABLED=true
```

## Important first-use flow

1. Start MySQL and import `schema.sql`.
2. Create the super-admin with `seed_super_admin.py`.
3. Log in as super-admin.
4. Add/import student roster entries.
5. A student can then register only if their name, roll number, batch year and IITG email exactly match the roster.
6. Read the OTP from the backend terminal.
7. Complete registration.
8. Approve the student from the admin dashboard.
9. Student can then submit profile/feature photos; photos remain pending until reviewed.

## Project structure

```text
physics-yearbook-local/
├── yearbook-backend/
│   ├── app/
│   ├── schema.sql
│   ├── seed_super_admin.py
│   ├── requirements.txt
│   └── .env.example
├── yearbook-frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
└── README.md
```

## Verification performed before packaging

- All Python backend files pass Python bytecode compilation.
- Frontend package metadata and source tree were checked.
- Frontend API wrappers were checked against the backend route structure.
- The original project was preserved; no secrets/passwords were packaged.

### Environment limitation

A full runtime integration test could not be executed in this environment because the required external Python/Node packages were not available locally and this environment has no package-registry network access. The package therefore includes the exact dependency manifests so it can be installed and run on your Mac/local machine.

Once dependencies are installed, the fastest runtime check is:

```bash
# backend
curl http://localhost:8000/api/health

# frontend
npm run build
```

If the backend health request returns `{"status":"ok"}` and the frontend build completes, the two applications are starting correctly.
cd Desktop/Projects/YB/physics/backend
 cd Desktop/Projects/YB/physics/frontend