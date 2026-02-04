import Link from "next/link";
import Button from "@/components/Button";
import Logo from "@/components/Logo";
import Background from "@/components/Background";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center relative px-6">
      <Background />

      <div className="text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-6">
          <Logo className="animate-spin-slow" />
        </div>

        <h1 className="hero-title">
          <span style={{color: "white"}}>Sound</span><span style={{color: "var(--brand)"}}>Circle</span>
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
