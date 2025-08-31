import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Database, Brain, Settings, Upload } from "lucide-react";
import { PDFUpload } from "@/components/admin/PDFUpload";
import { aiService } from "@/services/ai";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const [bnnStatus, setBnnStatus] = useState<{ hasPDF: boolean; chunks?: number }>({ hasPDF: false });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkBNNStatus();
  }, []);

  const checkBNNStatus = async () => {
    try {
      const status = await aiService.checkBNNStatus();
      setBnnStatus(status);
    } catch (error) {
      console.error('Error checking BNN status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePDFUploaded = () => {
    // Refresh status after upload
    checkBNNStatus();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center relative overflow-hidden">
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
        
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-200">Loading admin panel...</p>
        </div>
      </div>
    );
  }

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
            Admin Panel
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your BNN knowledge base and system settings
          </p>
        </motion.div>

        {/* Status Overview */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          <Card className="glass border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">BNN PDF Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={bnnStatus.hasPDF ? "default" : "secondary"}>
                      {bnnStatus.hasPDF ? "Active" : "Not Uploaded"}
                    </Badge>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-cosmic/20">
                  <FileText className="w-6 h-6 text-cosmic" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Knowledge Chunks</p>
                  <p className="text-2xl font-bold text-stardust">
                    {bnnStatus.chunks || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-stardust/20">
                  <Database className="w-6 h-6 text-stardust" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI System</p>
                  <p className="text-2xl font-bold text-aurora">
                    {bnnStatus.hasPDF ? "BNN-Powered" : "Demo Mode"}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-aurora/20">
                  <Brain className="w-6 h-6 text-aurora" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-8"
        >
          {/* PDF Upload Section */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif font-semibold text-cosmic mb-2">
                BNN Knowledge Base
              </h2>
              <p className="text-muted-foreground">
                Upload your Bhrigu Nandi Nadi PDF to enable AI-powered readings
              </p>
            </div>
            
            <PDFUpload />
          </div>



          {/* Instructions */}
          <Card className="glass border-accent/30">
            <CardContent className="p-6">
              <h3 className="text-xl font-serif font-semibold mb-4 text-accent">
                Getting Started
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-cosmic rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Upload Your BNN PDF</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the upload form above to add your Bhrigu Nandi Nadi PDF document. The system will process it automatically.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-stardust rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Wait for Processing</h4>
                    <p className="text-sm text-muted-foreground">
                      The system will extract text, create chunks, and generate embeddings. This may take a few minutes for large PDFs.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-aurora rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Start Using AI Readings</h4>
                    <p className="text-sm text-muted-foreground">
                      Once processing is complete, all AI readings will be based on your specific BNN knowledge base instead of generic astrological knowledge.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
