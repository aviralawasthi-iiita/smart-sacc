import { Button } from "@/components/ui/button";
import { Activity, Menu, X, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState("Dashboard");
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "Equipment", href: "/student/dashboard#equipment" },
    { label: "Find Players", href: "/student/players" },
    { label: "Profile", href: "/student/profile" },
    { label: "Analytics", href: "/student/analytics" },
    { label: "Chat", href: "/student/chat" },
    { label: "Complaints", href: "/student/complaints" },
  ];

  // highlight the active route
  useEffect(() => {
    const { pathname, hash } = location;
    if (pathname === "/student/dashboard") {
      if (hash === "#equipment") setActive("Equipment");
      else setActive("Dashboard");
    } else {
      const found = navItems.find((i) => i.href === pathname);
      if (found) setActive(found.label);
    }
  }, [location]);

  // logout handler
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/v1/users/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        localStorage.removeItem("token");
        sessionStorage.clear();
        toast({
          title: "Logged out successfully!",
          description: "See you soon 👋",
        });
        setTimeout(() => navigate("/"), 1000);
      } else {
        toast({
          title: "Logout failed",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Logout error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* --- LOGO --- */}
          <div
            onClick={() => navigate("/student/dashboard")}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Smart SAC</span>
          </div>

          {/* --- DESKTOP NAVIGATION --- */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`transition-colors font-medium ${
                  active === item.label
                    ? "text-primary"
                    : "text-foreground/80 hover:text-primary"
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* --- ACTION BUTTONS (Desktop) --- */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="transition-all"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-sky-500" />
              )}
            </Button>

            {/* Logout */}
            <Button
              onClick={handleLogout}
              className="bg-primary text-primary-foreground hover:opacity-90 transition-all"
            >
              Logout
            </Button>
          </div>

          {/* --- MOBILE MENU BUTTON --- */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground transition-transform duration-300"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* --- MOBILE MENU --- */}
        {isOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`transition-colors py-2 font-medium ${
                    active === item.label
                      ? "text-primary"
                      : "text-foreground/80 hover:text-primary"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {/* Theme toggle */}
                <Button
                  variant="ghost"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center justify-center gap-2"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-4 h-4 text-yellow-400" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-sky-500" />
                      Dark Mode
                    </>
                  )}
                </Button>

                {/* Logout */}
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full bg-primary text-primary-foreground hover:opacity-90"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
