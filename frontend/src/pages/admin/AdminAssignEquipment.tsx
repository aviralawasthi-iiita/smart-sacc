import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

const AdminAssignEquipment = () => {
  const { wrapApiCall } = useAuth();
  const navigate = useNavigate();

  const [equipment, setEquipment] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);

  // Checkout Modal State
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [rollNo, setRollNo] = useState("");
  const [duration, setDuration] = useState<number[]>([60]);
  const [fetchedUser, setFetchedUser] = useState<any>(null);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [checkingUser, setCheckingUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const equipmentRes = await wrapApiCall(() => api.get("/admin/get-equipment")).catch(() => []);
      setEquipment(Array.isArray(equipmentRes) ? equipmentRes : []);
    } catch (err) {
      console.error("Error fetching equipment data:", err);
      setEquipment([]);
      toast.error("Failed to load equipment");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [wrapApiCall]);

  const filteredEquipment = equipment.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEquipmentClick = (item: any) => {
    setSelectedEquipment(item);
    setStatusSelectOpen(true);
  };

  const handleStatusSelect = async (status: string) => {
    setStatusSelectOpen(false);
    if (status === "in-use") {
      setCheckoutStep(1);
      setRollNo("");
      setDuration([60]);
      setFetchedUser(null);
      setManualName("");
      setManualPhone("");
      setCheckoutOpen(true);
    } else {
      try {
        await api.post("/admin/update-equipment", {
          equipmentid: selectedEquipment._id,
          status: status,
        });
        toast.success(`Equipment marked as ${status}.`);
        fetchData();
      } catch (err) {
        console.error(err);
        toast.error(`Failed to update equipment status.`);
      }
    }
  };

  const handleContinueToStep2 = async () => {
    if (!rollNo) return;
    setCheckingUser(true);
    try {
      const res: any = await api.get(`/admin/check-user/${rollNo}`);
      if (res.exists) {
        setFetchedUser(res.user);
      } else {
        setFetchedUser(null);
      }
      setCheckoutStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleAssignEquipment = async () => {
    if (!selectedEquipment) return;
    if (!fetchedUser) {
      if (!manualName.trim()) {
        toast.error("Full name is required");
        return;
      }
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(manualPhone)) {
        toast.error("Phone number must be exactly 10 digits");
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload: any = {
        equipmentid: selectedEquipment._id,
        status: "in-use",
        roll_no: rollNo,
        duration: duration[0].toString() + " mins",
      };
      if (!fetchedUser) {
        payload.unregisteredName = manualName;
        payload.unregisteredPhone = manualPhone;
      }
      await api.post("/admin/update-equipment", payload);
      toast.success("Equipment assigned successfully");
      fetchData();
      setCheckoutOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign equipment");
    } finally {
      setSubmitting(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading equipment data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/dashboard")}
          >
            ← Back to Dashboard
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-6 text-center md:text-left">Assign Equipment</h1>

        <div className="mb-6 relative max-w-md">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...filteredEquipment]
            .sort((a, b) => {
              const weights = { "in-use": 1, "available": 2, "broken": 3 };
              return (weights[a.status as "available" | "in-use" | "broken"] || 99) - 
                     (weights[b.status as "available" | "in-use" | "broken"] || 99);
            })
            .map((e) => (
            <Card 
              key={e._id} 
              onClick={() => handleEquipmentClick(e)}
              className="cursor-pointer hover:shadow-lg transition-shadow border-2"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg capitalize">{e.name}</h3>
                  <span className={`text-sm font-semibold px-2 py-1 rounded ${
                    e.status === "available" ? "bg-green-100 text-green-800" :
                    e.status === "in-use" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {e.status}
                  </span>
                </div>
                
                {e.status === "in-use" && (
                  <div className="space-y-2 text-sm text-muted-foreground mt-4 border-t pt-4">
                    <p>
                      <strong className="text-foreground">Name:</strong>{" "}
                      {e.user?.fullname || e.unregisteredName || "Unknown"}
                    </p>
                    <p>
                      <strong className="text-foreground">Phone:</strong>{" "}
                      {e.user?.phone_number || e.unregisteredPhone || "Unknown"}
                    </p>
                    <p>
                      <strong className="text-foreground">Roll No:</strong>{" "}
                      {e.roll_no || "Unknown"}
                    </p>
                    <p>
                      <strong className="text-foreground">Duration:</strong>{" "}
                      {e.duration || "Not specified"}
                    </p>
                  </div>
                )}
                {e.status === "available" && (
                  <div className="text-sm text-muted-foreground mt-4">
                    Click to assign to a student.
                  </div>
                )}
                {e.status === "broken" && (
                  <div className="text-sm text-destructive mt-4">
                    Currently broken.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Checkout Dialog */}
        <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Checkout {selectedEquipment?.name}</DialogTitle>
            </DialogHeader>
            {checkoutStep === 1 ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Roll Number</Label>
                  <Input
                    placeholder="e.g. 21BCE1234"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration: {duration[0]} mins</Label>
                  <Slider
                    value={duration}
                    onValueChange={setDuration}
                    max={300}
                    step={15}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleContinueToStep2} disabled={!rollNo || checkingUser}>
                    {checkingUser ? "Checking..." : "Continue"}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {fetchedUser ? (
                  <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                    <p className="font-medium text-sm text-muted-foreground">User Found</p>
                    <p><strong>Name:</strong> {fetchedUser.fullname}</p>
                    <p><strong>Phone:</strong> {fetchedUser.phone_number}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">User not found. Please enter details manually.</p>
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        placeholder="Name"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        placeholder="Phone"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCheckoutStep(1)}>Back</Button>
                  <Button 
                    onClick={handleAssignEquipment} 
                    disabled={submitting || (!fetchedUser && (!manualName || !manualPhone))}
                  >
                    {submitting ? "Assigning..." : "Assign Equipment"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Status Select Dialog */}
        <Dialog open={statusSelectOpen} onOpenChange={setStatusSelectOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Update Status: {selectedEquipment?.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Button 
                variant={selectedEquipment?.status === "available" ? "secondary" : "outline"}
                className="justify-start h-12 text-lg"
                onClick={() => handleStatusSelect("available")}
              >
                Available
              </Button>
              <Button 
                variant={selectedEquipment?.status === "in-use" ? "secondary" : "outline"}
                className="justify-start h-12 text-lg"
                onClick={() => handleStatusSelect("in-use")}
              >
                In Use
              </Button>
              <Button 
                variant={selectedEquipment?.status === "broken" ? "secondary" : "outline"}
                className="justify-start h-12 text-lg"
                onClick={() => handleStatusSelect("broken")}
              >
                Broken
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default AdminAssignEquipment;
