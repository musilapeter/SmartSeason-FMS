# 🌾 SmartSeason — Field Monitoring System

A robust, role-based web application for tracking crop progress across multiple agricultural fields during a growing season. Administrators get a powerful oversight dashboard to manage fields and assign agents, while field agents receive a streamlined, mobile-friendly interface for submitting crop status updates.

---

## 📁 Project Structure

This project is organized as a **monorepo** using npm workspaces:

```
smartseason/
├── frontend/          # Vite + React + TypeScript SPA
│   ├── src/
│   │   ├── components/    # Reusable UI components (Layout, StatusBadge, etc.)
│   │   ├── lib/           # API client, Supabase client, auth context
│   │   ├── pages/         # Route-level pages (Dashboard, FieldDetail, Login, Signup)
│   │   │   └── admin/     # Admin-only pages (AdminDashboard, UsersManager, FieldsManager)
│   │   └── types/         # Shared TypeScript type definitions
│   ├── public/            # Static assets
│   └── vite.config.ts     # Vite config with API proxy
├── backend/           # Express + TypeScript API server
│   └── src/
│       └── index.ts       # Server entry point with health check endpoint
├── supabase/          # Database migration files
│   └── migrations/
│       └── 001_initial_schema.sql
├── package.json       # Root workspace config + dev scripts
├── vercel.json        # Vercel deployment configuration
└── .env               # Environment variables (not committed)
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** v18+ and **npm** v9+
- A [Supabase](https://supabase.com) project with the initial schema migration applied

### 1. Clone & Install

```bash
git clone https://github.com/musilapeter/SmartSeason-FMS.git
cd SmartSeason-FMS
npm install
```

npm workspaces will automatically install dependencies for both `frontend/` and `backend/`.

### 2. Environment Variables

Create a `.env` file in the **project root** (not inside frontend or backend):

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server
PORT=3001
NODE_ENV=development

# Client (prefixed with VITE_ for Vite exposure)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001/api
```

The frontend's `vite.config.ts` is configured with `envDir: '../'` to read this root-level `.env` file.

### 3. Database Setup

Apply the schema migration by running the contents of `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor. This creates:
- `profiles` table (linked to Supabase Auth)
- `fields` table (agricultural fields being monitored)
- `field_updates` table (timestamped crop observations)
- Row Level Security (RLS) policies
- Auto-profile creation trigger on signup

### 4. Run Locally

```bash
npm run dev
```

This single command uses `concurrently` to start both:
- **Frontend** → Vite dev server on `http://localhost:5173`
- **Backend** → Express API server on `http://localhost:3001`

The frontend automatically proxies all `/api` requests to the backend.

---

## ☁️ Deploying to Vercel

The project includes a `vercel.json` that handles monorepo deployment:

1. Import this repository in your [Vercel Dashboard](https://vercel.com).
2. Leave the **Root Directory** set to `./`.
3. Add your environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc.) in the Vercel project settings.
4. Vercel will automatically run `npm run build`, which compiles both workspaces, and serve the frontend from `frontend/dist`.

> **Note:** The Express backend is used for local development only. In production, the frontend communicates directly with Supabase via the client SDK and RLS policies handle data security.

---

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | View all fields, create new fields, assign agents, manage users, view all updates |
| **Field Agent** | View assigned fields only, submit crop stage updates and observation notes |

- Public signups via `/signup` default to the **Field Agent** role.
- Admin privileges must be set directly in the `profiles` table in Supabase.

---

## ⚙️ Field Status Logic (Computed Status)

Each field's health status is **dynamically computed** — not manually set:

| Condition | Status |
|-----------|--------|
| Field stage is `Harvested` | **Completed** |
| No updates recorded, OR last update is older than **7 days**, OR latest note contains keywords like `"pest"` or `"disease"` | **At Risk** |
| Recently updated with no concerning keywords | **Active** |

---

## 🧠 Design Decisions

1. **Monorepo with npm Workspaces**: The frontend and backend live side-by-side in a single repository, sharing a root `package.json` for orchestration. A single `npm install` and `npm run dev` gets everything running.

2. **Adaptive Dashboard**: Rather than building separate admin and agent interfaces, the `<Dashboard />` component dynamically adapts its UI based on the authenticated user's role — reducing code duplication while maintaining clear separation of concerns.

3. **Supabase-First Architecture**: Authentication, database, and Row Level Security are all handled by Supabase. The Express backend serves as a lightweight API layer for any server-side logic, while the frontend uses the Supabase JS client directly for real-time data access.

4. **RLS with SECURITY DEFINER**: Admin profile visibility uses a `public.is_admin()` PostgreSQL function with `SECURITY DEFINER` to safely bypass RLS for admin role checks — avoiding the common circular policy trap with self-referencing tables.

5. **Premium Light Theme**: A clean, modern UI using Tailwind CSS with emerald/green brand colors, glassmorphic cards, and subtle animations — designed for readability in outdoor field conditions.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7 |
| Backend | Express 4, TypeScript, tsx (dev server) |
| Database | Supabase (PostgreSQL), Row Level Security |
| Auth | Supabase Auth (email/password) |
| Deployment | Vercel |
| Monorepo | npm Workspaces, Concurrently |

---

## 📜 Assumptions

1. **Supabase Email Confirmation** is enabled. Signups redirect users to a "Check your email" screen before granting access.
2. **Admin elevation** is a manual database operation — there is no self-service admin registration to prevent unauthorized access.
3. **Field agents are pre-registered** by an admin or via the public signup flow, and are assigned to fields through the admin dashboard.
