## Vision

Transformer Moniq en une vraie app fintech mobile (style Revolut + Duolingo + Stripe). Tout est repensé mobile-first : sur desktop, l'app s'affiche dans une "frame" mobile centrée, sur mobile elle prend tout l'écran. Palette violet élégant, mode clair/sombre, animations fluides, gestes natifs.

---

## Phase 1 — Shell mobile & navigation (fondations)

- Créer `MobileShell` : header sticky + zone scroll + **bottom nav flottante** (5 onglets : Dashboard, Analytics, Community, Goals, Profile).
- Wrapper desktop : sur écran large, l'app s'affiche dans un cadre 390×844 centré (style "device frame") avec fond ambient violet.
- Refondre `DashboardSidebar` → devient `MobileShell` (sidebar masquée sous mobile, supprimée sur la frame mobile).
- Routes restructurées : `/dashboard` (home), `/dashboard/analytics`, `/dashboard/social` (community), `/dashboard/goals`, `/dashboard/profile`. Les routes existantes (bills, budget, scanner, etc.) deviennent accessibles via le Dashboard ou un menu "More".
- Composants réutilisables : `StickyHeader`, `BottomNav`, `FAB` (floating action button), `ScreenTransition` (animation fade/slide entre routes).

## Phase 2 — Design system mobile premium

- Mise à jour `src/styles.css` : tokens violet raffinés, gradients, glassmorphism (`.glass-card`), shadows douces, radius généreux.
- Mode sombre + clair déjà en place — polir les deux.
- Composants partagés : `MobileCard`, `StatCard`, `SwipeableCard`, `SkeletonLoader`, `PullToRefresh`, `BottomSheet`, `Toast` mobile.
- Typographie : titres display, hiérarchie claire, cibles tactiles ≥ 44px.
- Animations : fade-in, slide-up, scale, page transitions via Framer Motion (déjà dispo via `tw-animate-css` + keyframes custom).

## Phase 3 — Dashboard mobile

- En-tête : avatar + salutation + notif bell.
- **Carte balance** principale (gradient violet, animation counter).
- Grille de stats rapides (XP, niveau, streak, badges).
- **AI Insights** : carte avec recommandation personnalisée.
- **Budget tracking** : barres de progression catégories.
- **Recent activity** : timeline scrollable.
- **Monthly goals** : mini-cards swipeables.
- FAB pour scanner/ajouter une transaction.

## Phase 4 — Analytics, Goals, Profile

**Analytics** : charts mobile (Recharts), score de santé financière (gauge), catégories de dépenses (donut), comparaisons semaine/mois (cards), prédictions IA.

**Goals** : liste de goals avec progression animée, milestones interactives, célébration à l'unlock, création via bottom sheet.

**Profile** : avatar large, stats (niveau, XP, badges), achievements grid, settings (notifications, privacy, **dark mode toggle**), accès aux sous-pages (export, subscriptions, bills).

## Phase 5 — Community / Social mobile

Refonte complète de `social.tsx` :
- **Feed** : cartes activité scroll vertical, réactions (like/clap), commentaires en bottom sheet.
- **Discover** : grid de profils suggérés, recherche avec résultats live.
- **Leaderboard** : podium animé top 3 + liste classée.
- **Challenges** : cards de défis publics rejoignables.
- **Profile cards** : modale plein écran avec follow/unfollow, stats, badges.
- **Share achievement** : bottom sheet de partage.

## Phase 6 — Onboarding & Gamification

**Onboarding** (route `/onboarding`) : 4-5 slides swipeables (welcome, fonctionnalités, setup profil financier, sélection d'objectifs, fini), illustrations animées, indicateur de progression, skip.

**Gamification** :
- Animation XP bar (incrément animé).
- **Badge unlock popup** plein écran (confetti + scale).
- **Streak system** : flamme + compteur de jours.
- **Daily challenges** : carte sur le dashboard.
- **Level up** : célébration animée.
- Tout déclenchable côté client pour démo (pas de backend supplémentaire dans cette phase).

---

## Section technique

**Stack** : TanStack Start + React 19 + Tailwind v4. Framer Motion pour transitions (à installer). Recharts déjà dispo. Supabase déjà connecté pour social/follows/profiles.

**Fichiers clés à créer** :
- `src/components/mobile/MobileShell.tsx`, `BottomNav.tsx`, `StickyHeader.tsx`, `FAB.tsx`, `BottomSheet.tsx`, `SwipeableCard.tsx`, `PullToRefresh.tsx`, `SkeletonLoader.tsx`, `ScreenTransition.tsx`, `DeviceFrame.tsx`.
- `src/components/mobile/dashboard/*` : `BalanceCard`, `AIInsightCard`, `BudgetTracker`, `ActivityTimeline`, `GoalsCarousel`, `GamificationStats`.
- `src/components/mobile/gamification/*` : `XPBar`, `BadgeUnlockModal`, `StreakIndicator`, `LevelUpModal`, `AchievementCard`.
- `src/components/mobile/social/*` : `FeedCard`, `ProfileCard`, `LeaderboardPodium`, `ChallengeCard`, `CommentsSheet`.
- `src/routes/onboarding.tsx`, `src/routes/dashboard/analytics.tsx` (nouveau), refonte de `dashboard/index.tsx`, `dashboard/social.tsx`, `dashboard/goals.tsx`, `dashboard/profile.tsx`.

**Pas de changement DB** dans ce chantier — on réutilise les tables `profiles`, `user_follows`, `user_xp` existantes. Les animations gamification sont déclenchées localement.

**Routes existantes préservées** : bills, budget, scanner, transactions, subscriptions, etc. restent accessibles depuis le dashboard ou un écran "More".

---

## Livraison

J'exécute les 6 phases en séquence dans cette même conversation, en validant chaque phase avec un build propre. À la fin tu auras une app qui ressemble à une vraie native sur mobile, et une frame élégante sur desktop.