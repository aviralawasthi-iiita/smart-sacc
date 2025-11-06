import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Clock, Building, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { useLocation } from "react-router-dom"; // ✅ Added for route detection

interface RoomCardProps {
  roomId: string;
  name: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "maintenance";
  currentActivity?: string;
  timeSlot?: string;
  icon: React.ReactNode;
  bookedByUserId?: string | null;
  currentUserId: string;
  onBook: (roomId: string) => void;
  onCancel: (roomId: string) => void;
  isLoading: boolean;
}

const RoomCard = ({
  roomId,
  name,
  capacity,
  status,
  currentActivity,
  timeSlot,
  icon,
  bookedByUserId,
  currentUserId,
  onBook,
  onCancel,
  isLoading,
}: RoomCardProps) => {
  const location = useLocation();
  const isAdmin = location.pathname.includes("/admin");

  const statusConfig = {
    available: {
      badge: <Badge className="bg-success text-success-foreground">Available</Badge>,
      borderColor: "border-success/20",
    },
    occupied: {
      badge: <Badge className="bg-warning text-warning-foreground">Occupied</Badge>,
      borderColor: "border-warning/20",
    },
    reserved: {
      badge: <Badge className="bg-destructive text-destructive-foreground">Reserved</Badge>,
      borderColor: "border-destructive/20",
    },
    maintenance: {
      badge: <Badge className="bg-muted text-muted-foreground">Maintenance</Badge>,
      borderColor: "border-muted/20",
    },
  };

  const isBookedByMe = bookedByUserId === currentUserId;
  let buttonState: "book" | "cancel" | "occupied" | "unavailable" = "book";

  if (status === "available") buttonState = "book";
  else if (status === "occupied" && isBookedByMe) buttonState = "cancel";
  else if (status === "occupied" && !isBookedByMe) buttonState = "occupied";
  else buttonState = "unavailable";

  return (
    <Card
      className={`hover:shadow-lg transition-all border-2 ${statusConfig[status].borderColor} hover:-translate-y-1 flex flex-col`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-secondary flex items-center justify-center">
              {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6 text-black" })}
            </div>
            <CardTitle className="text-lg">{name}</CardTitle>
          </div>
          {statusConfig[status].badge}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>Capacity: {capacity}</span>
          </div>

          {currentActivity && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="w-4 h-4" />
              <span className="font-medium text-foreground">{currentActivity}</span>
            </div>
          )}

          {timeSlot && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{timeSlot}</span>
            </div>
          )}
        </div>

        {/* ✅ Only show button for Admins */}
        {isAdmin ? (
          <Button
            className="w-full"
            variant={buttonState === "book" ? "default" : "outline"}
            disabled={
              buttonState === "occupied" || buttonState === "unavailable" || isLoading
            }
            onClick={() =>
              buttonState === "book" ? onBook(roomId) : onCancel(roomId)
            }
          >
            {isLoading && "Processing..."}
            {!isLoading && buttonState === "book" && "Book Now"}
            {!isLoading && buttonState === "cancel" && "Cancel Booking"}
            {!isLoading && buttonState === "occupied" && "Occupied"}
            {!isLoading && buttonState === "unavailable" && "Unavailable"}
          </Button>
        ) : (
          <p className="text-xs italic text-muted-foreground text-center mt-2">
            ⚠️ Booking restricted to Admin. Please contact your administrator.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomCard;
