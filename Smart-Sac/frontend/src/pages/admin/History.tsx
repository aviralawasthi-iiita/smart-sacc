import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowLeft, Search, Download, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const AdminHistory = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const historyData = [
    { id: 1, student: "Rahul Kumar", roll: "CSE-21-042", equipment: "Table Tennis Bat", checkoutTime: "10:30 AM", returnTime: "12:15 PM", duration: "1h 45m", date: "Today", status: "returned" },
    { id: 2, student: "Priya Sharma", roll: "ECE-21-128", equipment: "Badminton Racket", checkoutTime: "2:00 PM", returnTime: "3:30 PM", duration: "1h 30m", date: "Today", status: "returned" },
    { id: 3, student: "Arjun Patel", roll: "ME-21-089", equipment: "Chess Board", checkoutTime: "11:15 AM", returnTime: "-", duration: "In Progress", date: "Today", status: "active" },
    { id: 4, student: "Sneha Reddy", roll: "CSE-21-156", equipment: "Squash Racket", checkoutTime: "9:00 AM", returnTime: "10:45 AM", duration: "1h 45m", date: "Yesterday", status: "returned" },
    { id: 5, student: "Vikram Singh", roll: "ECE-21-089", equipment: "Table Tennis Bat", checkoutTime: "4:00 PM", returnTime: "6:00 PM", duration: "2h", date: "Yesterday", status: "returned" },
    { id: 6, student: "Anjali Gupta", roll: "ME-21-176", equipment: "Badminton Racket", checkoutTime: "3:30 PM", returnTime: "5:00 PM", duration: "1h 30m", date: "Yesterday", status: "returned" },
    { id: 7, student: "Karan Mehta", roll: "CSE-21-234", equipment: "Snooker Cue", checkoutTime: "1:00 PM", returnTime: "3:30 PM", duration: "2h 30m", date: "2 days ago", status: "returned" },
    { id: 8, student: "Riya Joshi", roll: "ECE-21-198", equipment: "Chess Board", checkoutTime: "10:00 AM", returnTime: "11:30 AM", duration: "1h 30m", date: "2 days ago", status: "returned" },
  ];

  const filteredHistory = historyData.filter(item =>
    item.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.equipment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
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
                  <span className="ml-2 text-sm text-muted-foreground">Usage History</span>
                </div>
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Equipment History</h1>
          <p className="text-muted-foreground">Complete record of all equipment checkouts and returns</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 animate-scale-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by student name, roll number, or equipment..."
              className="pl-10 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-fade-in">
          <Card className="border-2">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold mb-1">156</div>
              <div className="text-sm text-muted-foreground">Total Checkouts</div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold mb-1">153</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold mb-1">3</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold mb-1">1h 52m</div>
              <div className="text-sm text-muted-foreground">Avg Duration</div>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <Card className="border-2 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Checkout History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div key={item.id} className="p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                  <div className="grid md:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                      <div className="font-semibold mb-1">{item.student}</div>
                      <div className="text-sm text-muted-foreground">{item.roll}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Equipment</div>
                      <div className="font-medium">{item.equipment}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Checkout</div>
                      <div className="font-medium">{item.checkoutTime}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Return</div>
                      <div className="font-medium">{item.returnTime}</div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Badge className={`${
                        item.status === 'active'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-success/10 text-success border-success/20'
                      } border`}>
                        {item.status === 'active' ? 'In Progress' : 'Returned'}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-2">{item.date}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminHistory;
