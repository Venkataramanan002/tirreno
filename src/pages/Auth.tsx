import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setOauthLoading(true);
    try {
      const redirectTo = window.location.origin.includes('localhost')
        ? 'http://localhost:8080'
        : 'https://bpylpdcnhbtnhkspcqyy.supabase.co/auth/v1/callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://mail.google.com/',
            'https://www.googleapis.com/auth/gmail.metadata',
            'https://www.googleapis.com/auth/gmail.labels',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.settings.basic',
            'https://www.googleapis.com/auth/gmail.settings.sharing'
          ].join(' '),
          redirectTo
        }
      });
      if (error) throw error;
      return data;
    } catch (e: any) {
      setError(e?.message || 'Google login failed');
    } finally {
      setOauthLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            setError("Please confirm your email first. Check your inbox for the confirmation link.");
          } else if (error.message.includes("Invalid login credentials")) {
            setError("Invalid email or password. If you just signed up, please confirm your email first.");
          } else {
            setError(error.message);
          }
          throw error;
        }
        navigate("/");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          if (error.message.includes("429") || error.message.includes("rate limit")) {
            setError("Too many signup attempts. Please wait a minute before trying again.");
          } else {
            setError(error.message);
          }
          throw error;
        }

        if (data.user) {
          setError("Success! Check your email to confirm your account before logging in.");
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md tahoe-glass-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-3xl border border-white/20 tahoe-icon">
              <Shield className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <CardTitle className="tahoe-title-lg mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to access your security dashboard" : "Sign up to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-6">
            {error && (
              <Alert variant={error.includes("Success!") || error.includes("Check your email") ? "default" : "destructive"}>
                <AlertCircle className="h-5 w-5 tahoe-icon" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label htmlFor="email" className="tahoe-text-lg">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="tahoe-text-lg">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="tahoe-glass px-4 py-1 rounded-full tahoe-text opacity-60">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full"
              disabled={oauthLoading}
            >
              {oauthLoading ? 'Connecting Google...' : 'Continue with Google'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="tahoe-text text-blue-400 hover:text-blue-300 tahoe-transition"
              >
                {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
