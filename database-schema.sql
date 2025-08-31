-- Database Schema for Astro Oracle App
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    zodiac_sign TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kundlis table
CREATE TABLE IF NOT EXISTS public.kundlis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    time_of_birth TIME NOT NULL,
    place_of_birth TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    chart_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create question_history table
CREATE TABLE IF NOT EXISTS public.question_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    kundli_id UUID REFERENCES public.kundlis(id) ON DELETE CASCADE NOT NULL,
    question_category TEXT NOT NULL,
    model_used TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kundlis_user_id ON public.kundlis(user_id);
CREATE INDEX IF NOT EXISTS idx_kundlis_created_at ON public.kundlis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_history_user_id ON public.question_history(user_id);
CREATE INDEX IF NOT EXISTS idx_question_history_kundli_id ON public.question_history(kundli_id);
CREATE INDEX IF NOT EXISTS idx_question_history_created_at ON public.question_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_history_category ON public.question_history(question_category);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kundlis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for kundlis table
CREATE POLICY "Users can view own kundlis" ON public.kundlis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kundlis" ON public.kundlis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own kundlis" ON public.kundlis
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own kundlis" ON public.kundlis
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for question_history table
CREATE POLICY "Users can view own question history" ON public.question_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question history" ON public.question_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own question history" ON public.question_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kundlis_updated_at
    BEFORE UPDATE ON public.kundlis
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.kundlis TO anon, authenticated;
GRANT ALL ON public.question_history TO anon, authenticated;
GRANT USAGE ON SEQUENCE public.kundlis_id_seq TO anon, authenticated;
GRANT USAGE ON SEQUENCE public.question_history_id_seq TO anon, authenticated;

-- Create view for user statistics
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(DISTINCT k.id) as kundli_count,
    COUNT(qh.id) as question_count,
    MAX(qh.created_at) as last_question_date
FROM public.users u
LEFT JOIN public.kundlis k ON u.id = k.user_id
LEFT JOIN public.question_history qh ON u.id = qh.user_id
GROUP BY u.id, u.name, u.email;

-- Grant access to the view
GRANT SELECT ON public.user_stats TO anon, authenticated;
