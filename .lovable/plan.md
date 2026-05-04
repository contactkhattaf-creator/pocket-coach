
## Plan: Social System + UI Improvements

### 1. Database: Social Tables
Create migration for:
- **user_follows** — follower/following relationships (follower_id, following_id, created_at) with RLS
- **user_likes** — likes on profiles/content (user_id, target_user_id, created_at) with RLS
- **activity_feed** — feed entries (user_id, action_type, target_user_id, metadata, created_at) with RLS

Profiles table already has badges, fds_score, avatar_url, full_name, bio — sufficient for social profiles.

### 2. Social Route: `/dashboard/social`
New page with:
- **Leaderboard** — top users by FDS score (public profiles)
- **Follow/unfollow** buttons with smooth animations
- **User cards** showing avatar, name, FDS score, badges, follower count
- **Activity feed** showing followed users' achievements
- **Search users** functionality

### 3. Friends Updates Card on Dashboard
Add a card in the dashboard right sidebar showing:
- Recent activity from followed users (score changes, new badges)
- Styled like the reference image with modern bento-grid cards

### 4. Font Change
Replace `Fraunces` with `Nunito Sans` (clean geometric, Avenir-like) for the display font across the app.

### 5. Landing Page Social Section
Add a new section between Features and Showcase highlighting:
- "Connect & Compete" — follow friends, leaderboard, badges
- Bento-grid layout inspired by the uploaded reference image
- Neon-green accent card + dark cards with icons

### 6. Dark/Light Mode Toggle
- Add light mode CSS variables in `:root` with `.dark` variant
- Add toggle button in dashboard header and landing page
- Store preference in localStorage
- Light mode: white/gray backgrounds, dark text
- Dark mode: current dark violet theme (default)

### Technical Details

**Migration SQL:**
```sql
CREATE TABLE user_follows (follower_id uuid, following_id uuid, created_at timestamptz)
CREATE TABLE activity_feed (user_id uuid, action text, metadata jsonb, created_at timestamptz)
```
With RLS policies for authenticated users.

**New files:**
- `src/routes/dashboard/social.tsx` — social/leaderboard page
- `src/components/dashboard/ThemeToggle.tsx` — dark/light toggle

**Modified files:**
- `src/styles.css` — light mode variables, font change
- `src/routes/__root.tsx` — font link update
- `src/routes/index.tsx` — add social section on landing
- `src/routes/dashboard/index.tsx` — friends updates card
- `src/components/dashboard/DashboardSidebar.tsx` — add social nav item + theme toggle
- `src/components/landing/Header.tsx` — theme toggle on landing

**RLS:** Users can follow/unfollow freely. Activity feed visible to followers. Profiles SELECT open to all authenticated users for leaderboard.
