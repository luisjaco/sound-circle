// app/signup/page.tsx
import Link from "next/link";
import Logo from "@/components/Logo";
import AuthCard from "@/components/AuthCard";
import Input from "@/components/Input";
import Button from "@/components/Button";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-start justify-center px-6 auth-top">
      <div className="w-full auth-wrapper">
        <div className="text-center mb-8">
          <Logo className="mx-auto mb-6 animate-spin-slow" />
          <h1 className="text-3xl font-extrabold">Join <span style={{color: "white"}}>Sound</span><span style={{color: "var(--brand)"}}>Circle</span></h1>
          <p className="text-[var(--muted)] mt-2">Create your account to start reviewing</p>
        </div>

        {/* outer dark card (rounded) */}
        <AuthCard>
          {/* inner grey panel that holds the inputs */}
          <div className="form-panel">
            <form className="space-y-0" method="post" action="/api/auth/signup">
              <div className="form-row">
                <label className="input-label">Email</label>
                <Input className="w-full" name="email" placeholder="your@email.com" type="email" />
              </div>

              <div className="form-row">
                <label className="input-label">Password</label>
                <Input className="w-full" name="password" placeholder="••••••••" type="password" />
              </div>

              <div className="form-row">
                <Button type="submit" variant="primary" className="w-full">Sign Up</Button>
              </div>
            </form>
          </div>
        </AuthCard>

        <p className="text-center text-sm text-[var(--muted)] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--brand)]">Log In</Link>
        </p>

        <div className="info-box">
          <p className="text-sm text-[var(--muted)] text-center">
            You'll be able to connect your Spotify and Apple Music accounts after signing up to import your listening history.
          </p>
        </div>
      </div>
    </main>
  );
}

