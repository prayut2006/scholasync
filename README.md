# ScholaSync — Modern Student & School Management System

ScholaSync is a comprehensive, production-grade School ERP and Student Information System built with a secure, database-connected, role-based architecture.

---

## 🌟 Key Features & Workspaces

The platform enforces strict server-side Role-Based Access Control (RBAC) across four distinct workspaces:

1. **👑 Principal / Super Administrator (`admin` / `PRINCIPAL`)**:
   - Complete school-level administrative control, institutional KPIs, and metrics.
   - Staff directory, permission delegation, and operational task delegation engine.
   - Faculty roster, workload analytics, and class teacher allocations.
   - Financial oversight (invoices, collections, outstanding balances).
   - Security audit logs tracking every critical state mutation.

2. **💼 Administrative Staff (`staff` / `STAFF`)**:
   - Centralized fee ledger and student invoicing.
   - Payment entry supporting Cash, UPI, and Bank Transfer with official CBSE fee receipt generation.
   - Student admissions registry and demographic records management.
   - Real-time operational task tracking assigned by administration.

3. **👨‍🏫 Teachers & Faculty (`teacher` / `TEACHER`)**:
   - Daily attendance register with automatic attendance rate recalculation.
   - CBSE gradebook and examination marks entry with grade point calculations.
   - Homework & assignment creator with student submission grading and feedback.
   - Academic schedules and assigned class rosters.

4. **🎓 Students (`student` / `STUDENT`)**:
   - Personalized student portal with attendance percentage and academic performance history.
   - Homework submission system with teacher grading and remarks.
   - Class timetable and examination schedule.
   - Fee statements, vouchers, and payment transaction history.

---

## 🛠 Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Motion
- **Backend**: Express.js, TypeScript, Node.js
- **Database & ORM**: MySQL 8.x with Prisma ORM v6
- **Authentication**: JWT authentication with bcrypt password hashing
- **Deployment**: Render (Unified Web Service architecture)

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- MySQL (v8.0+) running locally or a remote cloud MySQL instance

### 2. Environment Configuration
Copy `.env.example` to `.env` and set your database connection:
```bash
cp .env.example .env
```

Configure the following variables in `.env`:
```env
DATABASE_URL="mysql://<user>:<password>@127.0.0.1:3306/scholasync"
JWT_SECRET="YOUR_CRYPTOGRAPHICALLY_SECURE_SECRET_AT_LEAST_32_CHARS"
NODE_ENV="development"
PORT=3000
```

### 3. Install Dependencies & Generate Prisma Client
```bash
npm install
npx prisma generate
```

### 4. Database Setup & Seeding
Push the schema to MySQL and populate comprehensive CBSE demonstration records:
```bash
npx prisma db push
npm run db:seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Default Demo Credentials (Development Only)

| Role | Email | Password |
|---|---|---|
| **Principal** | `principal@scholasync.in` | `admin123` |
| **Staff (Finance)** | `finance.staff@scholasync.in` | `staff123` |
| **Staff (Admissions)** | `admissions.staff@scholasync.in` | `staff123` |
| **Teacher (Physics)** | `marcus.verma@scholasync.in` | `teacher123` |
| **Teacher (Mathematics)**| `priya.nair@scholasync.in` | `teacher123` |
| **Student** | `aarav.sharma@scholasync.in` | `student123` |

---

## ☁️ Production Deployment on Render

This repository is pre-configured with a Render Blueprint (`render.yaml`).

### Option A: Render Blueprint (One-Click)
1. Push this repository to your GitHub account (`scholasync-school-management-system`).
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository. Render will automatically parse `render.yaml`.
5. Enter your managed MySQL `DATABASE_URL` (from PlanetScale, Aiven, Railway, or AWS RDS).
6. Click **Apply**.

### Option B: Manual Web Service on Render
- **Environment**: Node
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm run start`
- **Health Check Path**: `/health`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: `10000`
  - `DATABASE_URL`: `mysql://<user>:<password>@<host>:<port>/<dbname>?sslaccept=strict`
  - `JWT_SECRET`: Generate a random 64-character secret

### Database Migrations in Production
Before the web service accepts traffic, apply database migrations:
```bash
npm run db:migrate
```
*(Or use `npm run db:push` if deploying to an uninitialized database).*

---

## 🩺 Health & Diagnostic Endpoints

- `GET /health`: Platform health check (returns service status and uptime).
- `GET /api/health`: REST API health check.
- `GET /api/health/db`: Database connectivity and latency diagnostic via Prisma without exposing connection strings or credentials.

---

## 🔒 Security Measures

- **Zero Plaintext Passwords**: All credentials hashed with 10-round bcrypt.
- **Server-Side RBAC**: Every sensitive endpoint strictly checks JWT role signatures.
- **Rate Limiting**: Authentication endpoints are rate-limited to mitigate brute-force attempts.
- **SQL Injection Prevention**: 100% parameterized queries via Prisma ORM.
- **Financial Integrity**: ACID database transactions for payment processing and balance adjustments.
