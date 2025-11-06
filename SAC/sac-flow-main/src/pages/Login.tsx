import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserCircle, Shield, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-elegant">
              <Activity className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
            Smart SAC
          </h1>
          <p className="text-xl text-muted-foreground">
            Student Activity Center Management System
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 animate-scale-in">
          {/* Student Login Card */}
          <Card 
            className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer"
            onClick={() => navigate('/student-login')}
          >
            <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity" />
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCircle className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Student Login</h2>
              <p className="text-muted-foreground mb-6">
                Access your profile, book equipment, find players, and track your activity
              </p>
              <ul className="text-sm text-left space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>View equipment availability</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Find and connect with players</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Track your sports activity</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Chat with other students</span>
                </li>
              </ul>
              <Button className="w-full bg-gradient-primary group-hover:shadow-lg transition-shadow">
                Continue as Student
              </Button>
            </div>
          </Card>

          {/* Admin Login Card */}
{/* Admin Login Card */}
<Card 
  className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer"
  onClick={() => navigate('/admin/login')} // ✅ FIXED ROUTE
>
  <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity" />
  <div className="p-8 text-center">
    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
      <Shield className="w-12 h-12 text-primary" />
    </div>
    <h2 className="text-2xl font-bold mb-3">Admin Login</h2>
    <p className="text-muted-foreground mb-6">
      Manage equipment checkouts, track usage, and maintain records
    </p>
    <ul className="text-sm text-left space-y-2 mb-6">
      <li className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        <span>Check out equipment to students</span>
      </li>
      <li className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        <span>Manage equipment returns</span>
      </li>
      <li className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        <span>View usage history</span>
      </li>
      <li className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        <span>Track equipment status</span>
      </li>
    </ul>
    <Button className="w-full bg-gradient-primary group-hover:shadow-lg transition-shadow">
      Continue as Admin
    </Button>
  </div>
</Card>

        </div>
      </div>
    </div>
  );
};

export default Login;