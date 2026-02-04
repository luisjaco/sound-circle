import Link from "next/link";
import Logo from "@/components/Logo";
import AuthCard from "@/components/AuthCard";
import Input from "@/components/Input";
import Button from "@/components/Button";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-start justify-center px-6 auth-top">
      <div className="w-full auth-wrapper">
        <div className="text-center mb-8">
          <Logo className="mx-auto mb-6 animate-spin-slow" />
          <h1 className="text-3xl font-extrabold">Welcome Back</h1>
          <p className="text-[var(--muted)] mt-2">Log in to continue your music journey</p>
        </div>

        <AuthCard>
          <div className="form-panel">
            <form className="space-y-0" method="post" action="/api/auth/login">
              <div className="form-row">
                <label className="input-label">Email</label>
                <Input className="w-full" name="email" placeholder="your@email.com" type="email" />
              </div>

              <div className="form-row">
                <label className="input-label">Password</label>
                <Input className="w-full" name="password" placeholder="••••••••" type="password" />
              </div>

              <div className="flex items-center justify-between mb-6">
                <div />
                <Link
                  href="/forgot-password"
                  className="text-sm text-[var(--brand)] forgot-link"
                >
                Forgot password?
                </Link>
              </div>

              <div>
                <Button type="submit" variant="primary" className="w-full mt-6">Log In</Button>
              </div>
            </form>
          </div>
        </AuthCard>

        <p className="text-center text-sm text-[var(--muted)] mt-6">
          Don't have an account? <Link href="/signup" className="text-[var(--brand)]">Sign Up</Link>
        </p>
      </div>
    </main>
  );
}