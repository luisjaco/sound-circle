import Link from "next/link";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center relative px-6">
      {/** background circles */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <svg className="w-[140vmax] h-[1400] opacity-10 translate-x-20 translate-y-8" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="50" r="48" stroke="#0a441d" strokeWidth="0.6" fill="none" />
          <circle cx="62" cy="32" r="36" stroke="#0a441d" strokeWidth="0.6" fill="none" />
          <circle cx="92" cy="66" r="24" stroke="#0a441d" strokeWidth="0.6" fill="none" />
        </svg>
      </div>

      <div className="text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-6">
          <Logo className="animate-spin-slow" />
        </div>

        <h1 className="hero-title">
          <span style={{ color: "white" }}>Sound</span><span style={{ color: "var(--brand)" }}>Circle</span>
        </h1>

        <p className="hero-sub">
          Share your music journey. Review albums. Connect with listeners worldwide.
        </p>

        <div className="hero-cta">
          <Link href="/signup" className="btn-primary inline-block">
            Sign Up
          </Link>

          <Link href="/login" className="btn-ghost inline-block">
            Log In
          </Link>
        </div>

        <div className="hero-hr" />

        <p className="preview-text">Preview the experience</p>
        <a href="#" className="explore-link">Explore Demo →</a>
      </div>
    </main>
  );
}