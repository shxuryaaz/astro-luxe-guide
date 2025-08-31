import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Stars, Zap, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { kundliService } from "@/services/kundli";
import { historyService } from "@/services/history";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [hasKundli, setHasKundli] = useState<boolean | null>(null);
  const [questionStats, setQuestionStats] = useState({
    totalQuestions: 0,
    recentActivity: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [zodiacInfoState, setZodiacInfoState] = useState<{ sign: string; icon: string }>({ sign: "Unknown", icon: "✨" });

  // Get zodiac sign from date of birth
  const getZodiacSign = (dateOfBirth?: string) => {
    if (!dateOfBirth) return { sign: "Unknown", icon: "✨" };
    
    const date = new Date(dateOfBirth);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { sign: "Aries", icon: "♈" };
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { sign: "Taurus", icon: "♉" };
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { sign: "Gemini", icon: "♊" };
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { sign: "Cancer", icon: "♋" };
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { sign: "Leo", icon: "♌" };
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { sign: "Virgo", icon: "♍" };
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { sign: "Libra", icon: "♎" };
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { sign: "Scorpio", icon: "♏" };
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { sign: "Sagittarius", icon: "♐" };
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { sign: "Capricorn", icon: "♑" };
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { sign: "Aquarius", icon: "♒" };
    return { sign: "Pisces", icon: "♓" };
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        console.log('Loading dashboard data for user:', user.id);
        
        // Check if user has Kundli
        const hasExistingKundli = await kundliService.hasExistingKundli(user.id);
        console.log('Has existing Kundli:', hasExistingKundli);
        setHasKundli(hasExistingKundli);

        // Get question statistics
        const stats = await historyService.getQuestionStats(user.id);
        console.log('Question stats:', stats);
        setQuestionStats({
          totalQuestions: stats.totalQuestions,
          recentActivity: stats.recentActivity.length,
        });

        // Determine zodiac sign from user profile or Kundli (fallback)
        let dob: string | undefined = user?.dateOfBirth;
        if (!dob && hasExistingKundli) {
          try {
            const userKundli = await kundliService.getUserKundli(user.id);
            dob = userKundli?.dateOfBirth;
          } catch {
            // ignore Kundli load errors here
          }
        }
        setZodiacInfoState(getZodiacSign(dob));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          title: "Loading Error",
          description: "Failed to load dashboard data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user, toast]);

  const zodiacInfo = zodiacInfoState;

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center relative overflow-hidden">
        {/* Cosmic background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        
        {/* Animated bubbles */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large bubbles */}
          <div className="absolute top-1/4 left-1/6 w-32 h-32 bg-purple-400/20 rounded-full animate-pulse" style={{ animationDelay: '0s', animationDuration: '4s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-blue-400/20 rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '5s' }}></div>
          <div className="absolute top-2/3 left-1/3 w-20 h-20 bg-pink-400/20 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>
          <div className="absolute bottom-1/4 right-1/6 w-28 h-28 bg-indigo-400/20 rounded-full animate-pulse" style={{ animationDelay: '3s', animationDuration: '4.5s' }}></div>
          
          {/* Medium bubbles */}
          <div className="absolute top-1/6 right-1/3 w-16 h-16 bg-purple-300/15 rounded-full animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}></div>
          <div className="absolute top-3/4 left-1/4 w-12 h-12 bg-blue-300/15 rounded-full animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '4s' }}></div>
          <div className="absolute bottom-1/3 right-1/2 w-18 h-18 bg-pink-300/15 rounded-full animate-pulse" style={{ animationDelay: '2.5s', animationDuration: '5.5s' }}></div>
          
          {/* Small bubbles */}
          <div className="absolute top-1/2 left-1/8 w-8 h-8 bg-purple-200/10 rounded-full animate-pulse" style={{ animationDelay: '0.8s', animationDuration: '3s' }}></div>
          <div className="absolute top-1/5 right-1/8 w-6 h-6 bg-blue-200/10 rounded-full animate-pulse" style={{ animationDelay: '1.8s', animationDuration: '3.8s' }}></div>
          <div className="absolute bottom-1/5 left-1/2 w-10 h-10 bg-pink-200/10 rounded-full animate-pulse" style={{ animationDelay: '2.8s', animationDuration: '4.2s' }}></div>
          <div className="absolute top-2/5 right-1/6 w-7 h-7 bg-indigo-200/10 rounded-full animate-pulse" style={{ animationDelay: '3.8s', animationDuration: '3.2s' }}></div>
          
          {/* Floating animation for some bubbles */}
          <div className="absolute top-1/4 left-1/6 w-32 h-32 bg-purple-400/20 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '6s' }}></div>
          <div className="absolute bottom-1/4 right-1/6 w-28 h-28 bg-indigo-400/20 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
          <div className="absolute top-3/4 left-1/4 w-12 h-12 bg-blue-300/15 rounded-full animate-bounce" style={{ animationDelay: '4s', animationDuration: '7s' }}></div>
        </div>
        
        {/* Subtle animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="text-center relative z-10">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-gray-200">Loading your cosmic dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen pt-20 overflow-hidden relative">
      {/* Cosmic background */}
      <div className="absolute inset-0 h-full bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
      
      {/* Animated stars */}
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3,
            delay: Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-yellow-300 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, -100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
      
              {/* Subtle animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="space-y-6">
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold break-words text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Welcome, {user?.name || "Cosmic Traveler"}
            </motion.h1>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-5xl sm:text-6xl animate-float">{zodiacInfo.icon}</div>
              <div className="text-center sm:text-left">
                <p className="text-lg sm:text-xl text-muted-foreground">Your sign</p>
                <p className="text-2xl sm:text-3xl font-serif font-semibold text-white">
                  {zodiacInfo.sign}
                </p>
              </div>
            </motion.div>

            <motion.p 
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              The stars have aligned to bring you cosmic wisdom. Ready to explore 
              the mysteries of your celestial blueprint?
            </motion.p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="grid md:grid-cols-2 gap-6 mb-16"
        >
          <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Questions</p>
                  <p className="text-3xl font-bold text-white">{questionStats.totalQuestions}</p>
                </div>
                <div className="p-3 rounded-full bg-purple-500/20">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recent Activity</p>
                  <p className="text-3xl font-bold text-white">{questionStats.recentActivity}</p>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </div>
                <div className="p-3 rounded-full bg-pink-500/20">
                  <Stars className="w-6 h-6 text-pink-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Cards */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          <Card className="group hover:scale-105 transition-all duration-500 bg-slate-900/50 border-white/10 backdrop-blur-sm">
            <CardContent className="p-8 text-center space-y-4">
              <div className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 w-fit mx-auto group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-white">Generate Kundli</h3>
              <p className="text-gray-200">
                {hasKundli 
                  ? "View your existing birth chart and planetary positions"
                  : "Create your personalized birth chart and unlock cosmic insights"
                }
              </p>
              <Link to="/kundli">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                  {hasKundli ? "View My Kundli" : "Start Reading"}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-500 bg-slate-900/50 border-white/10 backdrop-blur-sm">
            <CardContent className="p-8 text-center space-y-4">
              <div className="p-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 w-fit mx-auto group-hover:scale-110 transition-transform">
                <Stars className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-white">Ask the Universe</h3>
              <p className="text-gray-200">
                Get answers to your deepest questions through astrological wisdom
              </p>
              <Link to="/questions">
                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
                  Ask Now
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-500 bg-slate-900/50 border-white/10 backdrop-blur-sm">
            <CardContent className="p-8 text-center space-y-4">
              <div className="p-4 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 w-fit mx-auto group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-white">Daily Cosmic</h3>
              <p className="text-gray-200">
                Receive personalized daily guidance from the celestial realm
              </p>
              <Button className="w-full bg-gray-600 text-gray-300 cursor-not-allowed" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
                </motion.div>


      </div>
    </div>
  );
};

export default Dashboard;