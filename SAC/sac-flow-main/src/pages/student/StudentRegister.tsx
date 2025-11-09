import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { toast as sonner } from "sonner";

const StudentRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    phone_number: "",
    roll_no: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"register" | "verify">("register");
  const [verificationData, setVerificationData] = useState({
    email: "",
    token: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleVerificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationData({
      ...verificationData,
      [e.target.id]: e.target.value,
    });
  };

  const validateForm = () => {
    // Phone number validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      sonner.error("Invalid phone number", {
        description: "Phone number must be 10 digits"
      });
      return false;
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      sonner.error("Weak password", {
        description: "Must be 8+ characters with uppercase, lowercase, number, and special character"
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      sonner.error("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/users/register", {
        fullname: formData.fullname,
        username: formData.username,
        email: formData.email,
        phone_number: formData.phone_number,
        roll_no: formData.roll_no,
        password: formData.password,
      });

      sonner.success("Registration successful!", {
        description: "Please check your email for verification code.",
      });
      
      setVerificationData(prev => ({ ...prev, email: formData.email }));
      setStep("verify");

    } catch (error) {
      console.error("Registration failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post("/users/verify-email", {
        email: verificationData.email,
        token: verificationData.token,
      });

      sonner.success("Email verified successfully!", {
        description: "Your account has been activated.",
      });
      
      navigate("/student-login");

    } catch (error) {
      console.error("Verification failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await api.post("/users/resend-verification", {
        email: verificationData.email,
      });
      
      sonner.success("Verification code sent!", {
        description: "Check your email for the new code.",
      });
    } catch (error) {
      console.error("Resend failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <UserPlus className="w-12 h-12 mx-auto text-primary" />
            <CardTitle className="mt-4">Verify Your Email</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to {verificationData.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Verification Code</Label>
                <Input
                  id="token"
                  value={verificationData.token}
                  onChange={handleVerificationChange}
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
                  disabled={isLoading}
                  className="text-sm"
                >
                  Didn't receive code? Resend
                </Button>
              </div>
              
              <div className="text-center text-sm">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setStep("register")}
                  disabled={isLoading}
                >
                  Back to registration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <UserPlus className="w-12 h-12 mx-auto text-primary" />
          <CardTitle className="mt-4">Create Student Account</CardTitle>
          <CardDescription>Enter your details to register</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullname">Full Name</Label>
                <Input 
                  id="fullname" 
                  value={formData.fullname} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={formData.username} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                disabled={isLoading} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input 
                  id="phone_number" 
                  value={formData.phone_number} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                  placeholder="10 digits only"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roll_no">Roll Number</Label>
                <Input 
                  id="roll_no" 
                  value={formData.roll_no} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                  placeholder="Min 8 chars with Aa1@"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading} 
                />
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character (@$!%*?&)</li>
              </ul>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/student-login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentRegister;