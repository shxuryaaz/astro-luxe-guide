import { doc, setDoc, getDoc, getDocs, collection, query, where, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface QuestionHistory {
  id: string;
  userId: string;
  questionId: string;
  questionText: string;
  questionCategory: string;
  model: string;
  kundliId: string;
  answer: string;
  createdAt: Date;
  updatedAt: Date;
}

export const historyService = {
  // Store question and answer history
  async storeQuestionHistory(userId: string, data: {
    questionId: string;
    questionText: string;
    questionCategory: string;
    model: string;
    kundliId: string;
    answer: string;
  }): Promise<QuestionHistory> {
    try {
      const historyId = `history_${Date.now()}`;
      const history: QuestionHistory = {
        id: historyId,
        userId,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'question_history', historyId), history);
      return history;
    } catch (error) {
      console.error('Error storing question history:', error);
      throw error;
    }
  },

  // Get user's question history
  async getUserHistory(userId: string): Promise<QuestionHistory[]> {
    try {
      const historyRef = collection(db, 'question_history');
      const q = query(
        historyRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as QuestionHistory);
    } catch (error: any) {
      console.error('Error getting user history:', error);
      // If it's an index error, return empty array for now
      if (error.code === 'failed-precondition' || error.message.includes('index')) {
        console.warn('Firestore index not created yet. Returning empty history.');
        return [];
      }
      throw error;
    }
  },

            // Get recent questions by category
          async getRecentQuestionsByCategory(userId: string, category: string, limitCount: number = 5): Promise<QuestionHistory[]> {
            try {
              const historyRef = collection(db, 'question_history');
              const q = query(
                historyRef,
                where('userId', '==', userId),
                where('questionCategory', '==', category),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
              );
              const querySnapshot = await getDocs(q);

              return querySnapshot.docs.map(doc => doc.data() as QuestionHistory);
            } catch (error: any) {
              console.error('Error getting recent questions by category:', error);
              // If it's an index error, return empty array for now
              if (error.code === 'failed-precondition' || error.message.includes('index')) {
                console.warn('Firestore index not created yet. Returning empty history.');
                return [];
              }
              throw error;
            }
          },

  // Get question history by ID
  async getQuestionHistoryById(historyId: string): Promise<QuestionHistory | null> {
    try {
      const historyDoc = await getDoc(doc(db, 'question_history', historyId));
      
      if (historyDoc.exists()) {
        return historyDoc.data() as QuestionHistory;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting question history by ID:', error);
      throw error;
    }
  },

  // Delete question history
  async deleteQuestionHistory(historyId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'question_history', historyId));
    } catch (error) {
      console.error('Error deleting question history:', error);
      throw error;
    }
  },

  // Get question statistics
  async getQuestionStats(userId: string): Promise<{
    totalQuestions: number;
    questionsByCategory: Record<string, number>;
    recentActivity: QuestionHistory[];
  }> {
    try {
      const history = await this.getUserHistory(userId);
      
      const questionsByCategory = history.reduce((acc, item) => {
        acc[item.questionCategory] = (acc[item.questionCategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalQuestions: history.length,
        questionsByCategory,
        recentActivity: history.slice(0, 5), // Last 5 questions
      };
    } catch (error) {
      console.error('Error getting question stats:', error);
      return {
        totalQuestions: 0,
        questionsByCategory: {},
        recentActivity: [],
      };
    }
  },
};
