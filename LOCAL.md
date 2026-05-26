# Run MediCentral locally

## Prerequisites

- **Node.js 20+**
- **MongoDB** — one of:
  - Docker Desktop → `docker compose up -d mongo` (from project root), or
  - [MongoDB Community](https://www.mongodb.com/try/download/community) running on `127.0.0.1:27017`, or
  - MongoDB Atlas (set `MONGO_URI` in `backend/.env`)
- **Python 3.10+** (optional, for symptom assistant / OCR)

## One-command start (Windows)

```powershell
cd c:\Users\hp\Desktop\medicentral
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
npm run dev
```

Opens **http://localhost:5173** and starts API on **http://localhost:5000**.

## Manual start (3 terminals)

### 1. MongoDB (if not already running)

```powershell
docker compose up -d mongo
```

### 2. Backend

```powershell
cd backend
copy .env.example .env   # first time only
npm install
npm run dev
```

Check: http://localhost:5000/health → `"status":"ok"`

### 3. Frontend

```powershell
cd frontend
copy .env.example .env   # first time only — must be VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**).

### 4. ML service (optional)

```powershell
cd ml-service
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8000
```

## First-time test flow

1. http://localhost:5173/register — create **Patient**, **Doctor**, **Staff (Reception)** (use Apollo + branch).
2. Staff → **Reception desk** — register patient, forward to doctor.
3. Doctor → accept → save prescription → **Follow-up** or **Ready for discharge**.
4. Staff → **Follow-up & records** / **Revenue & billing**.

## Common issues

| Problem | Fix |
|---------|-----|
| `could not reach server` | `frontend/.env` → `VITE_API_URL=http://localhost:5000/api`, restart `npm run dev` |
| MongoDB connection failed | Start Mongo (`docker compose up -d mongo`) or fix `MONGO_URI` in `backend/.env` |
| Port 5000 in use | Stop other Node apps or change `PORT` in `backend/.env` |
| Prescription / workflow errors | Log out and log in again after backend code updates |

## Reset local database

```powershell
cd backend
npm run reset
```

Then register new accounts again.
