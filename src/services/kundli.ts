import { doc, setDoc, getDoc, getDocs, collection, query, where, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { prokeralaService } from './prokerala';

// Helper function to convert Firestore timestamps to Date objects
const convertTimestamp = (timestamp: any) => {
  if (!timestamp) return new Date();
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  if (typeof timestamp === 'number') return new Date(timestamp);
  return new Date();
};

export interface Kundli {
  id: string;
  userId: string;
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  gender?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  ascendant: {
    sign: string;
    degree: string;
  };
  planetaryPositions: any[];
  houses: any[];
  nakshatra?: any;
  chandra_rasi?: any;
  soorya_rasi?: any;
  zodiac?: any;
  additional_info?: any;
  createdAt: Date;
  updatedAt: Date;
}

export const kundliService = {
  // Generate and store Kundli data
  async generateAndStoreKundli(userId: string, userDetails: {
    name: string;
    dateOfBirth: string;
    timeOfBirth: string;
    placeOfBirth: string;
    gender?: string;
  }): Promise<Kundli> {
    try {
      // Get coordinates for the place
      const coordinates = await prokeralaService.getCoordinates(userDetails.placeOfBirth);
      
      // Generate Kundli data
      const kundliData = await prokeralaService.generateKundli({
        ...userDetails,
        coordinates
      });

      console.log('Generated Kundli data:', JSON.stringify(kundliData, null, 2));

      // Validate and provide fallbacks for undefined fields
      const validatedAscendant = kundliData.ascendant && 
        kundliData.ascendant.sign && 
        kundliData.ascendant.degree 
        ? kundliData.ascendant 
        : { sign: "Unknown", degree: "0°" };

      const validatedPlanetaryPositions = kundliData.planetary_positions || [];
      const validatedHouses = kundliData.houses || [];

      console.log('Validated ascendant:', validatedAscendant);
      console.log('Validated planetary positions count:', validatedPlanetaryPositions.length);
      console.log('Validated houses count:', validatedHouses.length);

      // Create Kundli document
      const kundliId = `kundli_${Date.now()}`;
      const kundli: Kundli = {
        id: kundliId,
        userId,
        name: userDetails.name,
        dateOfBirth: userDetails.dateOfBirth,
        timeOfBirth: userDetails.timeOfBirth,
        placeOfBirth: userDetails.placeOfBirth,
        gender: userDetails.gender,
        coordinates,
        ascendant: validatedAscendant,
        planetaryPositions: validatedPlanetaryPositions,
        houses: validatedHouses,
        // Include all ProKerala data with null fallbacks for undefined values
        nakshatra: kundliData.nakshatra || null,
        chandra_rasi: kundliData.chandra_rasi || null,
        soorya_rasi: kundliData.soorya_rasi || null,
        zodiac: kundliData.zodiac || null,
        additional_info: kundliData.additional_info || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

                    // Store in Firestore
              await setDoc(doc(db, 'kundlis', kundliId), kundli);

      return kundli;
    } catch (error) {
      console.error('Error generating and storing Kundli:', error);
      throw error;
    }
  },

  // Get user's Kundli
  async getUserKundli(userId: string): Promise<Kundli | null> {
    try {
      const kundlisRef = collection(db, 'kundlis');
      const q = query(kundlisRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      // Return the most recent Kundli
      const kundlis = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore timestamps to Date objects
        return {
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt)
        } as Kundli;
      });
      return kundlis.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    } catch (error) {
      console.error('Error getting user Kundli:', error);
      throw error;
    }
  },

  // Get all user's Kundlis
  async getUserKundlis(userId: string): Promise<Kundli[]> {
    try {
      const kundlisRef = collection(db, 'kundlis');
      const q = query(kundlisRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore timestamps to Date objects
        return {
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt)
        } as Kundli;
      });
    } catch (error) {
      console.error('Error getting user Kundlis:', error);
      throw error;
    }
  },

  // Update Kundli
  async updateKundli(kundliId: string, updates: Partial<Kundli>): Promise<void> {
    try {
      const kundliRef = doc(db, 'kundlis', kundliId);
      await updateDoc(kundliRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating Kundli:', error);
      throw error;
    }
  },

  // Delete Kundli
  async deleteKundli(kundliId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'kundlis', kundliId));
    } catch (error) {
      console.error('Error deleting Kundli:', error);
      throw error;
    }
  },

  // Check if user has existing Kundli
  async hasExistingKundli(userId: string): Promise<boolean> {
    try {
      console.log('Checking for existing Kundli for user:', userId);
      const kundli = await this.getUserKundli(userId);
      console.log('Found Kundli:', kundli ? 'Yes' : 'No');
      return kundli !== null;
    } catch (error) {
      console.error('Error checking existing Kundli:', error);
      return false;
    }
  },

  // Get Kundli by ID
  async getKundliById(kundliId: string): Promise<Kundli | null> {
    try {
      const kundliDoc = await getDoc(doc(db, 'kundlis', kundliId));
      
      if (kundliDoc.exists()) {
        const data = kundliDoc.data();
        // Convert Firestore timestamps to Date objects
        return {
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt)
        } as Kundli;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting Kundli by ID:', error);
      throw error;
    }
  },
};
