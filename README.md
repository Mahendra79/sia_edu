# SIA_EDU

Full stack education platform with:
- Frontend: React (Vite) + CSS
- Backend: Django + Django REST Framework
- Database: PostgreSQL (`SIA_EDU`)
- Auth: JWT access/refresh tokens
- Payments: Razorpay Checkout + webhook verification

## 1. Backend Setup

```powershell
cd backend
python -m pip install -r requirements.txt
```

Create `backend/.env` from `backend/.env.example` and set:
- `DJANGO_SECRET_KEY` (always required)
- PostgreSQL credentials for `SIA_EDU`
- Razorpay secrets (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`)
- `DEV_PAYMENT_MODE=False` for local mock payment simulation (auto success, no Razorpay popup)
- `DEV_PAYMENT_MODE=True` for real Razorpay flow (requires Razorpay keys on server)
- `AUTH_DEBUG_TOKENS=True` only if you want verification/reset tokens returned in API responses during local testing

Notes:
- Production-safe defaults are enabled (`DJANGO_DEBUG=False`, `DEV_PAYMENT_MODE=False`).
- For local development you can set `DJANGO_DEBUG=True` and disable forced HTTPS redirect in `.env` (`DJANGO_SECURE_SSL_REDIRECT=False`).
- For Render deployment, set backend env vars with exact origins (no trailing `/`):
  - `DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost,sia-edu.onrender.com` (hostnames only, never `https://...`)
  - `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://siasoftwareinnovationseducation.onrender.com`
  - `DJANGO_CSRF_TRUSTED_ORIGINS=http://127.0.0.1:8000,http://localhost:8000,http://localhost:5173,http://127.0.0.1:5173,https://siasoftwareinnovationseducation.onrender.com` (frontend origins, not backend host)
  - `FRONTEND_BASE_URL=https://siasoftwareinnovationseducation.onrender.com`
  - Prefer `DATABASE_URL=postgresql://...` from Render Postgres connection string (if set, backend uses it directly).
  - Use Render start command: `bash backend/render-start.sh`
  - This ensures `python manage.py migrate --noinput` runs on every deploy, which is required for JWT login/signup tables (`token_blacklist_*`).

Run migrations and server:

```powershell
python manage.py migrate
python manage.py seed_courses
python manage.py runserver
```

## 2. Frontend Setup

```powershell
cd frontend
npm install
```

Create `frontend/.env` from `frontend/.env.example`, then run:

```powershell
npm run dev
```

## 3. Key API Routes

- Auth: `/api/auth/...`
- Courses: `/api/courses/...`
- Payments: `/api/payments/...`
- Analytics: `/api/analytics/...`
- Deleted records: `/api/deleted-records/...`

Stripe webhook endpoint:
- `/api/payments/webhook/`

## 5. Chatbot RAG + QA Pipeline

Admin API:
- Chat message: `/api/chatbot/message/`
- Evaluation suite (admin only): `/api/chatbot/evaluate/`

Backend commands:

```powershell
cd backend
python manage.py evaluate_chatbot --max-cases 6
python manage.py evaluate_chatbot --use-model --max-cases 6 --output chatbot_eval_report.json
python manage.py export_chatbot_finetune --output chatbot_finetune_dataset.jsonl
```

## 4. Implemented Feature Coverage

- Navy default theme + light/dark mode toggle using CSS variables + `localStorage`
- JWT login/signup/profile, refresh handling, logout, email verification, password reset
- Role-based protected routes + backend permission classes
- Home live search, debounced course fetch, pagination, search highlighting
- Course ratings/reviews, admin course CRUD with soft delete + confirm modal
- Billing page with DB price/tax/total and Stripe checkout session
- Success/failure payment flow with transaction persistence and enrollment updates
- User dashboard/profile/my-courses/payment history with filters + pagination
- Admin dashboard with revenue/users/courses + Chart.js graphs
- Separate forgot-password page flow (`/forgot-password`)
- Admin users management, soft delete, per-user payment history
- Admin payments list with filters (status/course/date)
- Global toasts, loading spinner, error boundary, 404 page, page transitions
- API throttling, webhook signature verification, input validation, soft-delete audit table
- OTP support for email verification and password reset (`email + otp_code`)
- Dev payment mode that still stores transactions and enrollments without live Stripe



cd backend
venv\scripts\activate
python manage.py runserver



cd frontend
npm run dev 



