# 🌾 SmartSeason - Field Monitoring System

A lightweight, robust web application built to help track crop progress across multiple fields during a growing season. The system seamlessly handles multi-user roles, providing administrators with a powerful oversight dashboard and field agents with a streamlined, mobile-friendly interface for updating crop statuses.

---

## 🚀 Setup Instructions

### Option 1: Local Development (Node.js)
1. **Clone the repository.**
2. **Install all dependencies** from the root:
   ```bash
   npm install
   ```
3. **Environment Setup**: 
   Ensure you have your `.env` file at the root configuring Supabase and your API.
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```
4. **Run the entire application concurrently**:
   ```bash
   npm run dev
   ```
   *This single command leverages workspaces to build the API and launch the Vite client simultaneously!*

### Option 2: Docker / Docker Compose
1. Ensure Docker Desktop is installed.
2. Run the composition:
   ```bash
   docker-compose up --build
   ```
3. The interface will be accessible at `http://localhost:5173`.

### Option 3: Deploying to Vercel (Monolithic Deployment)
Because the configuration includes a unified `vercel.json` file natively routing the frontend AND the backend, compiling this entire monorepo is seamless!
1. Log into your Vercel Dashboard and click "Add New Project", importing this repository directly from GitHub.
2. Ensure you leave the **Root Directory set to `./`** (do not select `client`). 
3. Vercel will automatically read the `vercel.json` file at the root. It will run `npm run build` across all workspaces (`shared`, `server`, `client`) and deploy both your React Vite application and your Node.js server seamlessly (converting your Express backend into auto-scaling Serverless Functions mapped to `/api`).
4. Under Environment Variables in the setup, ensure your `.env` variables from Supabase are loaded! (You **do not** need to manually set `VITE_API_URL` anymore, it automatically defaults to the same domain because it routes to `/api`).

---

## 🧠 Design Decisions

1. **Elegant Flat Architecture (Frontend)**:
   I specifically avoided an over-engineered nested routing system. Instead, the application relies on a unified `<Layout />` and `<Dashboard />` component. The views automatically morph natively based on whether the authenticated user is an **Admin** or a **Field Agent**, drastically reducing code duplication and making it incredibly straightforward to maintain.
   
2. **Premium Light Theme (UI)**:
   The application intentionally eschews default dark-mode styling for a crisp, tailored "Light Theme" emphasizing green/emerald core brand colors, glassmorphic cards, and pulse animations. This establishes an organic, modern, and accessible experience suitable for outdoor use by field agents.

3. **Decoupled Monorepo Structure**:
   The `/shared` folder exports precise TypeScript type definitions and constants (`CropStage`) perfectly synced between the backend Express routes and the frontend React components, preventing any data mismatches over the wire. `App.tsx` and the core views handle only DOM rendering, delegating API logic entirely to `lib/api.ts`.

4. **Computed Field Status Lifecycle**:
   Instead of forcing users to manually determine if a field is "At Risk", the application dynamically computes field health based strictly on empirical properties parsed from agent inputs. 

---

## ⚙️ Field Status Logic (Computed Status)

As requested, each field maintains a real-time tracking status. Our logic evaluates the field based on the following strict ruleset dynamically computed in the backend:

- **Harvested -> Completed**: Any field marked specifically as "Harvested" instantly and permanently surfaces as \"Completed\".
- **Stale or Bad Notes -> At Risk**: For fields currently active (Planted, Growing, Ready):
    - If there hasn't been a recorded logged update in **7 days**, it flags as "At Risk".
    - If the latest observation note contains concerning keywords (e.g., `"pest"`, `"disease"`), it automatically flags as "At Risk" utilizing natural inference.
- **Healthy -> Active**: If it is Planted, Growing, or Ready, has been updated recently, and no bad keywords are detected in the latest note, the field stays \"Active\".

---

## 🤔 Assumptions Made

1. **Authentication Scoping Mechanism**:
   We assume that public signups made through the newly implemented UI naturally default to the "Field Agent" role. Administrators cannot randomly sign up; they must manually elevate their permissions directly inside the database `profiles` table to uphold security.

2. **Email Verification enforced by Supabase**:
   We assume Supabase Email Confirmations are toggled **ON** in the associated project configuration. Therefore, the signup logic pauses and directs users to a "Check your email" wrapper rather than instantly signing them in. 

3. **Row Level Security (RLS) & Backend Trust**:
   To strictly execute the exact business logic and avoid locking the frontend due to complex Postgres RLS triggers, the `server/` routes utilize `supabaseAdmin` keys to orchestrate field status creation securely on the backend layer on behalf of the users (verified by incoming JWTs). The Express server completely controls data consistency.
