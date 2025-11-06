import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast as sonner } from "sonner";
import { Search, Filter, Eye, MessageSquare, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Define types
interface Ticket {
  _id: string;
  heading: string;
  content: string;
  status: "open" | "in-process" | "closed";
  equipment: {
    _id: string;
    name: string;
  };
  sender: {
    _id: string;
    fullname: string;
    email: string;
    roll_no: string;
  };
  createdAt: string;
  updatedAt: string;
}

const AdminTickets = () => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 🔹 Fetch all tickets for admin - USING DIRECT API CALL LIKE ANNOUNCEMENTS
  const { data: tickets, isLoading, error } = useQuery<Ticket[]>({
    queryKey: ["adminTickets"],
    queryFn: async () => {
      try {
        const res = await api.get("/admin/get-active-tickets");
        // Handle different response structures
        return res.data?.tickets || res.tickets || res.data || res;
      } catch (err: any) {
        console.error("Fetch tickets error:", err);
        const errorMessage = err?.response?.data?.message || err.message || "Failed to fetch tickets";
        sonner.error(errorMessage);
        throw err;
      }
    },
    retry: 1,
  });

  // 🔹 Update ticket status mutation - USING DIRECT API CALL
  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      try {
        const newStatus = status;
        const res = await api.post("/admin/update-ticket", { ticketId, newStatus });
        return res.data;
      } catch (err: any) {
        console.error("Update ticket error:", err);
        const errorMessage = err?.response?.data?.message || err.message || "Failed to update ticket";
        sonner.error(errorMessage);
        throw err;
      }
    },
    onSuccess: () => {
      sonner.success("Ticket status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminTickets"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["activeTickets"] });
      setIsDialogOpen(false);
      setSelectedTicket(null);
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      // Error is already handled in mutationFn
    },
  });

  const handleStatusUpdate = (ticketId: string, newStatus: string) => {
    updateTicketMutation.mutate({ ticketId, status: newStatus });
  };

  const openTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-process":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="w-4 h-4" />;
      case "in-process":
        return <MessageSquare className="w-4 h-4" />;
      case "closed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Filter tickets based on search and status
  const filteredTickets = tickets?.filter(ticket => {
    const matchesSearch = 
      ticket.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.sender.fullname && ticket.sender.fullname.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error Loading Tickets</h2>
            <p className="text-muted-foreground mb-4">
              {error.message || "Failed to load tickets. Please try again."}
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/dashboard")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">Smart SAC</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  Ticket Management
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 md:px-8 pt-28 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Ticket Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage and resolve equipment complaints
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Badge variant="secondary" className="text-sm">
              Total: {tickets?.length || 0}
            </Badge>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search tickets by heading, equipment, or user..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-process">In process</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>All Tickets</CardTitle>
            <CardDescription>
              {filteredTickets?.length || 0} ticket(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading tickets...</p>
              </div>
            ) : filteredTickets?.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {tickets?.length === 0 ? "No tickets found" : "No tickets match your filters"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets?.map((ticket) => (
                  <Card key={ticket._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">
                                {ticket.heading}
                              </h3>
                              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                                {ticket.content}
                              </p>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="capitalize">
                                  {ticket.equipment.name}
                                </Badge>
                                <span>By: {ticket.sender.fullname}</span>
                                <span>Roll No: {ticket.sender.roll_no}</span>
                                <span>
                                  {new Date(ticket.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 items-start md:items-end">
                          {/* Status Badge */}
                          <Badge className={`${getStatusColor(ticket.status)} flex items-center gap-1`}>
                            {getStatusIcon(ticket.status)}
                            {ticket.status.replace("-", " ")}
                          </Badge>
                          
                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openTicketDetails(ticket)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            
                            {/* Quick Status Update */}
                            {ticket.status !== "closed" && (
                              <Select
                                value=""
                                onValueChange={(newStatus) => 
                                  handleStatusUpdate(ticket._id, newStatus)
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Actions" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="in-process">Mark In process</SelectItem>
                                  <SelectItem value="closed">Close</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            {selectedTicket && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedTicket.heading}</DialogTitle>
                  <DialogDescription>
                    Equipment: {selectedTicket.equipment.name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                      {selectedTicket.content}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Reported By</Label>
                      <p className="text-sm mt-1">{selectedTicket.sender.fullname}</p>
                    </div>
                    <div>
                      <Label>Roll Number</Label>
                      <p className="text-sm mt-1">{selectedTicket.sender.roll_no}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm mt-1">{selectedTicket.sender.email}</p>
                    </div>
                    <div>
                      <Label>Reported On</Label>
                      <p className="text-sm mt-1">
                        {new Date(selectedTicket.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Current Status</Label>
                    <div className="mt-2">
                      <Badge className={`${getStatusColor(selectedTicket.status)} text-sm`}>
                        {selectedTicket.status.replace("-", " ")}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Update Status</Label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {["open", "in-process", "closed"].map((status) => (
                        <Button
                          key={status}
                          variant={selectedTicket.status === status ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleStatusUpdate(selectedTicket._id, status)}
                          disabled={updateTicketMutation.isPending}
                        >
                          {status.replace("-", " ")}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminTickets;