import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast as sonner } from "sonner";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket } from "lucide-react";

// Define types for our data
interface ApiEquipment {
  _id: string;
  name: string;
}
interface DashboardData {
  equipment: ApiEquipment[];
}

const Complaints = () => {
  const [heading, setHeading] = useState("");
  const [content, setContent] = useState("");
  const [equipmentId, setEquipmentId] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { wrapApiCall, user } = useAuth();

  // 1️⃣ Fetch equipment list for dropdown
  const { data: equipmentData, isLoading: isLoadingEquipment } = useQuery<DashboardData>({
    queryKey: ["studentDashboard"],
    queryFn: () => wrapApiCall(() => api.get("/users/dashboard")),
    enabled: !!user, // Only fetch if logged in
  });

  // 2️⃣ Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: () => {
      return wrapApiCall(() =>
        api.post("/users/create-ticket", {
          heading,
          content,
          equipmentId,
        })
      );
    },
    onSuccess: () => {
      sonner.success("Ticket submitted successfully!");
      // Refresh dashboard data so open ticket count updates
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      // Redirect back to dashboard
      navigate("/student/dashboard");
    },
    onError: (error: any) => {
      console.error("Failed to submit ticket:", error);
      sonner.error("Failed to submit ticket. Please try again.");
    },
  });

  // 3️⃣ Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heading || !content || !equipmentId) {
      sonner.error("Please fill out all fields before submitting.");
      return;
    }
    createTicketMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Ticket className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="mt-4 text-2xl font-semibold">Submit a Complaint</CardTitle>
              <CardDescription className="text-muted-foreground">
                Found an issue with any equipment? Let us know.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Equipment Selector */}
                <div className="space-y-2">
                  <Label htmlFor="equipment">Equipment</Label>
                  <Select value={equipmentId} onValueChange={setEquipmentId}>
                    <SelectTrigger id="equipment">
                      <SelectValue placeholder="Select an equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingEquipment ? (
                        <SelectItem value="loading" disabled>
                          Loading equipment...
                        </SelectItem>
                      ) : (
                        equipmentData?.equipment.map((item) => (
                          <SelectItem key={item._id} value={item._id} className="capitalize">
                            {item.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Heading Input */}
                <div className="space-y-2">
                  <Label htmlFor="heading">Issue / Heading</Label>
                  <Input
                    id="heading"
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                    placeholder="e.g. Bat is cracked, Snooker cue tip broken"
                  />
                </div>

                {/* Details Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="content">Details</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Please describe the problem in detail..."
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createTicketMutation.isPending}
                >
                  {createTicketMutation.isPending ? "Submitting..." : "Submit Ticket"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Complaints;
