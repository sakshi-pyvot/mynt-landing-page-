import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MailCheck } from "lucide-react";

// Email + password signup against UC (SCRUM-72). The prototype's Google-SSO and
// email/mobile-OTP tabs are deliberately gone for v1 — payment is the trust
// gate; add federated login when the business asks for it.
export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Signup succeeded (202): the account exists but is DISABLED until the
  // verification email is clicked, so there's nowhere to navigate to yet —
  // show a confirmation instead of the form.
  const [submitted, setSubmitted] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(email, password, name);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed — please try again");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
            <MailCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
          <p className="text-muted-foreground mt-3 text-sm">
            We've sent a verification link to <span className="text-foreground font-medium">{email}</span>.
            Click it to activate your account.
          </p>
          <p className="text-muted-foreground mt-3 text-sm">
            Don't see it? Check your spam folder. Already verified?{" "}
            <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mb-8">
          <span className="text-2xl font-bold text-gradient-mint">mynt</span>
          <h1 className="text-2xl font-bold text-foreground mt-4">Create your account</h1>
          <p className="text-muted-foreground mt-1 text-sm">Know your real earnings in minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name" type="text" required
              placeholder="Restaurant owner"
              value={name} onChange={(e) => setName(e.target.value)}
              className="bg-secondary border-border h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email" type="email" required
              placeholder="you@restaurant.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary border-border h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password" type="password" required minLength={8}
              placeholder="At least 8 characters"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary border-border h-11"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full gradient-mint text-primary-foreground hover:opacity-90 h-11">
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
