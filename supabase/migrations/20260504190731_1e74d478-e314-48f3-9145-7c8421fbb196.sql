
-- 1. User follows table
CREATE TABLE public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view follows"
  ON public.user_follows FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.user_follows FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow"
  ON public.user_follows FOR DELETE TO authenticated
  USING (follower_id = auth.uid());

CREATE INDEX idx_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_follows_following ON public.user_follows(following_id);

-- 2. Activity feed table
CREATE TABLE public.activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL DEFAULT 'general',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view activity"
  ON public.activity_feed FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create own activity"
  ON public.activity_feed FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_activity_user ON public.activity_feed(user_id);
CREATE INDEX idx_activity_created ON public.activity_feed(created_at DESC);

-- 3. Update profiles policy so all authenticated users can view profiles (for leaderboard)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Enable realtime for activity_feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
