import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AllAnnouncements from "@/pages/AllAnnouncements";
import AdminAssignEquipment from "@/pages/admin/AdminAssignEquipment";
import EquipmentHistoryPage from "./pages/admin/EquipmentHistoryPage";

// Page Imports
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminGames from "./pages/AdminGames";
// Auth Pages
import Login from "./pages/Login"; 
import StudentLogin from "./pages/student/StudentLogin";
import AdminLogin from "./pages/admin/AdminLogin"
import RegisterAdmin from "./pages/admin/RegisterAdmin"; // ✅ admin register
import StudentRegister from "./pages/student/StudentRegister";
import ForgotPassword from "./pages/student/ForgotPassword";

// Student Pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/Profile";
import FindPlayers from "./pages/student/Players";
import Chat from "./pages/student/Chat";
import Analytics from "./pages/student/Analytics";
import Complaints from "./pages/student/Complaints";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCheckout from "./pages/admin/Checkout";
import AdminHistory from "./pages/admin/History";

// Route Protection
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/announcements" element={<AllAnnouncements />} />
            <Route path="/" element={<Login />} />
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} /> {/* ✅ FIXED */}
            <Route path="/admin/register" element={<RegisterAdmin />} /> {/* ✅ register route */}
            <Route path="/student-register" element={<StudentRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/home" element={<Index />} />

            {/* Student Protected Routes */}
            <Route element={<ProtectedRoute type="student" />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/profile" element={<StudentProfile />} />
              <Route path="/student/players" element={<FindPlayers />} />
              <Route path="/student/chat" element={<Chat />} />
              <Route path="/student/analytics" element={<Analytics />} />
              <Route path="/student/complaints" element={<Complaints />} />
            </Route>

            {/* Admin Protected Routes */}
            <Route element={<ProtectedRoute type="admin" />}>

              <Route path="/admin/equipment-history" element={<EquipmentHistoryPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/checkout" element={<AdminCheckout />} />
              <Route path="/admin/history" element={<AdminHistory />} />
              <Route path="/admin/tickets" element={<AdminTickets />} />
              <Route path="/admin/announcements" element={<AdminAnnouncements />} />
              <Route path="/admin/games" element={<AdminGames />} />
              <Route path="/admin/assign-equipment" element={<AdminAssignEquipment />} />

            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
