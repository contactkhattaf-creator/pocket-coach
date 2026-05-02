
-- Add financial profile columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS financial_profile_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fds_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL DEFAULT 30,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  progress JSONB DEFAULT '[]',
  reward_badge TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges" ON public.challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own challenges" ON public.challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON public.challenges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own challenges" ON public.challenges FOR DELETE USING (auth.uid() = user_id);

-- Create micro_objectives table
CREATE TABLE public.micro_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  category TEXT DEFAULT 'general',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.micro_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own micro_objectives" ON public.micro_objectives FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own micro_objectives" ON public.micro_objectives FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own micro_objectives" ON public.micro_objectives FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own micro_objectives" ON public.micro_objectives FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON public.challenges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_micro_objectives_updated_at BEFORE UPDATE ON public.micro_objectives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
