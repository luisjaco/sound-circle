import AuthCard from "../../components/AuthCard";
import Input from "../../components/Input";
import Button from "../../components/Button";

export default function Login() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-lg px-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-full border-2 border-brand flex items-center justify-center text-brand mb-4">◎</div>
          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-muted">Log in to continue your music journey</p>
        </div>

        <AuthCard>
          <form className="space-y-6">
            <Input label="Email" placeholder="your@email.com" type="email" />
            <Input label="Password" placeholder="••••••••" type="password" />
            <div className="text-right text-sm">
              <a className="text-brand hover:underline" href="#">Forgot password?</a>
            </div>

            <Button type="submit" className="w-full">Log In</Button>

            <p className="text-center text-sm text-muted">Don't have an account? <a href="/signup" className="text-brand">Sign Up</a></p>
          </form>
        </AuthCard>
      </div>
    </main>
  )
}