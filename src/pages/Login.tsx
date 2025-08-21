import { motion } from "framer-motion";
import { CosmicBackground } from "@/components/ui/cosmic-background";
import { LoginForm } from "@/components/auth/login-form";
import { Sparkles } from "lucide-react";

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <CosmicBackground />
      
      {/* Logo */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-8 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-cosmic glow-primary">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-stardust">
            Astro Oracle
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Discover the wisdom of the stars
        </p>
      </motion.div>

      <LoginForm />
    </div>
  );
};

export default Login;