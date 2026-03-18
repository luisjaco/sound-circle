'use client'

import Link from "next/link";
import Logo from "@/components/Logo";
import AuthCard from "@/components/AuthCard";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { useEffect } from 'react';

export default function LoginPage() {
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(true);
    } else {
      setError(false);

      const registered = await isUserRegistered();

      if (registered === null) {
        setError(false);
        await supabase.auth.signOut();
      } else {
        /** @todo set reroute when home page is made, dynamic depending on if user registered. */
        registered ? router.push('/home') : router.push('/onboarding');
      }
    }
  }

  async function isUserRegistered(): Promise<null | boolean> {
    const session = await fetch('/api/auth/session');
    const sessionData = await session.json();

    if (!session.ok) {
      return null;
    }

    const res = await fetch(`/api/supabase/users?id=${sessionData.user.id}`)
    const data = await res.json();

    console.log(data);
    if (!res.ok) {
      /** @todo handle error. */
      return null;
    } else if (data.length === 0) {
      return false
    } else {
      return true;
    }
  }

  return (
    <main className="min-h-screen flex items-start justify-center px-6 auth-top">
      <div className="w-full auth-wrapper">
        <div className="text-center mb-8">
          <Logo className="mx-auto mb-6 animate-spin-slow" />
          <h1 className="text-3xl font-extrabold">Welcome Back</h1>
          <p className="text-(--muted) mt-2">Log in to continue your music journey</p>
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
                  className="text-sm text-(--brand) forgot-link"
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

        <p className="text-center text-sm text-(--muted) mt-6">
          Don't have an account? <Link href="/signup" className="text-(--brand)">Sign Up</Link>
        </p>
      </div>
    </main>
  );
}