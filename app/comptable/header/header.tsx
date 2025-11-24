// components/Header/Header.tsx
"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { TokenPayload } from "@/app/auth/get-user";
import { AuthContext } from "@/app/auth/auth-context";
import { routes, unauthenticatedRoutes } from "@/app/common/constants/routes";

interface HeaderProps {
  user?: TokenPayload | null;
  onLogout?: () => Promise<void>;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const router = useRouter();
  const isAuthenticated = useContext(AuthContext);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Debug: Log authentication status
  console.log("Header - isAuthenticated:", isAuthenticated);
  console.log("Header - user:", user);
  console.log(user);

  // Get role-based dashboard path
  const getDashboardPath = () => {
    if (!user?.role) return "/";
    
    const role = user.role.toLowerCase();
    if (role === "client") {
      return "/client/dashboard";
    } else if (role === "comptable") {
      return "/comptable/dashboard";
    }
    return "/";
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      console.log("Déconnexion en cours...");

      setIsUserMenuOpen(false);
      setIsMobileMenuOpen(false);

      if (onLogout) {
        await onLogout();
      }

      console.log("Déconnexion réussie, redirection...");
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      window.location.href = "/auth/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavigation = (path: string) => {
    // If navigating to home, redirect based on user role
    if (path === "/" && user) {
      const dashboardPath = getDashboardPath();
      router.push(dashboardPath);
    } else {
      router.push(path);
    }
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".user-menu")) {
        setIsUserMenuOpen(false);
      }
      if (
        !target.closest(".mobile-menu") &&
        !target.closest(".mobile-menu-button")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [router]);

  const navigationItems = isAuthenticated ? routes : unauthenticatedRoutes;
  const isUserAuthenticated = isAuthenticated || !!user;

  console.log("Final auth status:", isUserAuthenticated);

  if (!isUserAuthenticated) {
    return (
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  CRM Comptable
                </h1>
                <p className="text-sm text-gray-300 hidden sm:block">
                  Gestion automatisée des obligations comptables
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-4">
              <button
                onClick={() => handleNavigation("/auth/login")}
                className="group relative px-6 py-2.5 text-white font-medium transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 group-hover:bg-white/20 transition-all duration-300"></div>
                <span className="relative">Connexion</span>
              </button>

              <button
                onClick={() => handleNavigation("/auth/signup")}
                className="group relative px-6 py-2.5 font-medium text-white transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300 shadow-lg group-hover:shadow-blue-500/25"></div>
                <span className="relative">Inscription</span>
              </button>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden mobile-menu-button p-2 text-white hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm border border-white/20"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="sm:hidden mobile-menu border-t border-white/20 py-6 space-y-4">
              <button
                onClick={() => handleNavigation("/auth/login")}
                className="w-full group relative p-4 text-white font-medium transition-all duration-300"
              >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 group-hover:bg-white/20 transition-all duration-300"></div>
                <span className="relative flex items-center justify-center">
                  <User className="h-5 w-5 mr-2" />
                  Connexion
                </span>
              </button>

              <button
                onClick={() => handleNavigation("/auth/signup")}
                className="w-full group relative p-4 font-medium text-white transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300 shadow-lg"></div>
                <span className="relative flex items-center justify-center">
                  <User className="h-5 w-5 mr-2" />
                  Inscription
                </span>
              </button>
            </div>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">CRM Comptable</h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Gestion automatisée des obligations comptables
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.title}
                onClick={() => handleNavigation(item.path)}
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                {item.title}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            {/* Settings */}
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="h-5 w-5" />
            </button>

            {/* User Menu */}
            <div className="relative user-menu">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoggingOut}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 hidden sm:block ${
                    isUserMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.nom || "Utilisateur"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email || "email@cabinet.fr"}
                        </p>
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full mt-1">
                          {user?.role || "Utilisateur"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleNavigation("/profile");
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={isLoggingOut}
                    >
                      <User className="h-4 w-4 mr-3 text-gray-400" />
                      Mon Profil
                    </button>
                    <button
                      onClick={() => {
                        handleNavigation("/settings");
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={isLoggingOut}
                    >
                      <Settings className="h-4 w-4 mr-3 text-gray-400" />
                      Paramètres
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                        isLoggingOut
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      {isLoggingOut ? "Déconnexion..." : "Se Déconnecter"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden mobile-menu-button p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoggingOut}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mobile-menu border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.title}
                  onClick={() => handleNavigation(item.path)}
                  className="text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                  disabled={isLoggingOut}
                >
                  {item.title}
                </button>
              ))}

              <div className="px-3 py-2 border-t border-gray-200 mt-4 pt-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.nom || "Utilisateur"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.role || "Utilisateur"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`text-left px-3 py-2 rounded-md transition-colors border-t border-gray-200 pt-4 ${
                  isLoggingOut
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-red-600 hover:bg-red-50"
                }`}
              >
                <LogOut className="h-4 w-4 mr-2 inline" />
                {isLoggingOut ? "Déconnexion..." : "Se Déconnecter"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}