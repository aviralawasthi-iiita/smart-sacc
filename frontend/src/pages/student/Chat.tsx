import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Send, MoreVertical, MessageCircle, Clock, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { formatDistanceToNow } from "date-fns";
import { toast as sonner } from "sonner";

interface ApiConversation {
  otherUser: {
    _id: string;
    fullname: string;
    sport: string;
    isAvailable: boolean;
  };
  lastMessage: string;
  lastMessageStatus: string;
  lastMessageSender: string;
  lastMessageCreatedAt: string;
  unreadCount: number;
}

interface ApiMessage {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  createdAt: string;
}

const Chat = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { user, wrapApiCall } = useAuth();
  const { socket, isConnected, onlineUsers, typingUsers } = useSocket();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── REST queries for initial data load ──────────────────────────
  const { data: conversations, isLoading: isLoadingConversations } = useQuery<ApiConversation[]>({
    queryKey: ["conversations"],
    queryFn: () => wrapApiCall(() => api.get("/users/get-conversations"))
  });

  const fetchMessages = (otherUserId: string) => {
    return wrapApiCall(() => api.get(`/users/get-messages/${otherUserId}`)) as Promise<ApiMessage[]>;
  };

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["messages", selectedChatId],
    queryFn: () => fetchMessages(selectedChatId!),
    enabled: !!selectedChatId,
  });

  // ─── Socket.IO: real-time message handling ───────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: ApiMessage) => {
      console.log("⚡ [handleNewMessage] msg.sender:", msg.sender, "user._id:", user?._id);
      const chatPartnerId =
        String(msg.sender) === String(user?._id) ? String(msg.receiver) : String(msg.sender);
      
      console.log("⚡ [handleNewMessage] Received:", msg.content, "Partner:", chatPartnerId);

      queryClient.setQueryData<ApiMessage[]>(
        ["messages", chatPartnerId],
        (old) => {
          if (!old) return [msg];
          if (old.some(m => String(m._id) === String(msg._id))) return old;
          return [...old, msg];
        }
      );
      
      // Also invalidate to ensure we're perfectly in sync eventually
      queryClient.invalidateQueries({ queryKey: ["messages", chatPartnerId] });
    };

    const handleConversationsUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    socket.on("message:new", handleNewMessage);
    socket.on("conversations:update", handleConversationsUpdate);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("conversations:update", handleConversationsUpdate);
    };
  }, [socket, user?._id, queryClient]);

  // ─── Mark messages as read when opening a conversation ───────────
  useEffect(() => {
    if (socket && selectedChatId) {
      socket.emit("message:read", { otherUserId: selectedChatId });
    }
  }, [socket, selectedChatId]);

  // ─── Send message via socket ─────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!message.trim() || !selectedChatId || !socket) return;

    setIsSending(true);

    // Stop typing indicator
    socket.emit("typing:stop", { receiverId: selectedChatId });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    socket.emit(
      "message:send",
      { receiverId: selectedChatId, content: message },
      (response: any) => {
        setIsSending(false);
        if (response?.error) {
          sonner.error(response.error);
        } else {
          setMessage("");
        }
      }
    );
  }, [message, selectedChatId, socket]);

  // ─── Typing indicators ──────────────────────────────────────────
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value);

      if (!socket || !selectedChatId) return;

      // Emit typing:start (debounced)
      socket.emit("typing:start", { receiverId: selectedChatId });

      // Reset the "stop" timer
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing:stop", { receiverId: selectedChatId });
        typingTimeoutRef.current = null;
      }, 2000);
    },
    [socket, selectedChatId]
  );

  // ─── Auto-scroll to bottom ──────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Auto-select first conversation ─────────────────────────────
  const selectedChat = conversations?.find((c) => c.otherUser._id === selectedChatId);

  if (!selectedChatId && conversations && conversations.length > 0) {
    setSelectedChatId(conversations[0].otherUser._id);
  }

  const isOtherUserTyping = selectedChatId ? typingUsers.get(selectedChatId) : false;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Messages</h1>
              <p className="text-muted-foreground">Chat with other students and coordinate games</p>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 gap-1">
                  <Wifi className="w-3 h-3" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-500 border-amber-500/30 gap-1">
                  <WifiOff className="w-3 h-3" />
                  Connecting...
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Conversations List */}
          <Card className="border-2 lg:col-span-1 animate-scale-in">
            <CardHeader className="border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto">
              <div className="divide-y">
                {isLoadingConversations && (
                  <p className="p-4 text-center">Loading chats...</p>
                )}
                {conversations?.map((conv) => {
                  const isOnline = onlineUsers.has(conv.otherUser._id);
                  return (
                    <div
                      key={conv.otherUser._id}
                      onClick={() => setSelectedChatId(conv.otherUser._id)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                        selectedChatId === conv.otherUser._id ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12 border-2 border-primary/20">
                            <AvatarFallback className="bg-gradient-primary text-white">
                              {conv.otherUser.fullname
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold truncate">
                              {conv.otherUser.fullname}
                            </h3>
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {formatDistanceToNow(
                                new Date(conv.lastMessageCreatedAt),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1 capitalize">
                            {conv.otherUser.sport}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessageSender === user?._id ? "You: " : ""}
                              {conv.lastMessage}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge className="ml-2 bg-primary text-primary-foreground flex-shrink-0">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="border-2 lg:col-span-2 flex flex-col animate-scale-in">
            {selectedChat ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12 border-2 border-primary/20">
                          <AvatarFallback className="bg-gradient-primary text-white">
                            {selectedChat.otherUser.fullname
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {onlineUsers.has(selectedChat.otherUser._id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {selectedChat.otherUser.fullname}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {onlineUsers.has(selectedChat.otherUser._id)
                            ? "Online"
                            : selectedChat.otherUser.sport}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 bg-background">
                  {isLoadingMessages && (
                    <p className="text-center">Loading messages...</p>
                  )}

                  <div className="flex flex-col w-full space-y-3">
                    {messages?.map((msg) => {
                      const isSent = String(msg.sender) === String(user?._id);

                      return (
                        <div
                          key={msg._id}
                          className={`flex w-full ${
                            isSent ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] p-3 rounded-2xl ${
                              isSent
                                ? "bg-primary text-white rounded-br-none"
                                : "bg-muted text-foreground rounded-bl-none"
                            }`}
                          >
                            <p className="text-sm leading-snug break-words">
                              {msg.content}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                isSent
                                  ? "text-white/70 text-right"
                                  : "text-muted-foreground text-left"
                              }`}
                            >
                              {formatDistanceToNow(new Date(msg.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {isOtherUserTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted text-muted-foreground rounded-2xl rounded-bl-none px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </CardContent>

                <div className="border-t p-4">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      value={message}
                      onChange={handleInputChange}
                      onKeyPress={(e) => e.key === "Enter" && handleSend()}
                      className="flex-1"
                      disabled={isSending}
                    />
                    <Button
                      className="bg-gradient-primary"
                      size="icon"
                      onClick={handleSend}
                      disabled={isSending || !isConnected}
                    >
                      {isSending ? (
                        <Clock className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageCircle className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold">Select a chat</h3>
                <p>Or send a new play request to start a conversation.</p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Chat;
