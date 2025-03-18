
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogOut, Users, FileText, LayoutDashboard } from "lucide-react";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
    },
    {
      title: "Projects",
      path: "/projects",
      icon: <FileText className="h-4 w-4 mr-2" />,
    },
  ];

  // Only show the Users management for Admins
  if (user?.role === "Admin") {
    navItems.push({
      title: "Users",
      path: "/users",
      icon: <Users className="h-4 w-4 mr-2" />,
    });
  }

  return (
    <header className="sticky top-0 z-10 w-full backdrop-blur-lg bg-background/80 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className="text-xl font-semibold tracking-tight hover:text-primary transition-colors"
            >
              Role Manager
            </Link>
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <div className="flex items-center gap-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Signed in as </span>
                  <span className="font-semibold">{user?.name}</span>
                </div>
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                  {user?.role}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={logout}
              size="sm"
              className="gap-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline-block">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
