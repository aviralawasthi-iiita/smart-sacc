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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      sonner.error("Passwords do not match");
      return;
    }
    setIsLoading(true);

    try {
      // This matches the fields in your registerUser controller
      await api.post("/users/register", {
        fullname: formData.fullname,
        username: formData.username,
        email: formData.email,
        phone_number: formData.phone_number,
        roll_no: formData.roll_no,
        password: formData.password,
      });

      sonner.success("Registration successful!", {
        description: "Please log in with your new account.",
      });
      navigate("/student-login");

    } catch (error) {
      // Error toast is already handled by api.ts
      console.error("Registration failed", error);
    } finally {
      setIsLoading(false);
    }
  };

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
                <Input id="fullname" value={formData.fullname} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={formData.username} onChange={handleChange} required disabled={isLoading} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={handleChange} required disabled={isLoading} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input id="phone_number" value={formData.phone_number} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roll_no">Roll Number</Label>
                <Input id="roll_no" value={formData.roll_no} onChange={handleChange} required disabled={isLoading} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={formData.password} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading} />
              </div>
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