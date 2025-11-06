import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";

interface Announcement {
  _id: string;
  heading: string;
  content: string;
  footer?: string;
  createdAt: string;
}

const AllAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("/users/get-announcements");
      setAnnouncements(res.announcements || res.data?.announcements || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading announcements...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 pt-24 pb-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-2">
          <Megaphone className="text-primary w-7 h-7" />
          All Announcements
        </h1>

        {announcements.length === 0 ? (
          <p className="text-muted-foreground">No announcements yet 🎉</p>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {announcements.map((ann) => (
              <Card
                key={ann._id}
                className="hover:shadow-lg transition-all border border-border"
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {ann.heading}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {ann.content}
                  </p>
                  {ann.footer && (
                    <p className="text-xs italic text-muted-foreground border-t pt-2">
                      {ann.footer}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    Posted on {new Date(ann.createdAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AllAnnouncements;
