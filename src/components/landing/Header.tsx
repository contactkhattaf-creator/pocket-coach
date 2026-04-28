import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-primary-foreground font-display text-lg">s</span>
          <span className="font-display text-2xl font-bold text-ink">sage</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink/80 md:flex">
          <a href="#features" className="hover:text-ink">Features</a>
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#ai" className="hover:text-ink">AI</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
        </nav>
        <a href="#cta" className="pill-btn text-xs">Get the app</a>
      </div>
    </header>
  );
}
