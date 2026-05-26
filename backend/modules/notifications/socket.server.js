import { Server } from 'socket.io';
import { SOCKET_EVENTS, SOCKET_NAMESPACES, buildBranchRoom } from './socket.events.js';

let io = null;

/**
 * Initialize Socket.IO foundation (opt-in via ENABLE_SOCKET=true).
 * @param {import('http').Server} httpServer
 */
export const initSocketFoundation = (httpServer) => {
  if (process.env.ENABLE_SOCKET === 'false') {
    console.log('[Socket] Disabled (ENABLE_SOCKET=false)');
    return null;
  }

  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
      credentials: true,
    },
    path: '/socket.io',
  });

  const queuesNs = io.of(SOCKET_NAMESPACES.QUEUES);
  queuesNs.on('connection', (socket) => {
    socket.on(SOCKET_EVENTS.JOIN_BRANCH, ({ tenantSlug, branchSlug }) => {
      if (tenantSlug && branchSlug) {
        socket.join(buildBranchRoom(tenantSlug, branchSlug));
      }
    });

    socket.on(SOCKET_EVENTS.LEAVE_BRANCH, ({ tenantSlug, branchSlug }) => {
      if (tenantSlug && branchSlug) {
        socket.leave(buildBranchRoom(tenantSlug, branchSlug));
      }
    });
  });

  console.log('[Socket] Foundation initialized on /queues namespace');
  return io;
};

export const getIO = () => io;

export const getSocketStats = () => {
  if (!io) return { enabled: false, connected: 0 };
  const queuesNs = io.of(SOCKET_NAMESPACES.QUEUES);
  return {
    enabled: true,
    connected: queuesNs.sockets.size,
    namespaces: [SOCKET_NAMESPACES.QUEUES],
  };
};

/**
 * Emit queue update to branch room (no-op if socket disabled).
 */
export const emitQueueUpdate = (tenantSlug, branchSlug, event, payload) => {
  if (!io) return;
  io.of(SOCKET_NAMESPACES.QUEUES)
    .to(buildBranchRoom(tenantSlug, branchSlug))
    .emit(event, payload);
};

export default { initSocketFoundation, getIO, emitQueueUpdate };
