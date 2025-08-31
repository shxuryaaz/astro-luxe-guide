# 🚀 Quick Setup Guide - Astro Oracle

## ⚡ Get Started in 5 Minutes

### 1. Environment Setup
```bash
# Copy environment template
cp env.example .env
```

### 2. Required API Keys

You need to get these API keys and add them to your `.env` file:

#### 🔑 Supabase (Free Tier)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key
4. Add to `.env`:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

#### 🔑 ProKerala API (Free Tier Available)
1. Go to [prokerala.com](https://prokerala.com)
2. Sign up for an account
3. Get your API key
4. Add to `.env`:
   ```
   VITE_PROKERALA_API_KEY=your_api_key
   ```

#### 🔑 OpenAI API (Paid)
1. Go to [openai.com](https://openai.com)
2. Create an account and add billing
3. Get your API key
4. Add to `.env`:
   ```
   VITE_OPENAI_API_KEY=your_api_key
   ```

### 3. Database Setup
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database-schema.sql`
4. Click "Run" to create all tables

### 4. Start the App
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

## 🎯 What's Working Now

✅ **Authentication** - Sign up/login with email or Google  
✅ **Kundli Generation** - Create birth charts with ProKerala API  
✅ **Question System** - Ask predefined astrological questions  
✅ **AI Readings** - Get BNN interpretations with OpenAI  
✅ **PDF Downloads** - Download readings as PDFs  
✅ **User History** - Track all your questions and readings  
✅ **Beautiful UI** - Cosmic-themed design with animations  

## 🔧 For Development

### Test Without OpenAI (Demo Mode)
If you don't want to set up OpenAI right away, the app will show demo readings.

### Test Without ProKerala
The app includes fallback data for testing the UI.

### Add Your BNN PDF
1. Place your BNN PDF in the project
2. Update the AI service to use it for context
3. The system is designed to be modular for this

## 🚀 Next Steps

1. **Customize Questions** - Edit `src/config/questions.ts`
2. **Add Your BNN PDF** - Integrate with vector database
3. **Deploy** - Use Vercel or Netlify
4. **Add More Systems** - KP, Parashari, Lal Kitab

## 🆘 Common Issues

### "Missing Supabase environment variables"
- Make sure your `.env` file has the correct Supabase URL and key

### "ProKerala API error"
- Check your API key is correct
- Verify your ProKerala account is active

### "OpenAI API error"
- Ensure you have billing set up on OpenAI
- Check your API key is valid

### "Database connection error"
- Run the SQL schema in Supabase
- Check your Supabase project is active

## 📞 Need Help?

1. Check the full [README.md](README.md)
2. Look at the code comments
3. Create an issue in the repository

---

**The app is now fully functional! 🌟**
