import { Server } from "socket.io";

let io: Server;

export const initSocket = (server: any, allowedOrigins: string[] = []) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : false,
      credentials: true,
    },
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket not initialized");
  }
  return io;
};