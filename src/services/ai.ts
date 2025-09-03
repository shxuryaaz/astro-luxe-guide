import axios from 'axios'
import { PlanetaryPosition } from './prokerala'
import { Question } from '@/config/questions'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

const backendApi = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface KundliAnalysis {
  planetaryPositions: PlanetaryPosition[]
  ascendant: {
    sign: string
    degree: string
  }
  houses: any[]
}

export interface QuestionContext {
  question: Question
  kundliData: KundliAnalysis
  userDetails: {
    name: string
    dateOfBirth: string
    timeOfBirth: string
    placeOfBirth: string
  }
}

export const aiService = {
  // Upload BNN PDF to the server
  async uploadBNNPDF(file: File): Promise<{ 
    success: boolean; 
    message: string; 
    filename?: string;
    chunks?: number;
    embeddings?: number;
  }> {
    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const response = await backendApi.post('/api/upload-bnn-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return {
        success: true,
        message: response.data.message,
        filename: response.data.filename,
        chunks: response.data.chunks,
        embeddings: response.data.embeddings
      }
    } catch (error) {
      console.error('Error uploading BNN PDF:', error)
      throw new Error('Failed to upload BNN PDF')
    }
  },

  // Generate BNN-based astrological reading using your PDF
  async generateBNNReading(context: QuestionContext): Promise<string> {
    try {
      console.log('🔮 Calling backend endpoint for BNN reading...');
      
      // Extract question text from the context
      const questionText = context.question.text || 'general guidance';
      
      const response = await backendApi.post('/api/bnn/generate-reading', {
        question: questionText,
        kundliData: context.kundliData
      })

      console.log('📡 Backend response:', response.data);

      // Check if the response contains an error
      if (response.data.error) {
        throw new Error(response.data.error)
      }

      // Handle both old and new response formats
      if (response.data.reading) {
        console.log('✅ Found reading in response.data.reading');
        return response.data.reading;
      } else if (typeof response.data === 'string') {
        console.log('✅ Found reading as direct string response');
        return response.data;
      } else {
        console.error('❌ Unexpected response format:', response.data);
        console.error('❌ Response keys:', Object.keys(response.data));
        throw new Error('Invalid response format from backend');
      }
    } catch (error) {
      console.error('❌ Error generating BNN reading:', error)
      
      // Check if it's a server error (500) or network error
      if (error.response?.status === 500 || error.code === 'ECONNREFUSED') {
        throw new Error('BNN service is currently unavailable. Please try again later.')
      }
      
      // For other errors, throw the original error
      throw error
    }
  },

  // Search BNN knowledge base
  async searchBNNKnowledge(query: string, kundliData?: any, question?: any): Promise<any> {
    try {
      const response = await backendApi.post('/api/search-bnn', {
        query,
        kundliData,
        question
      })

      return response.data.results
    } catch (error) {
      console.error('Error searching BNN knowledge base:', error)
      
      // Return fallback results
      return [
        "BNN Rule: Jupiter in 10th house indicates career success through wisdom and knowledge",
        "BNN Rule: Venus in 7th house suggests harmonious relationships and marriage",
        "BNN Rule: Saturn's transit through 6th house brings health challenges but also discipline",
        "BNN Rule: Mars in 1st house indicates leadership qualities and courage"
      ]
    }
  },

  // Check if BNN PDF is uploaded
  async checkBNNStatus(): Promise<{ hasPDF: boolean; chunks?: number }> {
    try {
      const response = await backendApi.get('/api/bnn-status')
      return {
        hasPDF: response.data.hasPDF,
        chunks: response.data.chunks
      }
    } catch (error) {
      console.error('Error checking BNN status:', error)
      return { hasPDF: false }
    }
  },

  // Generate demo reading (fallback)
  generateDemoReading(context: QuestionContext): string {
    const { question, kundliData, userDetails } = context

    return `Based on your birth chart analysis through the Bhrigu Nandi Nadi (BNN) system, I can see significant planetary influences affecting your ${question.text.toLowerCase()}.

**Key Insights:**

Your current planetary period (Mahadasha) shows favorable conditions for the question you've asked. The combination of planetary positions in your birth chart creates a strong foundation for growth and success in this area.

**Timing Analysis:**

The period between March 2024 to August 2024 appears particularly auspicious for major decisions and new beginnings in this area. The planetary transits during this time will support your endeavors.

**Favorable Factors:**

• Your natal Moon's placement creates strong intuitive guidance
• Jupiter's benefic aspects provide wisdom and expansion
• Venus's influence brings harmony and positive relationships
• Trust your instincts during this period

**Challenges to Navigate:**

• Saturn's transit may create some delays requiring patience
• View these as opportunities for deeper preparation
• Mercury's position suggests careful communication is needed

**Recommended Actions:**

• Begin new initiatives on Thursdays (Jupiter's day)
• Wear yellow sapphire or citrine for enhanced Jupiter energy
• Perform charity on Thursdays to strengthen benefic influences
• Meditate during sunrise for clarity and guidance

**Karmic Perspective:**

Your soul has chosen this lifetime to master the lessons related to ${question.text.toLowerCase()}. The current planetary alignments are cosmic support for this growth and evolution.

**Spiritual Guidance:**

The universe is conspiring to help you succeed. Stay aligned with your highest values and trust the divine timing of events unfolding in your life. Remember that astrology reveals potential - your conscious choices and actions determine the final outcome.

**BNN System Note:**

This reading is based on the ancient Bhrigu Nandi Nadi system, which provides precise timing and specific predictions. The system emphasizes the importance of planetary periods (Mahadasha) and their sub-periods (Antardasha) for accurate predictions.

Use this guidance as a cosmic compass while you navigate your journey. The BNN system is known for its accuracy in timing predictions, so pay special attention to the periods mentioned above.`
  },

  // Generate PDF content for the reading
  async generatePDFContent(reading: string, context: QuestionContext): Promise<string> {
    const { question, userDetails } = context
    
    return `
# Astrological Reading - Bhrigu Nandi Nadi

**Client:** ${userDetails.name}
**Date of Birth:** ${userDetails.dateOfBirth}
**Time of Birth:** ${userDetails.timeOfBirth}
**Place of Birth:** ${userDetails.placeOfBirth}

**Question:** ${question.text}
**System Used:** Bhrigu Nandi Nadi (BNN)

---

${reading}

---

*This reading is based on the ancient Bhrigu Nandi Nadi system and should be used as guidance. Your choices and actions determine your destiny.*

**Generated on:** ${new Date().toLocaleDateString()}
**System:** Astro Oracle - BNN Analysis
    `.trim()
  }
}
