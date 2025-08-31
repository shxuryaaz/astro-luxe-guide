export interface QuestionCategory {
  id: string
  title: string
  description: string
  icon: string
  gradient: string
  questions: Question[]
}

export interface Question {
  id: string
  text: string
  description: string
  keywords: string[]
}

export const questionCategories: QuestionCategory[] = [
  {
    id: "career",
    title: "Career",
    description: "Professional growth, job changes, business ventures",
    icon: "Briefcase",
    gradient: "bg-cosmic",
    questions: [
      {
        id: "career_1",
        text: "What is the best career path for me?",
        description: "Discover your ideal profession based on your planetary strengths",
        keywords: ["career", "profession", "job", "work", "vocation"]
      },
      {
        id: "career_2",
        text: "When is the best time to change jobs?",
        description: "Find the most auspicious timing for career transitions",
        keywords: ["job change", "career transition", "timing", "opportunity"]
      },
      {
        id: "career_3",
        text: "Will my business venture be successful?",
        description: "Analyze the potential success of your entrepreneurial dreams",
        keywords: ["business", "entrepreneurship", "success", "venture"]
      },
      {
        id: "career_4",
        text: "How can I improve my professional skills?",
        description: "Identify areas for skill development and growth",
        keywords: ["skills", "development", "learning", "improvement"]
      }
    ]
  },
  {
    id: "marriage",
    title: "Marriage & Love",
    description: "Relationships, marriage timing, partner compatibility",
    icon: "Heart",
    gradient: "bg-stardust",
    questions: [
      {
        id: "marriage_1",
        text: "When will I get married?",
        description: "Discover the timing of your marriage based on planetary positions",
        keywords: ["marriage", "wedding", "timing", "romance"]
      },
      {
        id: "marriage_2",
        text: "What qualities should I look for in a partner?",
        description: "Understand the ideal characteristics of your life partner",
        keywords: ["partner", "qualities", "compatibility", "relationship"]
      },
      {
        id: "marriage_3",
        text: "Is my current relationship compatible?",
        description: "Analyze the compatibility of your current relationship",
        keywords: ["compatibility", "relationship", "current", "partner"]
      },
      {
        id: "marriage_4",
        text: "How can I attract true love?",
        description: "Learn how to attract and maintain meaningful relationships",
        keywords: ["love", "attraction", "romance", "relationships"]
      }
    ]
  },
  {
    id: "health",
    title: "Health",
    description: "Physical wellness, mental health, healing guidance",
    icon: "Shield",
    gradient: "bg-aurora",
    questions: [
      {
        id: "health_1",
        text: "What health issues should I be aware of?",
        description: "Identify potential health concerns and preventive measures",
        keywords: ["health", "wellness", "prevention", "medical"]
      },
      {
        id: "health_2",
        text: "How can I improve my mental health?",
        description: "Find ways to enhance your mental and emotional well-being",
        keywords: ["mental health", "emotional", "wellness", "mind"]
      },
      {
        id: "health_3",
        text: "What is the best time for medical procedures?",
        description: "Choose auspicious timing for medical treatments",
        keywords: ["medical", "procedures", "timing", "treatment"]
      },
      {
        id: "health_4",
        text: "How can I maintain good health?",
        description: "Discover lifestyle practices for optimal health",
        keywords: ["lifestyle", "wellness", "maintenance", "health"]
      }
    ]
  },
  {
    id: "education",
    title: "Education",
    description: "Academic pursuits, learning paths, skill development",
    icon: "GraduationCap",
    gradient: "bg-nebula",
    questions: [
      {
        id: "education_1",
        text: "What field of study is best for me?",
        description: "Identify the most suitable academic path for your success",
        keywords: ["education", "study", "academic", "field"]
      },
      {
        id: "education_2",
        text: "When is the best time to pursue higher education?",
        description: "Find the optimal timing for educational advancement",
        keywords: ["higher education", "timing", "academic", "advancement"]
      },
      {
        id: "education_3",
        text: "How can I improve my learning abilities?",
        description: "Enhance your cognitive and learning capabilities",
        keywords: ["learning", "abilities", "cognitive", "improvement"]
      },
      {
        id: "education_4",
        text: "Will my academic pursuits be successful?",
        description: "Analyze the success potential of your educational goals",
        keywords: ["academic", "success", "pursuits", "goals"]
      }
    ]
  },
  {
    id: "finance",
    title: "Finance",
    description: "Wealth, investments, financial stability",
    icon: "DollarSign",
    gradient: "bg-cosmic",
    questions: [
      {
        id: "finance_1",
        text: "How can I improve my financial situation?",
        description: "Discover ways to enhance your wealth and prosperity",
        keywords: ["finance", "wealth", "prosperity", "money"]
      },
      {
        id: "finance_2",
        text: "What are the best investment opportunities for me?",
        description: "Identify profitable investment avenues based on your chart",
        keywords: ["investment", "opportunities", "profit", "wealth"]
      },
      {
        id: "finance_3",
        text: "When will I achieve financial stability?",
        description: "Understand the timing of financial success and stability",
        keywords: ["financial stability", "timing", "success", "wealth"]
      },
      {
        id: "finance_4",
        text: "How can I attract wealth and abundance?",
        description: "Learn techniques to attract prosperity and abundance",
        keywords: ["abundance", "prosperity", "attraction", "wealth"]
      }
    ]
  },
  {
    id: "travel",
    title: "Travel",
    description: "Journeys, relocations, foreign opportunities",
    icon: "Plane",
    gradient: "bg-stardust",
    questions: [
      {
        id: "travel_1",
        text: "Is this a good time for travel?",
        description: "Determine the auspicious timing for journeys and trips",
        keywords: ["travel", "journey", "timing", "trip"]
      },
      {
        id: "travel_2",
        text: "Should I relocate to a different place?",
        description: "Analyze the benefits of relocation and new environments",
        keywords: ["relocation", "move", "place", "environment"]
      },
      {
        id: "travel_3",
        text: "What are the best destinations for me?",
        description: "Identify favorable travel destinations and locations",
        keywords: ["destinations", "locations", "travel", "places"]
      },
      {
        id: "travel_4",
        text: "Will I have opportunities abroad?",
        description: "Explore international opportunities and foreign connections",
        keywords: ["abroad", "international", "foreign", "opportunities"]
      }
    ]
  }
]

export const getQuestionById = (questionId: string): Question | undefined => {
  for (const category of questionCategories) {
    const question = category.questions.find(q => q.id === questionId)
    if (question) return question
  }
  return undefined
}

export const getCategoryById = (categoryId: string): QuestionCategory | undefined => {
  return questionCategories.find(cat => cat.id === categoryId)
}
