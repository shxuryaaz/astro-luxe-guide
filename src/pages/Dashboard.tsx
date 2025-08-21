import { motion } from "framer-motion";
import { CosmicBackground } from "@/components/ui/cosmic-background";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Stars, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  // Mock user data - in real app this would come from context/state
  const user = {
    name: "Alexandra",
    zodiacSign: "Pisces",
    zodiacIcon: "♓",
  };

  return (
    <div className="min-h-screen pt-20">
      <CosmicBackground />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="space-y-6">
            <motion.h1 
              className="text-5xl md:text-7xl font-serif font-bold text-cosmic"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Welcome, {user.name}
            </motion.h1>
            
            <motion.div 
              className="flex items-center justify-center gap-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-6xl animate-float">{user.zodiacIcon}</div>
              <div className="text-left">
                <p className="text-xl text-muted-foreground">Your sign</p>
                <p className="text-3xl font-serif font-semibold text-stardust">
                  {user.zodiacSign}
                </p>
              </div>
            </motion.div>

            <motion.p 
              className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              The stars have aligned to bring you cosmic wisdom. Ready to explore 
              the mysteries of your celestial blueprint?
            </motion.p>
          </div>
        </motion.div>

        {/* Action Cards */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          <Card className="group hover:scale-105 transition-all duration-500">
            <CardContent className="p-8 text-center space-y-4">
              <div className="p-4 rounded-full bg-cosmic w-fit mx-auto group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-serif font-semibold">Generate Kundli</h3>
              <p className="text-muted-foreground">
                Create your personalized birth chart and unlock cosmic insights
              </p>
              <Link to="/kundli">
                <Button variant="cosmic" size="lg" className="w-full">
                  Start Reading
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-500">
            <CardContent className="p-8 text-center space-y-4">
              <div className="p-4 rounded-full bg-stardust w-fit mx-auto group-hover:scale-110 transition-transform">
                <Stars className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-serif font-semibold">Ask the Universe</h3>
              <p className="text-muted-foreground">
                Get answers to your deepest questions through astrological wisdom
              </p>
              <Link to="/questions">
                <Button variant="stardust" size="lg" className="w-full">
                  Ask Now
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-500">
            <CardContent className="p-8 text-center space-y-4">
              <div className="p-4 rounded-full bg-aurora w-fit mx-auto group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-serif font-semibold">Daily Cosmic</h3>
              <p className="text-muted-foreground">
                Receive personalized daily guidance from the celestial realm
              </p>
              <Button variant="glass" size="lg" className="w-full">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-center"
        >
          <Card className="max-w-2xl mx-auto glass border-primary/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-serif font-semibold mb-4 text-cosmic">
                Your Cosmic Journey Awaits
              </h2>
              <p className="text-muted-foreground mb-6">
                Dive deep into the ancient wisdom of astrology and discover 
                what the universe has in store for you.
              </p>
              <Link to="/kundli">
                <Button variant="cosmic" size="lg">
                  Generate My Kundli
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;