import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldPlus } from "lucide-react";

const RegisterAdmin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address matching pattern@domain.com";
    }

    if (!password) {
      newErrors.password = "Secret Key is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/admin/register", { email, password });
      toast.success("Admin registered successfully!");
      navigate("/admin/login");
    } catch (error: any) {
      console.error("Admin register failed:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Registration failed. Please try again.";
      
      const lowerError = message.toLowerCase();
      const backendErrors: { [key: string]: string } = {};

      if (lowerError.includes("email") || lowerError.includes("admin with this email")) {
        backendErrors.email = message;
      } else if (
        lowerError.includes("password") ||
        lowerError.includes("secret key") ||
        lowerError.includes("unauthorized") ||
        error?.response?.status === 401
      ) {
        backendErrors.password = message === "Unauthorized" ? "Invalid Secret Key" : message;
      } else {
        toast.error(message);
      }

      if (Object.keys(backendErrors).length > 0) {
        setErrors(backendErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <ShieldPlus className="w-12 h-12 mx-auto text-primary" />
          <CardTitle className="mt-4">Admin Registration</CardTitle>
          <CardDescription>
            Create a new admin account for Smart SAC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="admin@smartsac.com"
                required
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Secret Key</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter ADMIN_PASSWORD"
                required
                className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register"}
            </Button>
          </form>
          <p className="text-sm text-center mt-4">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/admin/login")}
              className="text-primary cursor-pointer hover:underline"
            >
              Login here
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterAdmin;
