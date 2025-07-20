"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/lib/types";
import { authApi, AuthService, setGlobalUserRefresh } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken(true);

          const response = await authApi.syncFirebaseUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || "User",
            email: firebaseUser.email!,
            avatarUrl:
              firebaseUser.photoURL || "https://placehold.co/100x100.png",
            idToken,
          });

          if (response.success && response.data) {
            setUser(response.data);
            AuthService.setCurrentUser(response.data);
            AuthService.setToken(idToken);
          }
        } catch (error) {
          console.error("Error syncing user with backend:", error);
        }
      } else {
        setUser(null);
        AuthService.removeToken();
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let tokenRefreshInterval: NodeJS.Timeout;

    if (firebaseUser) {
      tokenRefreshInterval = setInterval(async () => {
        try {
          const idToken = await firebaseUser.getIdToken(true);
          AuthService.setToken(idToken);
          console.log("Token refreshed successfully");
        } catch (error) {
          console.error("Error refreshing token:", error);
        }
      }, 50 * 60 * 1000);
    }

    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, [firebaseUser]);

  useEffect(() => {
    setGlobalUserRefresh(refreshUser);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (userCredential.user) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name,
        });

        toast({
          title: "Registration successful",
          description: "Welcome to DebatePlatform!",
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      AuthService.removeToken();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      try {
        const idToken = await firebaseUser.getIdToken(true);

        const response = await authApi.syncFirebaseUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || "User",
          email: firebaseUser.email!,
          avatarUrl:
            firebaseUser.photoURL || "https://placehold.co/100x100.png",
          idToken,
        });

        if (response.success && response.data) {
          setUser(response.data);
          AuthService.setCurrentUser(response.data);
          AuthService.setToken(idToken);
          console.log("User refreshed successfully");
        }
      } catch (error) {
        console.error("Error refreshing user:", error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        login,
        register,
        logout,
        refreshUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
