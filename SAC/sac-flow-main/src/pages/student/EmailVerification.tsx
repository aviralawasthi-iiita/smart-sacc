import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";
import { toast as sonner } from "sonner";

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    token: "",
  });
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Get email from location state (if coming from registration)
    if (location.state?.email) {
      setFormData(prev => ({ ...prev, email: location.state.email }));
    }
  }, [location.state]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post("/users/verify-email", {
        email: formData.email,
        token: formData.token,
      });

      sonner.success("Email verified successfully!", {
        description: "Your account has been activated. You can now login.",
      });
      
      navigate("/student-login");

    } catch (error) {
      console.error("Verification failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    try {
      await api.post("/users/resend-verification", {
        email: formData.email,
      });
      
      sonner.success("Verification code sent!", {
        description: "Check your email for the new code.",
      });
      
      setCountdown(60); // 60 seconds cooldown
    } catch (error) {
      console.error("Resend failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="w-12 h-12 mx-auto text-primary" />
          <CardTitle className="mt-4">Verify Your Email</CardTitle>
          <CardDescription>
            {formData.email 
              ? `Enter the 6-digit code sent to ${formData.email}`
              : "Enter your email and verification code"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerification} className="space-y-4">
            {!formData.email && (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="token">Verification Code</Label>
              <Input
                id="token"
                value={formData.token}
                onChange={handleChange}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
                disabled={isLoading}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify Email"}
            </Button>
            
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={handleResendCode}
                disabled={isLoading || countdown > 0}
                className="text-sm"
              >
                {countdown > 0 
                  ? `Resend code in ${countdown}s` 
                  : "Didn't receive code? Resend"
                }
              </Button>
            </div>
            
            <div className="text-center text-sm">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate("/student-register")}
                disabled={isLoading}
                className="flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to registration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;