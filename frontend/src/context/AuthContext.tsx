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


  const fetchUser = async (type: "student" | "admin"): Promise<boolean> => {
    try {
      const endpoint =
        type === "student" ? "/users/current-user" : "/admin/current-admin";
      const userData = await api.get(endpoint);
      
      if (type === "student" && userData?.userDetails) {
        setUser(userData.userDetails);
      } else {
        setUser(userData);
      }
      
      setAuthType(type);
      return true;
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.message === "Unauthorized") {
        return false;
      }
      console.error(`${type} fetchUser error:`, error);
      return false;
    }
  };
  

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
      throw error;
    }
  };


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


  const wrapApiCall = useCallback(
    async (apiCall: () => Promise<any>): Promise<any | undefined> => {
      try {
        return await apiCall();
      } catch (error: any) {
        if (error?.status === 401 || error?.message === "Unauthorized") {
          toast.error("Session expired. Please log in again.");
          await logout();
          return undefined;
        }
        // Re-throw all other errors so callers can handle them
        throw error;
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
