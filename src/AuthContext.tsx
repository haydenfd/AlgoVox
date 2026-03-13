import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { handleOAuthCallback } from "./oauth";

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: string;
  access_token: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load stored user session
    const storedUser = localStorage.getItem("auth_user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);

    // Listen for OAuth callback from local server
    const setupOAuthListener = async () => {
      const { listen } = await import("@tauri-apps/api/event");

      console.log("Setting up OAuth listener...");

      const unlisten = await listen<string>("oauth-callback", async (event) => {
        console.log("OAuth callback event received!", event);
        const callbackUrl = event.payload;
        console.log("Callback URL:", callbackUrl);

        try {
          // Construct full URL for parsing
          const fullUrl = `http://127.0.0.1:8080${callbackUrl}`;
          console.log("Processing full URL:", fullUrl);
          const userInfo = await handleOAuthCallback(fullUrl);
          console.log("User info received:", userInfo);
          login(userInfo);
          navigate("/home");
        } catch (error) {
          console.error("OAuth callback error:", error);
          alert(`Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`);
          navigate("/");
        }
      });

      console.log("OAuth listener set up successfully");
      return unlisten;
    };

    let unlistenPromise = setupOAuthListener();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [navigate]);

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem("auth_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
