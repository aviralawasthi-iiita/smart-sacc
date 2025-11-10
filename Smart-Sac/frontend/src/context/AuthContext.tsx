import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface User {
  _id: string;
  fullname: string;
  email: string;
  username: string;
  roll_no: string;
  phone_number: string;
}

interface Admin {
  _id: string;
  email: string;
}

type AuthType = "student" | "admin" | null;

interface AuthContextType {
  user: User | Admin | null;
  authType: AuthType;
  login: (type: "student" | "admin", credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  wrapApiCall: (apiCall: () => Promise<any>) => Promise<any | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | Admin | null>(null);
  const [authType, setAuthType] = useState<AuthType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  /**
   * Fetch current logged-in user (student or admin)
   * Returns true if logged in, false otherwise
   */
  const fetchUser = async (type: "student" | "admin"): Promise<boolean> => {
    try {
      const endpoint =
        type === "student" ? "/users/current-user" : "/admin/current-admin";
      const userData = await api.get(endpoint);
      setUser(userData);
      setAuthType(type);
      return true;
    } catch (error: any) {
      // 🔹 Suppress normal 401 unauthorized logs (expected before login)
      if (error?.response?.status === 401 || error?.message === "Unauthorized") {
        return false;
      }

      // 🔸 Log only unexpected backend errors
      console.error(`${type} fetchUser error:`, error);
      return false;
    }
  };
  
  /** Check if any user/admin is already logged in (called on page load) */
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      const studentFound = await fetchUser("student");
      if (!studentFound) {
        await fetchUser("admin");
      }
      setIsLoading(false);
    };
    checkUser();
  }, []);

  /** Login handler */
  const login = async (type: "student" | "admin", credentials: any) => {
    const endpoint = type === "student" ? "/users/login" : "/admin/login";

    try {
      await api.post(endpoint, credentials);
      const success = await fetchUser(type);

      if (success) {
        toast.success("Login successful!", {
          description: "Welcome back!",
        });
        navigate(type === "student" ? "/student/dashboard" : "/admin/dashboard");
      }
    } catch (error: any) {
      console.error(`${type} login failed:`, error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed. Please check your credentials.";
      toast.error(message);
    }
  };

  /** Logout handler */
  const logout = useCallback(async () => {
    if (!authType) {
      setUser(null);
      setAuthType(null);
      navigate("/");
      return;
    }

    const endpoint =
      authType === "student" ? "/users/logout" : "/admin/logout";

    try {
      await api.post(endpoint, {});
      setUser(null);
      setAuthType(null);
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed. Please try again.");
    }
  }, [authType, navigate]);

  /** Wrapper to handle expired tokens automatically */
  const wrapApiCall = useCallback(
    async (apiCall: () => Promise<any>): Promise<any | undefined> => {
      try {
        return await apiCall();
      } catch (error: any) {
        if (error?.response?.status === 401) {
          toast.error("Session expired. Please log in again.");
          await logout();
        } else {
          console.error("API call error:", error);
        }
        return undefined;
      }
    },
    [logout]
  );

  return (
    <AuthContext.Provider
      value={{ user, authType, login, logout, isLoading, wrapApiCall }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthContext");
  }
  return context;
};
