import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Briefcase, 
  Heart, 
  Shield, 
  GraduationCap, 
  DollarSign, 
  Plane,
  Sparkles 
} from "lucide-react";
import { Link } from "react-router-dom";

const Questions = () => {
  const questionCategories = [
    {
      id: "career",
      title: "Career",
      description: "Professional growth, job changes, business ventures",
      icon: Briefcase,
      gradient: "bg-cosmic",
    },
    {
      id: "marriage",
      title: "Marriage & Love",
      description: "Relationships, marriage timing, partner compatibility",
      icon: Heart,
      gradient: "bg-stardust",
    },
    {
      id: "health",
      title: "Health",
      description: "Physical wellness, mental health, healing guidance",
      icon: Shield,
      gradient: "bg-aurora",
    },
    {
      id: "education",
      title: "Education",
      description: "Academic pursuits, learning paths, skill development",
      icon: GraduationCap,
      gradient: "bg-nebula",
    },
    {
      id: "finance",
      title: "Finance",
      description: "Wealth, investments, financial stability",
      icon: DollarSign,
      gradient: "bg-cosmic",
    },
    {
      id: "travel",
      title: "Travel",
      description: "Journeys, relocations, foreign opportunities",
      icon: Plane,
      gradient: "bg-stardust",
    },
  ];

  return (
    <div className="min-h-screen pt-20 relative overflow-hidden">
      {/* Cosmic background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-purple-800/60 to-slate-800"></div>
      
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
      
      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-cosmic mb-4">
            Ask the Universe
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose a category to receive personalized astrological guidance 
            based on your cosmic blueprint
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {questionCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to={`/models?question=${category.id}`}>
                <Card className="h-full glass border-primary/20 hover:border-primary/40 transition-all duration-300 group cursor-pointer">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className={`p-4 rounded-full ${category.gradient} w-fit mx-auto group-hover:scale-110 transition-transform glow-primary`}>
                      <category.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-serif font-semibold text-stardust mb-2">
                        {category.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {category.description}
                      </p>
                    </div>

                    <div className="pt-2">
                      <div className="inline-flex items-center gap-2 text-primary text-sm font-medium">
                        Explore <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <Card className="max-w-2xl mx-auto glass border-primary/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-serif font-semibold mb-4 text-cosmic">
                Personalized Cosmic Guidance
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Each reading is uniquely crafted based on your birth chart, 
                planetary positions, and the ancient wisdom of Vedic astrology.
              </p>
              <div className="flex items-center justify-center gap-2 text-stardust">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Powered by Cosmic AI</span>
                <Sparkles className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Questions;