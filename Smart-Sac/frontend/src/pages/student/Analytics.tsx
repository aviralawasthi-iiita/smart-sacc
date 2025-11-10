import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, Clock, Activity } from "lucide-react";

const Analytics = () => {
  const [selectedOption, setSelectedOption] = useState("Table Tennis");

  // 🎾 Equipment usage data (realistic hourly trend)
  const equipmentUsageData = [
    { time: "8 AM", "Table Tennis": 1, Badminton: 0, Squash: 0, Chess: 2 },
    { time: "10 AM", "Table Tennis": 2, Badminton: 1, Squash: 1, Chess: 3 },
    { time: "12 PM", "Table Tennis": 3, Badminton: 2, Squash: 1, Chess: 4 },
    { time: "2 PM", "Table Tennis": 4, Badminton: 3, Squash: 2, Chess: 2 },
    { time: "4 PM", "Table Tennis": 6, Badminton: 5, Squash: 3, Chess: 3 },
    { time: "6 PM", "Table Tennis": 8, Badminton: 7, Squash: 4, Chess: 2 },
    { time: "8 PM", "Table Tennis": 7, Badminton: 6, Squash: 3, Chess: 1 },
    { time: "10 PM", "Table Tennis": 4, Badminton: 3, Squash: 2, Chess: 1 },
  ];

  // 🎭 Room usage data (realistic hourly trend)
  const roomUsageData = [
    { time: "8 AM", "Music Room": 0, "Drama Room": 0, "Dance Studio": 0 },
    { time: "10 AM", "Music Room": 1, "Drama Room": 0, "Dance Studio": 1 },
    { time: "12 PM", "Music Room": 1, "Drama Room": 1, "Dance Studio": 2 },
    { time: "2 PM", "Music Room": 2, "Drama Room": 1, "Dance Studio": 2 },
    { time: "4 PM", "Music Room": 3, "Drama Room": 2, "Dance Studio": 3 },
    { time: "6 PM", "Music Room": 4, "Drama Room": 3, "Dance Studio": 4 },
    { time: "8 PM", "Music Room": 5, "Drama Room": 4, "Dance Studio": 5 },
    { time: "10 PM", "Music Room": 3, "Drama Room": 2, "Dance Studio": 3 },
  ];

  const isEquipment = ["Table Tennis", "Badminton", "Squash", "Chess"].includes(
    selectedOption
  );

  // 🧠 Realistic statistics per facility
  const statsMap: Record<
    string,
    { peakHour: string; avgDuration: string; activeSessions: number }
  > = {
    "Table Tennis": { peakHour: "6 PM", avgDuration: "1 hr 10 min", activeSessions: 16 },
    Badminton: { peakHour: "6 PM", avgDuration: "1 hr 25 min", activeSessions: 18 },
    Squash: { peakHour: "5 PM", avgDuration: "45 min", activeSessions: 7 },
    Chess: { peakHour: "12 PM", avgDuration: "50 min", activeSessions: 9 },
    "Music Room": { peakHour: "8 PM", avgDuration: "1 hr 30 min", activeSessions: 5 },
    "Drama Room": { peakHour: "7 PM", avgDuration: "1 hr 45 min", activeSessions: 6 },
    "Dance Studio": { peakHour: "8 PM", avgDuration: "1 hr 10 min", activeSessions: 12 },
  };

  const selectedStats = statsMap[selectedOption];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 pt-24 pb-20">
        {/* HEADER */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4 shadow-sm">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wide">
              Insights
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Usage Analytics
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            Explore how students are using SAC facilities throughout the day.
          </p>
        </div>

        {/* DYNAMIC STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <Card className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl hover:shadow-md transition-all text-center p-4">
            <CardHeader className="pb-2">
              <TrendingUp className="w-6 h-6 mx-auto text-primary mb-2" />
              <CardTitle className="text-base font-medium text-muted-foreground">
                Peak Usage Hour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-primary">
                {selectedStats.peakHour}
              </p>
              <p className="text-xs text-muted-foreground">
                Highest activity recorded time
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl hover:shadow-md transition-all text-center p-4">
            <CardHeader className="pb-2">
              <Clock className="w-6 h-6 mx-auto text-primary mb-2" />
              <CardTitle className="text-base font-medium text-muted-foreground">
                Avg. Session Length
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-primary">
                {selectedStats.avgDuration}
              </p>
              <p className="text-xs text-muted-foreground">
                Typical duration of a single session
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl hover:shadow-md transition-all text-center p-4">
            <CardHeader className="pb-2">
              <Activity className="w-6 h-6 mx-auto text-primary mb-2" />
              <CardTitle className="text-base font-medium text-muted-foreground">
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-primary">
                {selectedStats.activeSessions}
              </p>
              <p className="text-xs text-muted-foreground">
                Ongoing sessions right now
              </p>
            </CardContent>
          </Card>
        </div>

        {/* SELECT MENU */}
        <div className="flex justify-center mb-10">
          <select
            className="px-4 py-3 rounded-xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground text-sm md:text-base"
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
          >
            <optgroup label="Games">
              <option value="Table Tennis">Table Tennis</option>
              <option value="Badminton">Badminton</option>
              <option value="Squash">Squash</option>
              <option value="Chess">Chess</option>
            </optgroup>
          </select>
        </div>

        {/* CHART */}
        <Card className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {selectedOption} Usage Throughout the Day
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="p-2 md:p-4">
              <ResponsiveContainer width="100%" height={350}>
                {isEquipment ? (
                  <LineChart data={equipmentUsageData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey={selectedOption}
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={roomUsageData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey={selectedOption}
                      fill="hsl(var(--primary))"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;
