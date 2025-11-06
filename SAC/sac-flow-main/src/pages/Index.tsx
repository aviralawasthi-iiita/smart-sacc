import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import EquipmentCard from "@/components/EquipmentCard";
import RoomCard from "@/components/RoomCard";
import PlayerCard from "@/components/PlayerCard";
import RepairRequest from "@/components/RepairRequest";
import { 
  Gamepad2, 
  Dumbbell, 
  Target, 
  UserCircle,
  Drama,
  Music,
  Palette,
  Users,
} from "lucide-react";

const Index = () => {
  const equipmentData = [
    {
      name: "Table Tennis",
      status: "in-use" as const,
      currentUser: "Rahul Sharma",
      contact: "+91 98765 43210",
      timeUsed: "45 mins",
      icon: <Gamepad2 className="w-6 h-6 text-white" />,
    },
    {
      name: "Snooker Table",
      status: "available" as const,
      icon: <Target className="w-6 h-6 text-white" />,
    },
    {
      name: "Badminton Set",
      status: "in-use" as const,
      currentUser: "Priya Patel",
      contact: "+91 87654 32109",
      timeUsed: "30 mins",
      icon: <Dumbbell className="w-6 h-6 text-white" />,
    },
    {
      name: "Chess Set",
      status: "available" as const,
      icon: <UserCircle className="w-6 h-6 text-white" />,
    },
  ];

  const roomsData = [
    {
      name: "Drama Room",
      capacity: 30,
      status: "occupied" as const,
      currentActivity: "Theater Practice",
      timeSlot: "4:00 PM - 6:00 PM",
      icon: <Drama className="w-6 h-6 text-white" />,
    },
    {
      name: "Music Studio",
      capacity: 15,
      status: "available" as const,
      icon: <Music className="w-6 h-6 text-white" />,
    },
    {
      name: "Art Room",
      capacity: 20,
      status: "reserved" as const,
      currentActivity: "Painting Workshop",
      timeSlot: "6:00 PM - 8:00 PM",
      icon: <Palette className="w-6 h-6 text-white" />,
    },
    {
      name: "Dance Studio",
      capacity: 25,
      status: "available" as const,
      icon: <Users className="w-6 h-6 text-white" />,
    },
  ];

  const playersData = [
    {
      name: "Amit Kumar",
      sport: "Squash",
      skillLevel: "advanced" as const,
      hoursPlayed: 156,
      available: true,
    },
    {
      name: "Sneha Reddy",
      sport: "Table Tennis",
      skillLevel: "intermediate" as const,
      hoursPlayed: 89,
      available: true,
    },
    {
      name: "Rohan Singh",
      sport: "Badminton",
      skillLevel: "beginner" as const,
      hoursPlayed: 34,
      available: false,
    },
    {
      name: "Ananya Das",
      sport: "Chess",
      skillLevel: "advanced" as const,
      hoursPlayed: 203,
      available: true,
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />

      {/* Equipment Section */}
      <section id="equipment" className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Gamepad2 className="w-4 h-4" />
              <span className="text-sm font-semibold">Real-Time Status</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Available Equipment
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Check what's available right now and who's using what
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            {equipmentData.map((equipment, index) => (
              <EquipmentCard key={index} {...equipment} />
            ))}
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section id="rooms" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-4">
              <Drama className="w-4 h-4" />
              <span className="text-sm font-semibold">Activity Spaces</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Activity Rooms
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Book practice spaces for your societies and activities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            {roomsData.map((room, index) => (
              <RoomCard key={index} {...room} />
            ))}
          </div>
        </div>
      </section>

      {/* Players Section */}
      <section id="players" className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-4">
              <Users className="w-4 h-4" />
              <span className="text-sm font-semibold">Community</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Find Play Partners
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with other players and improve your game
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            {playersData.map((player, index) => (
              <PlayerCard key={index} {...player} />
            ))}
          </div>
        </div>
      </section>

      {/* Repair Request Section */}
      <RepairRequest />

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; 2025 Smart SAC Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
