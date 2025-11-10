import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Star, Gamepad2 } from "lucide-react";

interface PlayerCardProps {
  playerId: string;
  name: string;
  games: {
    game: {
      _id: string;
      name: string;
      category?: string;
    };
    rating: number;
    _id: string;
  }[];
  available: boolean;
  onSendRequest: (playerId: string, sport: string) => void;
  isSending: boolean;
  gameCount?: number;
}

const PlayerCard = ({
  playerId,
  name,
  games,
  available,
  onSendRequest,
  isSending,
  gameCount
}: PlayerCardProps) => {
  const initials = name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();

  // Get primary game name from the populated data
  const primaryGame = games?.length > 0 ? games[0].game.name : "games";

  return (
    <Card className="hover:shadow-lg transition-all hover:-translate-y-1 border-2 border-border">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 border-2 border-primary/20">
            <AvatarFallback className="bg-gradient-primary text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{name}</h3>
              {available && (
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {gameCount || games?.length || 0} game{(gameCount || games?.length) !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Games with ratings */}
        <div className="space-y-3">
          {games?.slice(0, 3).map((userGame) => (
            <div key={userGame._id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium capitalize">
                  {userGame.game.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-1">
                  {userGame.rating.toFixed(1)}
                </span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={
                        i < Math.floor(userGame.rating) 
                          ? "text-yellow-500 fill-yellow-500" 
                          : "text-gray-300"
                      } 
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {games?.length > 3 && (
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                +{games.length - 3} more games
              </Badge>
            </div>
          )}
          
          {(!games || games.length === 0) && (
            <div className="text-center py-2">
              <span className="text-sm text-muted-foreground">
                No games rated yet
              </span>
            </div>
          )}
        </div>

        {/* Send Request Button */}
        <Button 
          className="w-full bg-gradient-primary" 
          size="sm"
          disabled={!available || isSending}
          onClick={() => onSendRequest(playerId, primaryGame)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {isSending ? "Sending..." : (available ? "Send Play Request" : "Not Available")}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;