'use client'

// app/signup/page.tsx
import Link from "next/link";
import Logo from "@/components/Logo";
import AuthCard from "@/components/AuthCard";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { useEffect } from 'react';

export default function SignUpPage() {

  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [userTakenError, setUserTakenError] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    setUserTakenError(false);

    /**
        The regular expression below cheks that a password:

        Has minimum 8 characters in length. Adjust it by modifying {8,}
        At least one uppercase English letter. You can remove this condition by removing (?=.*?[A-Z])
        At least one lowercase English letter.  You can remove this condition by removing (?=.*?[a-z])
        At least one digit. You can remove this condition by removing (?=.*?[0-9])
        At least one special character,  You can remove this condition by removing (?=.*?[#?!@$%^&*-])
     */
    const emailRegex = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
    const passwordValid = ((emailRegex.test(email)) && (passwordRegex.test(password)));

    setPasswordError(!passwordValid);
    if (!passwordValid) return;

    const passwordMatch = (password === confirmPassword)
    setConfirmPasswordError(!passwordMatch);
    if (!passwordMatch || !supabase) return;

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    })

    if (error || !data.session) {
      error?.status === 422 ? setUserTakenError(true) : setError(true);
      return
    }

    // move on
    setError(false);
    router.push('/onboarding');
  }

  return (
    <main className="min-h-screen flex items-start justify-center px-6 auth-top">
      <div className="w-full auth-wrapper">
        <div className="text-center mb-8">
          <Logo className="mx-auto mb-6 animate-spin-slow" />
          <h1 className="text-3xl font-extrabold">Join <span style={{ color: "white" }}>Sound</span><span style={{ color: "var(--brand)" }}>Circle</span></h1>
          <p className="text-[var(--muted)] mt-2">Create your account to start reviewing</p>
        </div>

        {/* outer dark card (rounded) */}
        <AuthCard>
          {/* inner grey panel that holds the inputs */}
          <div className="form-panel">
            <label hidden={!error} >Invalid email and password combination.</label> { /** @todo logan */}
            <label hidden={!userTakenError} >Email is already in use.</label> { /** @todo logan */}
            <form className="space-y-0" method="post" onSubmit={handleSubmit}>
              <div className="form-row">
                <label className="input-label">Email</label>
                <Input className="w-full" name="email" placeholder="your@email.com" type="email" onChange={(e) => setEmail(e.target.value)} />
              </div>

              <label hidden={!passwordError}>Invalid password.</label> { /** @todo logan */}
              <div className="form-row">
                <label className="input-label">Password</label>
                <Input className="w-full" name="password" placeholder="••••••••" type="password" onChange={(e) => setPassword(e.target.value)} />
              </div>

              <label hidden={!confirmPasswordError}>Passwords must match.</label> { /** @todo logan */}
              <div className="form-row">
                <label className="input-label">Confirm Password</label>
                <Input className="w-full" name="password" placeholder="••••••••" type="password" onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <p className="text-sm text-[var(--muted)] mb-6">
                A valid password has:
                <br />- Minimum 8 characters in length.
                <br />- At least one uppercase English letter.
                <br />- At least one lowercase English letter.
                <br />- At least one digit.
                <br />- At least one special character.
              </p>

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

