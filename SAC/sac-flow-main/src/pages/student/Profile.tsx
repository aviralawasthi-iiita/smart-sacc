import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Target, Trophy, CheckSquare, Star, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast as sonner } from "sonner";

type Game = { 
  _id: string;
  name: string;
  category?: string;
};

// Updated UserGame type to match backend response
type UserGame = { 
  game: {
    _id: string;
    name: string;
    category?: string;
  }; // Game object with details
  rating: number;
  _id?: string; // Added this for the nested _id
};

type UserProfileData = {
  userDetails: {
    _id: string;
    fullname: string;
    username: string;
    email: string;
    roll_no: string;
    phone_number: string;
    games: UserGame[];
    achievements: string[];
  };
  bookedItems: { _id: string; name: string }[];
};

const StudentProfile: React.FC = () => {
  const { wrapApiCall } = useAuth();
  const queryClient = useQueryClient();

  // Fetch profile
  const fetchUserProfile = async (): Promise<UserProfileData> => {
    const response = await wrapApiCall(() => api.get("/users/current-user"));
    return response?.data?.data || response?.data || response;
  };

  // Fetch available games
  const fetchGames = async (): Promise<Game[]> => {
    try {
      const response = await wrapApiCall(() => api.get("/users/get-games"));
      return response?.data?.data || response?.data || response || [];
    } catch (error) {
      console.error("Error fetching games:", error);
      return [];
    }
  };

  const { data: profileData, isLoading, error } = useQuery<UserProfileData>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
    refetchOnWindowFocus: false
  });

  const { data: gamesData = [] } = useQuery<Game[]>({
    queryKey: ["games"],
    queryFn: fetchGames,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Form state - updated to match backend structure
  const [form, setForm] = useState({
    fullname: "",
    username: "",
    roll_no: "",
    email: "",
    phone_number: "",
    games: [] as UserGame[],
    achievements: [] as string[]
  });

  const [editMode, setEditMode] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [gameRating, setGameRating] = useState<number>(0);
  const [newAchievement, setNewAchievement] = useState<string>("");

  // Sync form when data arrives - updated to handle populated game objects
  useEffect(() => {
    if (profileData?.userDetails) {
      const u = profileData.userDetails;
      setForm({
        fullname: u.fullname ?? "",
        username: u.username ?? "",
        roll_no: u.roll_no ?? "",
        email: u.email ?? "",
        phone_number: u.phone_number ?? "",
        games: Array.isArray(u.games) ? u.games : [],
        achievements: Array.isArray(u.achievements) ? u.achievements : []
      });
    }
  }, [profileData]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addGame = () => {
    if (!selectedGame) {
      sonner.error("Please select a game");
      return;
    }
    if (gameRating < 0 || gameRating > 5) {
      sonner.error("Rating must be between 0 and 5");
      return;
    }

    // Check if game already exists - updated to handle game object structure
    const existingGameIndex = form.games.findIndex(g => g.game._id === selectedGame);
    if (existingGameIndex !== -1) {
      // Update existing game rating
      const updatedGames = [...form.games];
      updatedGames[existingGameIndex] = { 
        ...updatedGames[existingGameIndex], 
        rating: gameRating 
      };
      setForm(prev => ({ ...prev, games: updatedGames }));
      sonner.success("Game rating updated");
    } else {
      // Find the selected game details from gamesData
      const selectedGameDetails = gamesData.find(g => g._id === selectedGame);
      if (!selectedGameDetails) {
        sonner.error("Selected game not found");
        return;
      }

      // Add new game with proper structure
      setForm(prev => ({ 
        ...prev, 
        games: [...prev.games, { 
          game: selectedGameDetails, 
          rating: gameRating 
        }] 
      }));
      sonner.success("Game added");
    }

    setSelectedGame("");
    setGameRating(0);
  };

  const removeGame = (gameId: string) => {
    setForm(prev => ({ 
      ...prev, 
      games: prev.games.filter(g => g.game._id !== gameId) 
    }));
    sonner.success("Game removed");
  };

  const addAchievement = () => {
    if (!newAchievement.trim()) {
      sonner.error("Enter achievement text");
      return;
    }
    setForm(prev => ({ 
      ...prev, 
      achievements: [...prev.achievements, newAchievement.trim()] 
    }));
    setNewAchievement("");
    sonner.success("Achievement added");
  };

  const removeAchievement = (index: number) => {
    setForm(prev => ({ 
      ...prev, 
      achievements: prev.achievements.filter((_, i) => i !== index) 
    }));
    sonner.success("Achievement removed");
  };

  // API call to update profile on server - updated to transform data for backend
  const updateUserApi = async (payload: typeof form) => {
    // Transform the games data for backend - send only game ID and rating
    const backendPayload = {
      ...payload,
      games: payload.games.map(userGame => ({
        game: userGame.game._id, // Send only the ID to backend
        rating: userGame.rating
      }))
    };

    const res = await wrapApiCall(() => api.post("/users/update-account-details", backendPayload));
    return res?.data?.data || res?.data || res;
  };

  const mutation = useMutation({
    mutationFn: updateUserApi,
    onSuccess: () => {
      sonner.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setEditMode(false);
    },
    onError: (err: any) => {
      console.error("Update failed:", err);
      sonner.error(err.response?.data?.message || "Failed to update profile");
    }
  });

  const handleSave = async () => {
    try {
      await mutation.mutateAsync(form);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 pt-24 pb-12 text-center">
        <p className="text-xl">Loading profile...</p>
      </div>
    </div>
  );

  if (error || !profileData) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 pt-24 pb-12 text-center">
        <p className="text-xl text-destructive">Error loading profile data</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["userProfile"] })} className="mt-4">
          Retry
        </Button>
      </div>
    </div>
  );

  const profile = profileData.userDetails;
  const bookedItems = profileData.bookedItems ?? [];
  const initials = (profile.fullname || "")
    .split(" ")
    .map(s => s[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 3);

  // Updated helper function to get game name - now directly from the game object
  const getGameName = (userGame: UserGame) => {
    return userGame.game?.name || "Unknown Game";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
          <Avatar className="w-24 h-24 border-4 border-primary/20">
            <AvatarFallback className="bg-primary text-white text-3xl font-bold">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {editMode ? (
              <div className="space-y-4">
                <Input 
                  value={form.fullname} 
                  onChange={(e) => handleChange("fullname", e.target.value)} 
                  placeholder="Full Name"
                />
                <Input 
                  value={form.username} 
                  onChange={(e) => handleChange("username", e.target.value)} 
                  placeholder="Username"
                />
                <Input 
                  value={form.roll_no} 
                  onChange={(e) => handleChange("roll_no", e.target.value)} 
                  placeholder="Roll Number"
                />
                <Input 
                  value={form.email} 
                  onChange={(e) => handleChange("email", e.target.value)} 
                  placeholder="Email"
                  type="email"
                />
                <Input 
                  value={form.phone_number} 
                  onChange={(e) => handleChange("phone_number", e.target.value)} 
                  placeholder="Phone Number"
                />
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold">{profile.fullname}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
                <p className="text-muted-foreground">{profile.roll_no}</p>

                <div className="flex flex-col md:flex-row gap-4 text-muted-foreground mt-2">
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    {profile.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    {profile.phone_number}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {editMode ? (
                <>
                  <Button 
                    onClick={handleSave} 
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditMode(false);
                      if (profileData?.userDetails) {
                        const u = profileData.userDetails;
                        setForm({
                          fullname: u.fullname ?? "",
                          username: u.username ?? "",
                          roll_no: u.roll_no ?? "",
                          email: u.email ?? "",
                          phone_number: u.phone_number ?? "",
                          games: Array.isArray(u.games) ? u.games : [],
                          achievements: Array.isArray(u.achievements) ? u.achievements : []
                        });
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditMode(true)}>Edit Profile</Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <Target size={28} className="mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{form.games.length}</div>
              <div className="text-sm text-muted-foreground">Games Played</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy size={28} className="mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{form.achievements.length}</div>
              <div className="text-sm text-muted-foreground">Achievements</div>
            </CardContent>
          </Card>
        </div>

        {/* Games Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Game Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            {editMode && (
              <div className="mb-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex flex-col md:flex-row gap-2 mb-2">
                  <Select value={selectedGame} onValueChange={setSelectedGame}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a game" />
                    </SelectTrigger>
                    <SelectContent>
                      {gamesData?.map((game) => (
                        <SelectItem key={game._id} value={game._id}>
                          {game.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm whitespace-nowrap">Rating:</span>
                    <Input 
                      type="number" 
                      min="0" 
                      max="5" 
                      step="1"
                      value={gameRating} 
                      onChange={(e) => setGameRating(Number(e.target.value))} 
                      className="w-20"
                    />
                  </div>
                  
                  <Button onClick={addGame}>
                    {form.games.find(g => g.game._id === selectedGame) ? "Update" : "Add"} Game
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select a game and rate it from 0 to 5 stars
                </p>
              </div>
            )}

            {form.games.length > 0 ? (
              <div className="space-y-3">
                {form.games.map((userGame) => (
                  <div key={userGame.game._id} className="p-3 border rounded-md flex justify-between items-center">
                    <div className="font-semibold capitalize">
                      {getGameName(userGame)}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={16} 
                            className={i < userGame.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"} 
                          />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({userGame.rating})
                        </span>
                      </div>
                      {editMode && (
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => removeGame(userGame.game._id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No games added yet. {editMode && "Add your first game above!"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Achievements Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {editMode && (
              <div className="mb-4 flex gap-2">
                <Input
                  placeholder="Enter new achievement"
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
                />
                <Button onClick={addAchievement}>Add</Button>
              </div>
            )}

            {form.achievements.length > 0 ? (
              <div className="space-y-2">
                {form.achievements.map((achievement, index) => (
                  <div key={index} className="p-3 border rounded-md flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className="text-yellow-500" />
                      <span>{achievement}</span>
                    </div>
                    {editMode && (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => removeAchievement(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No achievements added yet. {editMode && "Add your first achievement above!"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Booked Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare size={18} /> My Booked Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookedItems.length > 0 ? (
              <div className="space-y-2">
                {bookedItems.map(item => (
                  <div key={item._id} className="p-3 border rounded-md">
                    {item.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No items booked
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentProfile;