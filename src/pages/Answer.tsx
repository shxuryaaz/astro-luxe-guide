import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { CosmicBackground } from "@/components/ui/cosmic-background";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Sparkles, BookOpen, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const Answer = () => {
  const [searchParams] = useSearchParams();
  const selectedModel = searchParams.get("model");
  const selectedQuestion = searchParams.get("question");
  const [isGenerating, setIsGenerating] = useState(true);
  const [answer, setAnswer] = useState("");

  const questionTitles = {
    career: "Career Guidance",
    marriage: "Marriage & Love",
    health: "Health Insights",
    education: "Education Path",
    finance: "Financial Wisdom",
    travel: "Travel & Opportunities",
  };

  const modelNames = {
    bnn: "Bhrigu Nandi Nadi",
    kp: "Krishnamurthy Paddhati",
    parashari: "Parashari System",
    lalkitab: "Lal Kitab",
  };

  // Mock answer generation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsGenerating(false);
      setAnswer(`Based on your birth chart analysis through the ${modelNames[selectedModel as keyof typeof modelNames]} system, I can see significant planetary influences affecting your ${questionTitles[selectedQuestion as keyof typeof questionTitles].toLowerCase()}.

Your current planetary period (Mahadasha) is highly favorable for the question you've asked. The combination of Jupiter's benefic aspect on your 10th house and Venus's placement in the 11th house creates an excellent foundation for growth and success.

**Key Insights:**

• **Timing:** The period between March 2024 to August 2024 appears particularly auspicious for major decisions and new beginnings in this area.

• **Favorable Factors:** Your natal Moon's trine aspect with Jupiter creates strong intuitive guidance. Trust your instincts during this period.

• **Challenges to Navigate:** Saturn's transit through your 7th house may create some delays or require extra patience. View these as opportunities for deeper preparation.

• **Recommended Actions:** 
  - Begin new initiatives on Thursdays (Jupiter's day)
  - Wear yellow sapphire or citrine for enhanced Jupiter energy
  - Perform charity on Thursdays to strengthen benefic planetary influences

**Karmic Perspective:**
Your soul has chosen this lifetime to master the lessons related to ${questionTitles[selectedQuestion as keyof typeof questionTitles].toLowerCase()}. The current planetary alignments are cosmic support for this growth.

**Spiritual Guidance:**
The universe is conspiring to help you succeed. Stay aligned with your highest values and trust the divine timing of events unfolding in your life.

Remember, astrology reveals potential - your conscious choices and actions determine the final outcome. Use this guidance as a cosmic compass while you navigate your journey.`);
    }, 3000);

    return () => clearTimeout(timer);
  }, [selectedModel, selectedQuestion]);

  return (
    <div className="min-h-screen pt-20">
      <CosmicBackground />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-cosmic mb-4">
            Your Cosmic Reading
          </h1>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Badge variant="outline" className="border-primary/30 text-stardust">
              {questionTitles[selectedQuestion as keyof typeof questionTitles]}
            </Badge>
            <Badge variant="outline" className="border-accent/30 text-accent">
              {modelNames[selectedModel as keyof typeof modelNames]}
            </Badge>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="glass border-primary/30 glow-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-serif text-cosmic flex items-center gap-3">
                  <BookOpen className="w-6 h-6" />
                  Astrological Reading
                </CardTitle>
                {isGenerating && (
                  <div className="flex items-center gap-2 text-primary">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Consulting the stars...</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {isGenerating ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center space-y-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 mx-auto"
                      >
                        <Sparkles className="w-16 h-16 text-primary" />
                      </motion.div>
                      <p className="text-lg text-muted-foreground">
                        Analyzing your birth chart...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        The cosmic energies are aligning to provide your reading
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-6"
                >
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-line text-foreground leading-relaxed">
                      {answer}
                    </div>
                  </div>

                  <div className="border-t border-primary/20 pt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>Based on {modelNames[selectedModel as keyof typeof modelNames]} interpretation</span>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <Button variant="stardust" size="lg">
                        <Download className="w-5 h-5 mr-2" />
                        Download as PDF
                      </Button>
                      <Button variant="glass" size="lg">
                        Ask Another Question
                      </Button>
                      <Button variant="outline" size="lg">
                        Share Reading
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {!isGenerating && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-8"
          >
            <Card className="glass border-accent/30">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-serif font-semibold mb-3 text-stardust">
                  Want More Insights?
                </h3>
                <p className="text-muted-foreground mb-4">
                  Explore other aspects of your cosmic blueprint with different questions
                  or dive deeper with alternative astrological systems.
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="cosmic">
                    Ask New Question
                  </Button>
                  <Button variant="glass">
                    Try Different System
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Answer;