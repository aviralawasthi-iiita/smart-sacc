import Navbar from "@/components/Navbar";
import PlayerCard from "@/components/PlayerCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Filter, X, ChevronDown } from "lucide-react";
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
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const { wrapApiCall } = useAuth();
  
  // Fetch all players
  const { data: players, isLoading, error: playersError } = useQuery({
    queryKey: ["allPlayers"],
    queryFn: async (): Promise<ApiPlayer[]> => {
      try {
        const response = await wrapApiCall(() => api.get("/users/get-all-players"));
        if (Array.isArray(response)) return response;
        return response?.data || response || [];
      } catch (err) {
        console.error("Failed to fetch players:", err);
        return [];
      }
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

  // Fetch all games for sport filter
  const { data: allGames } = useQuery({
    queryKey: ["allGames"],
    queryFn: async () => {
      const res = await wrapApiCall(() => api.get("/users/get-games"));
      if (Array.isArray(res)) return res;
      return res?.data || res || [];
    },
    staleTime: Infinity,
  });
  // Derive unique sports from the full games list
  const allSports = (allGames || []).map((g: any) => g.name).filter(Boolean).sort();

  // Toggle a sport in the selection
  const toggleSport = (sport: string) => {
    setSelectedSports(prev =>
      prev.includes(sport)
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    );
  };

  // Remove a single sport badge
  const removeSport = (sport: string) => {
    setSelectedSports(prev => prev.filter(s => s !== sport));
  };

  // Filter the dynamic data — show players who play ANY of the selected sports
  const filteredPlayers = players?.filter(player => {
    const matchesSport = selectedSports.length === 0 || 
      player.games?.some(game => 
        selectedSports.some(s => game.game?.name?.toLowerCase() === s.toLowerCase())
      );
    
    const matchesSearch = player.fullname?.toLowerCase().includes(searchQuery.toLowerCase());
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

          {/* Sport Filter - Popover */}
          <div className="flex items-center gap-3 flex-wrap">
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filter by Sport
                  {selectedSports.length > 0 && (
                    <Badge variant="secondary" className="ml-1 rounded-full px-2 py-0 text-xs">
                      {selectedSports.length}
                    </Badge>
                  )}
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-1">
                  <p className="text-sm font-medium mb-2">Select Sports</p>
                  {allSports.length > 0 ? (
                    <div className="space-y-1">
                      {allSports.map((sport) => (
                        <label
                          key={sport}
                          className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={selectedSports.includes(sport)}
                            onCheckedChange={() => toggleSport(sport)}
                          />
                          <span className="text-sm capitalize">{sport}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No sports available</p>
                  )}
                  {selectedSports.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-xs"
                      onClick={() => setSelectedSports([])}
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Selected sport badges */}
            {selectedSports.map((sport) => (
              <Badge key={sport} variant="secondary" className="gap-1 pr-1 capitalize">
                {sport}
                <button
                  onClick={() => removeSport(sport)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}

            {selectedSports.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-7"
                onClick={() => setSelectedSports([])}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredPlayers.length}</span> player{filteredPlayers.length !== 1 ? 's' : ''}
            {selectedSports.length > 0 && (
              <span> for <span className="font-semibold text-foreground">{selectedSports.join(", ")}</span></span>
            )}
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
                  available={true}
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