import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wrench, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const RepairRequest = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    equipment: "",
    issue: "",
    contact: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Repair request submitted",
      description: "Our team will review and respond soon.",
    });
    setFormData({ equipment: "", issue: "", contact: "" });
  };

  return (
    <section id="repairs" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Wrench className="w-4 h-4" />
            <span className="text-sm font-semibold">Report Issues</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Equipment Repair Request
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Report damaged or malfunctioning equipment for quick maintenance
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Submit Repair Request</CardTitle>
              <CardDescription>
                Help us maintain quality equipment by reporting issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="equipment">Equipment Name</Label>
                  <Input
                    id="equipment"
                    placeholder="e.g., Table Tennis Paddle #3"
                    value={formData.equipment}
                    onChange={(e) =>
                      setFormData({ ...formData, equipment: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issue">Describe the Issue</Label>
                  <Textarea
                    id="issue"
                    placeholder="Please describe the problem in detail..."
                    value={formData.issue}
                    onChange={(e) =>
                      setFormData({ ...formData, issue: e.target.value })
                    }
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">Your Contact (Email/Phone)</Label>
                  <Input
                    id="contact"
                    placeholder="your.email@college.edu"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-gradient-primary" size="lg">
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default RepairRequest;
