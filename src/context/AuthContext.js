// AuthContext.js - COMPLETE VERSION with AsyncStorage fix
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
    
    // Listen for token expiration from api.js
    global.onTokenExpired = handleTokenExpired;
    
    return () => {
      global.onTokenExpired = null;
    };
  }, []);

  const checkAuth = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const userData = await AsyncStorage.getItem("user");

      console.log("Checking auth - tokens exist:", !!accessToken, !!refreshToken);

      if (accessToken && refreshToken) {
        setIsAuthenticated(true);
        
        // Parse user data if it exists and is valid
        if (userData && userData !== "undefined" && userData !== "null") {
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            console.log("User data loaded:", parsedUser.username);
          } catch (e) {
            console.log("Error parsing user data:", e);
            setUser(null);
          }
        } else {
          console.log("No valid user data found");
          setUser(null);
        }
      } else {
        console.log("No tokens found");
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.log("Error checking authentication:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenExpired = async () => {
    console.log("🚪 Token expired - auto logout triggered");
    await logout();
  };

  const login = async (accessToken, refreshToken, userData) => {
    try {
      console.log("=== LOGIN STARTED ===");
      
      // Validate required data
      if (!accessToken || !refreshToken) {
        throw new Error("Missing required tokens");
      }

      console.log("✓ Tokens received");
      
      // Store tokens
      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);
      
      console.log("✓ Tokens stored in AsyncStorage");
      
      // Store user data only if it exists and is valid
      if (userData && typeof userData === 'object' && userData !== null) {
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        console.log("✓ User data stored:", userData.username || userData.id);
      } else {
        console.log("⚠ No user data provided (optional)");
        setUser(null);
      }

      setIsAuthenticated(true);
      console.log("=== LOGIN COMPLETE ===");
      
    } catch (error) {
      console.log("❌ Error during login:", error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("=== LOGOUT STARTED ===");
      
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("user");
      
      setIsAuthenticated(false);
      setUser(null);
      
      console.log("=== LOGOUT COMPLETE ===");
    } catch (error) {
      console.log("❌ Error during logout:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};