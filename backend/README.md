# Physics Yearbook IITG — Backend

FastAPI + SQLAlchemy + MySQL. MVC-ish layout:
- `app/models/` — SQLAlchemy models (M)
- `app/schemas/` — Pydantic request/response contracts (V, in the API sense)
- `app/routers/` — controllers (route handlers + business logic — see note below)

## Setup
```bash
cd yearbook-backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # then edit DB creds, JWT_SECRET, etc.

mysql -u root -p < schema.sql
python seed_super_admin.py     # creates users.id = 1

uvicorn app.main:app --reload --port 8000
```
Docs at http://localhost:8000/docs

## What's implemented
- Batch-year-gated registration matched against `students`, OTP email verification (registration rejected outright without a verified OTP), login, forgot-password OTP flow.
- Public home feed: approved users only, grouped by batch, roll-no ascending, with the Fresher / Graduating / Recently Graduated / year tagging logic.
- Student detail page (feature photo, quote, all optional fields, core memories, gallery).
- Self-service dashboard: profile edit, mandatory quote, profile+feature photo upload with pending-approval workflow (old photo stays live until a new one is approved), gallery + core memories, own notifications.
- Admin/coordinator/super-admin: allowed-domain management (super admin only), manual + excel student roster import, role changes (admin creation restricted to super admin; coordinator grant/revoke available to admin+super admin), user approval, photo approval/rejection with self-approval blocked for admin/coordinator (super admin exempted per spec), position-of-responsibility tagging (CR/DPR/etc.).

## What is NOT implemented yet — do not assume otherwise
1. **No SMTP wired in.** `app/utils/mailer.py` logs OTPs/notifications to console when `MAIL_ENABLED=false`. Give me real SMTP/IITG mail-relay credentials and I'll flip it on — nothing else changes.
2. **No frontend changes made or added.** This backend matches the *existing* React components' data shape as closely as I could infer from `ProfileWorkspace.jsx` / `students.js` / `dummyUsers.js`. But your spec describes UI that doesn't exist in the uploaded project: OTP entry screen, batch-year-first registration flow, excel upload UI, coordinator's position-tagging control, the admin review/approve page, forgot-password UI. Those need new components before this API is actually usable end-to-end. I did not touch existing files.
3. **Excel import** expects columns `batch_year, name, roll_no, iitg_email` (case-insensitive, spaces→underscores). If your admin's real spreadsheet uses different headers, tell me and I'll adjust the parser rather than you reformatting every file.
4. **Role-change rules are my inference**, not a literal quote from your spec, because the spec doesn't say whether admins can demote a coordinator or whether super admin can create another super admin. I assumed: only super admin grants access_type=2 (admin); both admin and super admin can grant/revoke access_type=3 (coordinator); nobody can touch the super admin's own row. Correct me if wrong — this is a permissions boundary, worth confirming rather than guessing silently.
5. **Password reset invalidates old sessions implicitly** only in the sense that a new JWT is required post-reset — I did not build a token-blacklist, so an existing JWT stays valid until it expires (max 24h). Fine for a yearbook app; flag it if you disagree.

## Next step I'd take
Build the missing frontend pieces (item 2) as new components under `src/components/`, wired to this API, without touching what's already there — then you have something you can actually click through end-to-end instead of a backend sitting idle behind an incomplete UI.

---

## Update: frontend is now wired in

The `yearbook-frontend.zip` delivered alongside this backend replaces every localStorage mock with real API calls. **No CSS was touched** — same `App.css`, same class names, same layout. I only added a handful of new class rules (roll-no/position badge on cards, coordinator role-badge color, position-assign control) that follow the existing design tokens, documented inline in `App.css` with comments marking them as additions.

What changed, file by file:
- `src/api/*.js` — new: thin fetch wrappers for auth, students, dashboard, admin endpoints.
- `LoginPanel.jsx` — rewritten: real login; registration is now batch-year → details (matched against roster) → OTP → password; forgot-password OTP flow added. Same `login-*` CSS classes throughout.
- `App.jsx` — rewritten: pulls students from the API per selected year, restores session from a stored JWT, routes to `Dashboard` (access_type 1/2/3) or `ProfileWorkspace` (access_type 4).
- `ProfileWorkspace.jsx` — rewritten: mandatory quote + profile/feature photo enforced before save; uploads go straight to the backend and show pending/approved/rejected status inline; added optional PhD/academic/job fields; gallery and core-memory photos persist server-side instead of as base64 blobs.
- `StudentCard.jsx` / `StudentProfile.jsx` — extended (not restyled) to show roll number and position-of-responsibility where the spec asked for them.
- `UserManagement.jsx` — rewritten for the 4-tier access model, registration approval, and position assignment.
- `Dashboard.jsx` — rewritten with role-gated tabs.
- **New components**: `ContentApproval.jsx` (photo review queue), `RosterManagement.jsx` (manual add + excel import), `DomainManagement.jsx` (super admin's allowed-domains page). These didn't exist in any form before — I built them from the same class vocabulary as `UserManagement.jsx` so they don't look bolted on.
- Removed `src/data/dummyUsers.js` — dead code once nothing pointed at it. `src/data/students.js`'s comment-related helpers are untouched; the guestbook-comment feature isn't part of your spec and stays localStorage-only.

I ran an actual `npm run build` against this — it fails and I fix it wasn't a one-shot success; there was one bad import (`logout` pulled from the wrong module) that only a real build catches, and I corrected it before packaging. Build is currently clean.

### Setup
```bash
cd yearbook-frontend
cp .env.example .env   # set VITE_API_BASE if the backend isn't on localhost:8000
npm install
npm run dev
```

### Still not covered — flagging rather than guessing
1. **Forgot-password and OTP screens have no design precedent in your original mockup** — I built them inside `LoginPanel`'s existing panel/overlay so they at least sit in the right shell, but I made the layout call myself. Look at them before shipping.
2. **RosterManagement/ContentApproval/DomainManagement are new screens with no reference design.** I reused `UserManagement`'s card layout for consistency, but that's a judgment call, not something you approved.
3. Photo review currently shows the image and a text box for a rejection reason — no image-quality guidelines or preview cropping. If reviewers need side-by-side old-vs-new comparison, that's not built.

