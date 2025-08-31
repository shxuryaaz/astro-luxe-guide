import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const backendApi = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PlanetaryPosition {
  name: string;
  sign: string;
  degree: string;
  house: number;
  nakshatra: string;
  nakshatra_lord: string;
  is_retrograde: boolean;
}

export interface KundliData {
  ascendant: {
    sign: string;
    degree: string;
  };
  planetary_positions: PlanetaryPosition[];
  houses: any[];
  nakshatra?: any;
  chandra_rasi?: any;
  soorya_rasi?: any;
  zodiac?: any;
  additional_info?: any;
}

export interface BirthDetails {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export const prokeralaService = {
  // Get coordinates for a place
            async getCoordinates(place: string): Promise<{ latitude: number; longitude: number }> {
            try {
              const response = await backendApi.post('/api/prokerala/coordinates', {
                place
              });

              return response.data;
            } catch (error) {
              console.error('Error getting coordinates:', error);
              // Return default coordinates for Mumbai if geocoding fails
              return { latitude: 19.076, longitude: 72.8777 };
            }
          },

            // Generate Kundli data
          async generateKundli(birthDetails: BirthDetails): Promise<KundliData> {
            try {
              let coordinates = birthDetails.coordinates;

              if (!coordinates) {
                coordinates = await this.getCoordinates(birthDetails.placeOfBirth);
              }

              const response = await backendApi.post('/api/prokerala/kundli', {
                birthDetails: {
                  ...birthDetails,
                  coordinates
                }
              });

              return response.data;
            } catch (error) {
              console.error('Error generating Kundli:', error);
              throw new Error('Failed to generate Kundli');
            }
          },

  // Get planetary positions
  async getPlanetaryPositions(birthDetails: BirthDetails): Promise<PlanetaryPosition[]> {
    try {
      const kundliData = await this.generateKundli(birthDetails);
      return kundliData.planetary_positions;
    } catch (error) {
      console.error('Error getting planetary positions:', error);
      throw new Error('Failed to get planetary positions');
    }
  },

  // Get birth chart image
  async getBirthChartImage(birthDetails: BirthDetails): Promise<string> {
    try {
      let coordinates = birthDetails.coordinates;
      
      if (!coordinates) {
        coordinates = await this.getCoordinates(birthDetails.placeOfBirth);
      }

      // For now, return a placeholder since birth chart endpoint might need different handling
      // You can implement this later if needed
      return 'https://via.placeholder.com/600x400/1e293b/ffffff?text=Birth+Chart+Image';
    } catch (error) {
      console.error('Error getting birth chart image:', error);
      throw new Error('Failed to get birth chart image');
    }
  },
};
