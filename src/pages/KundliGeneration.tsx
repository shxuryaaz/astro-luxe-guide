import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Download, 
  MessageSquare, 
  Loader2,
  Sparkles,
  Globe
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { kundliService } from "@/services/kundli";
import { prokeralaService } from "@/services/prokerala";
import { pdfService } from "@/services/pdf";
import { useNavigate } from "react-router-dom";

const KundliGeneration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    dateOfBirth: "",
    timeOfBirth: "",
    placeOfBirth: "",
    gender: "",
  });
  
  const [kundliData, setKundliData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasExistingKundli, setHasExistingKundli] = useState(false);

  useEffect(() => {
    if (user) {
      loadExistingKundli();
    }
  }, [user]);

  const loadExistingKundli = async () => {
    if (!user) return;
    
    try {
      const existingKundli = await kundliService.getUserKundli(user.id);
      if (existingKundli) {
        setKundliData(existingKundli);
        setHasExistingKundli(true);
        setFormData({
          name: existingKundli.name,
          dateOfBirth: existingKundli.dateOfBirth,
          timeOfBirth: existingKundli.timeOfBirth,
          placeOfBirth: existingKundli.placeOfBirth,
          gender: "",
        });
      }
    } catch (error) {
      console.error('Error loading existing Kundli:', error);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate your Kundli.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const kundli = await kundliService.generateAndStoreKundli(user.id, formData);
      console.log('Frontend received Kundli data:', kundli);
      setKundliData(kundli);
      setHasExistingKundli(true);
      
      toast({
        title: "Kundli Generated!",
        description: "Your birth chart has been created successfully.",
      });
    } catch (error: any) {
      console.error('Error generating Kundli:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate Kundli. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!kundliData) return;
    
    setIsDownloading(true);
    
    try {
      const blob = await pdfService.generateKundliPDF(kundliData);
      pdfService.downloadPDF(blob, `kundli-${kundliData.name}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF Downloaded!",
        description: "Your Kundli has been saved as a PDF.",
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

  const handleAskQuestions = () => {
    navigate('/questions');
  };

  const getZodiacSign = (date: string) => {
    if (!date) return "";
    const month = new Date(date).getMonth() + 1;
    const day = new Date(date).getDate();
    
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
    return "Pisces";
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
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-cosmic mb-4">
            Generate Your Kundli
          </h1>
          <p className="text-xl text-gray-200">
            Discover your cosmic blueprint and planetary influences
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Card className="glass border-primary/30">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-cosmic flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  Birth Details
                </CardTitle>
                {hasExistingKundli && (
                  <Badge variant="secondary" className="w-fit">
                    Existing Kundli Found
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-200">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleInputChange("name")}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-200">
                      Date of Birth
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange("dateOfBirth")}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timeOfBirth" className="text-sm font-medium text-gray-200">
                      Time of Birth
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
                      <Input
                        id="timeOfBirth"
                        type="time"
                        value={formData.timeOfBirth}
                        onChange={handleInputChange("timeOfBirth")}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="placeOfBirth" className="text-sm font-medium text-gray-200">
                      Place of Birth
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
                      <Input
                        id="placeOfBirth"
                        type="text"
                        placeholder="City, State, Country"
                        value={formData.placeOfBirth}
                        onChange={handleInputChange("placeOfBirth")}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-semibold text-white">
                      Gender
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                      <select
                        id="gender"
                        value={formData.gender}
                        onChange={handleInputChange("gender")}
                        className="w-full pl-10 pr-3 py-2 bg-white/90 border border-primary/30 rounded-md text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        required
                      >
                        <option value="" className="text-gray-500">Select Gender</option>
                        <option value="male" className="text-gray-800">Male</option>
                        <option value="female" className="text-gray-800">Female</option>
                        <option value="other" className="text-gray-800">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    variant="cosmic"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Kundli...
                      </>
                    ) : hasExistingKundli ? (
                      "Update Kundli"
                    ) : (
                      "Generate Kundli"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-6"
          >
            {kundliData && (
              <>
                {console.log('Rendering Kundli data:', kundliData)}
                {console.log('Has nakshatra:', !!kundliData.nakshatra)}
                {console.log('Has additional_info:', !!kundliData.additional_info)}
                {console.log('Nakshatra data:', kundliData.nakshatra)}
                {console.log('Additional info:', kundliData.additional_info)}
                {/* Basic Info */}
                <Card className="glass border-primary/30 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                  <CardHeader>
                    <CardTitle className="text-2xl font-serif text-cosmic flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-yellow-400" />
                      Your Birth Chart
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gradient-to-r from-purple-800/30 to-blue-800/30 rounded-xl border border-purple-500/20">
                        <p className="text-sm text-purple-300 mb-1">Name</p>
                        <p className="font-semibold text-white text-lg">{kundliData.name}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-blue-800/30 to-cyan-800/30 rounded-xl border border-blue-500/20">
                        <p className="text-sm text-blue-300 mb-1">Zodiac Sign</p>
                        <p className="font-semibold text-white text-lg">{getZodiacSign(kundliData.dateOfBirth)}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-green-800/30 to-emerald-800/30 rounded-xl border border-green-500/20">
                        <p className="text-sm text-green-300 mb-1">Ascendant</p>
                        <p className="font-semibold text-white text-lg">
                          {kundliData.ascendant?.sign || 'Unknown'} {kundliData.ascendant?.degree || '0°'}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-orange-800/30 to-red-800/30 rounded-xl border border-orange-500/20">
                        <p className="text-sm text-orange-300 mb-1">Birth Place</p>
                        <p className="font-semibold text-white text-lg">{kundliData.placeOfBirth}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Planetary Positions */}
                <Card className="glass border-primary/30 bg-gradient-to-br from-indigo-900/20 to-purple-900/20">
                  <CardHeader>
                    <CardTitle className="text-2xl font-serif text-cosmic flex items-center gap-3">
                      <Globe className="w-6 h-6 text-blue-400" />
                      Planetary Positions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {kundliData.planetaryPositions && kundliData.planetaryPositions.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {kundliData.planetaryPositions.map((planet: any, index: number) => (
                          <div key={index} className="p-4 bg-gradient-to-br from-blue-800/20 to-purple-800/20 rounded-xl border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300">
                            <p className="font-semibold text-blue-300 text-lg">{planet.name}</p>
                            <p className="text-sm text-white">
                              {planet.sign} {planet.degree}°
                            </p>
                            <p className="text-xs text-gray-300">
                              House {planet.house}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-300 text-lg">Planetary positions data not available</p>
                        <p className="text-gray-400 text-sm">This information will be available in future updates</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Nakshatra Details */}
                {kundliData.nakshatra && (
                  <Card className="glass border-primary/30 bg-gradient-to-br from-emerald-900/20 to-teal-900/20">
                    <CardHeader>
                      <CardTitle className="text-2xl font-serif text-cosmic flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-emerald-400" />
                        Nakshatra Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-gradient-to-br from-emerald-800/30 to-green-800/30 rounded-xl border border-emerald-500/20">
                          <p className="font-semibold text-emerald-300 mb-2">Nakshatra</p>
                          <p className="text-white text-lg font-medium">{kundliData.nakshatra.name}</p>
                          <p className="text-emerald-200 text-sm">Pada {kundliData.nakshatra.pada}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-teal-800/30 to-cyan-800/30 rounded-xl border border-teal-500/20">
                          <p className="font-semibold text-teal-300 mb-2">Lord</p>
                          <p className="text-white text-lg font-medium">{kundliData.nakshatra.lord?.name}</p>
                          <p className="text-teal-200 text-sm">{kundliData.nakshatra.lord?.vedic_name}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-blue-800/30 to-indigo-800/30 rounded-xl border border-blue-500/20">
                          <p className="font-semibold text-blue-300 mb-2">ID</p>
                          <p className="text-white text-lg font-medium">{kundliData.nakshatra.id}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Rashi Details */}
                <Card className="glass border-primary/30 bg-gradient-to-br from-amber-900/20 to-orange-900/20">
                  <CardHeader>
                    <CardTitle className="text-2xl font-serif text-cosmic flex items-center gap-3">
                      <Globe className="w-6 h-6 text-amber-400" />
                      Rashi Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-gradient-to-br from-amber-800/30 to-yellow-800/30 rounded-xl border border-amber-500/20">
                        <p className="font-semibold text-amber-300 mb-2">Chandra Rashi</p>
                        <p className="text-white text-lg font-medium">{kundliData.chandra_rasi?.name}</p>
                        <p className="text-amber-200 text-sm">Lord: {kundliData.chandra_rasi?.lord?.name}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-orange-800/30 to-red-800/30 rounded-xl border border-orange-500/20">
                        <p className="font-semibold text-orange-300 mb-2">Soorya Rashi</p>
                        <p className="text-white text-lg font-medium">{kundliData.soorya_rasi?.name}</p>
                        <p className="text-orange-200 text-sm">Lord: {kundliData.soorya_rasi?.lord?.name}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-pink-800/30 to-rose-800/30 rounded-xl border border-pink-500/20">
                        <p className="font-semibold text-pink-300 mb-2">Zodiac</p>
                        <p className="text-white text-lg font-medium">{kundliData.zodiac?.name}</p>
                        <p className="text-pink-200 text-sm">ID: {kundliData.zodiac?.id}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Information */}
                {kundliData.additional_info && (
                  <Card className="glass border-primary/30 bg-gradient-to-br from-violet-900/20 to-purple-900/20">
                    <CardHeader>
                      <CardTitle className="text-2xl font-serif text-cosmic flex items-center gap-3">
                        <MessageSquare className="w-6 h-6 text-violet-400" />
                        Additional Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 bg-gradient-to-br from-violet-800/30 to-purple-800/30 rounded-xl border border-violet-500/20">
                          <p className="font-semibold text-violet-300 mb-2">Deity</p>
                          <p className="text-white text-lg font-medium">{kundliData.additional_info.deity}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-purple-800/30 to-pink-800/30 rounded-xl border border-purple-500/20">
                          <p className="font-semibold text-purple-300 mb-2">Ganam</p>
                          <p className="text-white text-lg font-medium">{kundliData.additional_info.ganam}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-pink-800/30 to-rose-800/30 rounded-xl border border-pink-500/20">
                          <p className="font-semibold text-pink-300 mb-2">Symbol</p>
                          <p className="text-white text-sm">{kundliData.additional_info.symbol}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-rose-800/30 to-red-800/30 rounded-xl border border-rose-500/20">
                          <p className="font-semibold text-rose-300 mb-2">Animal Sign</p>
                          <p className="text-white text-lg font-medium">{kundliData.additional_info.animal_sign}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-red-800/30 to-orange-800/30 rounded-xl border border-red-500/20">
                          <p className="font-semibold text-red-300 mb-2">Nadi</p>
                          <p className="text-white text-lg font-medium">{kundliData.additional_info.nadi}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-orange-800/30 to-yellow-800/30 rounded-xl border border-orange-500/20">
                          <p className="font-semibold text-orange-300 mb-2">Color</p>
                          <p className="text-white text-lg font-medium">{kundliData.additional_info.color}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-yellow-800/30 to-lime-800/30 rounded-xl border border-yellow-500/20">
                          <p className="font-semibold text-yellow-300 mb-2">Best Direction</p>
                          <p className="text-white text-lg font-medium">{kundliData.additional_info.best_direction}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-lime-800/30 to-green-800/30 rounded-xl border border-lime-500/20">
                          <p className="font-semibold text-lime-300 mb-2">Birth Stone</p>
                          <p className="text-white text-lg font-medium">{kundliData.additional_info.birth_stone}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-green-800/30 to-emerald-800/30 rounded-xl border border-green-500/20">
                          <p className="font-semibold text-green-300 mb-2">Planet</p>
                          <p className="text-white text-lg font-medium">{kundliData.additional_info.planet}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <Button
                    onClick={handleDownloadPDF}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleAskQuestions}
                    variant="cosmic"
                    size="lg"
                    className="flex-1"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask Questions
                  </Button>
                </div>
              </>
            )}

            {!kundliData && !isLoading && (
              <Card className="glass border-primary/30">
                <CardContent className="text-center py-12">
                  <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Kundli Generated Yet</h3>
                  <p className="text-gray-200">
                    Fill in your birth details to generate your personalized birth chart.
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default KundliGeneration;