import Navbar from "@/components/Navbar";
import PlayerCard from "@/components/PlayerCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast as sonner } from "sonner";

// Define the type for the Player data we expect
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

const FindPlayers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const { wrapApiCall } = useAuth();
  
  // Fetch all players
  const { data: players, isLoading } = useQuery({
    queryKey: ["allPlayers"],
    queryFn: async (): Promise<ApiPlayer[]> => {
      const response = await wrapApiCall(() => api.get("/users/get-all-players"));
      // Handle different response structures
      return response?.data?.data || response?.data || response || [];
    },
  });

  // Create the mutation for sending a message
  const sendMessageMutation = useMutation({
    mutationFn: (variables: { receiverId: string, content: string }) => {
      return wrapApiCall(() => api.post("/users/send-message", variables));
    },
    onSuccess: () => {
      sonner.success("Request Sent!", {
        description: "Your play request has been sent as a message.",
      });
    },
    onError: (error) => {
      console.error("Failed to send request", error);
      sonner.error("Failed to send request");
    }
  });

  // Create the handler to be passed to the card
  const handleSendRequest = (playerId: string, sport: string) => {
    sendMessageMutation.mutate({
      receiverId: playerId,
      content: `Hey! I saw you on the SAC page. Would you like to play ${sport} sometime?`
    });
  };

  // Get unique sports from all players' games
  const allSports = Array.from(
    new Set(
      players?.flatMap(player => 
        player.games?.map(game => game.game.name) || []
      ) || []
    )
  ).sort();

  // Filter the dynamic data
  const filteredPlayers = players?.filter(player => {
    // Check if any game matches the selected sport
    const matchesSport = !selectedSport || 
      player.games?.some(game => 
        game.game.name.toLowerCase().includes(selectedSport.toLowerCase())
      );
    
    const matchesSearch = player.fullname.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && matchesSport;
  }) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Find Players</h1>
          <p className="text-muted-foreground">Connect with other students and find playing partners</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4 animate-scale-in">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by student name..."
              className="pl-10 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Sport Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="w-4 h-4 text-primary" />
              Filter by Sport:
            </div>
            <Button
              variant={selectedSport === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSport(null)}
              className={selectedSport === null ? "bg-gradient-primary" : ""}
            >
              All Sports
            </Button>
            {allSports.map((sport) => (
              <Button
                key={sport}
                variant={selectedSport === sport ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSport(sport)}
                className={selectedSport === sport ? "bg-gradient-primary" : ""}
              >
                {sport}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredPlayers.length}</span> player{filteredPlayers.length !== 1 ? 's' : ''}
            {selectedSport && <span> for <span className="font-semibold text-foreground">{selectedSport}</span></span>}
          </p>
        </div>

        {/* Players Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            <p>Loading players...</p>
          ) : (
            filteredPlayers.map((player, index) => (
              <div key={player._id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <PlayerCard 
                  playerId={player._id}
                  name={player.fullname}
                  available={true} // You might want to add this field to your ApiPlayer interface
                  games={player.games || []}
                  onSendRequest={handleSendRequest}
                  isSending={sendMessageMutation.isPending && sendMessageMutation.variables?.receiverId === player._id}
                />
              </div>
            ))
          )}
        </div>

        {/* No Results */}
        {filteredPlayers.length === 0 && !isLoading && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-xl text-muted-foreground mb-4">No players found</p>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default FindPlayers;