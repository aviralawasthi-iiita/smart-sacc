import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, KeyRound } from "lucide-react";
import { toast as sonner } from "sonner";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Send the password reset email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Calls /api/v1/users/forgot-password
      await api.post("/users/forgot-password", { email });
      sonner.success("Token Sent", {
        description: "If an account exists, a reset token has been sent to your email.",
      });
      setStep('reset');
    } catch (error) {
      // Error toast is handled by api.ts
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Send the token and new password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      sonner.error("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      // Calls /api/v1/users/reset-password
      await api.post("/users/reset-password", {
        token,
        newPassword,
        confirmPassword,
      });
      sonner.success("Password Reset Successful", {
        description: "You can now log in with your new password.",
      });
      navigate("/student-login");
    } catch (error) {
      // Error toast is handled by api.ts
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {step === 'email' ? (
          <>
            <CardHeader className="text-center">
              <Mail className="w-12 h-12 mx-auto text-primary" />
              <CardTitle className="mt-4">Forgot Password</CardTitle>
              <CardDescription>Enter your email to receive a reset token</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aniket@college.edu"
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Token"}
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <KeyRound className="w-12 h-12 mx-auto text-primary" />
              <CardTitle className="mt-4">Reset Your Password</CardTitle>
              <CardDescription>Enter the token from your email and a new password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">6-Digit Token</Label>
                  <Input
                    id="token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="123456"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </CardContent>
          </>
        )}
        <div className="text-center text-sm p-6 pt-0">
          Remember your password?{" "}
          <Link to="/student-login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;