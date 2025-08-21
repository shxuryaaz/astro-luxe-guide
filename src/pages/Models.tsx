import { motion } from "framer-motion";
import { CosmicBackground } from "@/components/ui/cosmic-background";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Sparkles, Star } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

const Models = () => {
  const [searchParams] = useSearchParams();
  const selectedQuestion = searchParams.get("question");

  const questionTitles = {
    career: "Career Guidance",
    marriage: "Marriage & Love",
    health: "Health Insights",
    education: "Education Path",
    finance: "Financial Wisdom",
    travel: "Travel & Opportunities",
  };

  const models = [
    {
      id: "bnn",
      name: "Bhrigu Nandi Nadi",
      shortName: "BNN",
      description: "Ancient predictive system based on Sage Bhrigu's teachings. Highly accurate for timing and specific predictions.",
      accuracy: "95%",
      specialty: "Timing & Precise Predictions",
      features: [
        "Exact timing of events",
        "Specific predictions",
        "Life pattern analysis",
        "Karmic insights"
      ],
      available: true,
    },
    {
      id: "kp",
      name: "Krishnamurthy Paddhati",
      shortName: "KP",
      description: "Scientific approach to Vedic astrology with sub-lord theory for precise predictions.",
      accuracy: "92%",
      specialty: "Scientific Precision",
      features: [
        "Sub-lord analysis",
        "Event-based predictions",
        "Yes/No answers",
        "Stellar astrology"
      ],
      available: false,
    },
    {
      id: "parashari",
      name: "Parashari System",
      shortName: "Classical",
      description: "Traditional Vedic astrology based on Sage Parashara's principles and classical texts.",
      accuracy: "88%",
      specialty: "Traditional Wisdom",
      features: [
        "Classical interpretations",
        "Dasha analysis",
        "House lordships",
        "Traditional remedies"
      ],
      available: false,
    },
    {
      id: "lalkitab",
      name: "Lal Kitab",
      shortName: "Red Book",
      description: "Unique system combining astrology with palmistry, known for practical remedies.",
      accuracy: "85%",
      specialty: "Practical Remedies",
      features: [
        "Simple remedies",
        "Debt karmas",
        "Past life analysis",
        "Quick solutions"
      ],
      available: false,
    },
  ];

  return (
    <div className="min-h-screen pt-20">
      <CosmicBackground />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-cosmic mb-4">
            Choose Your Oracle
          </h1>
          {selectedQuestion && (
            <p className="text-xl text-stardust mb-4">
              Question Category: {questionTitles[selectedQuestion as keyof typeof questionTitles]}
            </p>
          )}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the astrological system that resonates with your spiritual journey
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {models.map((model, index) => (
            <motion.div
              key={model.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className={`h-full glass transition-all duration-300 ${
                model.available 
                  ? 'border-primary/30 hover:border-primary/50 hover:scale-105' 
                  : 'border-muted/20 opacity-75'
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl font-serif text-stardust">
                        {model.name}
                      </CardTitle>
                      <Badge 
                        variant={model.available ? "default" : "secondary"}
                        className={model.available ? "bg-cosmic" : ""}
                      >
                        {model.available ? "Available" : "Coming Soon"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{model.accuracy}</div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {model.description}
                  </p>

                  <div>
                    <h4 className="font-semibold text-cosmic mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Specialty: {model.specialty}
                    </h4>
                    <ul className="space-y-2">
                      {model.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Sparkles className="w-3 h-3 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    {model.available ? (
                      <Link to={`/answer?model=${model.id}&question=${selectedQuestion}`}>
                        <Button variant="cosmic" size="lg" className="w-full">
                          <BookOpen className="w-5 h-5 mr-2" />
                          Get Reading with {model.shortName}
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="glass" size="lg" className="w-full" disabled>
                        Coming Soon
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <Card className="max-w-3xl mx-auto glass border-primary/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-serif font-semibold mb-4 text-cosmic">
                Why Choose BNN (Bhrigu Nandi Nadi)?
              </h2>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="space-y-2">
                  <h3 className="font-semibold text-stardust">Ancient Wisdom</h3>
                  <p className="text-sm text-muted-foreground">
                    Based on 5000+ year old manuscripts by Sage Bhrigu
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-stardust">Precise Timing</h3>
                  <p className="text-sm text-muted-foreground">
                    Accurate predictions with specific dates and timeframes
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-stardust">Life Patterns</h3>
                  <p className="text-sm text-muted-foreground">
                    Reveals karmic patterns and life purpose clearly
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Models;