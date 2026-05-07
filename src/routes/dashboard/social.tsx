import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import {
  Users,
  UserPlus,
  UserMinus,
  Crown,
  Medal,
  Award,
  Search,
  TrendingUp,
  Star,
  Sparkles,
  Shield,
  Activity,
  Share2,
  Copy,
  Check,
  Gift,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/social")({
  component: SocialPage,
});

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  fds_score: number;
  badges: string[];
  bio: string | null;
  financial_profile_type: string | null;
}

interface FollowRecord {
  follower_id: string;
  following_id: string;
}

interface ActivityItem {
  id: string;
  user_id: string;
  action_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

function SocialPage() {
  const { user } = useDashboard();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [follows, setFollows] = useState<FollowRecord[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"leaderboard" | "following" | "feed">("leaderboard");
  const [animatingFollow, setAnimatingFollow] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const inviteLink = typeof window !== "undefined" ? `${window.location.origin}/register?ref=${user?.id?.slice(0, 8) || ""}` : "";

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link. Please copy it manually.");
    }
  }

  async function handleInvite() {
    setSharing(true);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "Join me on Monique",
          text: "Track your finances, earn badges, and compete with friends on Monique!",
          url: inviteLink,
        });
        toast.success("Invite shared!");
        return;
      }
      await copyToClipboard();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (!msg.includes("abort") && !msg.includes("cancel")) {
        toast.error("Sharing failed. The link has been copied instead.");
        try { await navigator.clipboard.writeText(inviteLink); } catch { /* ignore */ }
      }
    } finally {
      setSharing(false);
    }
  }

  const loadData = useCallback(async () => {
    if (!user) return;
    const [profRes, followRes, actRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url, fds_score, badges, bio, financial_profile_type").order("fds_score", { ascending: false }).limit(50),
      supabase.from("user_follows").select("follower_id, following_id"),
      supabase.from("activity_feed").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    console.log("Social Hub loadData:", { profData: profRes.data?.length, profError: profRes.error, followError: followRes.error, actError: actRes.error, userId: user?.id });
    if (profRes.error) { console.error("Profiles query error:", profRes.error); toast.error("Failed to load profiles"); }
    if (followRes.error) { console.error("Follows query error:", followRes.error); }
    if (actRes.error) { console.error("Activity query error:", actRes.error); }
    if (profRes.data) setProfiles(profRes.data.map(p => ({ ...p, badges: (p.badges as string[]) || [], fds_score: p.fds_score || 0 })) as UserProfile[]);
    if (followRes.data) setFollows(followRes.data as FollowRecord[]);
    if (actRes.data) setActivities(actRes.data as ActivityItem[]);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const myFollowing = follows.filter(f => f.follower_id === user?.id).map(f => f.following_id);
  const myFollowers = follows.filter(f => f.following_id === user?.id).map(f => f.follower_id);

  const isFollowing = (uid: string) => myFollowing.includes(uid);

  async function toggleFollow(targetId: string) {
    if (!user) return;
    setAnimatingFollow(targetId);
    if (isFollowing(targetId)) {
      await supabase.from("user_follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
    } else {
      await supabase.from("user_follows").insert({ follower_id: user.id, following_id: targetId });
      // Post activity
      await supabase.from("activity_feed").insert({
        user_id: user.id,
        action_type: "followed_user",
        metadata: { target_user_id: targetId },
      });
    }
    await loadData();
    setTimeout(() => setAnimatingFollow(null), 500);
  }

  const getFollowerCount = (uid: string) => follows.filter(f => f.following_id === uid).length;
  const getFollowingCount = (uid: string) => follows.filter(f => f.follower_id === uid).length;

  const filteredProfiles = profiles.filter(p =>
    p.id !== user?.id &&
    (search === "" || (p.full_name || "").toLowerCase().includes(search.toLowerCase()))
  );

  const followingProfiles = filteredProfiles.filter(p => isFollowing(p.id));
  const leaderboard = [...filteredProfiles].sort((a, b) => b.fds_score - a.fds_score);

  const feedActivities = activities.filter(a => myFollowing.includes(a.user_id));

  const getInitials = (name: string | null) => name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";

  const getRankIcon = (i: number) => {
    if (i === 0) return <Crown className="h-5 w-5 text-[#FFD700]" />;
    if (i === 1) return <Medal className="h-5 w-5 text-[#C0C0C0]" />;
    if (i === 2) return <Medal className="h-5 w-5 text-[#CD7F32]" />;
    return <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>;
  };

  const getProfileById = (id: string) => profiles.find(p => p.id === id);

  const getActivityText = (a: ActivityItem) => {
    const profile = getProfileById(a.user_id);
    const name = profile?.full_name || "Someone";
    switch (a.action_type) {
      case "followed_user": return `${name} followed a user`;
      case "badge_earned": return `${name} earned a new badge: ${(a.metadata as Record<string, string>).badge || ""}`;
      case "score_updated": return `${name}'s score changed to ${(a.metadata as Record<string, number>).score || 0}`;
      case "goal_completed": return `${name} completed a savings goal`;
      default: return `${name} was active`;
    }
  };

  const myProfile = profiles.find(p => p.id === user?.id);
  const myRank = leaderboard.findIndex(p => p.id === user?.id) + 1;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Social Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">Connect, compete, and grow with the community</p>
      </div>

      {/* My stats row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Your Rank", value: myRank > 0 ? `#${myRank}` : "-", icon: TrendingUp, color: "#FFD700" },
          { label: "FDS Score", value: myProfile?.fds_score || 0, icon: Star, color: "#D4B8FF" },
          { label: "Followers", value: myFollowers.length, icon: Users, color: "#C8F7C5" },
          { label: "Following", value: myFollowing.length, icon: UserPlus, color: "#06B6D4" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${s.color}20` }}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Friends */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-violet-bright/20 via-card to-[#C8F7C5]/10 p-5 ring-1 ring-violet-bright/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-bright/20">
              <Gift className="h-6 w-6 text-violet-bright" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">Invite Your Friends</h3>
              <p className="text-sm text-muted-foreground">Share Monique and grow your circle. Compete together!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 ring-1 ring-border">
              <span className="text-xs text-muted-foreground truncate max-w-[180px]">{inviteLink}</span>
              <button
                onClick={copyToClipboard}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-hover text-muted-foreground transition hover:text-foreground"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#C8F7C5]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <button
              onClick={handleInvite}
              disabled={sharing}
              className="flex items-center gap-2 rounded-xl bg-violet-bright px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-bright/80 disabled:opacity-60"
            >
              {sharing ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {sharing ? "Sharing..." : "Share"}
            </button>
          </div>
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright/50 placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-surface p-1">
          {(["leaderboard", "following", "feed"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold capitalize transition-all ${
                tab === t ? "bg-violet-bright text-white shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      {tab === "leaderboard" && (
        <div className="space-y-3">
          {/* Top 3 podium */}
          {leaderboard.length >= 3 && (
            <div className="mb-6 grid grid-cols-3 gap-4">
              {[1, 0, 2].map(idx => {
                const p = leaderboard[idx];
                if (!p) return null;
                const isCenter = idx === 0;
                return (
                  <div
                    key={p.id}
                    className={`flex flex-col items-center rounded-2xl p-5 ring-1 ring-border transition-all ${
                      isCenter ? "bg-gradient-to-b from-[#FFD700]/15 to-card scale-105 ring-[#FFD700]/30" : "bg-card"
                    }`}
                  >
                    <div className="mb-2">{getRankIcon(idx)}</div>
                    <div className={`grid place-items-center overflow-hidden rounded-full ring-2 ${
                      isCenter ? "h-16 w-16 ring-[#FFD700]/50" : "h-12 w-12 ring-border"
                    } bg-violet-bright/15`}>
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-violet-bright">{getInitials(p.full_name)}</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-bold text-foreground truncate max-w-full">{p.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{p.fds_score} pts</p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Users className="h-3 w-3" /> {getFollowerCount(p.id)}
                    </div>
                    <button
                      onClick={() => toggleFollow(p.id)}
                      className={`mt-3 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-semibold transition-all duration-300 ${
                        animatingFollow === p.id ? "scale-110" : ""
                      } ${
                        isFollowing(p.id)
                          ? "bg-surface text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                          : "bg-violet-bright text-white hover:bg-violet-bright/80"
                      }`}
                    >
                      {isFollowing(p.id) ? <><UserMinus className="h-3 w-3" /> Unfollow</> : <><UserPlus className="h-3 w-3" /> Follow</>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest of leaderboard */}
          {leaderboard.slice(3).map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-border transition-all hover:ring-violet-bright/20">
              <div className="w-8 text-center">{getRankIcon(i + 3)}</div>
              <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-bright/15 ring-1 ring-border">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-violet-bright">{getInitials(p.full_name)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{p.full_name || "User"}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{p.fds_score} pts</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{getFollowerCount(p.id)}</span>
                  {p.badges.length > 0 && <span className="flex items-center gap-1"><Award className="h-3 w-3" />{p.badges.length}</span>}
                </div>
              </div>
              <button
                onClick={() => toggleFollow(p.id)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                  animatingFollow === p.id ? "scale-110" : ""
                } ${
                  isFollowing(p.id)
                    ? "bg-surface text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                    : "bg-violet-bright text-white hover:bg-violet-bright/80"
                }`}
              >
                {isFollowing(p.id) ? <><UserMinus className="h-3.5 w-3.5" /> Unfollow</> : <><UserPlus className="h-3.5 w-3.5" /> Follow</>}
              </button>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="py-16 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No other users yet. Invite friends to join!</p>
            </div>
          )}
        </div>
      )}

      {/* Following tab */}
      {tab === "following" && (
        <div className="space-y-3">
          {followingProfiles.length === 0 ? (
            <div className="py-16 text-center">
              <UserPlus className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">You're not following anyone yet. Check the leaderboard!</p>
            </div>
          ) : (
            followingProfiles.map(p => (
              <div key={p.id} className="flex items-center gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-bright/15 ring-2 ring-violet-bright/30">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-violet-bright">{getInitials(p.full_name)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">{p.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{p.bio || "No bio yet"}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-[#FFD700]" />{p.fds_score} pts</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{getFollowerCount(p.id)} followers</span>
                    {p.badges.length > 0 && <span className="flex items-center gap-1"><Shield className="h-3 w-3" />{p.badges.length} badges</span>}
                  </div>
                </div>
                <button
                  onClick={() => toggleFollow(p.id)}
                  className="flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
                >
                  <UserMinus className="h-3.5 w-3.5" /> Unfollow
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Activity Feed */}
      {tab === "feed" && (
        <div className="space-y-3">
          {feedActivities.length === 0 ? (
            <div className="py-16 text-center">
              <Activity className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No activity from people you follow yet</p>
            </div>
          ) : (
            feedActivities.map(a => {
              const profile = getProfileById(a.user_id);
              return (
                <div key={a.id} className="flex gap-4 rounded-2xl bg-card p-4 ring-1 ring-border">
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-bright/15">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-violet-bright">{getInitials(profile?.full_name || null)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{getActivityText(a)}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <Sparkles className="h-4 w-4 text-violet-bright/40 shrink-0 mt-1" />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
