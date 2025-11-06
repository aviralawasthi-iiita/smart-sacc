import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast as sonner } from "sonner";
import { api } from "@/lib/api";
import { Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Announcement {
  _id: string;
  heading: string;
  content: string;
  createdAt: string;
}

const AdminAnnouncements = () => {
  const [heading, setHeading] = useState("");
  const [content, setContent] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔹 Fetch all announcements
  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("/admin/get-announcements");
      // Make sure we're accessing the correct response structure
      const announcementsData = res.data?.announcements || res.announcements || [];
      setAnnouncements(announcementsData);
    } catch (err) {
      console.error("Fetch error:", err);
      sonner.error("Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Create new announcement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heading || !content) {
      sonner.error("Please fill out all fields");
      return;
    }

    try {
      await api.post("/admin/make-announcement", { heading, content });
      sonner.success("Announcement created!");
      setHeading("");
      setContent("");
      fetchAnnouncements();
    } catch (err) {
      console.error("Create error:", err);
      sonner.error("Failed to create announcement");
    }
  };

  // 🔹 Delete announcement - USING DELETE METHOD
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/delete-announcement/${id}`);
      sonner.success("Announcement deleted successfully");
      fetchAnnouncements();
    } catch (err: any) {
      console.error("Delete error:", err);
      const errorMessage = err?.response?.data?.message || err.message || "Failed to delete announcement";
      sonner.error(errorMessage);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* ✅ Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/dashboard")}
          >
            ← Back to Dashboard
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-6">Manage Announcements</h1>

        {/* === Create Form === */}
        <Card className="mb-8 border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Create New Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Announcement Heading"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
              />
              <Textarea
                placeholder="Announcement Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
              <Button type="submit" className="w-full bg-gradient-primary text-white">
                Publish Announcement
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* === Existing Announcements === */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Current Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-6">Loading announcements...</p>
            ) : announcements.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No announcements yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {announcements.map((a) => (
                  <Card key={a._id} className="relative border hover:shadow-lg transition">
                    <CardHeader className="pb-3">
                      <CardTitle className="pr-10 text-lg">{a.heading}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {a.content}
                      </p>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(a._id)}
                        className="absolute top-3 right-3"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnnouncements;