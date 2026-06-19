import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchAnnouncements = async (pageNum: number, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await api.get(`/users/get-announcements?page=${pageNum}`);
      const newAnnouncements = res.announcements || [];
      if (isLoadMore) {
        setAnnouncements((prev) => [...prev, ...newAnnouncements]);
      } else {
        setAnnouncements(newAnnouncements);
      }
      setHasNextPage(res.hasNextPage || false);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements(1, false);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAnnouncements(nextPage, true);
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center text-muted-foreground pt-24">
          Loading announcements...
        </div>
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

            {hasNextPage && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="gap-2"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AllAnnouncements;
