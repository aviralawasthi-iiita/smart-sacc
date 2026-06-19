import { useState, useEffect, useRef } from "react";
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"register" | "verify">("register");
  const [verificationData, setVerificationData] = useState({
    email: "",
    token: "",
  });
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = (seconds: number) => {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
    // Clear error for this field when user types
    if (errors[e.target.id]) {
      setErrors({
        ...errors,
        [e.target.id]: "",
      });
    }
  };

  const handleVerificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationData({
      ...verificationData,
      [e.target.id]: e.target.value,
    });
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Full Name validation
    if (!formData.fullname.trim()) {
      newErrors.fullname = "Full name is required";
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.includes("@")) {
      newErrors.username = "Username cannot contain '@'";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email (e.g. pattern@domain.com)";
    }

    // Phone number validation
    const phoneRegex = /^\d{10}$/;
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone_number)) {
      newErrors.phone_number = "Phone number must be exactly 10 digits";
    }

    // Roll number validation
    if (!formData.roll_no.trim()) {
      newErrors.roll_no = "Roll number is required";
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = "Must be 8+ characters with uppercase, lowercase, number, and special character";
    }

    // Password confirmation validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/users/register", {
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
      startCooldown(60);
      setStep("verify");

    } catch (error: any) {
      console.error("Registration failed", error);
      const backendError = error?.response?.data?.message || error?.message || "Registration failed";

      // Rate-limited: an OTP was already sent recently — navigate to verify with countdown
      if (error?.response?.status === 429) {
        const match = backendError.match(/(\d+)/);
        const waitSeconds = match ? parseInt(match[1]) : 60;
        sonner.error(backendError);
        setVerificationData(prev => ({ ...prev, email: formData.email }));
        startCooldown(waitSeconds);
        setStep("verify");
      } else {
        const lowerError = backendError.toLowerCase();
        const newErrors: { [key: string]: string } = {};

        if (lowerError.includes("email") || lowerError.includes("mail")) {
          newErrors.email = backendError;
        } else if (lowerError.includes("phone")) {
          newErrors.phone_number = backendError;
        } else if (lowerError.includes("username")) {
          newErrors.username = backendError;
        } else if (lowerError.includes("password")) {
          newErrors.password = backendError;
        } else if (lowerError.includes("roll")) {
          newErrors.roll_no = backendError;
        } else if (lowerError.includes("fullname") || lowerError.includes("full name")) {
          newErrors.fullname = backendError;
        } else {
          sonner.error(backendError);
        }

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
        }
      }
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
      startCooldown(60);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to resend code";
      // If rate-limited, parse the wait time from the message and start countdown
      if (error?.response?.status === 429) {
        const match = message.match(/(\d+)/);
        const waitSeconds = match ? parseInt(match[1]) : 60;
        startCooldown(waitSeconds);
        sonner.error(message);
      } else {
        sonner.error(message);
      }
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
                  disabled={isLoading || resendCooldown > 0}
                  className="text-sm"
                >
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : "Didn't receive code? Resend"}
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
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullname">Full Name</Label>
                <Input 
                  id="fullname" 
                  value={formData.fullname} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                  className={errors.fullname ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.fullname && (
                  <p className="text-xs text-destructive mt-1">{errors.fullname}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={formData.username} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                  className={errors.username ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.username && (
                  <p className="text-xs text-destructive mt-1">{errors.username}</p>
                )}
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
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email}</p>
              )}
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
                  className={errors.phone_number ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.phone_number && (
                  <p className="text-xs text-destructive mt-1">{errors.phone_number}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="roll_no">Roll Number</Label>
                <Input 
                  id="roll_no" 
                  value={formData.roll_no} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                  className={errors.roll_no ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.roll_no && (
                  <p className="text-xs text-destructive mt-1">{errors.roll_no}</p>
                )}
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
                  className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password}</p>
                )}
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
                  className={errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
                )}
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