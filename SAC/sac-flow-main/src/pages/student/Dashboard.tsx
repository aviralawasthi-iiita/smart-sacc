import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import EquipmentCard from "@/components/EquipmentCard";
import PlayerCard from "@/components/PlayerCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Gamepad2,
  Dumbbell,
  Target,
  UserCircle,
  Users,
  MessageSquare,
  Megaphone,
} from "lucide-react";
import React from "react";
import { toast as sonner } from "sonner";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface ApiPlayer {
  _id: string;
  fullname: string;
  username: string;
  email: string;
  roll_no: string;
  phone_number: string;
  games: {
    _id: string;
    game: {
      _id: string;
      name: string;
      category?: string;
    };
    rating: number;
  }[];
  achievements: string[];
}

interface ApiEquipment {
  _id: string;
  name: string;
  status: "available" | "in-use" | "broken";
  user?: { fullname: string; roll_no: string; phone_number: string };
  duration?: string;
  roll_no?: string;
}

interface DashboardData {
  unreadMessages: number;
  openTickets: number;
  equipment: ApiEquipment[];
  announcements: { _id: string; heading: string; content: string; footer?: string }[];
  totalHours: number;
  gamesPlayed: number;
}

interface ApiGame {
  _id: string;
  name: string;
  category?: string;
  description?: string;
}

const getEquipmentIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("badminton")) return <Dumbbell className="w-6 h-6 text-white" />;
  return <Gamepad2 className="w-6 h-6 text-white" />;
};

const StudentDashboard = () => {
  const { user, wrapApiCall } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showOnlyAvailable, setShowOnlyAvailable] = React.useState(true);

  // Fixed API calls - properly handle response structure
  const fetchDashboardData = async (): Promise<DashboardData> => {
    const response = await wrapApiCall(() => api.get("/users/dashboard"));
    // Return the data property from the response
    return response?.data?.data || response?.data || response;
  };

  const { data: dashboardData, isLoading: isLoadingDashboard, error: dashboardError } = useQuery({
    queryKey: ["studentDashboard"],
    queryFn: fetchDashboardData,
  });

  const fetchGames = async (): Promise<ApiGame[]> => {
    const response = await wrapApiCall(() => api.get("/users/get-games"));
    // Handle different response structures
    return response?.data?.data || response?.data || response || [];
  };

  const { data: gamesData = [], isLoading: isLoadingGames } = useQuery({
    queryKey: ["studentGames"],
    queryFn: fetchGames,
  });

  const fetchPlayers = async (): Promise<ApiPlayer[]> => {
    const response = await wrapApiCall(() => api.get("/users/get-all-players"));
    // Handle different response structures
    return response?.data?.data || response?.data || response || [];
  };

  const { data: playersData = [], isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["players"],
    queryFn: fetchPlayers,
  });

  const bookEquipmentMutation = useMutation({
    mutationFn: (equipmentId: string) =>
      wrapApiCall(() =>
        api.post("/users/book-equipment", {
          equipmentId,
          duration: "1h 30m",
        })
      ),
    onSuccess: () => {
      sonner.success("Equipment Booked!");
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
    },
    onError: (error: any) => {
      sonner.error("Failed to book equipment");
      console.error("Booking error:", error);
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (variables: { receiverId: string; content: string }) =>
      wrapApiCall(() => api.post("/users/send-message", variables)),
    onSuccess: () => {
      sonner.success("Request Sent!", {
        description: "Your play request has been sent as a message.",
      });
    },
    onError: (error: any) => {
      sonner.error("Failed to send request");
      console.error("Message error:", error);
    }
  });

  const handleBookEquipment = (id: string) => bookEquipmentMutation.mutate(id);
  const handleSendRequest = (id: string, sport: string) =>
    sendMessageMutation.mutate({
      receiverId: id,
      content: `Hey! Would you like to play ${sport} sometime?`,
    });

  if (isLoadingDashboard)
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 md:px-6 pt-24 pb-12 text-center">
          <p className="text-xl">Loading your dashboard...</p>
        </div>
      </div>
    );

  if (dashboardError || !dashboardData)
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 md:px-6 pt-24 pb-12 text-center">
          <p className="text-xl text-destructive">Could not load dashboard data.</p>
        </div>
      </div>
    );

  // Safe data access with defaults
  const equipment = dashboardData?.equipment || [];
  const announcements = dashboardData?.announcements || [];
  const openTickets = dashboardData?.openTickets || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* --- WELCOME SECTION --- */}
      <section className="container mx-auto px-4 md:px-6 pt-24 pb-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          Welcome back, {user && "fullname" in user ? user.fullname : "Student"}!
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card
            onClick={() => navigate("/student/profile")}
            className="cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all rounded-lg shadow-md hover:shadow-lg"
          >
            <CardHeader className="flex flex-col items-center p-4 space-y-2 text-center">
              <UserCircle className="w-6 h-6 text-primary" />
              <CardTitle className="text-sm font-semibold">My Profile</CardTitle>
            </CardHeader>
          </Card>

          <Card
            onClick={() => navigate("/student/players")}
            className="cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all rounded-lg shadow-md hover:shadow-lg"
          >
            <CardHeader className="flex flex-col items-center p-4 space-y-2 text-center">
              <Users className="w-6 h-6 text-primary" />
              <CardTitle className="text-sm font-semibold">Find Players</CardTitle>
            </CardHeader>
          </Card>

          <Card
            onClick={() => navigate("/student/analytics")}
            className="cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all rounded-lg shadow-md hover:shadow-lg"
          >
            <CardHeader className="flex flex-col items-center p-4 space-y-2 text-center">
              <Target className="w-6 h-6 text-primary" />
              <CardTitle className="text-sm font-semibold">Usage Analytics</CardTitle>
            </CardHeader>
          </Card>

          <Card
            onClick={() => navigate("/student/chat")}
            className="cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all rounded-lg shadow-md hover:shadow-lg"
          >
            <CardHeader className="flex flex-col items-center p-4 space-y-2 text-center">
              <MessageSquare className="w-6 h-6 text-primary" />
              <CardTitle className="text-sm font-semibold">Chat</CardTitle>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all rounded-lg shadow-md hover:shadow-lg">
            <CardHeader className="flex flex-col items-center p-4 pb-1 text-center">
              <Megaphone className="w-6 h-6 text-primary" />
              <CardTitle className="text-sm font-semibold">Open Tickets</CardTitle>
            </CardHeader>
            <CardContent className="text-center p-4 pt-1">
              <p className="text-2xl font-bold text-primary">
                {openTickets}
              </p>
              <p className="text-xs text-muted-foreground">Active Complaints</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* --- EQUIPMENT SECTION --- */}
      <section id="equipment" className="py-16 bg-muted/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full mb-3 border border-primary/20">
              <Gamepad2 className="w-4 h-4" />
              <span className="text-xs font-semibold">Real-Time Status</span>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <h2 className="text-3xl md:text-4xl font-extrabold text-center md:text-left">
                Equipment Status
              </h2>

              <div className="flex items-center gap-2 bg-card p-2 rounded-lg shadow-inner">
                <Label htmlFor="available-toggle" className="text-xs font-medium text-muted-foreground">
                  Show only available
                </Label>
                <Switch
                  id="available-toggle"
                  checked={showOnlyAvailable}
                  onCheckedChange={setShowOnlyAvailable}
                />
              </div>
            </div>
          </div>

          <div
            key={showOnlyAvailable ? "available" : "all"}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in"
          >
            {equipment
              .filter((eq) => !showOnlyAvailable || eq.status === "available")
              .map((equipment) => (
                <EquipmentCard
                  key={equipment._id}
                  equipmentId={equipment._id}
                  name={equipment.name}
                  status={equipment.status === "broken" ? "maintenance" : equipment.status}
                  currentUser={
                    equipment.user
                      ? `${equipment.user.fullname} (${equipment.roll_no})`
                      : undefined
                  }
                  contact={equipment.user?.phone_number}
                  timeUsed={equipment.duration}
                  rollNumber={equipment.roll_no}
                  duration={equipment.duration}
                  icon={getEquipmentIcon(equipment.name)}
                  // Remove onBook and isBooking props, and add:
                  bookingText="booking can only be done via admin(guard)"
                />
              ))}
          </div>
        </div>
      </section>

      {/* --- ANNOUNCEMENTS SECTION --- */}
      <section id="announcements" className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full mb-3 border border-primary/20">
              <Megaphone className="w-4 h-4" />
              <span className="text-xs font-semibold">What's New</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Announcements</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {announcements.length > 0 ? (
              announcements.map((ann) => (
                <Card key={ann._id} className="animate-slide-up rounded-lg shadow-md border-l-4 border-primary">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">{ann.heading}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm">{ann.content}</p>
                    {ann.footer && (
                      <p className="text-xs text-muted-foreground mt-3">{ann.footer}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground md:col-span-2 p-4 bg-muted rounded-lg">
                No new announcements.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* --- GAMES SECTION --- */}
      <section id="games" className="py-16 bg-muted/10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-1 bg-accent/10 text-accent px-3 py-1 rounded-full mb-3 border border-accent/20">
              <Gamepad2 className="w-4 h-4" />
              <span className="text-xs font-semibold">Games</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
              Available Games
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Explore all active games and start playing today
            </p>
          </div>

          {isLoadingGames ? (
            <p className="text-center">Loading games...</p>
          ) : gamesData.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No games available yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
              {gamesData.map((game) => (
                <Card
                  key={game._id}
                  className="border-2 rounded-lg" // Removed hover effects and cursor-pointer
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="capitalize text-lg font-semibold">
                      {game.name}
                    </CardTitle>
                    {game.category && (
                      <p className="text-sm text-muted-foreground">{game.category}</p>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex justify-between items-center">
                    {game.description ? (
                      <span className="text-sm text-muted-foreground">
                        {game.description}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                      
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- PLAYERS SECTION --- */}
      <section id="players" className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-1 bg-accent/10 text-accent px-3 py-1 rounded-full mb-3 border border-accent/20">
              <Users className="w-4 h-4" />
              <span className="text-xs font-semibold">Community</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Find Play Partners</h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Connect with other players and improve your game
            </p>
          </div>
          
          {isLoadingPlayers ? (
            <p className="text-center">Loading players...</p>
          ) : playersData.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No players found.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
              {playersData
                .slice(0, 4)
                .map((player) => {
                  const playerGames = player.games || [];
                  
                  return (
                    <PlayerCard
                      key={player._id}
                      playerId={player._id}
                      name={player.fullname}
                      available={true}
                      games={playerGames}
                      onSendRequest={handleSendRequest}
                      isSending={
                        sendMessageMutation.isPending &&
                        sendMessageMutation.variables?.receiverId === player._id
                      }
                    />
                  );
                })}
            </div>
          )}
        </div>
      </section>
      {/* --- FOOTER --- */}
      <footer className="bg-card border-t border-border py-6 mt-8">
        <div className="container mx-auto px-4 md:px-6 text-center text-xs text-muted-foreground">
          <p>&copy; 2025 Smart SAC Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default StudentDashboard;