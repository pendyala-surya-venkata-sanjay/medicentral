# Realtime Architecture

## Transport

- Socket.io on same Node process as Express
- JWT validated on connection (staff sessions)
- Events: queue updates, visit changes, platform feed (where enabled)

## Client

- `socket.io-client` in frontend context/hooks
- Dashboards subscribe per tenant/department
- Graceful degradation to HTTP polling if socket unavailable

## Production

- `ENABLE_SOCKET=true`
- NGINX: WebSocket upgrade on `/socket.io/`
- Health: `getSocketStats()` in detailed health payload

## Monitoring

Command Center shows connected client count via Launch Health panel.
