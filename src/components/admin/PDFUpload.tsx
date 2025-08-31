import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { aiService } from '@/services/ai';
import { useToast } from '@/hooks/use-toast';

export const PDFUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setUploadStatus('idle');
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a PDF file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a PDF file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const result = await aiService.uploadBNNPDF(file);
      
      setUploadResult(result);
      setUploadStatus('success');
      
      toast({
        title: "PDF Uploaded Successfully!",
        description: `BNN PDF processed with ${result.chunks} chunks and ${result.embeddings} embeddings.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      
      toast({
        title: "Upload Failed",
        description: "Failed to upload and process the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="glass border-primary/30">
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-center text-cosmic">
            Upload BNN PDF
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Upload your Bhrigu Nandi Nadi PDF to enable AI-powered readings
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-4">
            <Label htmlFor="pdf-upload" className="text-lg font-medium">
              Select BNN PDF File
            </Label>
            
            <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-cosmic/20 rounded-full flex items-center justify-center">
                    {file ? (
                      <FileText className="w-8 h-8 text-cosmic" />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div>
                    {file ? (
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-cosmic">
                          {file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-lg font-medium">
                          Click to select PDF file
                        </p>
                        <p className="text-sm text-muted-foreground">
                          or drag and drop your BNN PDF here
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            variant="cosmic"
            size="lg"
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing PDF...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Upload & Process PDF
              </>
            )}
          </Button>

          {/* Upload Status */}
          {uploadStatus === 'success' && uploadResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-700">
                    PDF Processed Successfully!
                  </p>
                  <p className="text-sm text-green-600">
                    {uploadResult.chunks} text chunks created with {uploadResult.embeddings} embeddings
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {uploadStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-700">
                    Upload Failed
                  </p>
                  <p className="text-sm text-red-600">
                    Please check your file and try again
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-700 mb-2">Instructions:</h4>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Upload your Bhrigu Nandi Nadi PDF document</li>
              <li>• The system will extract text and create embeddings</li>
              <li>• AI readings will be based on your specific BNN content</li>
              <li>• Maximum file size: 10MB</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
