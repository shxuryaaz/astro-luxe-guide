# Astrometry - AI-Powered Astrology App

A modern, beautiful astrology application that combines ancient Vedic wisdom with AI technology to provide personalized astrological readings using the Bhrigu Nandi Nadi (BNN) system.

## 🌟 Features

### ✨ Core Features
- **Secure Authentication** - Supabase Auth with Google OAuth and email/password
- **Kundli Generation** - Real-time birth chart generation using ProKerala API
- **AI-Powered Readings** - BNN (Bhrigu Nandi Nadi) interpretations using OpenAI
- **Question System** - Predefined categories with specific astrological questions
- **PDF Generation** - Download readings as professional PDF documents
- **User History** - Track all questions and readings
- **Responsive Design** - Beautiful cosmic-themed UI with animations

### 🔮 Astrological Systems
- **BNN (Bhrigu Nandi Nadi)** - Primary system for precise predictions
- **Modular Design** - Ready for additional systems (KP, Parashari, Lal Kitab)

### 📱 User Experience
- **Glassmorphism Design** - Modern cosmic aesthetic
- **Framer Motion** - Smooth animations and transitions
- **Real-time Updates** - Live data synchronization
- **Mobile Responsive** - Works perfectly on all devices

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **Framer Motion** - Animation library

### Backend & Services
- **Supabase** - Authentication, database, and real-time features
- **ProKerala API** - Astrological calculations and birth charts
- **OpenAI API** - AI-powered BNN interpretations
- **jsPDF** - PDF generation

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **React Query** - Data fetching and caching

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn** or **bun**
- **Git**

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd astro-luxe-guide
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
bun install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp env.example .env
```

Fill in your environment variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# ProKerala Astrology API
VITE_PROKERALA_API_KEY=your_prokerala_api_key
VITE_PROKERALA_BASE_URL=https://api.prokerala.com/v2/astrology

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_MODEL=gpt-4-turbo-preview

# App Configuration
VITE_APP_NAME=Astro Oracle
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development
```

### 4. BNN PDF Setup (Optional but Recommended)

For the best BNN (Bhrigu Nandi Nadi) readings, place your BNN document in the project root:

```bash
# Place your BNN PDF in the project root
cp /path/to/your/BNN_05_Dec_24.pdf ./BNN_05_Dec_24.pdf
```

**Requirements:**
- Filename must be exactly: `BNN_05_Dec_24.pdf`
- Must be a readable PDF containing Bhrigu Nandi Nadi methodology
- The system will automatically process it when users request BNN readings

**How it works:**
- When users click "Get Reading with BNN", the system automatically loads your PDF
- Processes it into searchable knowledge chunks
- Generates personalized readings based on your specific BNN methodology
- Caches the processed data for faster subsequent readings

**Troubleshooting:**
- **OpenAI API Error**: Make sure your `OPENAI_API_KEY` is set in the `.env` file
- **ChromaDB Error**: Start ChromaDB with `./start-chromadb.sh` or `chroma run --path ./chroma_db`
- **PDF Not Found**: Ensure `BNN_05_Dec_24.pdf` is in the project root directory

See `BNN_SETUP.md` for detailed instructions.

### 5. Set Up Supabase

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Run Database Schema**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the contents of `database-schema.sql`

3. **Configure Authentication**
   - In Supabase dashboard, go to Authentication > Settings
   - Add your domain to allowed redirect URLs
   - Configure Google OAuth (optional)

### 5. Set Up External APIs

#### ProKerala API
1. Sign up at [prokerala.com](https://prokerala.com)
2. Get your API key from the dashboard
3. Add it to your `.env` file

#### OpenAI API
1. Sign up at [openai.com](https://openai.com)
2. Get your API key from the dashboard
3. Add it to your `.env` file

### 6. Start Development Server

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   └── ui/             # shadcn/ui components
├── config/             # Configuration files
│   └── questions.ts    # Predefined questions
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   └── supabase.ts     # Supabase client
├── pages/              # Page components
├── services/           # API services
│   ├── ai.ts           # OpenAI integration
│   ├── history.ts      # Question history
│   ├── kundli.ts       # Kundli management
│   ├── pdf.ts          # PDF generation
│   └── prokerala.ts    # ProKerala API
└── main.tsx            # App entry point
```

## 🔧 Configuration

### Adding New Question Categories

Edit `src/config/questions.ts` to add new question categories:

```typescript
export const questionCategories: QuestionCategory[] = [
  {
    id: "new_category",
    title: "New Category",
    description: "Description of the category",
    icon: "IconName",
    gradient: "bg-cosmic",
    questions: [
      {
        id: "new_question_1",
        text: "Your question text",
        description: "Question description",
        keywords: ["keyword1", "keyword2"]
      }
    ]
  }
];
```

### Adding New Astrological Systems

1. Update the Models page (`src/pages/Models.tsx`)
2. Add system-specific logic in `src/services/ai.ts`
3. Update the AI prompts for the new system

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Add Environment Variables**
   - Go to your Vercel project dashboard
   - Add all environment variables from your `.env` file

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Netlify

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Drag and drop the `dist` folder to Netlify
   - Or connect your GitHub repository

3. **Add Environment Variables**
   - Go to Site settings > Environment variables
   - Add all required environment variables

## 🔒 Security Considerations

- All API keys are stored as environment variables
- Row Level Security (RLS) is enabled on all database tables
- User authentication is handled by Supabase
- No sensitive data is stored in localStorage
- HTTPS is enforced in production

## 📊 Performance Optimization

- **Code Splitting** - Automatic with Vite
- **Image Optimization** - Optimized assets
- **Caching** - React Query for data caching
- **Lazy Loading** - Components loaded on demand
- **Bundle Analysis** - Use `npm run build:analyze`

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 API Documentation

### ProKerala API Integration

The app integrates with ProKerala's astrology API for:
- Birth chart generation
- Planetary positions
- House calculations
- Chart images

### OpenAI Integration

Uses OpenAI's GPT models for:
- BNN (Bhrigu Nandi Nadi) interpretations
- Contextual astrological readings
- Personalized guidance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact support at support@astrooracle.com

## 🙏 Acknowledgments

- **Sage Bhrigu** - Ancient wisdom of BNN system
- **ProKerala** - Astrological calculations API
- **OpenAI** - AI-powered interpretations
- **Supabase** - Backend infrastructure
- **shadcn/ui** - Beautiful UI components

## 🔮 Future Enhancements

- [ ] Additional astrological systems (KP, Parashari, Lal Kitab)
- [ ] Real-time planetary transits
- [ ] Compatibility matching
- [ ] Daily horoscopes
- [ ] Mobile app (React Native)
- [ ] Advanced chart visualizations
- [ ] Multi-language support
- [ ] Voice-guided readings

---

**Made with ❤️ and cosmic energy**
