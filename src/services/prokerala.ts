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

              console.log('Sending Kundli request with birth details:', {
                ...birthDetails,
                coordinates
              });

              const response = await backendApi.post('/api/prokerala/kundli', {
                birthDetails: {
                  ...birthDetails,
                  coordinates
                }
              });

              console.log('ProKerala API response status:', response.status);
              console.log('ProKerala API response data:', JSON.stringify(response.data, null, 2));

              // Validate the response data
              if (!response.data) {
                throw new Error('Empty response from ProKerala API');
              }

              // Ensure required fields exist with fallbacks
              const kundliData = {
                ascendant: response.data.ascendant || { sign: "Unknown", degree: "0°" },
                planetary_positions: response.data.planetary_positions || [],
                houses: response.data.houses || [],
                nakshatra: response.data.nakshatra || null,
                chandra_rasi: response.data.chandra_rasi || null,
                soorya_rasi: response.data.soorya_rasi || null,
                zodiac: response.data.zodiac || null,
                additional_info: response.data.additional_info || null,
                ...response.data
              };

              return kundliData;
            } catch (error) {
              console.error('Error generating Kundli:', error);
              if (error.response) {
                console.error('API Error Response:', error.response.data);
                console.error('API Error Status:', error.response.status);
              }
              throw new Error(`Failed to generate Kundli: ${error.message}`);
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
