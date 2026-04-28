import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Header } from "@/components/landing/Header";
import { PhoneDashboard } from "@/components/landing/PhoneDashboard";
import { Squiggle, Star, Blob } from "@/components/landing/Squiggle";
import collage1 from "@/assets/collage-1.jpg";
import collage2 from "@/assets/collage-2.jpg";
import heroCollage from "@/assets/hero-collage.jpg";

gsap.registerPlugin(ScrollTrigger);

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
        });
      });
      gsap.utils.toArray<HTMLElement>(".reveal-stagger > *").forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 24 },
          {
            opacity: 1, y: 0, duration: 0.7, delay: i * 0.06, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" },
          });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="min-h-screen overflow-x-clip">
      <Header />
      <Hero />
      <SocialProof />
      <Problem />
      <Solution />
      <Features />
      <Showcase />
      <HowItWorks />
      <AIDifferentiator />
      <Benefits />
      <CTA />
      <FAQ />
      <Footer />
    </div>
  );

  // ───────── HERO
  function Hero() {
    return (
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* squiggle decor */}
        <Squiggle className="absolute left-8 top-28 h-6 w-32 text-violet-bright/60" />
        <Star className="absolute right-12 top-36 h-6 w-6 text-magenta float-slow" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-4 py-1.5 text-xs font-semibold text-ink/80 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-mint pulse-dot" /> AI money coach · now in beta
            </div>
            <h1 className="reveal mt-6 font-display text-5xl font-bold leading-[0.95] text-ink sm:text-6xl lg:text-[5.5rem]">
              Money that <br className="hidden sm:block" />
              <span className="relative inline-block">
                makes sense.
                <Squiggle className="absolute -bottom-3 left-0 h-3 w-full text-violet-bright" />
              </span>
            </h1>
            <p className="reveal mt-6 max-w-xl text-lg text-ink/70">
              Sage tracks every dirham, decodes your spending personality, and turns saving into a daily streak.
              An AI coach in your pocket — built for students and young pros.
            </p>
            <div className="reveal mt-8 flex flex-wrap items-center gap-3">
              <a href="#cta" className="pill-btn">Download free →</a>
              <a href="#how" className="pill-btn-ghost">See how it works</a>
            </div>
            <div className="reveal mt-10 flex items-center gap-6 text-sm text-ink/60">
              <div className="flex -space-x-2">
                {["#a78bfa","#f472b6","#34d399","#fbbf24"].map((c) => (
                  <span key={c} className="h-8 w-8 rounded-full ring-2 ring-background" style={{ background: c }} />
                ))}
              </div>
              <p>Loved by <b className="text-ink">12,400+</b> early users</p>
            </div>
          </div>

          <div className="reveal relative lg:col-span-5">
            <div className="absolute -top-8 -left-6 h-40 w-40 rotate-12">
              <Blob className="h-full w-full text-violet-bright/30" />
            </div>
            <PhoneDashboard className="relative z-10" />
            {/* floating sticker cards */}
            <div className="absolute -left-6 top-16 z-20 hidden rotate-[-8deg] rounded-2xl bg-white px-4 py-3 shadow-card ring-1 ring-ink/5 sm:block float-slow">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/50">Saved today</p>
              <p className="font-display text-xl font-bold text-ink">+$24.10</p>
            </div>
            <div className="absolute -right-4 bottom-20 z-20 hidden rotate-[6deg] rounded-2xl bg-cream px-4 py-3 shadow-card ring-1 ring-ink/5 sm:block float-slow" style={{ animationDelay: "1s" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/50">Profile</p>
              <p className="font-display text-base font-bold text-ink">Mindful spender</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ───────── SOCIAL PROOF
  function SocialProof() {
    const logos = ["TechCrunch", "Product Hunt", "FinTech Today", "WIRED", "Forbes 30/30", "The Verge"];
    return (
      <section className="border-y border-ink/5 bg-lavender-soft py-10">
        <p className="reveal mx-auto max-w-7xl px-6 text-center text-xs font-semibold uppercase tracking-[0.3em] text-ink/50">
          Featured in
        </p>
        <div className="mt-6 overflow-hidden">
          <div className="marquee flex w-max gap-16 px-6">
            {[...logos, ...logos].map((l, i) => (
              <span key={i} className="font-display text-2xl font-bold text-ink/40 whitespace-nowrap">{l}</span>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ───────── PROBLEM
  function Problem() {
    const items = [
      { stat: "73%", text: "of students lose track of where their money goes each month." },
      { stat: "1 in 4", text: "young pros say money stress affects their daily focus." },
      { stat: "$1,200", text: "average yearly leak from invisible micro-spending." },
    ];
    return (
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="reveal max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-bright">The problem</p>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">
              Budgets feel like punishment. Apps feel like spreadsheets.
            </h2>
          </div>
          <div className="reveal-stagger mt-14 grid gap-6 md:grid-cols-3">
            {items.map((it) => (
              <div key={it.stat} className="rounded-3xl bg-white p-8 shadow-soft ring-1 ring-ink/5">
                <p className="font-display text-5xl font-bold text-violet-bright">{it.stat}</p>
                <p className="mt-3 text-base text-ink/70">{it.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ───────── SOLUTION (oversized rounded card like reference)
  function Solution() {
    return (
      <section className="px-6 py-16 sm:py-24">
        <div className="reveal mx-auto max-w-7xl rounded-[2.5rem] bg-violet-bright/95 p-10 shadow-card sm:p-16 lg:p-20"
             style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 295) 0%, oklch(0.45 0.18 285) 100%)" }}>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">The Sage way</p>
              <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
                A coach that learns you, not a ledger that judges you.
              </h2>
              <p className="mt-5 max-w-lg text-white/80">
                Sage's AI watches patterns — not just numbers. It nudges you with tiny wins,
                celebrates streaks, and quietly turns better habits into a real Financial Discipline Score.
              </p>
              <ul className="mt-8 space-y-3">
                {["Live spending intelligence", "Personal financial profile", "Micro-goals + 30-day challenges", "Smart save & invest playbooks"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-white">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-violet-bright">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative mx-auto w-full max-w-sm">
              <img src={heroCollage} alt="Young person checking the Sage app" className="rounded-3xl object-cover shadow-card"
                   width={1024} height={1280} loading="lazy" />
              <div className="absolute -bottom-5 -left-5 rotate-[-6deg] rounded-2xl bg-white px-4 py-3 shadow-card">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/50">Streak</p>
                <p className="font-display text-xl font-bold text-ink">14 days 🔥</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ───────── FEATURES
  function Features() {
    const features = [
      { tag: "Track", title: "Every cent, auto-categorized", body: "Add a transaction in 2 taps. Sage learns merchants, splits, and recurring charges automatically.", color: "bg-cream" },
      { tag: "Decode", title: "Your money personality", body: "Are you a mindful spender, a social flamer, or a careful saver? Sage finds your profile in days.", color: "bg-lavender" },
      { tag: "Score", title: "Financial Discipline Score", body: "Not how rich you are — how steady you're getting. A live score that grows with your habits.", color: "bg-mint/40" },
      { tag: "Save", title: "Goals that feel like games", body: "Trip to Lisbon, new laptop, emergency cushion. Sage breaks it into weekly micro-objectives.", color: "bg-white" },
      { tag: "Coach", title: "AI nudges, not noise", body: "One useful message a day. Skip a coffee, hit your goal — the kind of advice a friend would give.", color: "bg-white" },
      { tag: "Grow", title: "Investing, training wheels on", body: "Simulated portfolios from index funds to crypto. Learn the moves before you risk a dirham.", color: "bg-cream" },
    ];
    return (
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="reveal flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-bright">Features</p>
              <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">
                Everything you need to take back the wallet.
              </h2>
            </div>
            <a href="#cta" className="pill-btn-ghost">Try it free</a>
          </div>
          <div className="reveal-stagger mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article key={f.title} className={`group rounded-3xl ${f.color} p-8 shadow-soft ring-1 ring-ink/5 transition-transform duration-300 hover:-translate-y-1`}>
                <span className="inline-block rounded-full bg-ink px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">{f.tag}</span>
                <h3 className="mt-5 font-display text-2xl font-bold text-ink">{f.title}</h3>
                <p className="mt-3 text-ink/70">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ───────── PRODUCT SHOWCASE — big colored card with phone (reference's signature)
  function Showcase() {
    return (
      <section className="px-6 py-16 sm:py-24">
        <div className="reveal mx-auto max-w-7xl rounded-[2.5rem] bg-cream p-10 shadow-card sm:p-16 lg:p-20">
          {/* tabs decoration */}
          <div className="mb-8 flex flex-wrap justify-center gap-3 text-sm font-semibold text-ink/60">
            {["Track", "Coach", "Save", "Invest"].map((t, i) => (
              <span key={t} className={`rounded-full px-4 py-1.5 ${i === 1 ? "bg-ink text-primary-foreground" : ""}`}>{t}</span>
            ))}
          </div>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
                A dashboard that <span className="text-violet-bright">glows</span> with your wins.
              </h2>
              <p className="mt-5 max-w-lg text-ink/70">
                Charts redraw the moment a transaction lands. Color shifts as your discipline score climbs.
                Your phone becomes a living view of your financial health.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4">
                <Stat k="$2.4M" v="tracked weekly" />
                <Stat k="78" v="avg FDS" />
                <Stat k="4.9★" v="App Store" />
              </div>
            </div>
            <div className="relative">
              <PhoneDashboard />
              <Star className="absolute -top-4 right-8 h-8 w-8 text-violet-bright float-slow" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  function Stat({ k, v }: { k: string; v: string }) {
    return (
      <div>
        <p className="font-display text-3xl font-bold text-ink">{k}</p>
        <p className="text-xs uppercase tracking-wider text-ink/50">{v}</p>
      </div>
    );
  }

  // ───────── HOW IT WORKS
  function HowItWorks() {
    const steps = [
      { n: "01", t: "Sign up in 60 seconds", b: "No bank link required. Add income & spending however you want." },
      { n: "02", t: "Sage learns your patterns", b: "In a week, our AI maps your habits and finds your money personality." },
      { n: "03", t: "Get a daily nudge", b: "One smart insight, one micro-goal. Repeat. Watch the score climb." },
    ];
    return (
      <section id="how" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="reveal mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-bright">How it works</p>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">
              Three steps to a smarter wallet.
            </h2>
          </div>
          <div className="reveal-stagger mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-3xl bg-white p-8 shadow-soft ring-1 ring-ink/5">
                <span className="font-display text-6xl font-bold text-violet-bright/25">{s.n}</span>
                <h3 className="mt-2 font-display text-2xl font-bold text-ink">{s.t}</h3>
                <p className="mt-3 text-ink/70">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ───────── AI DIFFERENTIATOR — dark band
  function AIDifferentiator() {
    return (
      <section id="ai" className="px-6 py-16 sm:py-24">
        <div className="reveal mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-dark-card p-10 text-white shadow-card sm:p-16 lg:p-20"
             style={{ background: "radial-gradient(circle at 20% 20%, oklch(0.32 0.18 295) 0%, oklch(0.16 0.06 285) 60%)" }}>
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-bright">Why Sage is different</p>
              <h2 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
                Other apps log spending. <span className="text-violet-bright">Sage understands it.</span>
              </h2>
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {[
                  { t: "Behavioural AI", b: "Detects emotional spending vs intentional spending across categories." },
                  { t: "Profile detection", b: "Classifies you across 4 financial archetypes — and re-evaluates monthly." },
                  { t: "FDS scoring", b: "A discipline score that rewards consistency, not income." },
                  { t: "Adaptive coaching", b: "Tone, frequency, and goals tuned to your profile." },
                ].map((f) => (
                  <div key={f.t} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                    <h3 className="font-display text-xl font-bold">{f.t}</h3>
                    <p className="mt-2 text-sm text-white/70">{f.b}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative lg:col-span-5">
              <PhoneDashboard />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ───────── BENEFITS
  function Benefits() {
    return (
      <section className="py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
          <div className="reveal relative">
            <img src={collage1} alt="Student using Sage" className="rounded-[2rem] shadow-card" width={800} height={1000} loading="lazy" />
            <div className="absolute -bottom-6 -right-6 rotate-[8deg] rounded-2xl bg-violet-bright px-5 py-3 text-white shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">FDS up</p>
              <p className="font-display text-2xl font-bold">+18 pts</p>
            </div>
          </div>
          <div>
            <p className="reveal text-xs font-semibold uppercase tracking-[0.25em] text-violet-bright">Benefits</p>
            <h2 className="reveal mt-4 font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">
              Less stress. <br />More runway.
            </h2>
            <div className="reveal-stagger mt-10 space-y-5">
              {[
                ["Stop the leaks", "Spot subscriptions and habits draining $40+ a month."],
                ["Build the muscle", "Daily streaks turn budgeting from chore to game."],
                ["See the future", "Forecasts show where you'll land if today's habits hold."],
                ["Learn while you grow", "Bite-sized lessons unlock as you level up."],
              ].map(([t, b]) => (
                <div key={t} className="flex gap-4">
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-primary-foreground">✓</span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-ink">{t}</h3>
                    <p className="text-ink/70">{b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ───────── CTA
  function CTA() {
    return (
      <section id="cta" className="px-6 py-16 sm:py-24">
        <div className="reveal relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-ink p-10 text-white shadow-card sm:p-16 lg:p-24">
          <Blob className="absolute -right-20 -top-20 h-80 w-80 text-violet-bright/40" />
          <Blob className="absolute -left-20 -bottom-24 h-72 w-72 text-magenta/30" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
                Ready to make money <span className="text-violet-bright">make sense?</span>
              </h2>
              <p className="mt-5 max-w-lg text-white/70">
                Join 12,000+ students and young pros building real money habits with Sage.
                Free forever for the basics.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#" className="pill-btn-bright">Download for iOS</a>
                <a href="#" className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">Download for Android</a>
              </div>
            </div>
            <div className="relative">
              <img src={collage2} alt="Young pro using Sage" className="mx-auto w-72 rotate-[4deg] rounded-3xl shadow-card sm:w-80" width={800} height={1000} loading="lazy" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ───────── FAQ
  function FAQ() {
    const items = [
      { q: "Is Sage really free?", a: "Yes — tracking, AI insights, and FDS are free forever. Premium adds investing simulators and advanced coaching." },
      { q: "Do I need to link my bank?", a: "No. You can use Sage manually, or connect read-only feeds when you're ready. Your call." },
      { q: "Will Sage do real trades?", a: "Not yet. Sage is a coach and simulator — designed to teach, not to risk your savings." },
      { q: "How does the Financial Discipline Score work?", a: "FDS rewards consistency: hitting micro-goals, stable spending, and growing savings — not how much you earn." },
      { q: "Is my data safe?", a: "End-to-end encryption, no selling of personal data, ever. You own your numbers." },
    ];
    return (
      <section id="faq" className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <div className="reveal text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-bright">FAQ</p>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">
              Questions, answered.
            </h2>
          </div>
          <div className="reveal-stagger mt-12 space-y-3">
            {items.map((it) => (
              <details key={it.q} className="group rounded-2xl bg-white p-6 shadow-soft ring-1 ring-ink/5 open:bg-lavender-soft">
                <summary className="flex cursor-pointer items-center justify-between font-display text-xl font-bold text-ink">
                  {it.q}
                  <span className="ml-4 grid h-8 w-8 place-items-center rounded-full bg-ink text-primary-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-ink/70">{it.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ───────── FOOTER
  function Footer() {
    return (
      <footer className="border-t border-ink/10 bg-lavender-soft px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-primary-foreground font-display text-lg">s</span>
                <span className="font-display text-2xl font-bold text-ink">sage</span>
              </div>
              <p className="mt-4 max-w-xs text-sm text-ink/60">
                The AI money coach for the next generation. Built with care in Casablanca.
              </p>
            </div>
            {[
              { h: "Product", l: ["Features", "How it works", "Pricing", "Changelog"] },
              { h: "Company", l: ["About", "Careers", "Press", "Contact"] },
              { h: "Legal", l: ["Privacy", "Terms", "Security", "Cookies"] },
            ].map((c) => (
              <div key={c.h}>
                <h4 className="font-display text-lg font-bold text-ink">{c.h}</h4>
                <ul className="mt-4 space-y-2 text-sm text-ink/65">
                  {c.l.map((x) => <li key={x}><a href="#" className="hover:text-ink">{x}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-6 text-xs text-ink/50 sm:flex-row">
            <p>© 2026 Sage. All rights reserved.</p>
            <p>Made for students & young pros.</p>
          </div>
        </div>
      </footer>
    );
  }
}
