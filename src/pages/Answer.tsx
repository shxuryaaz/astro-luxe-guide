import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Sparkles, BookOpen, RefreshCw, Loader2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { aiService } from "@/services/ai";
import { kundliService } from "@/services/kundli";
import { historyService } from "@/services/history";
import { pdfService } from "@/services/pdf";
import { getQuestionById, getCategoryById } from "@/config/questions";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Answer = () => {
  const [searchParams] = useSearchParams();
  const selectedModel = searchParams.get("model");
  const selectedQuestion = searchParams.get("question");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isGenerating, setIsGenerating] = useState(true);
  const [answer, setAnswer] = useState("");
  const [kundliData, setKundliData] = useState<any>(null);
  const [questionData, setQuestionData] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  // Generate answer using AI
  useEffect(() => {
    const generateAnswer = async () => {
      if (!user || !selectedModel || !selectedQuestion) {
        setIsGenerating(false);
        return;
      }

      try {
        // Get user's Kundli
        const kundli = await kundliService.getUserKundli(user.id);
        if (!kundli) {
          toast({
            title: "Kundli Required",
            description: "Please generate your Kundli first.",
            variant: "destructive",
          });
          navigate('/kundli');
          return;
        }

        // Get question data - handle both category and specific question IDs
        let question;
        if (selectedQuestion.includes('_')) {
          // Specific question ID (e.g., "career_1")
          question = getQuestionById(selectedQuestion);
        } else {
          // Category ID (e.g., "career") - get the first question from that category
          const category = getCategoryById(selectedQuestion);
          if (category && category.questions.length > 0) {
            question = category.questions[0];
          }
        }
        
        if (!question) {
          toast({
            title: "Question Not Found",
            description: "The selected question could not be found.",
            variant: "destructive",
          });
          navigate('/questions');
          return;
        }

        setKundliData(kundli);
        setQuestionData(question);

        // Generate AI reading
        const context = {
          question,
          kundliData: {
            planetaryPositions: kundli.planetaryPositions || [],
            ascendant: kundli.ascendant || { sign: "Unknown", degree: "0°" },
            houses: kundli.houses || [],
            nakshatra: kundli.nakshatra,
            chandra_rasi: kundli.chandra_rasi,
            soorya_rasi: kundli.soorya_rasi,
            zodiac: kundli.zodiac,
            additional_info: kundli.additional_info,
            gender: kundli.gender || ""
          },
          userDetails: {
            name: kundli.name,
            dateOfBirth: kundli.dateOfBirth,
            timeOfBirth: kundli.timeOfBirth,
            placeOfBirth: kundli.placeOfBirth,
            gender: kundli.gender || "",
          }
        };

        console.log('🔮 Generating BNN reading with context:', context);
        
        const aiAnswer = await aiService.generateBNNReading(context);
        
        // Check if we got a valid answer
        if (aiAnswer && typeof aiAnswer === 'string' && aiAnswer.trim().length > 0) {
          setAnswer(aiAnswer);
          
          // Store in history
          await historyService.storeQuestionHistory({
            userId: user.id,
            kundliId: kundli.id,
            questionCategory: selectedQuestion,
            modelUsed: selectedModel,
            answer: aiAnswer,
          });

          toast({
            title: "Reading Complete! ✨",
            description: "Your BNN reading has been generated successfully.",
          });
        } else {
          throw new Error('Invalid or empty response from AI service');
        }

      } catch (error) {
        console.error('❌ Error generating answer:', error);
        
        // Only show error toast if we don't have a fallback answer
        if (!answer || answer.trim().length === 0) {
          toast({
            title: "Generation Failed",
            description: "Failed to generate reading. Please try again.",
            variant: "destructive",
          });
          
          // Set a helpful fallback message
          setAnswer(`We're experiencing some technical difficulties with the AI service. 

**What happened:**
The system encountered an issue while generating your personalized reading.

**What you can do:**
1. **Try again** - Click the refresh button below
2. **Check your connection** - Ensure you have a stable internet connection
3. **Contact support** - If the issue persists, reach out to our team

**Your Kundli Data:**
- **Model Used:** ${modelNames[selectedModel as keyof typeof modelNames]}
- **Question Category:** ${questionTitles[selectedQuestion as keyof typeof questionTitles]}
- **Generated:** ${new Date().toLocaleString()}

We apologize for the inconvenience and are working to resolve this issue.`);
        }
      } finally {
        setIsGenerating(false);
      }
    };

    generateAnswer();
  }, [user, selectedModel, selectedQuestion, navigate, toast]);

  const handleDownloadPDF = async () => {
    if (!answer || !kundliData || !questionData || !user) return;

    setIsDownloading(true);

    try {
      const pdfBlob = await pdfService.generateComprehensiveReadingPDF({
        userDetails: {
          name: kundliData.name || "User",
          dateOfBirth: kundliData.birthDate || kundliData.dateOfBirth || "",
          timeOfBirth: kundliData.birthTime || kundliData.timeOfBirth || "",
          placeOfBirth: kundliData.birthPlace || kundliData.placeOfBirth || "",
        },
        question: {
          text: questionData.text,
          category: selectedQuestion || "",
        },
        reading: answer,
        planetaryPositions: kundliData.planetaryPositions || [],
      });

      pdfService.downloadPDF(pdfBlob, `reading-${selectedQuestion}-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: "Your reading has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAskAnotherQuestion = () => {
    navigate('/questions');
  };

  const handleShareReading = () => {
    // Implement sharing functionality
    toast({
      title: "Sharing Coming Soon",
      description: "Share functionality will be available soon.",
    });
  };

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
      
      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
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
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      className="text-foreground leading-relaxed"
                      components={{
                        h1: ({children}) => <h1 className="text-2xl font-bold text-primary mb-6 mt-8 first:mt-0">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xl font-semibold text-primary mb-4 mt-6">{children}</h2>,
                        h3: ({children}) => <h3 className="text-lg font-semibold text-accent mb-3 mt-4">{children}</h3>,
                        p: ({children}) => <p className="mb-4 leading-relaxed text-base">{children}</p>,
                        strong: ({children}) => <strong className="text-primary font-semibold">{children}</strong>,
                        em: ({children}) => <em className="text-accent italic">{children}</em>,
                        ul: ({children}) => <ul className="list-disc list-inside space-y-2 mb-6 pl-6">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside space-y-2 mb-6 pl-6">{children}</ol>,
                        li: ({children}) => <li className="mb-2 leading-relaxed">{children}</li>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-6 py-2">{children}</blockquote>,
                        hr: () => <hr className="border-primary/20 my-8" />,
                        br: () => <br className="mb-2" />,
                      }}
                    >
                      {answer}
                    </ReactMarkdown>
                  </div>

                  <div className="border-t border-primary/20 pt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>Based on {modelNames[selectedModel as keyof typeof modelNames]} interpretation</span>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <Button 
                        variant="stardust" 
                        size="lg"
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Generating PDF...
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5 mr-2" />
                            Download as PDF
                          </>
                        )}
                      </Button>
                      <Button variant="glass" size="lg" onClick={handleAskAnotherQuestion}>
                        Ask Another Question
                      </Button>
                      <Button variant="outline" size="lg" onClick={handleShareReading}>
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
                  <Button variant="cosmic" onClick={handleAskAnotherQuestion}>
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