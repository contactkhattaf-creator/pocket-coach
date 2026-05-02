
# Moniq Complete Rebuild Plan

This is a large-scale rebuild covering design, database, and 10+ feature pages. I'll implement it in phases across multiple messages.

## Phase 1 — Foundation (this message)
- **Dark theme design system** inspired by the Hynex screenshot: dark backgrounds, card-based layout, violet accents
- **New logo** using the symbol icon from the uploaded branding sheet
- **Updated registration form** with personal info (full name, age, phone) and financial info (salary, salary frequency, currency)
- **Sidebar layout** with all 9 navigation items: Dashboard, Transactions, Budget, Goals, Investments, Subscriptions, Bills, AI Assistant, Settings
- **Database migrations** for new tables: budgets, goals, investments, subscriptions, bills, streaks

## Phase 2 — Core Pages
- **Dashboard** redesign: net worth hero card, spending vs income bar chart (Recharts), quick stats row, recent transactions, upcoming bills widget
- **Transactions** page: full table with search/filter, add/edit/delete modal, color-coded category chips
- **Budget** page: category progress bars, remaining vs spent, donut chart

## Phase 3 — Feature Pages
- **Goals**: goal cards with circular SVG progress rings, milestone celebration
- **Streak Calendar**: GitHub-style heatmap, streak counter, hover tooltips
- **Investments**: portfolio overview, holdings table with sparklines, allocation donut

## Phase 4 — Advanced Features
- **Subscriptions Tracker**: recurring list, monthly total, cancel risk badges
- **Bills**: upcoming bills list, negotiation CTA modals
- **AI Assistant**: slide-in chat panel with typewriter animation, suggested prompts
- **Receipt Scanner**: camera/upload interface to extract transaction data
- **Settings**: profile editing, preferences
- **PDF/CSV Export**: monthly summary export
- **SMS Import**: paste SMS to auto-create transactions

## Database Changes (Phase 1)
New tables needed:
- `budgets` — user_id, category_id, amount, month, year
- `goals` — user_id, name, target_amount, current_amount, deadline, icon
- `investments` — user_id, asset_name, ticker, shares, avg_price, asset_class
- `subscriptions` — user_id, name, amount, billing_cycle, next_date, is_active
- `bills` — user_id, name, amount, due_date, category, is_negotiable
- `streaks` — user_id, date, action_count
- Update `profiles` to add age, phone, salary, salary_frequency

## Design Direction
- **Dark mode** primary (deep navy/charcoal like the Hynex screenshot)
- **Violet accent** (#7C3AED range) for highlights, badges, active states
- **Card-based layout** with subtle borders and glassmorphism
- **Green for positive** values, **red for negative**
- Rounded corners, smooth transitions
- Collapsible sidebar with icon-only mode

## Tech Stack Additions
- `recharts` for charts (bar, line, donut, sparklines)
- GSAP kept for animations

I'll start with Phase 1 now and continue in subsequent messages. Ready to proceed?
