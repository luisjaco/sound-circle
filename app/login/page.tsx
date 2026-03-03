'use client'

import Link from "next/link";
import Logo from "@/components/Logo";
import AuthCard from "@/components/AuthCard";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if ( error ) {
      setError(true);
    } else {
      setError(false);

      const registered = await isUserRegistered();
      // registered ? router.push('/home') : router.push('/onboarding');
      /** @todo set reroute when home page is made, dynamic depending on if user registered. */
      //router.push('/onboarding');
      //router.push('/home');
    }
  }

  async function isUserRegistered(): Promise<boolean> {
    const session = await fetch('/api/auth/session');
    const sessionData = await session.json();

    if (!session.ok) {
      return false;
    }

    console.log(sessionData);

    return true;
  }
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
            <form className="space-y-0" method="post" onSubmit={handleSubmit}>
              <label hidden={!error} >Invalid email or password.</label> { /** @todo logan */}

              <div className="form-row">
                <label className="input-label">Email</label>
                <Input className="w-full" name="email" placeholder="your@email.com" type="email" onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="form-row">
                <label className="input-label">Password</label>
                <Input className="w-full" name="password" placeholder="••••••••" type="password" onChange={(e) => setPassword(e.target.value)} />
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
        <Button onClick={() => isFirstTimeUser()} variant="primary" className="w-full mt-6">Log In</Button>
      </div>
    </main>
  );
}