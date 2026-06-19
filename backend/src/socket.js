import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "./models/user.model.js";
import { Message } from "./models/message.model.js";
import { randomBytes } from "crypto";

let io;

// userId → Set<socketId>
const onlineUsers = new Map();

/**
 * Initialises the Socket.IO server, attaches auth middleware,
 * and registers all event handlers.
 *
 * @param {import("http").Server} httpServer
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CorsOrigin || "http://localhost:8080",
      credentials: true,
    },
  });

  // ─── Auth middleware ───────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      // Extract accessToken from cookies sent via handshake headers
      const cookieHeader = socket.handshake.headers.cookie || "";
      const tokenMatch = cookieHeader.match(/accessToken=([^;]+)/);
      const token = tokenMatch?.[1];

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded._id).select("-password -refreshToken");

      if (!user) {
        return next(new Error("Authentication error: Invalid token"));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error("Socket auth error:", err.message);
      next(new Error("Authentication error"));
    }
  });

  // ─── Connection handler ────────────────────────────────────────────
  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`⚡ Socket connected: ${socket.user.fullname} (${userId})`);

    // Track online presence
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Broadcast this user came online to everyone
    io.emit("user:online", userId);

    // Send the full online users list to the newly connected socket
    socket.emit("users:online", Array.from(onlineUsers.keys()));

    // ── Send a message ─────────────────────────────────────────────
    socket.on("message:send", async ({ receiverId, content }, ack) => {
      try {
        if (!receiverId || !content) {
          return ack?.({ error: "Receiver ID and content are required" });
        }

        const uniqueId = randomBytes(16).toString("hex");

        const message = await Message.create({
          id: uniqueId,
          sender: socket.user._id,
          receiver: receiverId,
          content,
          status: "sent",
        });

        const messageData = {
          _id: message._id.toString(),
          id: message.id,
          sender: message.sender.toString(),
          receiver: message.receiver.toString(),
          content: message.content,
          status: message.status,
          createdAt: message.createdAt,
        };

        // Emit to sender's sockets
        emitToUser(userId, "message:new", messageData);

        // Emit to receiver's sockets
        emitToUser(receiverId, "message:new", messageData);

        // Tell both parties to refresh their conversation lists
        emitToUser(userId, "conversations:update");
        emitToUser(receiverId, "conversations:update");

        ack?.({ success: true, message: messageData });
      } catch (err) {
        console.error("message:send error:", err);
        ack?.({ error: "Failed to send message" });
      }
    });

    // ── Mark messages as read ──────────────────────────────────────
    socket.on("message:read", async ({ otherUserId }) => {
      try {
        await Message.updateMany(
          {
            receiver: socket.user._id,
            sender: otherUserId,
            status: { $in: ["sent", "received"] },
          },
          { $set: { status: "read" } }
        );

        // Notify the other user that their messages were read
        emitToUser(otherUserId, "message:read", { readBy: userId });
        // Refresh both conversation lists so unread badges update
        emitToUser(userId, "conversations:update");
        emitToUser(otherUserId, "conversations:update");
      } catch (err) {
        console.error("message:read error:", err);
      }
    });

    // ── Typing indicators ──────────────────────────────────────────
    socket.on("typing:start", ({ receiverId }) => {
      emitToUser(receiverId, "typing:start", { userId });
    });

    socket.on("typing:stop", ({ receiverId }) => {
      emitToUser(receiverId, "typing:stop", { userId });
    });

    // ── Disconnect ─────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.user.fullname} (${userId})`);

      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit("user:offline", userId);
        }
      }
    });
  });

  return io;
}

/**
 * Emit an event to all sockets belonging to a specific user.
 */
function emitToUser(userId, event, data) {
  const sockets = onlineUsers.get(userId);
  if (sockets) {
    for (const socketId of sockets) {
      io.to(socketId).emit(event, data);
    }
  }
}

/**
 * Returns the initialised Socket.IO instance.
 */
export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialised. Call initSocket first.");
  }
  return io;
}
