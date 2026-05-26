# Deploy API on Render

## Build failed: `open Dockerfile: no such file or directory`

Render was set to **Docker** but looked for `Dockerfile` in the repo root. This repo now includes a **root `Dockerfile`** for that setup.

**Recommended (faster builds):** In Render Dashboard → your service → **Settings**:

| Setting | Value |
|---------|--------|
| **Root Directory** | `backend` |
| **Runtime** | `Node` (not Docker) |
| **Build Command** | `npm install --omit=dev` |
| **Start Command** | `node server.js` |
| **Health Check Path** | `/health/ready` |

Save and **Manual Deploy**.

**Docker alternative:** Keep runtime **Docker**, leave root directory empty, use `./Dockerfile` at repo root (included in latest `main`).

---

## Required environment variables

| Key | Example |
|-----|---------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | 32+ random characters |
| `JWT_REFRESH_SECRET` | 32+ random characters |
| `CORS_ORIGIN` | `https://medicentral-swart.vercel.app` |
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `true` |
| `ENABLE_SOCKET` | `true` |
| `SEED_DEMO_DATA` | `false` |

---

## Blueprint deploy

Connect the GitHub repo and apply `render.yaml` for `medicentral-api` + optional `medicentral-ml`.

After deploy: `https://YOUR-SERVICE.onrender.com/health/ready` should return `"ready": true`.

Set Vercel `VITE_API_URL` to `https://YOUR-SERVICE.onrender.com/api`.
