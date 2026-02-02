import Link from "next/link";
import Button from "@/components/Button";
import Background from "@/components/Background";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center relative">
      <Background />

      <div className="text-center px-6">
        {/* Logo placeholder */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-brand flex items-center justify-center text-brand font-bold">
            ◎
          </div>
        </div>

        {/* Title */}
        <h1 className="text-6xl font-extrabold leading-tight mb-4">
          <span className="text-white">Sound</span>
          <span className="text-brand">Circle</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-xl mx-auto text-muted mb-8">
          Share your music journey. Review albums. Connect with listeners worldwide.
        </p>

        {/* Buttons — FIXED */}
        <div className="flex items-center justify-center gap-5">
          <Link href="/signup">
            <Button>Sign Up</Button>
          </Link>

          <Link href="/login">
            <Button variant="ghost">Log In</Button>
          </Link>
        </div>

        {/* Footer link */}
        <div className="mt-12 border-t faint pt-8 max-w-xl mx-auto text-muted">
          <a className="inline-block mt-4 text-brand hover:underline" href="#">
            Explore Demo →
          </a>
        </div>
      </div>
    </main>
  );
}