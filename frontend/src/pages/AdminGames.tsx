import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast as sonner } from "sonner";
import { Gamepad2, Plus, Trash2 } from "lucide-react";

type Game = {
  _id: string;
  name: string;
  equipment?: { _id: string; name: string; status: string }[];
};

const fetchAdminGames = async () => {
  const res = await api.get("/admin/games");
  return res.games as Game[];
};

const AdminGames = () => {
  const qc = useQueryClient();
  const [newGame, setNewGame] = useState("");

  const { data: games = [], isLoading } = useQuery({
    queryKey: ["adminGames"],
    queryFn: fetchAdminGames,
  });

  const addGameMutation = useMutation({
    mutationFn: (name: string) => api.post("/admin/add-game", { name }),
    onSuccess: () => {
      sonner.success("Game added");
      setNewGame("");
      qc.invalidateQueries({ queryKey: ["adminGames"] });
      qc.invalidateQueries({ queryKey: ["studentGames"] });
    },
  });

  const removeGameMutation = useMutation({
    mutationFn: (name: string) => api.post(`/admin/remove-game?name=${encodeURIComponent(name)}`, {}),
    onSuccess: () => {
      sonner.success("Game removed");
      qc.invalidateQueries({ queryKey: ["adminGames"] });
      qc.invalidateQueries({ queryKey: ["studentGames"] });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Manage Games</h1>
          <p className="text-muted-foreground">Add or remove games shown across the platform.</p>
        </div>

        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              Add a New Game
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="e.g. Table Tennis"
              value={newGame}
              onChange={(e) => setNewGame(e.target.value)}
              className="md:max-w-sm"
            />
            <Button
              onClick={() => newGame.trim() && addGameMutation.mutate(newGame.trim())}
              disabled={addGameMutation.isPending}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {addGameMutation.isPending ? "Adding..." : "Add Game"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <p>Loading games...</p>
          ) : games.length === 0 ? (
            <p className="text-muted-foreground">No games yet.</p>
          ) : (
            games.map((g) => (
              <Card key={g._id} className="border-2 hover:shadow-md transition">
                <CardHeader>
                  <CardTitle className="capitalize">{g.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {g.equipment?.length ?? 0} item{(g.equipment?.length ?? 0) === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={() => removeGameMutation.mutate(g.name)}
                    disabled={removeGameMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                    {removeGameMutation.isPending ? "Removing..." : "Remove Game"}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminGames;
