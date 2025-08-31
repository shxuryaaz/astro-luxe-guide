import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sparkles, User, LogOut, Settings, History, SparklesIcon, Shield } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const Navbar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  // Hide navbar on login/signup pages
  if (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Sign Out Error",
        description: "An error occurred while signing out.",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-primary/20"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cosmic">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-serif font-semibold text-white">
              Astrometry
            </span>
          </NavLink>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => 
                `text-sm font-medium transition-colors hover:text-purple-300 ${
                  isActive ? 'text-purple-300' : 'text-gray-200'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/kundli" 
              className={({ isActive }) => 
                `text-sm font-medium transition-colors hover:text-purple-300 ${
                  isActive ? 'text-purple-300' : 'text-gray-200'
                }`
              }
            >
              My Kundli
            </NavLink>
            <NavLink 
              to="/questions" 
              className={({ isActive }) => 
                `text-sm font-medium transition-colors hover:text-purple-300 ${
                  isActive ? 'text-purple-300' : 'text-gray-200'
                }`
              }
            >
              Ask Questions
            </NavLink>
            <NavLink 
              to="/admin" 
              className={({ isActive }) => 
                `text-sm font-medium transition-colors hover:text-purple-300 ${
                  isActive ? 'text-purple-300' : 'text-gray-200'
                }`
              }
            >
              Admin
            </NavLink>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={user.name || "User"} />
                      <AvatarFallback className="bg-cosmic text-white">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NavLink to="/dashboard" className="flex items-center">
                      <SparklesIcon className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLink to="/kundli" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Kundli</span>
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLink to="/questions" className="flex items-center">
                      <History className="mr-2 h-4 w-4" />
                      <span>Question History</span>
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NavLink to="/admin" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLink to="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};