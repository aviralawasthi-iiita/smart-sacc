import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

interface EquipmentHistoryEntry {
  _id: string;
  equipment: string;
  status: string;
  user?: {
    name: string;
    email: string;
    roll_no: string;
  } | null;
  roll_no?: string | null;
  duration?: string | null;
  changedAt: string;
}

// The backend returns: { "equipmentName": EquipmentHistoryEntry[] }
interface EquipmentHistoryDict {
  [equipmentName: string]: EquipmentHistoryEntry[];
}

interface PaginatedHistory {
  history: EquipmentHistoryEntry[];
  currentPage: number;
  totalPages: number;
  totalHistory: number;
}

const EquipmentHistoryPage = () => {
  const { wrapApiCall } = useAuth();
  const navigate = useNavigate();
  
  const [equipmentHistoryDict, setEquipmentHistoryDict] = useState<EquipmentHistoryDict>({});
  const [expandedEquipment, setExpandedEquipment] = useState<string | null>(null);
  const [fullHistory, setFullHistory] = useState<{ [equipmentName: string]: PaginatedHistory }>({});
  const [loading, setLoading] = useState(true);
  const [loadingEquipment, setLoadingEquipment] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [equipmentIdMap, setEquipmentIdMap] = useState<{ [equipmentName: string]: string }>({});

  // Fetch initial equipment history dictionary
  useEffect(() => {
    const fetchEquipmentHistoryDict = async () => {
      try {
        setLoading(true);
        const response = await wrapApiCall(() => 
          api.get("/admin/get-equipment-recent-history-dict")
        );
        console.log("Equipment history dict response:", response);
        
        if (response && typeof response === 'object') {
          setEquipmentHistoryDict(response);
          
          // Extract equipment IDs from the first entry of each equipment
          const idMap: { [equipmentName: string]: string } = {};
          Object.entries(response).forEach(([equipmentName, historyArray]) => {
            if (historyArray && historyArray[0].equipment) {
              idMap[equipmentName] = historyArray[0].equipment;
            }
          });
          setEquipmentIdMap(idMap);
        } else {
          setEquipmentHistoryDict({});
        }
      } catch (err) {
        console.error("Error fetching equipment history:", err);
        toast.error("Failed to load equipment history");
      } finally {
        setLoading(false);
      }
    };

    fetchEquipmentHistoryDict();
  }, [wrapApiCall]);

  // Fetch full history for an equipment when expanded
  const fetchEquipmentFullHistory = async (equipmentName: string) => {
    try {
      setLoadingEquipment(equipmentName);
      
      const equipmentId = equipmentIdMap[equipmentName];
      if (!equipmentId) {
        toast.error(`Could not find equipment ID for ${equipmentName}`);
        return;
      }

      // Get total count
      const countResponse = await wrapApiCall(() =>
        api.get(`/admin/get-no-of-equipment-history/${equipmentId}`)
      );
      console.log("Count response:", countResponse);
      
      // Get first page of history
      const historyResponse = await wrapApiCall(() =>
        api.get(`/admin/get-recent-equipment-history/${equipmentId}?page=1`)
      );
      console.log("History response:", historyResponse);

      setFullHistory(prev => ({
        ...prev,
        [equipmentName]: {
          history: historyResponse?.history || [],
          currentPage: 1,
          totalPages: countResponse?.totalPages || 1,
          totalHistory: countResponse?.totalHistory || 0
        }
      }));
    } catch (err) {
      console.error(`Error fetching full history for ${equipmentName}:`, err);
      toast.error(`Failed to load history for ${equipmentName}`);
    } finally {
      setLoadingEquipment(null);
    }
  };

  // Load more history for pagination
  const loadMoreHistory = async (equipmentName: string, page: number) => {
    try {
      const equipmentId = equipmentIdMap[equipmentName];
      if (!equipmentId) return;

      const response = await wrapApiCall(() =>
        api.get(`/admin/get-recent-equipment-history/${equipmentId}?page=${page}`)
      );

      setFullHistory(prev => ({
        ...prev,
        [equipmentName]: {
          ...prev[equipmentName],
          history: [...(prev[equipmentName]?.history || []), ...(response?.history || [])],
          currentPage: page
        }
      }));
    } catch (err) {
      console.error("Error loading more history:", err);
      toast.error("Failed to load more history");
    }
  };

  const handleExpand = (equipmentName: string) => {
    if (expandedEquipment === equipmentName) {
      setExpandedEquipment(null);
    } else {
      setExpandedEquipment(equipmentName);
      if (!fullHistory[equipmentName]) {
        fetchEquipmentFullHistory(equipmentName);
      }
    }
  };

  const handleLoadMore = (equipmentName: string) => {
    const currentData = fullHistory[equipmentName];
    if (currentData && currentData.currentPage < currentData.totalPages) {
      loadMoreHistory(equipmentName, currentData.currentPage + 1);
    }
  };

  // Filter equipment based on search term
  const filteredEquipment = Object.entries(equipmentHistoryDict).filter(
    ([equipmentName]) =>
      equipmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-6">
            <Button variant="outline" onClick={() => navigate("/admin/dashboard")}>
              ← Back to Dashboard
            </Button>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading equipment history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 md:px-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate("/admin/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Equipment History</h1>
          <p className="text-muted-foreground">
            View complete history of all equipment status changes and assignments
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Equipment List */}
        <div className="space-y-4">
          {filteredEquipment.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  {searchTerm ? "No equipment found matching your search" : "No equipment history available"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredEquipment.map(([equipmentName, equipmentHistory]) => (
              <Card key={equipmentName} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{equipmentName}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExpand(equipmentName)}
                      disabled={loadingEquipment === equipmentName || !equipmentIdMap[equipmentName]}
                    >
                      {loadingEquipment === equipmentName ? (
                        "Loading..."
                      ) : expandedEquipment === equipmentName ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Expand
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Recent {equipmentHistory?.length || 0} changes
                  </p>
                </CardHeader>

                {/* Recent History (Always visible) */}
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {equipmentHistory?.slice(0, 3).map((entry) => (
                      <HistoryEntry key={entry._id} entry={entry} />
                    ))}
                  </div>

                  {/* Expanded Full History */}
                  {expandedEquipment === equipmentName && (
                    <div className="mt-6 border-t pt-6">
                      <h4 className="font-semibold mb-4">Complete History</h4>
                      
                      {loadingEquipment === equipmentName ? (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">Loading full history...</p>
                        </div>
                      ) : fullHistory[equipmentName] ? (
                        <div className="space-y-3">
                          {fullHistory[equipmentName].history.map((entry) => (
                            <HistoryEntry key={entry._id} entry={entry} />
                          ))}
                          
                          {/* Load More Button */}
                          {fullHistory[equipmentName].currentPage < 
                           fullHistory[equipmentName].totalPages && (
                            <div className="text-center pt-4">
                              <Button
                                variant="outline"
                                onClick={() => handleLoadMore(equipmentName)}
                              >
                                Load More History
                              </Button>
                              <p className="text-xs text-muted-foreground mt-2">
                                Showing {fullHistory[equipmentName].history.length} of{" "}
                                {fullHistory[equipmentName].totalHistory} entries
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">Failed to load history</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Component for individual history entry
const HistoryEntry = ({ entry }: { entry: EquipmentHistoryEntry }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "in-use":
        return "bg-yellow-100 text-yellow-800";
      case "broken":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Safe access to user properties
  const getUserDisplay = () => {
    if (entry.user) {
      return `By: ${entry.user.name || 'Unknown'} (${entry.user.roll_no || 'No roll number'})`;
    } else if (entry.roll_no) {
      return `By: Roll No: ${entry.roll_no}`;
    } else {
      return "System";
    }
  };

  return (
    <div className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/30 transition">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-1">
          <Badge className={getStatusColor(entry.status)}>
            {entry.status}
          </Badge>
          {entry.duration && (
            <span className="text-sm text-muted-foreground">
              Duration: {entry.duration}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {getUserDisplay()}
          {" • "}
          {new Date(entry.changedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default EquipmentHistoryPage;