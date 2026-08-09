# Mini ERP + CRM Operations Portal

A full-stack ERP/CRM system for wholesale/distribution companies. Manages customers, products, inventory, and sales challans with role-based access control.

## Live Demo (if deployed)

| Service  | URL |
|----------|-----|
| Frontend | https://erp-portal.vercel.app |
| Backend  | https://erp-backend.onrender.com |

## Test Credentials

| Role      | Email                 | Password   |
|-----------|-----------------------|------------|
| Admin     | admin@erp.com         | Admin@123  |
| Sales     | sales@erp.com         | Sales@123  |
| Warehouse | warehouse@erp.com     | Ware@123   |
| Accounts  | accounts@erp.com      | Acct@123   |

---

## Tech Stack

| Layer      | Tech                                         |
|------------|----------------------------------------------|
| Backend    | Node.js 20, TypeScript, Express.js           |
| ORM        | Prisma 5                                     |
| Database   | PostgreSQL 16                                |
| Auth       | JWT (bcryptjs)                               |
| Validation | Zod                                          |
| Frontend   | React 18 + TypeScript + Vite                 |
| HTTP       | Axios                                        |
| UI         | Vanilla CSS (custom dark design system)      |
| Icons      | Lucide React                                 |
| Deployment | Render (backend) + Vercel (frontend)         |

---

## Project Structure

```
FUNDSROOM/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Seed data
│   ├── src/
│   │   ├── config/            # DB, env config
│   │   ├── middleware/        # Auth, validate, error handlers
│   │   ├── modules/
│   │   │   ├── auth/          # Login, JWT
│   │   │   ├── customers/     # CRM module
│   │   │   ├── products/      # Products + stock
│   │   │   ├── challans/      # Sales challan flow
│   │   │   └── dashboard/     # Stats aggregation
│   │   ├── utils/             # Pagination, challan number
│   │   ├── app.ts
│   │   └── server.ts
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios client + API functions
│   │   ├── components/        # Shared UI components
│   │   ├── contexts/          # AuthContext
│   │   ├── layouts/           # Sidebar, Topbar, DashboardLayout
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── customers/
│   │   │   ├── products/
│   │   │   └── challans/
│   │   ├── types/             # TypeScript interfaces
│   │   ├── utils/             # format.ts
│   │   └── index.css          # Full design system
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Local Setup (Without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ (or use Docker just for the DB)

### 1. Clone and navigate
```bash
git clone <repo-url>
cd FUNDSROOM
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env and set your DATABASE_URL
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```
Backend runs at: http://localhost:3001

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:3001/api (already set)
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

---

## Local Setup (With Docker)

```bash
# From project root
docker-compose up --build
```

- Frontend: http://localhost:80
- Backend API: http://localhost:3001
- Database: localhost:5432

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/erp_crm_db
JWT_SECRET=your_very_long_random_secret_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3001/api
```

---

## API Documentation

### Authentication
```
POST /api/auth/login     { email, password } → { token, user }
GET  /api/auth/me        (Bearer token) → user info
```

### Customers
```
GET    /api/customers                    ?page&limit&search&status&customerType
POST   /api/customers                    { name, mobile, email, ... }
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id                (admin only)
POST   /api/customers/:id/followups      { note }
GET    /api/customers/:id/followups
```

### Products
```
GET    /api/products                     ?page&limit&search&categoryId
POST   /api/products                     (admin/warehouse only)
GET    /api/products/:id
PUT    /api/products/:id                 (admin/warehouse only)
DELETE /api/products/:id                 (admin only)
GET    /api/products/low-stock
GET    /api/products/categories
POST   /api/products/categories          { name }
GET    /api/products/stock-movements     ?productId&movementType
POST   /api/products/stock-movements     { productId, quantityChanged, movementType, reason }
```

### Challans
```
GET    /api/challans                     ?page&limit&status&search
POST   /api/challans                     { customerId, items[], status }
GET    /api/challans/:id
PUT    /api/challans/:id                 (draft only)
PATCH  /api/challans/:id/confirm         (deducts stock)
PATCH  /api/challans/:id/cancel
```

### Dashboard
```
GET    /api/dashboard/stats
```

---

## Key Business Logic

### Stock Safety (Challans)
- Confirming a challan runs inside a Prisma `$transaction`
- If ANY product lacks sufficient stock, the entire operation is rolled back
- Error response: `409 Conflict` with details of which product(s) are insufficient
- Stock is NEVER allowed to go negative

### Challan State Machine
```
draft ──► confirmed ──► (terminal)
  │
  └──► cancelled ──► (terminal)
```
- Only draft challans can be edited or confirmed
- Cancellation does NOT auto-restore stock (requires manual stock IN)

### Challan Number Format
- `CH-YYYYMM-XXXX` — e.g. `CH-202608-0001`
- Sequential within each month

---

## Deployment Guide

### Option 1: Render + Vercel + Neon (Free, Recommended)

#### Database (Neon)
1. Create account at https://neon.tech
2. Create a new project → copy connection string
3. Set as `DATABASE_URL` in backend env

#### Backend (Render)
1. Push to GitHub
2. Create Render Web Service → connect repo → set root as `backend`
3. Build command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
4. Start command: `npm start`
5. Add all environment variables

#### Frontend (Vercel)
1. Import GitHub repo to Vercel
2. Set root as `frontend`
3. Set `VITE_API_URL` to your Render backend URL
4. Deploy

---

## Role-Based Access

| Feature          | Admin | Sales | Warehouse | Accounts |
|------------------|-------|-------|-----------|----------|
| Customers CRUD   | ✅    | ✅    | ❌        | ❌       |
| View customers   | ✅    | ✅    | ❌        | ❌       |
| Products CRUD    | ✅    | 👁    | ✅        | 👁        |
| Stock adjust     | ✅    | ❌    | ✅        | ❌       |
| Challans CRUD    | ✅    | ✅    | 👁        | 👁        |
| Delete anything  | ✅    | ❌    | ❌        | ❌       |
| Dashboard        | ✅    | ✅    | ✅        | ✅       |

---

## Architecture

```
React SPA (Vite)
    │  Axios + JWT
    ▼
Express.js API (TypeScript)
    │  Zod validation
    │  JWT auth middleware
    │  RBAC middleware
    │  Prisma ORM
    ▼
PostgreSQL Database
```

---

## Known Limitations / Future Work

1. **Invoice module** — not included (not in required spec); can be added by converting a confirmed challan
2. **PDF export** — not implemented in this version
3. **User management UI** — users can only be created via seed; no admin UI for user management
4. **Token storage** — JWT stored in `localStorage` (not httpOnly cookie) for simplicity
5. **Stock on cancel** — cancelling a challan does not auto-restore stock; warehouse must do manual stock IN
6. **Real-time updates** — no WebSocket; requires page refresh to see changes from other users

---

## Assumptions

1. One role per user; roles are fixed at creation
2. GST number is optional
3. Product snapshots in challans store prices at time of creation (price changes don't affect old challans)
4. Cancellation stock reversal is a business decision left to the warehouse team via manual stock IN
