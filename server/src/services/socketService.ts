import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { config } from '../utils/config';
import { getSessionByToken, getSessionById } from './sessionService';
import { FileItem } from '../types';

let io: SocketIOServer | null = null;

export function initSocketServer(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    socket.on('join_pc_session', (data: { token?: string; sessionId?: string }) => {
      let session = null;
      if (data.token) {
        session = getSessionByToken(data.token);
      } else if (data.sessionId) {
        session = getSessionById(data.sessionId);
      }

      if (session) {
        const roomName = `session:${session.id}`;
        socket.join(roomName);
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function notifyPhoneConnected(sessionId: string, pcId: string): void {
  if (io) {
    io.to(`session:${sessionId}`).emit('phone_connected', {
      pcId,
      timestamp: new Date().toISOString()
    });
  }
}

export function notifyFilesReceived(sessionId: string, files: FileItem[], totalFiles: number): void {
  if (io) {
    io.to(`session:${sessionId}`).emit('files_received', {
      files,
      totalFiles
    });
  }
}

export function notifyFileDeleted(sessionId: string, fileId: string): void {
  if (io) {
    io.to(`session:${sessionId}`).emit('file_deleted', { fileId });
  }
}

export function notifySessionExpired(sessionId: string, reason: string = 'Session expired'): void {
  if (io) {
    io.to(`session:${sessionId}`).emit('session_expired', { reason });
  }
}

export function notifySessionClosed(sessionId: string, reason: string = 'Session closed by user'): void {
  if (io) {
    io.to(`session:${sessionId}`).emit('session_closed', { reason });
  }
}
