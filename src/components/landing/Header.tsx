import { Link } from "@tanstack/react-router";
import moniqLogo from "@/assets/moniq-logo.jpg";

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={moniqLogo} alt="Moniq logo" className="h-9 w-9 rounded-full object-cover" />
          <span className="font-display text-2xl font-bold text-ink">moniq</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink/80 md:flex">
          <a href="#features" className="hover:text-ink">Features</a>
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#ai" className="hover:text-ink">AI</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
        </nav>
        <Link to="/login" className="pill-btn text-xs">Sign in</Link>
      </div>
    </header>
  );
}
