import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Phone, User } from "lucide-react";

interface EquipmentCardProps {
  equipmentId: string;
  name: string;
  status: "available" | "in-use" | "maintenance";
  currentUser?: string;
  contact?: string;
  timeUsed?: string;
  rollNumber?: string;
  duration?: string;
  icon: React.ReactNode;
  bookingText?: string; // New prop for static text
  onBook?: (id: string) => void; // Keep optional for backward compatibility
  isBooking?: boolean;
}

const EquipmentCard = ({
  equipmentId,
  name,
  status,
  currentUser,
  contact,
  timeUsed,
  rollNumber,
  duration,
  icon,
  bookingText,
  onBook,
  isBooking = false,
}: EquipmentCardProps) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "available":
        return "default";
      case "in-use":
        return "secondary";
      case "maintenance":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "in-use":
        return "In Use";
      case "maintenance":
        return "Under Maintenance";
      default:
        return status;
    }
  };

  return (
    <Card 
      className={`relative overflow-hidden border-2 transition-all hover:shadow-lg ${
        status === "available" 
          ? "border-green-200 hover:border-green-300" 
          : status === "in-use"
          ? "border-yellow-200 hover:border-yellow-300"
          : "border-red-200 hover:border-red-300"
      }`}
    >
      {/* Status Indicator */}
      <div
        className={`absolute top-0 left-0 w-full h-1 ${
          status === "available"
            ? "bg-green-500"
            : status === "in-use"
            ? "bg-yellow-500"
            : "bg-red-500"
        }`}
      />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                status === "available"
                  ? "bg-green-500"
                  : status === "in-use"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            >
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold capitalize">
                {name}
              </CardTitle>
              <Badge 
                variant={getStatusVariant(status)} 
                className="mt-1"
              >
                {getStatusText(status)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Current User Info - ALWAYS show when in-use */}
        {status === "in-use" && (
          <div className="space-y-2">
            {/* Current User */}
            {currentUser && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Current User:</span>
                <span>{currentUser}</span>
              </div>
            )}
            
            {/* Roll Number - ALWAYS show when in-use */}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Roll No:</span>
              <span>{rollNumber || "Not specified"}</span>
            </div>

            {/* Contact - show if available */}
            {contact && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Contact:</span>
                <span>{contact}</span>
              </div>
            )}

            {/* Duration - ALWAYS show when in-use */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Duration:</span>
              <span>{duration || timeUsed || "Not specified"}</span>
            </div>
          </div>
        )}

        {/* Booking Section */}
        <div className="pt-2 border-t">
          {status === "available" ? (
            bookingText ? (
              // Show static text when bookingText is provided
              <div className="text-center">
                <p className="text-sm text-muted-foreground italic">
                  {bookingText}
                </p>
              </div>
            ) : (
              // Show booking button when bookingText is not provided (for backward compatibility)
              <Button
                onClick={() => onBook?.(equipmentId)}
                disabled={isBooking}
                className="w-full"
                variant="default"
              >
                {isBooking ? "Booking..." : "Book Now"}
              </Button>
            )
          ) : status === "in-use" ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Currently in use
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Not available for booking
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentCard;