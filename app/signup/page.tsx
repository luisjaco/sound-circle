import AuthCard from "../../components/AuthCard";
import Input from "../../components/Input";
import Button from "../../components/Button";

export default function SignUp() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-lg px-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-full border-2 border-brand flex items-center justify-center text-brand mb-4">◎</div>
          <h2 className="text-3xl font-bold mb-2">Join SoundCircle</h2>
          <p className="text-muted">Create your account to start reviewing</p>
        </div>

        <AuthCard>
          <form className="space-y-6">
            <Input label="Email" placeholder="your@email.com" type="email" />
            <Input label="Password" placeholder="••••••••" type="password" />
            <div className="mt-2">
              <Button type="submit" className="w-full">Sign Up</Button>
            </div>

            <p className="text-center text-sm text-muted">Already have an account? <a href="/login" className="text-brand">Log In</a></p>
          </form>
        </AuthCard>
      </div>
    </main>
  )
}