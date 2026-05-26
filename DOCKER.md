# Docker Desktop — MediCentral

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and **running**
- WSL2 backend enabled (recommended on Windows)

## Quick start

From the project root (`medicentral`):

```powershell
docker compose up --build
```

Or run detached (background):

```powershell
docker compose up --build -d
```

Stop everything:

```powershell
docker compose down
```

Reset database volume (fresh MongoDB):

```powershell
docker compose down -v
docker compose up --build
```

## URLs

| Service    | URL |
|-----------|-----|
| Web app   | http://localhost |
| API       | http://localhost:5000/api |
| API health| http://localhost:5000/health/ready |
| ML service| http://localhost:8000 |
| MongoDB   | `localhost:27017` (optional host tools) |

The web container proxies `/api` and WebSocket traffic to the API, so the browser uses a single origin (`http://localhost`).

## First-time use

1. Open http://localhost
2. **Register** patient, doctor, and staff accounts (database starts empty unless you seed)
3. Apollo / Yashoda hospitals are created automatically when the API starts

## Configuration

Copy `.env.docker.example` to `.env.docker` and set JWT secrets. The compose file sets `MONGO_URI` to the `mongo` service automatically.

## Troubleshooting

- **Port 80 in use** — change `frontend` ports to `"8080:80"` and open http://localhost:8080
- **Build fails on ML service** — first build downloads Python packages; allow several minutes
- **API unhealthy** — `docker compose logs backend` (wait for MongoDB healthcheck)
- **Cannot connect** — ensure Docker Desktop shows all containers as running

## Production-style stack

For external MongoDB (Atlas), use `docker-compose.prod.yml` and set `MONGO_URI` in a `.env` file.
