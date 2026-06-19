import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Map<string, boolean>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect when we have an authenticated user
    if (!user) {
      // If user logs out, disconnect any existing socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
        setTypingUsers(new Map());
      }
      return;
    }

    // Don't reconnect if already connected for the same user
    if (socketRef.current?.connected) {
      return;
    }

    // Connect via the Vite dev proxy (same origin) so cookies are sent automatically.
    // In production the socket.io path is served from the same host.
    const newSocket = io({
      withCredentials: true,
      // No explicit URL — defaults to window.location (i.e. the Vite proxy)
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("⚡ Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      setIsConnected(false);
    });

    // Full online-user list on first connect
    newSocket.on("users:online", (userIds: string[]) => {
      setOnlineUsers(new Set(userIds));
    });

    // A single user came online
    newSocket.on("user:online", (userId: string) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    });

    // A single user went offline
    newSocket.on("user:offline", (userId: string) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // Typing indicators
    newSocket.on("typing:start", ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(userId, true);
        return next;
      });
    });

    newSocket.on("typing:stop", ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers, typingUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
