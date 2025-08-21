import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, User, LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

export const Navbar = () => {
  const location = useLocation();
  
  // Hide navbar on login/signup pages
  if (location.pathname === "/" || location.pathname === "/signup") {
    return null;
  }

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
            <span className="text-xl font-serif font-semibold text-cosmic">
              Astro Oracle
            </span>
          </NavLink>

          {/* User menu */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};