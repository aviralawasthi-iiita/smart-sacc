import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  ClipboardList,
  History,
  LogOut,
  Megaphone,
  Ticket,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface AdminDashboardData {
  equipment: {
    _id: string;
    name: string;
    status: "available" | "in-use" | "broken";
  }[];
  announcements: {
    _id: string;
    heading: string;
    content: string;
  }[];
}

interface EquipmentHistoryItem {
  _id: string;
  equipment: {
    name: string;
    status: string;
  };
  user: {
    name: string;
    email: string;
    roll_no: string;
  } | null;
  status: string;
  duration: string | null;
  roll_no: string | null;
  changedAt: string;
}

interface EquipmentHistoryResponse {
  history: EquipmentHistoryItem[];
  count: number;
}

const fetchAdminDashboard = async () => {
  return (await api.get("/admin/dashboard")) as AdminDashboardData;
};

const fetchActiveTickets = async () => {
  const res = await api.get("/admin/get-no-of-active-tickets");
  return res.totalTickets || 0;
};

const fetchEquipmentHistory = async (): Promise<EquipmentHistoryResponse> => {
  const res = await api.get("/admin/get-recent-equipment-history");
  return res;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { data, isLoading, error } = useQuery<AdminDashboardData>({
    queryKey: ["adminDashboard"],
    queryFn: fetchAdminDashboard,
  });

  const { data: activeTickets = 0, isLoading: ticketsLoading } = useQuery({
    queryKey: ["activeTickets"],
    queryFn: fetchActiveTickets,
  });

  const { data: equipmentHistory, isLoading: historyLoading } = useQuery<EquipmentHistoryResponse>({
    queryKey: ["equipmentHistory"],
    queryFn: fetchEquipmentHistory,
  });

  const stats = {
    activeCheckouts:
      data?.equipment.filter((e) => e.status === "in-use").length || 0,
    equipmentInUse: `${
      data?.equipment.filter((e) => e.status === "in-use").length || 0
    }/${data?.equipment.length || 0}`,
    equipmentBroken:
      data?.equipment.filter((e) => e.status === "broken").length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">Smart SAC</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  Admin Panel
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={logout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 md:px-8 pt-28 pb-16 space-y-10">
        {/* Welcome Section */}
        <div className="text-center md:text-left space-y-2 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-base">
            Manage checkouts, complaints, and monitor SAC activity.
          </p>
        </div>

        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-scale-in">
          {/* Active Checkouts */}
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Active Checkouts
                  </p>
                  <p className="text-3xl font-bold">
                    {isLoading ? "..." : stats.activeCheckouts}
                  </p>
                </div>
                <ClipboardList className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          {/* Equipment In Use */}
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Equipment In Use
                  </p>
                  <p className="text-3xl font-bold">
                    {isLoading ? "..." : stats.equipmentInUse}
                  </p>
                </div>
                <Activity className="w-10 h-10 text-accent" />
              </div>
            </CardContent>
          </Card>

          {/* Broken Items */}
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Items Broken
                  </p>
                  <p className="text-3xl font-bold">
                    {isLoading ? "..." : stats.equipmentBroken}
                  </p>
                </div>
                <History className="w-10 h-10 text-warning" />
              </div>
            </CardContent>
          </Card>

          {/* Active Tickets */}
          <Card
            onClick={() => navigate("/admin/tickets")}
            className="border-2 hover:shadow-lg hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
          >
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Active Tickets
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {ticketsLoading ? "..." : activeTickets}
                  </p>
                </div>
                <Ticket className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Manage Sections */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manage Announcements */}
          <Card
            onClick={() => navigate("/admin/announcements")}
            className="border-2 hover:shadow-lg hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
          >
            <CardContent className="py-6 px-4 md:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Manage</p>
                  <p className="text-3xl font-bold text-primary">
                    Announcements
                  </p>
                </div>
                <Megaphone className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          {/* Assign Equipment */}
          <Card
            onClick={() => navigate("/admin/assign-equipment")}
            className="border-2 hover:shadow-lg hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
          >
            <CardContent className="py-6 px-4 md:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Manage</p>
                  <p className="text-3xl font-bold text-primary">
                    Assign Equipment
                  </p>
                </div>
                <Wrench className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Announcements & Equipment Section */}
        <section className="grid lg:grid-cols-2 gap-8 mt-10">
          {/* Announcements */}
          <Card className="border-2 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Megaphone className="w-5 h-5 text-primary" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && <p>Loading announcements...</p>}
              {error && (
                <p className="text-destructive">
                  Could not load announcements.
                </p>
              )}
              {data?.announcements.map((item) => (
                <div
                  key={item._id}
                  className="p-4 rounded-lg border hover:bg-muted/30 transition"
                >
                  <h3 className="font-semibold">{item.heading}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.content}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Equipment */}
          <Card className="border-2 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-primary" />
                Equipment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading && <p>Loading equipment...</p>}
              {error && (
                <p className="text-destructive">
                  Could not load equipment.
                </p>
              )}
              {data?.equipment.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition"
                >
                  <span className="font-medium capitalize">{item.name}</span>
                  <span
                    className={`text-sm font-semibold ${
                      item.status === "available"
                        ? "text-success"
                        : item.status === "in-use"
                        ? "text-warning"
                        : "text-destructive"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Equipment History Section */}
        <section className="mt-10">
          <Card className="border-2 animate-fade-in">
            <CardHeader 
              className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg"
              onClick={() => navigate("/admin/equipment-history")}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Equipment History
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                  View All →
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading && <p>Loading equipment history...</p>}
              {equipmentHistory?.history.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  No equipment history available.
                </p>
              ) : (
                <div className="space-y-3">
                  {equipmentHistory?.history.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <span className="font-medium capitalize min-w-[120px]">
                            {item.equipment?.name}
                          </span>
                          <span
                            className={`text-sm font-semibold px-2 py-1 rounded ${
                              item.status === "available"
                                ? "bg-green-100 text-green-800"
                                : item.status === "in-use"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.duration && (
                            <span className="text-sm text-muted-foreground">
                              Duration: {item.duration}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.user ? (
                            <>By: {item.user.name} ({item.user.roll_no})</>
                          ) : item.roll_no ? (
                            <>By: Roll No: {item.roll_no}</>
                          ) : (
                            "System"
                          )}
                          {" • "}
                          {new Date(item.changedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;