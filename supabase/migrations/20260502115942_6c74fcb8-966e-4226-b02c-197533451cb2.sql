
-- Create the updated_at function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS salary numeric,
ADD COLUMN IF NOT EXISTS salary_frequency text DEFAULT 'monthly';

-- Budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  month integer NOT NULL,
  year integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, month, year)
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own budgets" ON public.budgets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (user_id = auth.uid());

-- Goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  current_amount numeric NOT NULL DEFAULT 0,
  deadline date,
  icon text DEFAULT '🎯',
  color text DEFAULT '#7C3AED',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own goals" ON public.goals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (user_id = auth.uid());

-- Investments table
CREATE TABLE IF NOT EXISTS public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asset_name text NOT NULL,
  ticker text,
  shares numeric NOT NULL DEFAULT 0,
  avg_price numeric NOT NULL DEFAULT 0,
  current_price numeric NOT NULL DEFAULT 0,
  asset_class text DEFAULT 'stocks',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own investments" ON public.investments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own investments" ON public.investments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own investments" ON public.investments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own investments" ON public.investments FOR DELETE USING (user_id = auth.uid());

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  next_date date,
  is_active boolean NOT NULL DEFAULT true,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions FOR DELETE USING (user_id = auth.uid());

-- Bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date,
  category text,
  is_paid boolean NOT NULL DEFAULT false,
  is_negotiable boolean NOT NULL DEFAULT false,
  estimated_savings numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bills" ON public.bills FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own bills" ON public.bills FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own bills" ON public.bills FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own bills" ON public.bills FOR DELETE USING (user_id = auth.uid());

-- Streaks table
CREATE TABLE IF NOT EXISTS public.streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  action_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own streaks" ON public.streaks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own streaks" ON public.streaks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own streaks" ON public.streaks FOR UPDATE USING (user_id = auth.uid());

-- Updated_at triggers
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
