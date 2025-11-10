import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, ArrowLeft, CheckCircle, Clock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast as sonner } from "sonner";

// 1. Define the types for our data
interface Equipment {
  _id: string;
  name: string;
  status: 'available' | 'in-use' | 'broken';
  duration?: string;
  user?: { // This user is populated from our backend fix
    _id: string;
    fullname: string;
    roll_no: string;
  };
  updatedAt: string; // To calculate duration
}

// 2. Define the fetch function
const fetchAllEquipment = async (): Promise<Equipment[]> => {
  // We can't use wrapApiCall from AuthContext, so we'll call api.get
  // The admin dashboard endpoint returns all equipment
  const data = await api.get("/admin/dashboard");
  return data.equipment;
};

const AdminCheckout = () => {
  const navigate = useNavigate();
  const { wrapApiCall } = useAuth();
  const queryClient = useQueryClient();

  // 3. Form state
  const [rollNumber, setRollNumber] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [duration, setDuration] = useState("1h"); // Default duration

  // 4. Fetch all equipment data
  const { data: equipmentList, isLoading } = useQuery({
    queryKey: ["allEquipment"],
    queryFn: fetchAllEquipment,
  });

  // 5. Create a "mutation" to handle updates
  const updateEquipmentMutation = useMutation({
    mutationFn: (variables: { status: string; equipment: { _id: string }; roll_no?: string; duration?: string }) => {
      // Use wrapApiCall to handle auth errors
      return wrapApiCall(() => api.post("/admin/update-equipment", variables));
    },
    onSuccess: (data: any) => {
      sonner.success("Success", { description: data.message || "Equipment updated!" });
      // This is the magic: it tells react-query to re-fetch the data
      queryClient.invalidateQueries({ queryKey: ["allEquipment"] });
      // Clear the form
      setRollNumber("");
      setEquipmentId("");
    },
    onError: (error) => {
      // Error toast is already handled by api.ts
      console.error("Mutation failed", error);
    },
  });

  // 6. Handle the checkout form submission
  const handleCheckout = () => {
    if (!rollNumber || !equipmentId || !duration) {
      sonner.error("Missing Information", {
        description: "Please fill in all fields.",
      });
      return;
    }
    updateEquipmentMutation.mutate({
      status: "in-use",
      equipment: { _id: equipmentId },
      roll_no: rollNumber,
      duration: duration,
    });
  };

  // 7. Handle the return button click
  const handleReturn = (checkout: Equipment) => {
    updateEquipmentMutation.mutate({
      status: "available",
      equipment: { _id: checkout._id },
    });
  };

  // 8. Filter data for the UI
  const availableEquipment = equipmentList?.filter(e => e.status === 'available') || [];
  const activeCheckouts = equipmentList?.filter(e => e.status === 'in-use') || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        {/* ... (Navbar content is the same) ... */}
         <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/admin/dashboard')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold">Smart SAC</span>
                  <span className="ml-2 text-sm text-muted-foreground">Checkout Management</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Checkout Form - Now Dynamic */}
          <Card className="border-2 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                New Checkout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Student Roll Number</Label>
                <Input
                  id="rollNumber"
                  placeholder="e.g., CSE-21-042"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">Equipment</Label>
                <Select value={equipmentId} onValueChange={setEquipmentId}>
                  <SelectTrigger id="equipment">
                    <SelectValue placeholder="Select available equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      availableEquipment.map((item) => (
                        <SelectItem key={item._id} value={item._id} className="capitalize">
                          {item.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 1h 30m"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <Button 
                className="w-full bg-gradient-primary"
                size="lg"
                onClick={handleCheckout}
                disabled={updateEquipmentMutation.isPending}
              >
                {updateEquipmentMutation.isPending ? "Checking out..." : "Check Out Equipment"}
              </Button>
            </CardContent>
          </Card>

          {/* Active Checkouts - Now Dynamic */}
          <Card className="border-2 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Active Checkouts ({activeCheckouts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading && <p>Loading checkouts...</p>}
              {activeCheckouts.length === 0 && !isLoading && (
                <p className="text-muted-foreground text-center">No equipment is currently checked out.</p>
              )}
              {activeCheckouts.map((checkout) => (
                <div key={checkout._id} className="p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold mb-1">{checkout.user?.fullname || "N/A"}</h3>
                      <p className="text-sm text-muted-foreground mb-1">{checkout.user?.roll_no || "N/A"}</p>
                      <p className="text-sm font-medium capitalize">{checkout.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        Duration: {checkout.duration}
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="hover:bg-success/10 hover:text-success hover:border-success"
                      onClick={() => handleReturn(checkout)}
                      disabled={updateEquipmentMutation.isPending}
                    >
                      Return
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminCheckout;