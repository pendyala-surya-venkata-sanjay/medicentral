# Deploy MediCentral (Vercel + Render)

Vercel runs the **React frontend** only. The **API** (Express + MongoDB + WebSockets) must run on [Render](https://render.com) (free tier works). This is normal — Vercel does not host long-running Node servers with databases.

| Part | Platform | URL (example) |
|------|----------|----------------|
| Frontend | [Vercel](https://vercel.com) | `https://medicentral.vercel.app` |
| API | [Render](https://render.com) | `https://medicentral-api.onrender.com` |
| Database | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | connection string |

---

## Step 1 — MongoDB Atlas (5 min)

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. **Database Access** → add user + password.
3. **Network Access** → **Allow access from anywhere** (`0.0.0.0/0`) for Render.
4. **Connect** → copy connection string, e.g.  
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/medicentral?retryWrites=true&w=majority`  
   (encode `@` in password as `%40` if needed.)

---

## Step 2 — Deploy API on Render (10 min)

1. Push code to GitHub: [medicentral](https://github.com/pendyala-surya-venkata-sanjay/medicentral).
2. [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint** → connect repo → use `render.yaml`.
3. Or **New Web Service** → repo → **Root Directory:** `backend` → **Build:** `npm install` → **Start:** `node server.js`.
4. Set environment variables:

| Key | Value |
|-----|--------|
| `MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | 32+ random characters |
| `JWT_REFRESH_SECRET` | 32+ random characters |
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `true` |
| `ENABLE_SOCKET` | `true` |
| `CORS_ORIGIN` | `https://YOUR-APP.vercel.app` (set after Vercel deploy) |
| `ML_SERVICE_URL` | optional — leave empty or deploy `ml-service` separately |

5. Wait until **Live**. Open `https://YOUR-SERVICE.onrender.com/health/ready` → should show `"ready": true`.

**Copy your API base URL**, e.g. `https://medicentral-api.onrender.com`

---

## Step 3 — Deploy frontend on Vercel (5 min)

1. Open: [Import medicentral on Vercel](https://vercel.com/new/clone?repository-url=https://github.com/pendyala-surya-venkata-sanjay/medicentral&project-name=medicentral&root-directory=.)
2. Sign in with GitHub if asked.
3. **Framework Preset:** Vite (auto-detected from `vercel.json`).
4. **Root Directory:** leave as **`.`** (repo root) — `vercel.json` builds `frontend/`.
5. **Environment variables** (required for production build):

| Name | Value |
|------|--------|
| `VITE_API_URL` | `https://YOUR-SERVICE.onrender.com/api` |

6. Click **Deploy**.

When the build finishes, open the Vercel URL (e.g. `https://medicentral.vercel.app`).

---

## Step 4 — Link frontend ↔ API

1. In **Render** → your API service → **Environment** → set  
   `CORS_ORIGIN` = your Vercel URL (no trailing slash), e.g.  
   `https://medicentral.vercel.app`  
   Preview deployments on `*.vercel.app` are already allowed by the API.
2. **Redeploy** the Render service after changing env vars.

---

## Step 5 — Verify

1. Vercel URL loads the landing page.
2. Register a patient / doctor / staff account.
3. If login fails, check browser **Network** tab — API calls should go to `onrender.com`, not `localhost`.

---

## Common Vercel errors

| Error | Fix |
|-------|-----|
| Build fails on `npm ci` | Repo uses `npm install` in `vercel.json` — redeploy latest `main`. |
| Blank page after deploy | Set `VITE_API_URL` before build; redeploy. |
| API / CORS errors | Set `CORS_ORIGIN` on Render to your Vercel URL; redeploy API. |
| `Could not reach server` | `VITE_API_URL` must be `https://...onrender.com/api` (include `/api`). |

---

## Optional — ML service on Render

Add a second Render **Web Service** with **Root Directory** `ml-service`, Docker runtime, port `8000`. Set `ML_SERVICE_URL` on the API service to that URL.

---

## Team import link

[Vercel — New project (your team)](https://vercel.com/new?teamSlug=pendyala-surya-venkata-sanjays-projects)

Use **Import Git Repository** → `pendyala-surya-venkata-sanjay/medicentral`.
