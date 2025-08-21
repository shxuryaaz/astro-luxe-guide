import { motion } from "framer-motion";
import { useState } from "react";
import { CosmicBackground } from "@/components/ui/cosmic-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, Clock, MapPin, Sparkles } from "lucide-react";

const KundliGeneration = () => {
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    timeOfBirth: "",
    placeOfBirth: "",
  });

  const [showChart, setShowChart] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowChart(true);
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Mock planetary data
  const planets = [
    { name: "Sun", sign: "Pisces", degree: "15°42'", house: "7th" },
    { name: "Moon", sign: "Cancer", degree: "28°15'", house: "11th" },
    { name: "Mars", sign: "Aries", degree: "3°22'", house: "8th" },
    { name: "Mercury", sign: "Aquarius", degree: "22°18'", house: "6th" },
    { name: "Jupiter", sign: "Sagittarius", degree: "12°55'", house: "4th" },
    { name: "Venus", sign: "Taurus", degree: "7°33'", house: "9th" },
    { name: "Saturn", sign: "Capricorn", degree: "19°44'", house: "5th" },
  ];

  return (
    <div className="min-h-screen pt-20 overflow-x-hidden">
      <CosmicBackground />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-cosmic mb-4 break-words">
            Generate Your Kundli
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground px-4">
            Create your personalized birth chart and unlock cosmic insights
          </p>
        </motion.div>

        {!showChart ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="glass border-primary/30">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-center text-cosmic">
                  Birth Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Your full name"
                          value={formData.name}
                          onChange={handleInputChange("name")}
                          className="pl-10 glass border-primary/20 focus:border-primary/50"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange("dateOfBirth")}
                          className="pl-10 glass border-primary/20 focus:border-primary/50"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeOfBirth">Time of Birth</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="timeOfBirth"
                          type="time"
                          value={formData.timeOfBirth}
                          onChange={handleInputChange("timeOfBirth")}
                          className="pl-10 glass border-primary/20 focus:border-primary/50"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="placeOfBirth">Place of Birth</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="placeOfBirth"
                          type="text"
                          placeholder="City, Country"
                          value={formData.placeOfBirth}
                          onChange={handleInputChange("placeOfBirth")}
                          className="pl-10 glass border-primary/20 focus:border-primary/50"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" variant="cosmic" size="lg" className="w-full">
                      Generate Kundli
                      <Sparkles className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Birth Chart Wheel */}
            <Card className="glass border-primary/30">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-center text-cosmic">
                  Your Birth Chart
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="relative w-80 h-80 rounded-full border-4 border-primary/30 bg-cosmic/20 backdrop-blur-sm">
                  <div className="absolute inset-4 rounded-full border-2 border-primary/20">
                    <div className="absolute inset-4 rounded-full border border-primary/10">
                      {/* Zodiac signs around the wheel */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-4xl animate-rotate-slow">✨</div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-sm font-medium">
                    ♈ Aries
                  </div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm font-medium">
                    ♎ Libra
                  </div>
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm font-medium">
                    ♋ Cancer
                  </div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm font-medium">
                    ♑ Capricorn
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Planetary Positions */}
            <div>
              <h2 className="text-2xl font-serif font-semibold text-cosmic mb-6 text-center">
                Planetary Positions
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {planets.map((planet, index) => (
                  <motion.div
                    key={planet.name}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <Card className="glass border-primary/20 hover:border-primary/40 transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-stardust">{planet.name}</h3>
                          <span className="text-xs bg-primary/20 px-2 py-1 rounded-full">
                            {planet.house} House
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>Sign: {planet.sign}</div>
                          <div>Degree: {planet.degree}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="text-center">
              <Button variant="stardust" size="lg" className="mr-4">
                Ask the Universe
              </Button>
              <Button variant="glass" size="lg">
                Download PDF
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default KundliGeneration;